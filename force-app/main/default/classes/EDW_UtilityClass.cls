/**
* Name: EDW_UtilityClass
* Author: PwC
* Date Created: April 24, 2019
* Purpose: To house all repeated logic for the Emergency Dispatch Wizard
*/
public with sharing class EDW_UtilityClass {
    public static final String ACCOUNT_PREFIX = Account.SObjectType.getDescribe().getKeyPrefix();
    public static final String CASE_PREFIX = Case.SObjectType.getDescribe().getKeyPrefix();
    public static final String ORDER_PREFIX = Order.SObjectType.getDescribe().getKeyPrefix();
    public static final String DELIMITER = '~';
    public static final String EMPTY_SPACE = ' ';
    public static final String ERROR = 'error';
    public static final String SUCCESS = 'success';
    public static final Integer MINUTES_IN_HOUR = 60;
    private static final Integer DAYS_IN_WEEK = 7;
    public static final String EDIT_MODE = 'EDIT';
    public static final String NEW_MODE = 'NEW';
    public static Boolean hasOrderBeenCreated = false;
    //Begin:Shashi:10-4-2019:Populate related infestation and rooms
    private static Map<String,Set<String>> mapTreatInfestLvl = new Map<String,Set<String>>();
    private static Map<String,Set<String>> mapTreatInfestLvlRooms = new Map<String,Set<String>>();
    private static Boolean isLocationRoomsExec = false;
    //End
    
    /**
     * Checks if the current lightning component is called from a Salesforce Site or is internal
     */
    public static Boolean isCommunity() {
        return Site.getSiteId() != null;
    }
    
    /**
     * Returns all values on the Infestation Level picklist
     */
    public static List<String> getInfestationLevelValues() {
        Set<String> values = new Set<String>();
        
        Schema.DescribeFieldResult results = Product2.Infestation_Level__c.getDescribe();
        
        for (Schema.PicklistEntry field : results.getPicklistValues()) {
            values.add(field.getLabel());
        }
        
        values.remove(null);
        
        return new List<String>(values);
    }
    
    /**
     * Returns all values on the Treatment Type picklist
     */
    public static List<String> getTreatmentTypeValues() {
        Set<String> values = new Set<String>();
        
        Schema.DescribeFieldResult results = Product2.Treatment_Type__c.getDescribe();
        
        for (Schema.PicklistEntry field : results.getPicklistValues()) {
            values.add(field.getLabel());
        }
        
        values.remove(null);
        
        return new List<String>(values);
    }
    
    /**
     * Returns all values on the Number of Rooms picklist
     */
    public static List<String> getNumberOfRooms() {
        Set<String> values = new Set<String>();
        
        Schema.DescribeFieldResult results = Product2.Number_of_Rooms__c.getDescribe();
        
        for (Schema.PicklistEntry field : results.getPicklistValues()) {
            values.add(field.getLabel());
        }
        
        values.remove(null);
        
        return new List<String>(values);
    }
    
    /**
     * Returns all values on the Number of Rooms picklist
     */
    public static List<String> getTimeBlocks() {
        Set<String> values = new Set<String>();
        
        Schema.DescribeFieldResult results = Case.Appointment_Time_Block__c.getDescribe();
        
        for (Schema.PicklistEntry field : results.getPicklistValues()) {
            values.add(field.getLabel());
        }
        
        values.remove(null);
        
        return new List<String>(values);
    }
    
    /**
     * Returns all Pest Service Products that are Active
     */
    public static Map<String, EDW_ViewModels.ProductWrapper> getAllPestServiceProducts() {
        Map<String, EDW_ViewModels.ProductWrapper> productMap = new Map<String, EDW_ViewModels.ProductWrapper>();
        
        for (PricebookEntry pbe : Database.query(QueryGenerator.queryAllPestServiceProducts('Pricebook2Id = \'' + QueryUtils.fieldServiceSettings.Standard_Pricebook_Id__c + '\' AND IsActive = TRUE AND Product2.IsActive = TRUE AND Product2.IsPestService__c = TRUE AND Product2.Allows_One_Time__c = TRUE AND Product2.Product_Unique_Key__c != NULL'))) {
            Decimal duration = pbe.Product2.Service_Work_Type__r.DurationType == QueryUtils.fieldServiceSettings.Work_Type_Hours_Duration__c
                ? pbe.Product2.Service_Work_Type__r.EstimatedDuration 
                : (pbe.Product2.Service_Work_Type__r.EstimatedDuration / MINUTES_IN_HOUR);
                    
            productMap.put(pbe.Product2.Product_Unique_Key__c, new EDW_ViewModels.ProductWrapper(pbe.Id, pbe.Product2Id, pbe.Product2.Name, pbe.Product2.ProductCode, pbe.Product2.Service_Work_Type__r.DurationType, duration, pbe.Product2.Infestation_Level__c, pbe.Product2.Treatment_Type__c, pbe.Product2.Number_of_Rooms_NA__c ? '' : pbe.Product2.Number_of_Rooms__c));
        }
        
        productMap.remove(null);
        
        return productMap;
    }
    
    /**
     * Inserts a new Order into the system
     * 
     * @param accountId  the Id of the Account to be on the Order
     * @param contactId  the Id of the Contact to be on the Order
     * @param poNumber  the PO Number to be on the Order
     */
    public static Order createNewOrder(Account account, String contactId, String poNumber) {
        Date today = System.today();
        String formatted = EMPTY_SPACE + Date.newInstance(today.year(), today.month(), today.day()).format();
        
        Order order = new Order(
                AccountId = account.Id,
                ShipToContactId = contactId,
                Pricebook2Id = QueryUtils.fieldServiceSettings.Standard_Pricebook_Id__c,
                Emergency__c = true,
                Status = QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c,
                EffectiveDate = today,
                Line_of_Businesses__c = QueryUtils.fieldServiceSettings.Pest_LOB__c,
                Name = QueryUtils.emergencyDispatchSettings.Order_Name__c + formatted,
                PoNumber = poNumber,
                User_Specified_Estimated_Duration__c = 0,
                Number_of_Resources__c = 1
        );
        
        DatetimeRecord defaultDateTimeValues = getDateTimeRecordFromAccount(new Map<Id, Account> { account.Id => account }, order);
        
        order.Service_Appointment_Scheduled_Start_Time__c = String.valueOf(defaultDateTimeValues.startDate.time());
        
        return order;
    }
    
    /**
     * Returns up to date information on the specified Order and its OrderItems
     * 
     * @param orderId  the Id of the Order to be queried
     */
    public static Order getUpdatedOrderInformation(String orderId) {
        return [
                SELECT
                        Id, OrderNumber, Description, TotalAmount, AccountId, Account.Name, Order_Cancelled__c,
                        Account.OperatingHoursId, Account.Pest_Control_OperatingHoursId__c, Account.Is_Multi_Res__c,
                        Account.PO_Required_for_Orders__c, Account.PO_Required_on_Line_Item__c,
                        Account.AccPac_Account__c, Site_Survey__c, ShipToContactId, ShipToContact.FirstName,
                        ShipToContact.LastName, Pricebook2Id, Emergency__c, Status, EffectiveDate,
                        Line_of_Businesses__c, Name, PoNumber, User_Specified_Estimated_Duration__c,
                        Number_of_Resources__c, Is_PO_Provided_by_Customer__c,
                        Service_Appointment_Scheduled_Start_Time__c, Override_Account_Operating_Hours__c,
                        (SELECT Id, Product2.Service_Work_Type__r.EstimatedDuration,
                                Product2.Service_Work_Type__r.DurationType
                        FROM OrderItems)
                FROM Order
                WHERE Id = :orderId
        ];
    }
    
    /**
     * Retrieves a map of the main Operating Hours on the Account, along with the Pest Control Operating Hours
     * 
     * @param accountMap  all Accounts that require retrieval of their regular Operating Hours and Pest Control Operating Hours
     */
    public static Map<String, Id> buildAccountOperatingHourKeys(Map<Id, Account> accountMap) {
        Map<String, Id> accountLOBOperatingHoursMap = new Map<String, Id>();
        
        if (!accountMap.isEmpty()) {
            for (Account a : accountMap.values()) {
                accountLOBOperatingHoursMap.put(a.Id + DELIMITER + QueryUtils.fieldServiceSettings.Pest_LOB__c, a.Pest_Control_OperatingHoursId__c);
                accountLOBOperatingHoursMap.put(String.valueOf(a.Id), a.OperatingHoursId);
            }
        }
        
        accountLOBOperatingHoursMap.remove(null);
        
        return accountLOBOperatingHoursMap;
    }
    
    /**
     * Retrieves the TimeSlot records related to each OperatingHour ID
     * 
     * @param operatingHoursIds  The IDs of the OperatingHour records to retrieve the TimeSlot records
     */
    public static Map<Id, OperatingHours> getOperatingHoursOnAccount(Set<Id> operatingHoursIds) {
        return new Map<Id, OperatingHours>([SELECT Id, Name, TimeZone, 
        	(SELECT Id, DayOfWeek, StartTime, EndTime FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime) 
            FROM OperatingHours WHERE Id IN :operatingHoursIds]);
    }
    
    /**
     * Calculates the Start Time and End Time values for the given Order
     * 
     * @param o  The Order record leveraged to calculate the date/time values
     * @param accountOperatingHoursMap  The IDs of the OperatingHours to retrieve the correct OperatingHour record(s)
     * @param operatingHoursMap  The OperatingHours used for date/time calculations
     */
    public static DatetimeRecord getCalculatedDateTimeRecordFromOperatingHours(Order o, Map<String, Id> accountOperatingHoursMap, Map<Id, OperatingHours> operatingHoursMap) {
        String key = o.AccountId + DELIMITER + QueryUtils.fieldServiceSettings.Pest_LOB__c;
        OperatingHours oh = operatingHoursMap.get(accountOperatingHoursMap.get(key));
        
        Datetime startDate =  Datetime.newInstance(o.EffectiveDate.year(), o.EffectiveDate.month(), o.EffectiveDate.day(), 00, 00, 00);
        Datetime endDate =  Datetime.newInstance(o.EffectiveDate.year(), o.EffectiveDate.month(), o.EffectiveDate.day(), 23, 59, 59);
        
        DatetimeRecord dateTimeInstance = new DatetimeRecord(startDate, endDate);
        
        if (oh != null) {
            dateTimeInstance.opHours = oh;
            dateTimeInstance.emergency = o.Emergency__c;
            dateTimeInstance = DatetimeRecord.getWODates(dateTimeInstance, System.now());
        }
        
        return dateTimeInstance;
    }
    
    /**
     * Retrieves a DatetimeRecord instance wrapped neatly to allow a single point of reference
     * 
     * @param accountMap  A map of Account records to get the appropriate OperatingHour records
     * @param order  The Order record leveraged to calculate the date/time values
     */
    public static DatetimeRecord getDateTimeRecordFromAccount(Map<Id, Account> accountMap, Order order) {
        Map<String, Id> operatingHourKeys = buildAccountOperatingHourKeys(accountMap);
        Map<Id, OperatingHours> operatingHours = getOperatingHoursOnAccount(new Set<Id>(operatingHourKeys.values()));        
        
        return getCalculatedDateTimeRecordFromOperatingHours(order, operatingHourKeys, operatingHours);
    }
    
    /**
     * Checks if the PO Number(s) have been input by the user inside a specified window for PO Required Before
     * 
     * @param o  The Order record to have its PO Number(s) validated
     */
    public static Boolean isPORequiredBeforeInTimeWindowSatisfied(Order o) {
        Integer numberOfBusinessDays = EDW_UtilityClass.calculatedNumberOfBusinessDays(o.EffectiveDate, Integer.valueOf(QueryUtils.emergencyDispatchSettings.Number_of_Days_to_Limit_Access__c));
        Integer numberOfDaysForWindow = Integer.valueOf(QueryUtils.emergencyDispatchSettings.Number_of_Days_to_Limit_Access__c);
        
        return (!o.Is_PO_Provided_by_Customer__c && numberOfBusinessDays >= numberOfDaysForWindow) ||
            (o.Is_PO_Provided_by_Customer__c && numberOfBusinessDays >= numberOfDaysForWindow) ||
            (o.Is_PO_Provided_by_Customer__c && numberOfBusinessDays < numberOfDaysForWindow);
    }
    
    /**
     * Builds and returns a list of TableOrderItems for the Current Order in the Emergency Dispatch Wizard
     * 
     * @param mainData  all data stringified
     */
    public static Map<Id, EDW_ViewModels.TableOrderItem> buildTableOrderItemMap(EDW_ViewModels.MainViewModel mainData) {
        Map<Id, EDW_ViewModels.TableOrderItem> rows = new Map<Id, EDW_ViewModels.TableOrderItem>();
        
        Integer offset = (Integer.valueOf(QueryUtils.emergencyDispatchSettings.Pagination_Limit__c) * mainData.pageNumber) - Integer.valueOf(QueryUtils.emergencyDispatchSettings.Pagination_Limit__c);
        
        if (offset < 0) { offset = 0; }
        
        Integer pageLimit = QueryUtils.emergencyDispatchSettings.Pagination_Limit__c == null ? 0 : Integer.valueOf(QueryUtils.emergencyDispatchSettings.Pagination_Limit__c);
        
        Map<Id, OrderItem> orderItems = new Map<Id, OrderItem>((List<OrderItem>)Database.query(QueryGenerator.queryOrderItems('OrderId = \'' + mainData.order.Id + '\' AND Active__c = TRUE ORDER BY CreatedDate DESC LIMIT :pageLimit OFFSET :offset')));
        Map<String, Warranty__c> allWarranties = getAllActiveWarrantiesOnAccount(mainData.account.Id, mainData.order.EffectiveDate);
        
        Map<String, EDW_ViewModels.ProductWrapper> allPestServiceProducts = getAllPestServiceProducts();
        
        for (OrderItem oi : orderItems.values()) {
            EDW_ViewModels.ProductWrapper selectedProduct = allPestServiceProducts.get(oi.Product2.Product_Unique_Key__c);
            
            Survey_Location__c location = null;
            
            if (!String.isBlank(oi.Survey_Location__c)) {
                location = new Survey_Location__c(
                    Id = oi.Survey_Location__c,
                    Name = oi.Survey_Location__r.Name,
                    Number_of_Rooms__c = oi.Survey_Location__r.Number_of_Rooms__c,
                    Service_Order__c = oi.Survey_Location__r.Service_Order__c,
                    Floor__c = oi.Survey_Location__r.Floor__c,
                    Unit_Number__c = oi.Survey_Location__r.Unit_Number__c,
                    Building__c = oi.Survey_Location__r.Building__c,
                    Service_Notes__c = oi.Survey_Location__r.Service_Notes__c,
                    Installation_Notes__c = oi.Survey_Location__r.Installation_Notes__c,
                    Notes__c = oi.Survey_Location__r.Notes__c,
                    Location_Type__c = oi.Survey_Location__r.Location_Type__c,
                    Location_SubType__c = oi.Survey_Location__r.Location_SubType__c
                );
            }
            
            Product2 product = new Product2(Id = selectedProduct.productId, Treatment_Type__c = selectedProduct.treatmentType, Infestation_Level__c = selectedProduct.infestationLevel, Number_of_Rooms__c = selectedProduct.numberOfRooms, Product_Unique_Key__c = oi.Product2.Product_Unique_Key__c);
            Warranty__c warranty = allWarranties.get(oi.Product2.Product_Unique_Key__c);
            
            rows.put(oi.Id, new EDW_ViewModels.TableOrderItem(location, oi.Product2.Infestation_Level__c, product, selectedProduct.numberOfRooms, selectedProduct, warranty, oi.Id, oi.Id, oi, oi.Product2.Treatment_Type__c));
        }
        
        rows.remove(null);
        
        return rows;
    }
    
    /**
     * Returns all active Warranties related to an Account that won't expire prior to an Order starting
     * 
     * @param accountId  the Id of the Account related to the Warranty
     * @param orderEffectiveDate  the EffectiveDate of the relevant Order
     */
    public static Map<String, Warranty__c> getAllActiveWarrantiesOnAccount(Id accountId, Date orderEffectiveDate) {
        Map<String, Warranty__c> warrantyMap = new Map<String, Warranty__c>();
        
        if (QueryUtils.emergencyDispatchSettings.Activate_Warranty_Logic__c) {
            for (Warranty__c warranty : [SELECT Id, Warranty_End__c, Product__r.Product_Unique_Key__c FROM Warranty__c WHERE Ship_To__c = :accountId AND Active__c = TRUE AND Warranty_End__c >= :orderEffectiveDate]) {
                warrantyMap.put(warranty.Product__r.Product_Unique_Key__c, warranty);
            }
            
            warrantyMap.remove(null);
        }
        
        return warrantyMap;
    }
    
    /**
     * Returns the estimated duration from the Service Work Type related to each OrderItem Product
     * 
     * @param orderItems  the OrderItem records used to calcualte the estimated duration
     */
    public static Decimal calculateWorkTypeDuration(List<OrderItem> orderItems) {
        Decimal total = 0, duration = 0;
        
        for (OrderItem oi : orderItems) {
            duration = oi.Product2.Service_Work_Type__r.DurationType == QueryUtils.fieldServiceSettings.Work_Type_Hours_Duration__c
                ? oi.Product2.Service_Work_Type__r.EstimatedDuration 
                : (oi.Product2.Service_Work_Type__r.EstimatedDuration / MINUTES_IN_HOUR);
                    
            total += duration;
        }
        
        return total.setScale(2);
    }
    
    /**
     * Checks if the "Save & Next" button on the Configure Appointment screen in the Emergency Dispatch Wizard should be disabled
     * 
     * @param mainData  all data stringified
     */
    public static Boolean isNextDisabled(EDW_ViewModels.MainViewModel mainData) {
        Integer rowSizeOnPage = mainData.tableRows.size();
        Integer numberOfLastRowVisible = rowSizeOnPage * mainData.pageNumber;
        
        return mainData.tableRows.size() < QueryUtils.emergencyDispatchSettings.Pagination_Limit__c || numberOfLastRowVisible == mainData.orderItemCount;
    }
    
	/**
     * Returns all labels relevant to the Resource Preference table
     */
    public static Set<String> queryResourcePreferenceColumnNames() {
        Set<String> columnNames = new Set<String>();
        
        for (Schema.FieldSetMember f : SObjectType.Technician_Preference__c.FieldSets.Technician_Preference_Table_Field_Set.getFields()) {
            columnNames.add(f.getLabel());
        }
        
        return columnNames;
    }
    
    /**
     * Builds the product unique key to get the appropriate Product from the system
     * 
     * @param treatmentType  the Treatment Type portion of the Product Unique Key
     * @param infestationLevel  the Infestation Level portion of the Product Unique Key
     * @param numberOfRooms  the Number of Rooms portion of the Product Unique Key
     * @param numberOfRoomsNotApplicable  checks if the Number of Rooms portion of the Product Unique Key is to be leveraged
     */
    public static String buildProductKey(String treatmentType, String infestationLevel, String numberOfRooms, Boolean numberOfRoomsNotApplicable) {
        return String.isBlank(numberOfRooms) || (numberOfRoomsNotApplicable != null && numberOfRoomsNotApplicable)
            ? treatmentType + EDW_UtilityClass.DELIMITER + infestationLevel
            : treatmentType + EDW_UtilityClass.DELIMITER + numberOfRooms + EDW_UtilityClass.DELIMITER + infestationLevel;
    }
    
    /**
     * Recalculates the Duration for all remaining ServiceAppointment records after a ServiceAppointment is cancelled or deleted
     *
     * @param workOrderId  The ID of the Work Order leveraged to retrieve the related ServiceAppointment records
     * @param serviceAppointmentBeingDeletedId  The ID of the ServiceAppointment being deleted, if specified
     */
    public static Map<Id, ServiceAppointment> recalculateServiceAppointmentDurations(String workOrderId, String serviceAppointmentBeingDeletedId) {
        Map<Id, ServiceAppointment> remainingAppointments = getRemainingActiveServiceAppointments(workOrderId);
        
        if (!String.isBlank(serviceAppointmentBeingDeletedId)) {
            remainingAppointments.remove(serviceAppointmentBeingDeletedId);
        }
        
        Decimal totalJobDuration = getTotalDurationFromWorkOrder(workOrderId),
            numberOfRemainingServiceAppointments = remainingAppointments.size();
        Decimal averageDurationToGive = totalJobDuration / numberOfRemainingServiceAppointments;
        averageDurationToGive = averageDurationToGive.setScale(2);
        
        for (ServiceAppointment sa : remainingAppointments.values()) {
            sa.Duration = setServiceAppointmentDuration(averageDurationToGive);
        }
        
        return remainingAppointments;
    }
    
    /**
     * Clones an OrderItem record and provides updates to specified values before being returned to the calling method
     * 
     * @param  preserveId  Determines whether the ID of the original object is preserved or cleared in the duplicate. If set to true, the ID is copied to the duplicate. The default is false, that is, the ID is cleared.
     * @param  isDeepClone  Determines whether the method creates a full copy of the SObject field or just a reference.
     * @param  preserveReadonlyTimestamps  Determines whether the read-only timestamp fields are preserved or cleared in the duplicate.
     * @param  preserveAutonumber  Determines whether auto number fields of the original object are preserved or cleared in the duplicate.
     * @param  orderItemToClone  The OrderItem record to be cloned
     * @param  selectedProduct  The EDW_ViewModels.ProductWrapper instance that holds the Pricebook Entry Id and Product2 Id values
     * @param  warranty  The Warranty__c record to be leveraged. This value can be null.
     */
    public static OrderItem cloneOrderItemRecord(Boolean preserveId, Boolean isDeepClone, Boolean preserveReadonlyTimestamps, Boolean preserveAutonumber, OrderItem orderItemToClone, EDW_ViewModels.ProductWrapper selectedProduct, Warranty__c warranty) {
        OrderItem replacementOrderProduct = orderItemToClone.clone(preserveId, isDeepClone, preserveReadonlyTimestamps, preserveAutonumber);
        replacementOrderProduct.PricebookEntryId = selectedProduct.pricebookEntryId;
        replacementOrderProduct.Product2Id = selectedProduct.productId;
        replacementOrderProduct.Service_Price_Per_Unit__c = 0;
        replacementOrderProduct.Has_Warranty__c = warranty != null;
        
        return replacementOrderProduct;
    }
    
    /**
     * Deletes Survey Asset Location records that are no longer tied to an Order from the Emergency Dispatch Wizard
     * 
     * @param orderItemIds  The IDs of the Order Item records that have been deleted during a "replace" process
     */
    public static void deleteSurveyAssetLocationRecords(Set<String> orderItemIds) {
        List<Survey_Asset_Location__c> salsToDelete = new List<Survey_Asset_Location__c>();
        
        for (Order_Item_Location__c oil : [SELECT Id, Survey_Asset_Location__c FROM Order_Item_Location__c WHERE Order_Product__c IN :orderItemIds]) {
            salsToDelete.add(new Survey_Asset_Location__c(Id = oil.Survey_Asset_Location__c));
        }
        
        delete salsToDelete;
    }
    
    /**
     * Updates a Survey Asset Location record to have the up to date Survey Location reference
     * 
     * @param oi  The OrderItem record that is to have its related Survey Asset Location record be updated to the specified Survey Location record
     */
    public static void updateSurveyAssetLocationRecords(OrderItem oi) {
        List<Survey_Asset_Location__c> salsToUpdate = new List<Survey_Asset_Location__c>();
        
        for (Order_Item_Location__c oil : [SELECT Id, Survey_Asset_Location__c, Survey_Asset_Location__r.Survey_Location__c FROM Order_Item_Location__c WHERE Order_Product__c = :oi.Id]) {
            salsToUpdate.add(new Survey_Asset_Location__c(Id = oil.Survey_Asset_Location__c, Survey_Location__c = oi.Survey_Location__c));
        }
        
        update salsToUpdate;
    }
    
    /**
     * Returns the complete duration of all ServiceAppointment records related to a Work Order
     *
     * @param workOrderId  The ID of the Work Order leveraged to retrieve all ServiceAppointment records
     */
    public static Decimal getTotalDurationFromWorkOrder(String workOrderId) {
        return [SELECT Duration FROM WorkOrder WHERE Id = :workOrderId].Duration;
    }
    
    /**
     * Retrieves all ServiceAppointment records that are not cancelled
     *
     * @param workOrderId  
     */
    public static Map<Id, ServiceAppointment> getRemainingActiveServiceAppointments(String workOrderId) {
        return new Map<Id, ServiceAppointment>([SELECT Id, Status FROM ServiceAppointment WHERE Status != :QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c AND ParentRecordId = :workOrderId]);
    }
    
    /**
     * Checks if the provided date is in the past
     *
     * @param theDate  The date to be validated
     */
    public static Boolean isDateInPast(Date theDate) {
        return theDate < System.today();
    }
    
    /**
     * Checks if the provided date is a weekday
     *
     * @param theDate  The date to be validated
     */
    public static Boolean isDateAWeekDay(Date theDate) {
        Integer dayOfWeek = Math.Mod(Date.newInstance(1900, 1, DAYS_IN_WEEK).daysBetween(theDate), DAYS_IN_WEEK);
        
        return dayOfWeek != 6 && dayOfWeek != 0;
    }
    
    /**
     * Calculates how many Monday-Friday days are between the current date and the specified date
     *
     * @param theDate  The date to be validated
     * @param numberOfDays  The number of days leveraged to calculate against
     */
    public static Integer calculatedNumberOfBusinessDays(Date theDate, Integer numberOfDays) {
        Integer index = numberOfDays == null ? 1 : Integer.valueOf(numberOfDays);
                
        while (index > 0) {
            theDate = theDate.addDays(-1);
            Integer dayOfWeek = Math.Mod(Date.newInstance(1900, 1, DAYS_IN_WEEK).daysBetween(theDate), DAYS_IN_WEEK);
            
            if (dayOfWeek != 6 && dayOfWeek != 0) {
                index--;
            }
        }
        
        return Date.today().daysBetween(theDate);
    }
    
    /**
     * Checks if the specified user is assigned to the specified permission set
     *
     * @param assigneeId  The ID of the user being checked against
     * @param permissionSetId  The ID of the permission set being checked against
     */
    public static Boolean checkIfUserHasAssignedPermissionSet(String assigneeId, String permissionSetId) {
        return [SELECT COUNT() FROM PermissionSetAssignment WHERE AssigneeId =: assigneeId AND PermissionSetId =: permissionSetId LIMIT 1] > 0;
    }
    
    /**
     * Checks if the provided date is within a specified range
     *
     * @param theDate  The date to be validated
     */
    public static Boolean isDateValidForRange(Date theDate) {
        return calculatedNumberOfBusinessDays(theDate, Integer.valueOf(QueryUtils.emergencyDispatchSettings.Customer_Ticket_Minimum_Business_Days__c)) >= 0 && System.today().daysBetween(theDate) <= QueryUtils.emergencyDispatchSettings.Customer_Ticket_Maximum_Number_of_Days__c;
    }
    
    /**
     * Calculates the minimum valid requested date and serves as the default date on page load
     */
    public static Date calculateMinimumDate() {
        Integer index = QueryUtils.emergencyDispatchSettings.Customer_Ticket_Minimum_Business_Days__c == null ? 1 : Integer.valueOf(QueryUtils.emergencyDispatchSettings.Customer_Ticket_Minimum_Business_Days__c);
        Date theDate = System.today();
        Integer dayOfWeek = Math.Mod(Date.newInstance(1900, 1, DAYS_IN_WEEK).daysBetween(theDate), DAYS_IN_WEEK);
        
        while (index > 0) {
            theDate = theDate.addDays(1);
            dayOfWeek = Math.Mod(Date.newInstance(1900, 1, 7).daysBetween(theDate), 7);
            
            if (dayOfWeek != 6 && dayOfWeek != 0) {
                index--;
            }
        }
        
        return theDate;
    }
    
    /**
     * Updates a list of ServiceAppointment records to a specified status and returns a map of the results
     *
     * @param appointments  The list of ServiceAppointment records to have their statuses updated
     * @param toStatus  The status to update the ServiceAppointment records to
     */
    public static Map<Id, ServiceAppointment> moveServiceAppointmentsToSpecifiedStatus(List<ServiceAppointment> appointments, String toStatus) {
        Map<Id, ServiceAppointment> appointmentsToUpdate = new Map<Id, ServiceAppointment>(appointments);
        
        for (ServiceAppointment sa : appointmentsToUpdate.values()) {
            sa.Status = toStatus;
        }
        
        update appointmentsToUpdate.values();
        
        return appointmentsToUpdate;
    }
    
    /**
     * Retrieves the base URL of the org instance
     */
    public static String getInstanceUrl() {
        return System.Url.getSalesforceBaseURL().toExternalForm();
    }
    
    /**
     * Flags all necessary Orders as Pest Emergency Not Invoicing
     * 
     * @param orders  The Orders to have Pest_Emergency_Not_Invoicing__c be set to TRUE
     */
    public static void updateOrdersToNotInvoicing(Map<Id, Order> orders) {
        for (Order o : orders.values()) {
            o.Pest_Emergency_Not_Invoicing__c = true;
        }
        
        if (orders.size() > 0) {
        	update orders.values();
        }
    }
    
    /**
     * Converts a duration in hours to a duration in minutes
     * 
     * @param totalDurationInHours  The duration to be converted
     */
    public static Decimal calculateDurationInMinutes(Decimal totalDurationInHours) {
        return (totalDurationInHours * 60).setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Calculates the average duration to be provided to each ServiceAppointment record
     * 
     * @param totalDurationInHours  The duration to be split
     * @param numberOfResources  The Number of Resources on an Order
     */
    public static Decimal calculateDurationPerServiceAppointment(Decimal totalDurationInHours, Decimal numberOfResources) {
        return ((totalDurationInHours * 60) / numberOfResources).setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Converts a duration in hours to a duration in minutes
     * 
     * @param totalDurationInHours  The duration to be converted
     */
    public static Decimal setServiceAppointmentDuration(Decimal duration) {
        return duration >= QueryUtils.emergencyDispatchSettings.Service_Appointment_Minimum_Duration__c ? duration : QueryUtils.emergencyDispatchSettings.Service_Appointment_Minimum_Duration__c;
    }
    
    /**
     * Recalculates durations for Service Appointment records and also sets the proper service window
     * 
     * @param wo  The Work Order record to have its Service Appointments have their durations configured
     * @param durationPerAppointment  The duration in minutes for each Service Appointment record
     */
    public static List<ServiceAppointment> recalculateDurationsAndSetServiceWindows(WorkOrder wo, Decimal durationPerAppointment) {
        Datetime earliestStartDate = Datetime.newInstance(wo.StartDate.year(), wo.StartDate.month(), wo.StartDate.day(), wo.StartDate.hour(), wo.StartDate.minute(), wo.StartDate.second());
        Datetime dueDate = Datetime.newInstance(wo.EndDate.year(), wo.EndDate.month(), wo.EndDate.day(), 23, 59, 59);
        List<ServiceAppointment> appointmentsToUpsert = new List<ServiceAppointment>();
        
        if (!wo.ServiceAppointments.isEmpty()) {
            for (ServiceAppointment sa : wo.ServiceAppointments) {
                if (sa.Status != QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c) {
                    sa.Duration = setServiceAppointmentDuration(durationPerAppointment);
                    sa.EarliestStartTime = earliestStartDate;
                    sa.DueDate = dueDate;
                    appointmentsToUpsert.add(sa);
                }
            }
        }
        
        return appointmentsToUpsert;
    }
    
    /**
     * Grabs and sets the requested configuration of the Path component
     * 
     * @param mode  The mode of the Emergency Dispatch Wizard to initialize the Path component accordingly
     */
    public static List<EDW_ViewModels.Path> initializePaths(String mode) {
     	final String SELECT_CUSTOMER = 'Select Customer', CONFIGURE_APPOINTMENT = 'Configure Appointment';
        Map<Decimal, EDW_ViewModels.Path> paths = new Map<Decimal, EDW_ViewModels.Path>();
        
        for (EDW_Path_Names__mdt path : [SELECT MasterLabel, Sort_Order__c FROM EDW_Path_Names__mdt ORDER BY Sort_Order__c]) {
            EDW_ViewModels.Path pathViewModel = new EDW_ViewModels.Path(path.MasterLabel);
            
            if (mode == NEW_MODE && pathViewModel.pathName == SELECT_CUSTOMER) {
                pathViewModel.isCurrentPathItem = true;
            } else if (mode == EDIT_MODE && pathViewModel.pathName == CONFIGURE_APPOINTMENT) {
                paths.get(path.Sort_Order__c - 1).isStepComplete = true;
                pathViewModel.isCurrentPathItem = true;
            }
            
            paths.put(path.Sort_Order__c, pathViewModel);
        }
        
        return paths.values();
    }
    
    //Begin:Shashi:10-4-2019:Populate related infestation and rooms
    /**
     * Fetch the dependent treatment and number of rooms
     **/
    public static List<String> getInfestationAndRooms(String TreatmentType,String InfestationLevel,String strField){
        List<String> optionList = new List<String>();
        
        if(!isLocationRoomsExec){
        	String qry = 'SELECT Treatment_Type__c,Infestation_Level__c,Number_of_Rooms__c FROM product2 ' +
                         'WHERE Treatment_Type__c != null OR Infestation_Level__c != null OR Number_of_Rooms__c !=null ' +
                         'GROUP BY Treatment_Type__c,Infestation_Level__c,Number_of_Rooms__c';
            
            List<AggregateResult> groupedResults = Database.query(qry);
            for (AggregateResult aggres:groupedResults){
                String treatType='',infestLevel='N/A',numOfRooms='N/A',roomKey='';
                Set<String> lstInfestLevel = new Set<String>();
                Set<String> lstNOFRooms = new Set<String>();
                
                if(aggres.get('Treatment_Type__c')!=null){treatType=String.valueOf(aggres.get('Treatment_Type__c'));}
                if(aggres.get('Infestation_Level__c')!=null){infestLevel=String.valueOf(aggres.get('Infestation_Level__c'));}
                if(aggres.get('Number_of_Rooms__c')!=null){numOfRooms=String.valueOf(aggres.get('Number_of_Rooms__c'));}
                
                if(!mapTreatInfestLvl.containsKey(treatType)){
                    lstInfestLevel.add(infestLevel);
                    mapTreatInfestLvl.put(treatType,lstInfestLevel);
                } else {
                    lstInfestLevel = mapTreatInfestLvl.get(treatType);
                    lstInfestLevel.add(infestLevel);
                }
                roomKey = treatType + '-' + infestLevel;
                if(!mapTreatInfestLvlRooms.containsKey(roomKey)){
                   //Fix To Remove 'N/A' From Number of rooms picklist - Irfan 25-Oct-19
                    if(numOfRooms != 'N/A'){
                    	lstNOFRooms.add(numOfRooms);
                    }
                    mapTreatInfestLvlRooms.put(roomKey,lstNOFRooms);
                } else {
                    lstNOFRooms = mapTreatInfestLvlRooms.get(roomKey);
                    lstNOFRooms.add(numOfRooms);
                }
            }
            
            isLocationRoomsExec = true;
        }
        
        if(strField.equals('INFLVL')){
            if(mapTreatInfestLvl.containsKey(TreatmentType)){
                return new List<String>(mapTreatInfestLvl.get(TreatmentType));
            }
        }
        
        if(strField.equals('ROOMS')){
            String key = TreatmentType + '-' + InfestationLevel;
            if(mapTreatInfestLvlRooms.containsKey(key)){
                return new List<String>(mapTreatInfestLvlRooms.get(key));
            }
        }
        
        return optionList;
    }
    //End
}