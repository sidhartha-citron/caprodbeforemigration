/**
* Name: SpawnPestEmergencyServiceAppointments
* Author: PwC
* Date Created: April 23, 2019
* Purpose: To generate the Pest Emergency Service Appointments from the Emergency Dispatch Wizard app
*/
public class SpawnPestEmergencyServiceAppointments {
    private static Emergency_Dispatch_Wizard_Setttings__c edwSettings = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
    private static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    private static final String DELIMITER = '-';
    private static final Integer MINIMUM_SA_COUNT_FOR_STATUS_UNSYNC = 1;
    
    /**
     * Generates Pest Emergency Service Appointments as specified
     * 
     * @param workOrderIds  represents all Work Orders to have Service Appointments be generated 
     * @param totalDuration  the total duration to be spread between all generated Service Appointments
     */
    public static Set<Id> generatePestEmergencyServiceAppointments(Set<Id> workOrderIds, Decimal totalDuration) {
        Map<Id, List<ServiceAppointment>> appointments = new Map<Id, List<ServiceAppointment>>();
        Map<String, SkillRequirement> skillRequirements = new Map<String, SkillRequirement>();
        Map<String, SkillRequirement> alreadyExistingRequirements = new Map<String, SkillRequirement>();
        List<ServiceAppointment> appointmentsToUpsert = new List<ServiceAppointment>();
        Set<Id> siteSurveyIds = new Set<Id>();
        Set<String> skillIds = new Set<String>();
        
        for (Pest_Emergency_Required_Skill__mdt skill : [SELECT Skill_Id__c FROM Pest_Emergency_Required_Skill__mdt]) {
            skillIds.add(skill.Skill_Id__c);
        }
        
        Map<Id, Skill> pestEmergencySkills = new Map<Id, Skill>([SELECT Id FROM Skill WHERE Id IN :skillIds]);
        
        Map<Id, WorkOrder> workOrders = new Map<Id, WorkOrder>([SELECT Id, ServiceTerritoryId, StartDate, EndDate, Order__c, AccountId, Account.Is_Multi_Res__c, Emergency__c, Line_of_Business__c, ContactId, Type__c, Status, Order__r.Number_of_Resources__c, Site_Survey__r.Pest_WorkOrder_Calculation_Adjustment__c, Site_Survey__r.Min_Pest_Work_Order_Lines__c,
                             (SELECT Id, EID__c, Status, Duration, Pest_Emergency_Dedicated_Count__c FROM ServiceAppointments ORDER BY Pest_Emergency_Dedicated_Count__c DESC),
                             (SELECT Id, SkillId, SkillLevel FROM SkillRequirements WHERE SkillId IN :pestEmergencySkills.keySet())
                             FROM WorkOrder WHERE Id IN :workOrderIds]);
        
        for (WorkOrder wo : workOrders.values()) {
            siteSurveyIds.add(wo.Site_Survey__c);
        }
        
        for (WorkOrder wo : workOrders.values()) {
            Integer numberOfNonCancelledServiceAppointments = 0;
            
            if (!wo.ServiceAppointments.isEmpty()) {
                for (ServiceAppointment sa : wo.ServiceAppointments) {
                    if (sa.Status != dataSets.Work_Order_Cancelled_Status__c) {
                        numberOfNonCancelledServiceAppointments++;
                    }
                }
            }
            
            if (numberOfNonCancelledServiceAppointments > wo.Order__r.Number_of_Resources__c) {
                //do nothing and skip - deletion will take care of any recalculation of the duration
                continue;
            }
            
            Datetime earliestStartDate = Datetime.newInstance(wo.StartDate.year(), wo.StartDate.month(), wo.StartDate.day(), wo.StartDate.hour(), wo.StartDate.minute(), wo.StartDate.second());
            Datetime dueDate = Datetime.newInstance(wo.EndDate.year(), wo.EndDate.month(), wo.EndDate.day(), 23, 59, 59);
            
            Decimal numberOfResourcesRequested = wo.Order__r.Number_of_Resources__c;
            
            if (!appointments.containsKey(wo.Id)) {
                appointments.put(wo.Id, new List<ServiceAppointment>());
            }
            
            Decimal durationPerAppointment = EDW_UtilityClass.calculateDurationPerServiceAppointment(totalDuration, wo.Order__r.Number_of_Resources__c);
            
            Integer dedicatedCount = 0;
            
            if (!wo.ServiceAppointments.isEmpty()) {
                for (ServiceAppointment sa : wo.ServiceAppointments) {
                    sa.ContactId = wo.ContactId;//ensure the contact always matches in case of a change
                    
                    if (sa.Pest_Emergency_Dedicated_Count__c != null && sa.Pest_Emergency_Dedicated_Count__c > dedicatedCount) {
                        dedicatedCount = Integer.valueOf(sa.Pest_Emergency_Dedicated_Count__c) + 1;
                    }
                }
            }
            
            appointmentsToUpsert = EDW_UtilityClass.recalculateDurationsAndSetServiceWindows(wo, durationPerAppointment);
            
            String eId = dueDate.year() + DELIMITER + dueDate.month() + DELIMITER + dueDate.day() + DELIMITER + wo.Id;
            
            for (Integer index = numberOfNonCancelledServiceAppointments; index < numberOfResourcesRequested; index++) {
                dedicatedCount++;
                
                appointments.get(wo.Id).add(new ServiceAppointment(
                    ParentRecordId = wo.Id,
                    ContactId = wo.ContactId,
                    Account__c = wo.AccountId,
                    Line_Of_Business__c = wo.Line_of_Business__c,
                    FSL__Emergency__c = wo.Emergency__c,
                    DurationType = dataSets.Duration_Type_Minutes__c,
                    FSL__GanttLabel__c = dataSets.Non_Recurring_Frequency_Value__c,
                    Type__c = wo.Type__c,
                    EID__c = eId + DELIMITER + dedicatedCount,
                    EarliestStartTime = earliestStartDate,
                    DueDate = dueDate,
                	Status = wo.Status,
                    Duration = EDW_UtilityClass.setServiceAppointmentDuration(durationPerAppointment),
                    FSL__Scheduling_Policy_Used__c = edwSettings.Default_Scheduling_Policy_Id__c,
                    Is_Pest_Emergency__c = true,
                    Pest_Emergency_Dedicated_Count__c = dedicatedCount,
                    Status_UnSync_WO_SA__c = wo.Order__r.Number_of_Resources__c > MINIMUM_SA_COUNT_FOR_STATUS_UNSYNC
                ));
            }
            
            appointments.remove(null);
            appointmentsToUpsert.addAll(appointments.get(wo.Id));
            
            /* Skill Requirements */
            SkillRequirement sr;
            Skill skill;
            String srKey;
            
            if (wo.Account.Is_Multi_Res__c) {
                skill = pestEmergencySkills.get(edwSettings.SSRS_Multi_Res_Pest_Skill_Id__c);
                srKey = skill.Id + '|' + wo.Id;
            } else {
                skill = pestEmergencySkills.get(edwSettings.SSRS_Pest_Commercial_Skill_Id__c);
                srKey = skill.Id + '|' + wo.Id;                
            }
            
            alreadyExistingRequirements.putAll(wo.SkillRequirements);
            skillRequirements.put(srKey, new SkillRequirement(RelatedRecordId = wo.Id, SkillId = skill.Id, SkillLevel = 1, EID__c = srKey));
        }
        
        skillRequirements.remove(null);
        alreadyExistingRequirements.remove(null);
        
        List<SkillRequirement> newSkillRequirements = new List<SkillRequirement>();
        
        for (SkillRequirement sr : skillRequirements.values()) {
            SkillRequirement alreadyExistingSkillRequirement = alreadyExistingRequirements.get(sr.EID__c);
            
            if (alreadyExistingSkillRequirement == null) {
                newSkillRequirements.add(sr);
            }
        }
        
        Database.insert(newSkillRequirements, false);
        
        if (appointments.size() > 0) {
            upsert appointmentsToUpsert;
            
            Set<Id> serviceAppointmentIds = new Set<Id>();
            
            for (ServiceAppointment sa : appointmentsToUpsert) {
                serviceAppointmentIds.add(sa.Id);
            }
            
            return serviceAppointmentIds;
        }
        
        return null;
    }
}