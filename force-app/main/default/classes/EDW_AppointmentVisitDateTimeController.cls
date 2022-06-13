/**
* Name: EDW_AppointmentVisitDateTimeController
* Author: PwC
* Date Created: May 8, 2019
* Purpose: To initialize and handle all logic of the Appointment Visit Date/Time screen in the Emergency Dispatch Wizard
*/ 
public with sharing class EDW_AppointmentVisitDateTimeController {
    private static Emergency_Dispatch_Wizard_Setttings__c edwSettings = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
    private static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
	/**
     * Retrieves the base URL of the Salesforce instance
     */
    @AuraEnabled
    public static String getInstanceUrl() {
        return EDW_UtilityClass.getInstanceUrl();
    }
	
	/**
     * Retrieves the baseline Work Order data to initialize the Appointment Visit Date/Time screen
     *
     * @param workOrderId  The ID of the related Work Order
     */
    @AuraEnabled
    public static EDW_ViewModels.AppointmentVisitViewModel initializeAppointmentVisitDateTimeScreen(String workOrderId) {
        EDW_ViewModels.AppointmentVisitViewModel model = new EDW_ViewModels.AppointmentVisitViewModel();
        model.areAllServiceAppoinmentsResourced = true;
        
        List<ServiceAppointment> appointments = new List<ServiceAppointment>();
        
        for (WorkOrder wo : [SELECT Id, AccountId, (SELECT Id, Has_Resource_Assigned__c FROM ServiceAppointments WHERE Status != :dataSets.Work_Order_Cancelled_Status__c) FROM WorkOrder WHERE Id = :workOrderId]) {
            model.workOrderId = wo.Id;
            model.accountId = wo.AccountId;
            model.numberOfServiceAppointments = wo.ServiceAppointments.size();
            
            appointments.addAll(wo.ServiceAppointments);
        }
        
        for (ServiceAppointment sa : appointments) {
            if (!sa.Has_Resource_Assigned__c) {
                model.areAllServiceAppoinmentsResourced = false;
                break;
            }
        }
        
        return model;
    }
    
	/**
     * Returns all ServiceAppointment records related to the specified Work Order that aren't Cancelled
     *
     * @param workOrderId  The ID of the related Work Order  
     */
    @AuraEnabled
    public static List<ServiceAppointment> getServiceAppointmentsOnWorkOrder(String workOrderId) {
        return [SELECT Id, AppointmentNumber, Status, FSL__Scheduling_Policy_Used__c, Has_Resource_Assigned__c, Duration, ParentRecordId, RecordTypeId,
                 TYPEOF ParentRecord WHEN WorkOrder THEN Order__r.Number_of_Resources__c END
                FROM ServiceAppointment WHERE ParentRecordId = :workOrderId AND Status != :dataSets.Work_Order_Cancelled_Status__c ORDER BY AppointmentNumber];
    }
    
	/**
     * Retrieves all Scheduling Policy records in the system
     */
    @AuraEnabled
    public static List<FSL__Scheduling_Policy__c> getSchedulingPolicies() {
        return [SELECT Id, Name FROM FSL__Scheduling_Policy__c];
    }
    
    @AuraEnabled
    public static Boolean checkForAppointmentAssignment(String appointmentId) {
        for (ServiceAppointment sa : [SELECT Has_Resource_Assigned__c FROM ServiceAppointment WHERE Id = :appointmentId]) {
            return sa.Has_Resource_Assigned__c;
        }
        
        return false;
    }
    
	/**
     * Updates the scheduling policy on the specified ServiceAppointment record
     *
     * @param policyId  The ID of the chosen Scheduling Policy record
     * @param sa  The ServiceAppointment record to have its Scheduling Policy updated
     */
    @AuraEnabled
    public static ServiceAppointment updateServiceAppointmentPolicy(String policyId, ServiceAppointment sa) {
        sa.FSL__Scheduling_Policy_Used__c = policyId;
        
        update sa;
        
        return sa;
    }

	/**
     * Updates the specified ServiceAppointment record to have a status of Cancelled
     *
     * @param sa  The specified ServiceAppointment to be cancelled
     */       
    @AuraEnabled
    public static AuraStatusResponse cancelSpecifiedServiceAppointment(ServiceAppointment sa) {
        AuraStatusResponse auraResponse;
        
        try {
            TriggerHelper.isServiceAppointmentBeingCancelled = true;
            
            /*Map<Id, ServiceAppointment> appointment = EDW_UtilityClass.moveServiceAppointmentsToSpecifiedStatus(new List<ServiceAppointment>{ sa }, dataSets.Work_Order_Cancelled_Status__c);
            
            update EDW_UtilityClass.recalculateServiceAppointmentDurations(appointment.values()[0].ParentRecordId, null).values();*/
            
            Map<Id, ServiceAppointment> appointment = EDW_UtilityClass.moveServiceAppointmentsToSpecifiedStatus(new List<ServiceAppointment>{ sa }, dataSets.Work_Order_Dispatched_Status__c);
            
            for (ServiceAppointment saToUnpin : appointment.values()) {
                if (saToUnpin.Status == dataSets.Work_Order_Dispatched_Status__c) {
                    saToUnpin.FSL__Pinned__c = false;
                }
            }
        
            appointment = EDW_UtilityClass.moveServiceAppointmentsToSpecifiedStatus(new List<ServiceAppointment>(appointment.values()), dataSets.Work_Order_Cancelled_Status__c);
            
            update EDW_UtilityClass.recalculateServiceAppointmentDurations(appointment.values()[0].ParentRecordId, null).values();
        } catch (Exception e) {
            return new AuraStatusResponse(false, EDW_UtilityClass.ERROR, e.getMessage(), sa);
        }
        
        return new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, Label.Service_Appointment_Successfully_Cancelled, sa);
    }

	/**
     * Deletes the specified ServiceAppointment record from the system
     *
     * @param sa  The specified ServiceAppointment record to be deleted from the system
     */    
    @AuraEnabled
    public static String deleteSpecifiedServiceAppointment(ServiceAppointment sa) {
        try {
        	update EDW_UtilityClass.recalculateServiceAppointmentDurations(sa.ParentRecordId, sa.Id).values();
            
        	delete sa;
            
            return sa.Id;
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
        }
        
        return null;
    }
    
	/**
     * Retrieves Time Blocks to be chosen on the Appointment Visit Date/Time Eternal lightning component
     */
    @AuraEnabled
    public static List<String> getTimeBlocks() {
        return EDW_UtilityClass.getTimeBlocks();
    }
    
	/**
     * Retrieves the minimum valid date that can be requested by the user
     */
    @AuraEnabled
    public static Date getDefaultRequestedDate() {
        return EDW_UtilityClass.calculateMinimumDate();
    }
    
	/**
     * Validates the requested date and returns the appropriate response
     *
     * @param requestedDate  The date selected by the user
     */
    @AuraEnabled
    public static AuraStatusResponse validateRequestedDate(String requestedDate) {
        Date theDate = Date.valueOf(requestedDate);
        
        if (EDW_UtilityClass.isDateInPast(theDate)) {
            return new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Request_Date_Cannot_be_in_Past, null);
        }
        
        if (!EDW_UtilityClass.isDateAWeekDay(theDate)) {
            return new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Requested_Date_Must_be_Week_Day, null);
        }
        
        if (!EDW_UtilityClass.isDateValidForRange(theDate)) {
            return new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Requested_Date_Not_in_Range, null);
        }
        
        return new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, null, null);
    }
    
	/**
     * Creates a new Case record for Customer Success with the appointment information chosen by the user
     *
     * @param requestedDate  The date selected by the user
     * @param timeBlock  The time block selected by the user
     */
    @AuraEnabled
    public static AuraStatusResponse createAppointmentRequest(String requestedDate, String timeBlock) {
        try {
            List<User> user = [SELECT Id, ContactId, Contact.AccountId FROM User WHERE Id = :UserInfo.getUserId()];
            
            if (user.isEmpty() || String.isBlank(user[0].ContactId)) {
                return new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Specified_User_Not_Found, null);
            }
            
            String accountId = user[0].Contact.AccountId,
                contactId = user[0].ContactId;
            
            AuraStatusResponse response = validateRequestedDate(requestedDate);
            
            if (response.responseType == EDW_UtilityClass.ERROR) {
                return response;
            }
            
            insert new Case(RecordTypeId = dataSets.Ticket_Emergency_Record_Type__c, OwnerId = dataSets.Customer_Success_Queue__c, Subject = edwSettings.Customer_Ticket_Subject__c, Priority = edwSettings.Customer_Ticket_Priority__c, AccountId = accountId, ContactId = contactId, Appointment_Requested_Date__c = Date.valueOf(requestedDate), Appointment_Time_Block__c = timeBlock, Status = dataSets.Ticket_New_Status__c, Origin = edwSettings.Customer_Ticket_Origin__c);
            return new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, Label.Requested_Appointment_Received, null);
        } catch (Exception e) {
            System.debug(e.getMessage());
            return new AuraStatusResponse(false, EDW_UtilityClass.ERROR, e.getMessage(), null);
        }
    }
    
	/**
     * Completes the Emergency Dispatch Wizard by dispatching ServiceAppointment records if necessary, updating the Order to "Pest Emergency Not Invoicing" if necessary, and sending a DocuSign Envelope to the Ship To Contact if necessary
     *
     * @param orderJson  The Order record from the Emergency Dispatch Wizard in JSON (String) format  
     */
    @AuraEnabled
    public static Boolean completeEmergencyDispatchWizard(String orderJson) {
        try {
            Order order = (Order)System.JSON.deserialize(orderJson, Order.class);
            
            Set<Id> orderIdsForDocuSignEnvelope = new Set<Id>();
            Set<Id> workOrderIdsToUpdate = new Set<Id>();
            Set<Id> setWrkIds = new Set<Id>();
            Map<Id, Order> ordersToSetToActiveNotInvoicing = new Map<Id, Order>();
            Map<Id, ServiceAppointment> appointmentsToDispatch = new Map<Id, ServiceAppointment>();
            
            for (WorkOrder wo : [SELECT Id, Order__c, Status, Order__r.Is_PO_Provided_by_Customer__c, 
                                 Order__r.Pest_Emergency_Not_Invoicing__c, Account.PO_Required_for_Orders__c, 
                                 (SELECT Id, Status,ParentRecordId FROM ServiceAppointments) FROM WorkOrder WHERE Order__c = :order.Id]) {
                                     
                if (!wo.Order__r.Is_PO_Provided_by_Customer__c && wo.Account.PO_Required_for_Orders__c == dataSets.PO_Required_Before_Label__c) {
                    orderIdsForDocuSignEnvelope.add(wo.Order__c);
                    
                    //Begin:Shashi:9-11-2019:Allows CS to exit without assigning SA
                    Boolean saFlag = false;
                    List<ServiceAppointment> lstSAs = wo.ServiceAppointments;
                    for(ServiceAppointment SA:lstSAs){if(SA.Status==dataSets.Work_Order_New_Status__c){saFlag=true;}}
                    if(!saFlag && wo.Status==dataSets.Work_Order_New_Status__c){setWrkIds.add(wo.Id);} 
                    //End
                    
                } else {
                    appointmentsToDispatch.putAll(wo.ServiceAppointments);
                    workOrderIdsToUpdate.add(wo.Id);
                }
                
                if (!wo.Order__r.Pest_Emergency_Not_Invoicing__c) {
            		ordersToSetToActiveNotInvoicing.put(wo.Order__c, new Order(Id = wo.Order__c, Pest_Emergency_Not_Invoicing__c = true));
                }
            }
            
            orderIdsForDocuSignEnvelope.remove(null);
            ordersToSetToActiveNotInvoicing.remove(null);
            workOrderIdsToUpdate.remove(null);
            
            if (!orderIdsForDocuSignEnvelope.isEmpty()) {
                SendDocuSignOnDemandController.fireEmail(new List<Id>(orderIdsForDocuSignEnvelope));
            }
            
            if (!ordersToSetToActiveNotInvoicing.isEmpty()) {
                EDW_UtilityClass.updateOrdersToNotInvoicing(ordersToSetToActiveNotInvoicing);
            }
            if(setWrkIds.size()>0){
                WorkOrderUtil.setWorkOrdersToSpecificStatus(setWrkIds,dataSets.Work_Order_Scheduled_Status__c);
            }
            if (!appointmentsToDispatch.isEmpty()) {
                EDW_UtilityClass.moveServiceAppointmentsToSpecifiedStatus(appointmentsToDispatch.values(), dataSets.Work_Order_Dispatched_Status__c);
            	WorkOrderUtil.setWorkOrdersToSpecificStatus(workOrderIdsToUpdate, dataSets.Work_Order_Dispatched_Status__c);
            }
        } catch (Exception e) {
            System.debug('Error: ' + e);
        }
        
        return EDW_UtilityClass.isCommunity();
    }
    
    /**
     * Update the Order to "Pest Emergency Not Invoicing" if necessary
     * @param orderJson  The Order record from the Emergency Dispatch Wizard in JSON (String) format  
     * @author shashi:9-11-2019:Allows CS to exit without assigning SA
     */
    @AuraEnabled
    public static Boolean exitEmergencyDispatchWizard(String orderJson) {
        try {
            Order order = (Order)System.JSON.deserialize(orderJson, Order.class);
            Map<Id, Order> ordersToSetToActiveNotInvoicing = new Map<Id, Order>();
            Set<Id> setWrkIds = new Set<Id>();
            
            for (WorkOrder wo : [SELECT Id, Order__c, Order__r.Is_PO_Provided_by_Customer__c, Status,
                                 Order__r.Pest_Emergency_Not_Invoicing__c, Account.PO_Required_for_Orders__c, 
                                 (SELECT Id, Status,ParentRecordId FROM ServiceAppointments) FROM WorkOrder 
                                 WHERE Order__c =:order.Id]) {
                if (!wo.Order__r.Pest_Emergency_Not_Invoicing__c) {
                    ordersToSetToActiveNotInvoicing.put(wo.Order__c, new Order(Id = wo.Order__c, Pest_Emergency_Not_Invoicing__c = true));
                }
                                     
				Boolean saFlag = false;                                     
                List<ServiceAppointment> lstSAs = wo.ServiceAppointments;
                for(ServiceAppointment SA:lstSAs){if(SA.Status==dataSets.Work_Order_New_Status__c){saFlag=true;}}
                if(!saFlag && wo.Status==dataSets.Work_Order_New_Status__c){setWrkIds.add(wo.Id);}                                     
            }
            ordersToSetToActiveNotInvoicing.remove(null);
            if (!ordersToSetToActiveNotInvoicing.isEmpty()) {
                EDW_UtilityClass.updateOrdersToNotInvoicing(ordersToSetToActiveNotInvoicing);
            }
            if(setWrkIds.size()>0){
                WorkOrderUtil.setWorkOrdersToSpecificStatus(setWrkIds,dataSets.Work_Order_Scheduled_Status__c);
            }
        } catch (Exception e) {
            System.debug('Error: ' + e);
        }
        return EDW_UtilityClass.isCommunity();
    }
}