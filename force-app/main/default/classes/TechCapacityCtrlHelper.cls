/**
 * @FileName: TechCapacityCtrlHelper
 * @Description: Helper methods for TechCapacityCtrl
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/18/2019      Created
 *-----------------------------------------------------------  
 */
public inherited sharing class TechCapacityCtrlHelper {
    private static ServicePlanDateWrapper dateWrapper;
    private static Map<Date,TechCapacityWrappers.CalendarDay> daysById;
    private static TechCapacityWrappers.SiteSurveyWrapper surveyWrapper;

    /*
     * @Name        getTechnician
     * @Description Get details about a specified Service Resource
     * @Author      Graeme Ward
     * @Params      technicianId: Id of the Service Resource Record
     * @Return      String: Serialized Service Resource record
     */
    public static String getTechnician(String technicianId) {
        ServiceResource technician = [
                SELECT Id, Name, Travel_Factor__c,
                (SELECT Id, Skill.MasterLabel, SkillLevel
                FROM ServiceResourceSkills),
                (SELECT Id, OperatingHoursId, OperatingHours.Name
                FROM ServiceTerritories
                WHERE TerritoryType = 'P'
                ORDER BY EffectiveEndDate DESC NULLS FIRST)
                FROM ServiceResource
                WHERE Id = :technicianId
        ];

        TechCapacityWrappers.TechWrapper wrapper = new TechCapacityWrappers.TechWrapper(technician);

        return JSON.serialize(wrapper);
    }

    /*
     * @Name        getServicePlans
     * @Description Get the relevant Service Plans for the specified Service Resource over and 8 week period
     * @Author      Graeme Ward
     * @Params      criteria: serialized search criteria (technician id, list of day objects to store service plan
     *              information)
     * @Return      String: input criteria is modified, serialized, and returned
     */
    public static String getServicePlans(String criteria) {
        TechCapacityWrappers.ServicePlanCriteria wrapper = (TechCapacityWrappers.ServicePlanCriteria)
                JSON.deserialize(criteria, TechCapacityWrappers.ServicePlanCriteria.class);

        dateWrapper = new ServicePlanDateWrapper(4, Date.today().toStartOfMonth().addMonths(-1));
        //dateWrapper = new ServicePlanDateWrapper(4);
        daysById = mapCriteriaByDay(wrapper);

        Map<Id,Route__c> routes = new Map<Id,Route__c>([
                SELECT Id
                FROM Route__c
                WHERE Service_Resource__c = :wrapper.technician.tech.Id
        ]);

        List<Service_Plan__c> servicePlans = [
                SELECT Id, Effective_Date__c, Schedule_Type__c, Schedule_Type__r.Code__c, Schedule_Type__r.Description__c,
                (SELECT Id, Product_Name__c, Product2.Item_Type__c, Product2.ExternalID__c, Quantity,
                        Account_Id__c, Order.OrderNumber, Line_of_Business__c, Frequency__c,
                        Item_Type__c, Service_Price_Per_Unit__c, Product2.Service_Work_Type__r.DurationInMinutes,
                        Product2.Delivery_Work_Type__r.DurationInMinutes, Order.Season_Start_Date__c,
                        Order.Season_End_Date__c, Valid_for_Install_Remove_Replace__c, Installation_Status__c
                FROM Order_Products__r
                WHERE Frequency__c != 'One-time'
                AND Active__c = TRUE)
                FROM Service_Plan__c
                WHERE Route__c IN :routes.keySet()
        ];

        surveyWrapper = new TechCapacityWrappers.SiteSurveyWrapper(servicePlans);

        for(Service_Plan__c sp : servicePlans) {
            if(String.isNotBlank(sp.Schedule_Type__c)) {
                assignServicePlan(sp);
            }
        }

        setDayDetails(wrapper);

        return JSON.serialize(wrapper);
    }

    /*
     * @Name        mapCriteriaByDay
     * @Description Map of calendar day objects by their date
     * @Author      Graeme Ward
     * @Params      wrapper: serialized search criteria containing list of day objects to store service plan
     *              information
     * @Return      Map<Date,TechCapacityWrappers.CalendarDay>: map of calendar day objects by their date
     */
    private static Map<Date,TechCapacityWrappers.CalendarDay> mapCriteriaByDay(TechCapacityWrappers.ServicePlanCriteria wrapper) {
        Map<Date,TechCapacityWrappers.CalendarDay> daysById = new Map<Date, TechCapacityWrappers.CalendarDay>();

        for(TechCapacityWrappers.CalendarDay cd : wrapper.days) {
            List<String> dateString = cd.d.split('-');
            daysById.put(Date.newInstance(Integer.valueOf(dateString[0]), Integer.valueOf(dateString[1]), Integer.valueOf(dateString[2])), cd);
        }

        return daysById;
    }

    /*
     * @Name        getAccountIds
     * @Description Assign a specified Service Plan to corresponding days in the Calendar map
     * @Author      Graeme Ward
     * @Params      sp: Service Plan record
     *              servicePlanDays: List of dates that correspond with this service plan
     *              daysById: Map of day objects by date that will receive Service Plan information
     * @Return      void
     */
    private static void assignServicePlan(Service_Plan__c sp) {
        List<Date> servicePlanDays = dateWrapper.getServicePlanDays(sp.Schedule_Type__r.Code__c, sp.Effective_Date__c);

        for(Date spd : servicePlanDays) {
            TechCapacityWrappers.CalendarDay day = daysById.get(spd);

            if(day != null) {
                assignItems(day, sp, spd);
            }
        }
    }

    /*
     * @Name        assignItems
     * @Description Assign Order Item information to the specified day object
     * @Author      Graeme Ward
     * @Params      day: Day wrapper object to summarize Order Item information
     *              items: List of Order Items associated with this day
     * @Return      void
     */
    private static void assignItems(TechCapacityWrappers.CalendarDay day, Service_Plan__c sp, Date spd) {
        if(day.accounts == null) day.accounts = new Map<Id,TechCapacityWrappers.AccountWrapper>();

        for(OrderItem item : sp.Order_Products__r) {
            if(item.Order.Season_Start_Date__c == null
                    || item.Order.Season_End_Date__c == null
                    || (spd >= item.Order.Season_Start_Date__c
                    && spd <= item.Order.Season_End_Date__c))
            {
                // create a new account wrapper if this account does not yet exist on this day
                if(!day.accounts.containsKey(item.Account_Id__c)) {
                    Account account = surveyWrapper.accountMap.get(item.Account_Id__c);
                    Site_Survey__c survey = surveyWrapper.siteSurveyMap.get(account.Site_Survey__c);

                    day.accounts.put(
                            item.Account_Id__c,
                            new TechCapacityWrappers.AccountWrapper(account, survey)
                    );
                }

                assignItem(day, item, sp);
            }
        }

        day.calls = day.accounts.keySet().size();
    }

    /*
     * @Name        assignItem
     * @Description Assign Order Item information to the specified day object
     * @Author      Graeme Ward
     * @Params      day: Day wrapper object to summarize Order Item information
     *              item: Order Item associated with this day
     * @Return      void
     */
    private static void assignItem(TechCapacityWrappers.CalendarDay day, OrderItem item, Service_Plan__c sp) {
        TechCapacityWrappers.AccountWrapper account = day.accounts.get(item.Account_Id__c);

        String assetId = item.Product2.ExternalID__c + '-' + sp.Schedule_Type__r.Code__c;

        Decimal duration = 0;

        Double familyCount = account.assetCountByFamily.get(item.Line_of_Business__c);

        if (item.Line_of_Business__c != QueryUtils.fieldServiceSettings.Pest_LOB__c
            && item.Item_Type__c == QueryUtils.fieldServiceSettings.Label_for_Service_Work_Order_Type__c
            && item.Product2.Service_Work_Type__r != null)
        {
            duration = item.Product2.Service_Work_Type__r.DurationInMinutes * item.Quantity;
        }
        else if (item.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_for_Consumables__c
                && item.Product2.Delivery_Work_Type__r != null
                && !account.productIds.contains(item.Product2Id))
        {
            duration = item.Product2.Delivery_Work_Type__r.DurationInMinutes;
            account.productIds.add(item.Product2Id);
        }

        ServicePlanAssetWrapper asset = account.assetMap.get(assetId);

        if (asset == null) {
            account.assetMap.put(
                    assetId,
                    new ServicePlanAssetWrapper(item, sp.Schedule_Type__r.Description__c)
            );
        }
        else {
            asset.item.Quantity += item.Quantity;
        }

        if (familyCount == null) familyCount = 0;

        familyCount += item.Quantity;

        account.assetCountByFamily.put(item.Line_of_Business__c, familyCount);

        account.duration += duration;
        account.assetCount += item.Quantity;

        if (day.rR == null) day.rR = 0;

        day.minutes += duration;
        day.rR += item.Service_Price_Per_Unit__c == null ? 0 : item.Service_Price_Per_Unit__c;
        day.assets += item.Quantity;
    }

    /*
     * @Name        setDayDetails
     * @Description Calculates the Service Resource utilization and sets Account details for a list of days
     * @Author      Graeme Ward
     * @Params      wrapper: wrapper containing list of days
     *              accountMap: Account records mapped by Id
     * @Return      void
     */
    private static void setDayDetails(TechCapacityWrappers.ServicePlanCriteria wrapper) {
        List<Technician_Utilization_Setting__mdt> utilizationSettings = [
                SELECT Id, DeveloperName, Minimum_Percent__c, Maximum_Percent__c
                FROM Technician_Utilization_Setting__mdt
                WHERE Minimum_Percent__c != NULL
                ORDER BY Minimum_Percent__c DESC
        ];

        for(TechCapacityWrappers.CalendarDay day : wrapper.days) {
            if(day.accounts != null) setAccountDetails(day);

            calculateUtilization(day, wrapper.technician, utilizationSettings);
        }
    }

    /*
     * @Name        calculateUtilization
     * @Description Calculates the Service Resource utilization for a list of days, and applies the appropriate
     *              CSS class name for colour coding (CSS class names correspond to the Developer Name on Technician
     *              Utilization Setting custom metadata records)
     * @Author      Graeme Ward
     * @Params      day: wrapper containing day for which to calculate utilization
     *              technician: wrapper containing technician details
     *              utilizationSettings: custom metadata with percent utilization breakpoints
     * @Return      void
     */
    private static void calculateUtilization(
            TechCapacityWrappers.CalendarDay day,
            TechCapacityWrappers.TechWrapper technician,
            List<Technician_Utilization_Setting__mdt> utilizationSettings)
    {
        day.travelTime = day.minutes * (technician.tech.Travel_Factor__c / 100);
        day.travelTime = day.travelTime.setScale(2, RoundingMode.HALF_UP);

        Double utilization = 0;

        if(day.minutes != 0 && technician.averageShift != 0) {
            Double utilizationMinutes = day.minutes + technician.travelTime;
            utilization = (utilizationMinutes / technician.averageShift) * 100;
            utilization = Integer.valueOf(utilization);
        }

        for(Technician_Utilization_Setting__mdt setting : utilizationSettings) {
            if(utilization >= setting.Minimum_Percent__c && (setting.Maximum_Percent__c == null || utilization <= setting.Maximum_Percent__c)) {
                day.utilization = setting.DeveloperName;
                break;
            }
        }
    }

    /*
     * @Name        setAccountDetails
     * @Description Set the assets as a list and calculates adjustment time for the Account
     * @Author      Graeme Ward
     * @Params      day: wrapper containing day for which to set Account details
     * @Return      void
     */
    private static void setAccountDetails(TechCapacityWrappers.CalendarDay day) {
        for(Id accountId : day.accounts.keySet()) {
            TechCapacityWrappers.AccountWrapper account = day.accounts.get(accountId);
            account.assets = account.assetMap.values();
            account.assets.sort();

            if (account.survey != null) {
                account.adjustments += ServicePlanUtils.getSiteSurveyAdjustments(account.survey, account.assetCountByFamily);
            }

            if (account.assetCountByFamily.size() == 1) {
                List<String> familyList = new List<String>(account.assetCountByFamily.keySet());
                String field = ServicePlanConstants.OPERATING_HOURS_FIELD_MAP.get(familyList[0]);

                if (String.isNotBlank(field)) {
                    account.operatingHours = (String) ApexUtils.getFieldValue(account.acc, field + '__r.Name');
                    account.operatingHoursId = (String) ApexUtils.getFieldValue(account.acc, field + '__c');
                }

                if (String.isBlank(account.operatingHours)) {
                    account.operatingHours = account.acc.OperatingHours.Name;
                    account.operatingHoursId = account.acc.OperatingHoursId;
                }
            }
            else {
                account.operatingHours = account.acc.OperatingHours.Name;
                account.operatingHoursId = account.acc.OperatingHoursId;
            }

            day.minutes += account.adjustments;
            day.minutes = day.minutes.setScale(2, RoundingMode.HALF_UP);
            day.rR = day.rR.setScale(0, RoundingMode.HALF_UP);
        }
    }
}