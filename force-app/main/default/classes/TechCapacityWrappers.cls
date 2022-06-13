/**
 * @FileName: TechCapacityWrappers
 * @Description: Wrapper classes for TechCapacityCtrl
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/24/2019      Created
 *-----------------------------------------------------------  
 */
public inherited sharing class TechCapacityWrappers {

    public class TechWrapper {
        public ServiceResource tech;
        public String shift;
        public Integer travelTime;
        public List<String> skills;
        public List<Technician_Utilization_Setting__mdt> utilizations;
        public Integer averageShift;

        public TechWrapper(ServiceResource tech) {
            if(tech.Travel_Factor__c == null) tech.Travel_Factor__c = 0;

            this.tech = tech;
            setShift(tech);
            setSkills(tech);
            setUtilizations();
            getAverageShift(tech);
        }

        private void setShift(ServiceResource tech) {
            if(!tech.ServiceTerritories.isEmpty() && String.isNotBlank(tech.ServiceTerritories[0].OperatingHoursId)) {
                this.shift = tech.ServiceTerritories[0].OperatingHours.Name;
            } else {
                this.shift = 'No Primary Service Territory Found';
            }
        }

        private void setSkills(ServiceResource tech) {
            List<String> skillList = new List<String>();

            for(ServiceResourceSkill skill : tech.ServiceResourceSkills) {
                skillList.add(skill.Skill.MasterLabel + ' (' + skill.SkillLevel + ')');
            }

            this.skills = skillList;
        }

        private void setUtilizations() {
            List<Technician_Utilization_Setting__mdt> utilizations = [
                    SELECT Id, MasterLabel, DeveloperName, Minimum_Percent__c, Maximum_Percent__c
                    FROM Technician_Utilization_Setting__mdt
                    WHERE Minimum_Percent__c != NULL
                    ORDER BY Maximum_Percent__c DESC
            ];

            for (Technician_Utilization_Setting__mdt utilization : utilizations) {
                if (utilization.Maximum_Percent__c == null) {
                    utilization.MasterLabel += ' (+' + (utilization.Minimum_Percent__c - 1).setScale(0, RoundingMode.HALF_UP) + '%)';
                } else if (utilization.DeveloperName != 'No_Utilization') {
                    utilization.MasterLabel += ' (' + utilization.Minimum_Percent__c.setScale(0, RoundingMode.HALF_UP) + '% - ' + utilization.Maximum_Percent__c.setScale(0, RoundingMode.HALF_UP) + '%)';
                }
            }

            this.utilizations = utilizations;
        }

        private void getAverageShift(ServiceResource tech) {
            this.averageShift = 0;
            this.travelTime = 0;

            List<ServiceTerritoryMember> serviceTerritories = tech.ServiceTerritories;

            if(serviceTerritories.isEmpty()) return;

            OperatingHours hours = [
                    SELECT Id,
                    (SELECT Id, DayOfWeek, StartTime, EndTime
                    FROM TimeSlots)
                    FROM OperatingHours
                    WHERE Id = :tech.ServiceTerritories[0].OperatingHoursId
            ];

            if(hours.TimeSlots.isEmpty()) return;

            Set<Integer> daysOfWeek = new Set<Integer>();
            Long totalTime = 0;
            Time dayBreakPoint = Time.newInstance(5,0,0,0);

            for(TimeSlot ts : hours.TimeSlots) {
                Datetime st = Datetime.newInstanceGmt(Date.today(), ts.StartTime);
                Datetime et;

                if(ts.EndTime == Time.newInstance(0,0,0,0)) {
                    et = Datetime.newInstanceGmt(Date.today(), ts.EndTime).addDays(1);
                } else {
                    et = Datetime.newInstanceGmt(Date.today(), ts.EndTime);
                }

                Integer dayInt = ServicePlanConstants.DAY_OF_WEEK_INTEGERS.get(ts.DayOfWeek);

                if(ts.StartTime < dayBreakPoint && ts.EndTime > dayBreakPoint) {
                    daysOfWeek.add(dayInt - 1);
                    daysOfWeek.add(dayInt);
                } else if(ts.StartTime < dayBreakPoint && ts.EndTime < dayBreakPoint) {
                    daysOfWeek.add(dayInt - 1);
                } else {
                    daysOfWeek.add(dayInt);
                }

                Long shiftLength = et.getTime() - st.getTime();

                if(shiftLength != 0) {
                    totalTime += shiftLength / 60000;
                }
            }

            if(!daysOfWeek.isEmpty()) {
                this.averageShift = Integer.valueOf(totalTime) / daysOfWeek.size();
                this.travelTime = Integer.valueOf((averageShift * (tech.Travel_Factor__c / 100)).setScale(0, RoundingMode.HALF_UP));
            }
        }
    }

    public class ServicePlanCriteria {
        public TechWrapper technician;
        public List<CalendarDay> days;
    }

    public class SiteSurveyWrapper {
        public Map<Id,Account> accountMap;
        public Map<Id,Site_Survey__c> siteSurveyMap;

        public SiteSurveyWrapper(List<Service_Plan__c> sps) {
            getAccountMap(sps);
            getSiteSurveyMap();
        }

        private void getAccountMap(List<Service_Plan__c> sps) {
            Set<Id> accountIds = new Set<Id>();

            for(Service_Plan__c sp : sps) {
                accountIds.addAll(getAccountIds(sp));
            }

            accountMap = new Map<Id,Account>([
                    SELECT Id, Name, Customer_Tiers__c, Site_Survey__c, AccPac_Account__c, ShippingStreet, ShippingCity,
                            ShippingPostalCode, OperatingHours.Name, Hygiene_Operating_Hours__r.Name,
                            Chemical_Operating_Hours__r.Name, Pest_Control_Operating_Hours__r.Name
                    FROM Account
                    WHERE Id IN :accountIds
                    ORDER BY ShippingPostalCode ASC
            ]);
        }

        /*
         * @Name        getAccountIds
         * @Description Get all Account Ids associated to the specified Service Plan order items
         * @Author      Graeme Ward
         * @Params      sp: Service Plan record
         * @Return      Set<Id>: Set of Account ids
         */
        private Set<Id> getAccountIds(Service_Plan__c sp) {
            Set<Id> accountIds = new Set<Id>();

            for(OrderItem oi : sp.Order_Products__r) {
                accountIds.add(oi.Account_Id__c);
            }

            return accountIds;
        }

        private void getSiteSurveyMap() {
            Set<Id> siteSurveyIds = ApexUtils.getIdsFromField(
                    (List<SObject>) accountMap.values(),
                    'Site_Survey__c'
            );

            siteSurveyMap = ServicePlanUtils.getSiteSurveyMap(siteSurveyIds);
        }
    }

    public class CalendarDay {
        public String d;
        public Integer num;
        public String dayName;
        public String month;
        public Integer calls;
        public Double assets;
        public Decimal minutes;
        public Decimal travelTime;
        public Decimal rR;
        public String utilization;
        public String pastDay;
        public Map<Id,AccountWrapper> accounts;

        public CalendarDay() {
            this.calls = 0;
            this.assets = 0;
            this.minutes = 0;
            this.travelTime = 0;
            this.rR = 0;
        }
    }

    public class AccountWrapper {
        public Account acc;
        public String operatingHours;
        public String operatingHoursId;
        public Site_Survey__c survey;
        public Decimal duration;
        public Decimal adjustments;
        public Double assetCount;
        public Map<String,Double> assetCountByFamily;
        public Map<String,ServicePlanAssetWrapper> assetMap;
        public List<ServicePlanAssetWrapper> assets;
        public Set<Id> productIds;

        public AccountWrapper(Account a, Site_Survey__c ss) {
            this.acc = a;
            this.survey = ss;
            this.duration = 0;
            this.adjustments = 0;
            this.assetCount = 0;
            this.assetCountByFamily = new Map<String,Double>();
            this.assetMap = new Map<String,ServicePlanAssetWrapper>();
            this.assets = new List<ServicePlanAssetWrapper>();
            this.productIds = new Set<Id>();
        }
    }
}