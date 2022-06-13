/**
* Name: SpawnPestEmergencyWorkOrders
* Author: PwC
* Date Created: April 23, 2019
* Purpose: To generate the Pest Emergency Work Order from the Emergency Dispatch Wizard app
*/
public class SpawnPestEmergencyWorkOrders {
    private static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    private static Emergency_Dispatch_Wizard_Setttings__c edws = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
    private static final String DELIMITER = '~';
    
    /**
     * Generates Pest Emergency Service Appointments as specified
     * 
     * @param orderIds  represents all Orders to have Work Orders be generated 
     * @param emergencyTickets  the Emergenct Ticket selected in the Emergency Dispatch Wizard to close
     */
    public static Set<Id> generatePestEmergencyWorkOrders(Set<String> orderIds, List<Case> emergencyTickets, Decimal totalDuration) {
        Map<Id, WorkOrder> workOrdersToGenerate = new Map<Id, WorkOrder>();
        Map<Id, Account> accountMap = new Map<Id, Account>();
        Map<Id, Order> ordersToUpdate = new Map<Id, Order>();
        Set<Id> operatingHoursIds = new Set<Id>();
        Date maxServiceDate = System.today().addDays(Integer.valueOf(edws.Work_Order_Multi_Res_Advance_Days__c));
        
        for (Order o : [SELECT Id, EffectiveDate, AccountId, Site_Survey__c, OpportunityId, Account.OperatingHoursId, Account.Pest_Control_OperatingHoursId__c, Account.Service_Territory__c, Account.PO_Required_for_Orders__c, Number_of_Resources__c, Service_Territory__c, Pricebook2Id, Emergency__c, Site_Survey__r.Notes__c, ShipToContactId, Is_PO_Provided_by_Customer__c, Service_Appointment_Scheduled_Start_Time__c, Override_Account_Operating_Hours__c,
                        (SELECT Id, Status FROM Work_Orders__r ORDER BY CreatedDate DESC LIMIT 1)
                        FROM Order WHERE Id IN :orderIds AND Emergency__c = TRUE AND Line_of_Businesses__c = :dataSets.Pest_LOB__c])
        {
            if (o.EffectiveDate > maxServiceDate || o.EffectiveDate < System.today()) {
                continue;
            }
            
            WorkOrder existingWorkOrder = new WorkOrder();
            
            if (!o.Work_Orders__r.isEmpty()) {
                existingWorkOrder.Id = o.Work_Orders__r[0].Id;
                existingWorkOrder.Status = o.Work_Orders__r[0].Status;
            }
            
            Datetime startDate = Datetime.newInstance(o.EffectiveDate.year(), o.EffectiveDate.month(), o.EffectiveDate.day(), 00, 00, 00),
            		 endDate = Datetime.newInstance(o.EffectiveDate.year(), o.EffectiveDate.month(), o.EffectiveDate.day(), 23, 59, 59);
            
            accountMap.put(o.AccountId, o.Account);
            ordersToUpdate.put(o.Id, o);
            
            Decimal totalDurationForJob;
            
            //ensure the duration on the Work Order always has the minimum value
            if (totalDuration == null || totalDuration == 0) {
            	totalDurationForJob = o.Number_of_Resources__c * edws.Service_Appointment_Minimum_Duration__c;
            } else {
                totalDurationForJob = EDW_UtilityClass.calculateDurationInMinutes(totalDuration);
            }

            workOrdersToGenerate.put(o.Id, new WorkOrder(
                Id = existingWorkOrder.Id,
            	AccountId = o.AccountId,
                Opportunity__c = o.OpportunityId,
                Type__c = dataSets.Label_for_Service_Work_Order_Type__c,
                //Begin:Shashi:9-11-2019:Allows CS to exit without assigning SA
                //Status = String.isBlank(existingWorkOrder.Id) ? dataSets.Work_Order_Scheduled_Status__c : existingWorkOrder.Status,
                Status = String.isBlank(existingWorkOrder.Id) ? dataSets.Work_Order_New_Status__c : existingWorkOrder.Status,
                //End
                Line_of_Business__c = dataSets.Pest_LOB__c,
                Priority = dataSets.Work_Order_Medium_Priority__c,
                FSL__VisitingHours__c = o.Account.OperatingHoursId,
                ServiceTerritoryId = o.Service_Territory__c == null ? o.Account.Service_Territory__c : o.Service_Territory__c,
                Pricebook2Id = o.Pricebook2Id,
                Site_Survey__c = o.Site_Survey__c,
                Order__c = o.Id,
                Emergency__c = o.Emergency__c,
                Site_Survey_Notes__c = o.Site_Survey__r.Notes__c,
                ContactId = o.ShipToContactId,
                StartDate = startDate,
                EndDate = endDate,
                Duration = totalDurationForJob,
                DurationType = dataSets.Duration_Type_Minutes__c
            ));
        }
        
        workOrdersToGenerate.remove(null);
        accountMap.remove(null);
        ordersToUpdate.remove(null);
        
        Map<String, Id> accountLOBOperatingHoursMap = getLOBSpecificOperatingHours(accountMap);
        
        operatingHoursIds.addAll(accountLOBOperatingHoursMap.values());
        
        Map<Id, OperatingHours> workOrderOperatingHours = new Map<Id, OperatingHours>([SELECT Id, Name, TimeZone, 
                                                                                       (SELECT Id, DayOfWeek, StartTime, EndTime FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime) 
                                                                                       FROM OperatingHours WHERE Id IN :operatingHoursIds]);
        
        //date manipulation
        for (WorkOrder wo : workOrdersToGenerate.values()) {
            String key = wo.accountId + DELIMITER + wo.Line_of_Business__c;
            OperatingHours oh = workOrderOperatingHours.get(accountLOBOperatingHoursMap.get(key));
            
            Datetime startDate =  Datetime.newInstance(wo.StartDate.year(), wo.StartDate.month(), wo.StartDate.day(), 00, 00, 00);
            Datetime endDate =  Datetime.newInstance(wo.EndDate.year(), wo.EndDate.month(), wo.EndDate.day(), 23, 59, 59);
            
            DatetimeRecord woDates = new DatetimeRecord(startDate, endDate);
            
            if (oh != null) {
                woDates.opHours = oh;
                woDates.emergency = wo.Emergency__c;
                woDates.hasPestControlMonthly = false;
                woDates = DatetimeRecord.getWODates(woDates, System.now());
            }
            
            wo.StartDate = woDates.startDate;
            wo.EndDate = woDates.endDate;
            
            Order orderOnWorkOrder = ordersToUpdate.get(wo.Order__c);
            
            if (orderOnWorkOrder.Override_Account_Operating_Hours__c) {
                String[] timeValues = orderOnWorkOrder.Service_Appointment_Scheduled_Start_Time__c.split('\\:');
                Time overrideTime = Time.newInstance(Integer.valueOf(timeValues[0]), Integer.valueOf(timeValues[1]), 0, 0);
                                
                wo.StartDate = DateTime.newInstance(wo.StartDate.year(), wo.StartDate.month(), wo.StartDate.day(), overrideTime.hour(), overrideTime.minute(), overrideTime.second());
            }
        }
        
        if (workOrdersToGenerate.size() > 0) {
        	upsert workOrdersToGenerate.values();

            closeEmergencyTickets(emergencyTickets);
            
            Set<Id> workOrderIds = new Set<Id>();
            
            for (WorkOrder wo : workOrdersToGenerate.values()) {
                workOrderIds.add(wo.Id);
            }
            
            return workOrderIds;
        }
        
        return null;
    }
    
    /**
     * Retrieves a map of the main Operating Hours on the Account, along with the Pest Control Operating Hours
     * 
     * @param accountMap  all Accounts that require retrieval of their regular Operating Hours and Pest Control Operating Hours
     */
    private static Map<String, Id> getLOBSpecificOperatingHours(Map<Id, Account> accountMap) {
        Map<String, Id> accountLOBOperatingHoursMap = new Map<String, Id>();
        
        if (!accountMap.isEmpty()) {
            for (Account a : accountMap.values()) {
                accountLOBOperatingHoursMap.put(a.Id + DELIMITER + dataSets.Pest_LOB__c, a.Pest_Control_OperatingHoursId__c);
                accountLOBOperatingHoursMap.put(String.valueOf(a.Id), a.OperatingHoursId);
            }
        }
        
        accountLOBOperatingHoursMap.remove(null);
        
        return accountLOBOperatingHoursMap;
    }
    
    /**
     * Closes all specified Emergency Tickets
     * 
     * @param emergencyTickets  the Emergenct Ticket selected in the Emergency Dispatch Wizard to close
     */
    private static void closeEmergencyTickets(List<Case> emergencyTickets) {
        if (emergencyTickets != null && !emergencyTickets.isEmpty()) {
            Map<Id, Case> casesToUpdate = new Map<Id, Case>();
            
            for (Case c : emergencyTickets) {
                if (c == null) { continue; }
                
                c.Pest_Emergency_Order_Draft_Override__c = true;
                c.Status = dataSets.Ticket_Closed_Status__c;
                casesToUpdate.put(c.Id, c);
            }
            
            if (!casesToUpdate.isEmpty()) {
                Database.update(casesToUpdate.values(), false);
            }
        }
    }
}