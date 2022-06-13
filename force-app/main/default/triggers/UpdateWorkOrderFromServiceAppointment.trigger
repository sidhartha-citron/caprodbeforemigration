trigger UpdateWorkOrderFromServiceAppointment on ServiceAppointment (after insert, after update) {
    System.debug('SA Line Items After Trigger');
    
    String workOrderPrefix = WorkOrder.sobjecttype.getDescribe().getKeyPrefix();
    Field_Service_Settings__c fssettings = Field_Service_Settings__c.getOrgDefaults();
    
    Set<Order> updateOrdersSet = new Set<Order>();
    List<Order> updateOrders = new List<Order>();
    List<WorkOrder> workOrderUpdateWithSA = new List<WorkOrder>();
    
    Map<Id,WorkOrder> workOrders = new Map<Id,WorkOrder>();
    Map<Id,WorkOrder> workOrdersForStatusSync = new Map<Id,WorkOrder>();
    Map<Id,ServiceAppointment> sAForStatusSync = new Map<Id,ServiceAppointment>();
    Map<Id,OrderItem> updateOrderItems = new Map<Id,OrderItem>();
    Map<Id,ServiceAppointment> mainSAs = new Map<Id, ServiceAppointment>();
    Map<Id, Id> assignedResourcesMap = new Map<Id, Id>();
    Map<Id, Datetime> serviceAppointmentSchedStartDate = new Map<Id, Datetime>();
    
    Set<String> streets = new Set<String>();
    Set<String> cities = new Set<String>();
    Set<String> states = new Set<String>();
    Set<String> countries = new Set<String>();
    Set<String> statusSyncSAIds = new Set<String>();
    Set<String> workOrderIds = new Set<String>();
    Set<Id> workOrderSAMap = new Set<Id>();
    Set<Id> saPestEmergencyIds = new Set<Id>();//case 21618
    Set<WorkOrderLineItem> workOrderLineItems = new Set<WorkOrderLineItem>();
    Set<ServiceAppointment> relatedSAs = new Set<ServiceAppointment>();
    Set<String> queryStatuses = new Set<String>{fssettings.Service_Appointment_Dispatched_Status__c, fssettings.Service_Appointment_Arrived_Status__c, 
                                                fssettings.Service_Appointment_In_Progress_Status__c, fssettings.Service_Appointment_Completed_Status__c};
     
    for (ServiceAppointment sa : Trigger.new) {
        ServiceAppointment oldRec = (Trigger.isInsert ? new ServiceAppointment() : Trigger.oldMap.get(sa.Id));
        if(sa.ParentRecordId!=null && String.valueOf(sa.ParentRecordId).startsWithIgnoreCase(workOrderPrefix)) {
            if(sa.IsOpen__c) {
                workOrders.put(sa.ParentRecordId,null);
            }
            Boolean syncStatus = Trigger.isUpdate && sa.RecordTypeId!=fssettings.SA_Vehicle_Inspection_Record_Type_Id__c && !sa.Status_UnSync_WO_SA__c  && (sa.Status_UnSync_WO_SA__c!=oldRec.Status_UnSync_WO_SA__c || sa.Status!=oldRec.Status);
            if(syncStatus) {
                workOrdersForStatusSync.put(sa.ParentRecordId, null);
                sAForStatusSync.put(sa.ParentRecordId, sa);
            }
            
            if(sa.ParentRecordId!=oldRec.ParentRecordId) {
                workOrderSAMap.add(sa.ParentRecordId);
                workOrderSAMap.add(oldRec.ParentRecordId);
            }
        }
        //21618
        /*if (fssettings.Activate_Pest_Emergency_Email_Logic__c && sa.Status == fssettings.Service_Appointment_Dispatched_Status__c && oldRec.Status != sa.Status && sa.Line_Of_Business__c == fssettings.Pest_LOB__c && sa.FSL__Emergency__c) {
            saPestEmergencyIds.add(sa.Id);
        }*/
    }
    workOrdersForStatusSync.remove(null);
    sAForStatusSync.remove(null);
    workOrderSAMap.remove(null);
    saPestEmergencyIds.remove(null);
    
    //21618, send room emails immediately [dk], March 24, 2019
    /*if (!saPestEmergencyIds.isEmpty()) {// && !System.isBatch() && !System.isFuture()
        ServiceAppointmentFutureCalls.sendCongaNotificationEmails(saPestEmergencyIds);
    }*/
    
    workOrdersForStatusSync = new Map<Id, WorkOrder>([SELECT Id, Status, WorkOrderNumber FROM WorkOrder WHERE Id IN :workOrdersForStatusSync.keySet()]);    
    for (WorkOrder wo : workOrdersForStatusSync.values()) {
        ServiceAppointment sa = sAForStatusSync.get(wo.Id);
        if(sa!=null){
            System.debug('>>Before Status Sync WO: ' + wo.WorkOrderNumber + ' Status: ' + wo.Status);
            wo.Status = sa.Status;
            System.debug('>>After Status Sync WO: ' + wo.WorkOrderNumber + ' Status: ' + wo.Status);
            System.debug('>>After Status Sync SA: ' + sa.AppointmentNumber + ' Status: ' + sa.Status);
        }
    }
    System.debug('SyncedWOs: ' + workOrdersForStatusSync.values());
    update workOrdersForStatusSync.values();
    
    //case 21537 - append first SA onto WO [dk]
    for(WorkOrder wo : [SELECT Id, Service_Appointment__c, (SELECT Id FROM ServiceAppointments ORDER BY CreatedDate LIMIT 1) FROM WorkOrder WHERE Id IN :workOrderSAMap]) {
        if(wo.ServiceAppointments.isEmpty()) {
            workOrderUpdateWithSA.add(new WorkOrder(Id=wo.Id, Service_Appointment__c=null));
        } else {
            workOrderUpdateWithSA.add(new WorkOrder(Id=wo.Id, Service_Appointment__c=wo.ServiceAppointments.get(0).Id));
        }
    }

    update workOrderUpdateWithSA;
    
    /*if(!System.isFuture() && !workOrders.isEmpty()) {
        System.debug('>>Enquing Queueable');
        //ServiceAppointmentsQueueable queueJob = new ServiceAppointmentsQueueable(workOrders.keySet());
        //Id jobID = System.enqueueJob(queueJob);
        if(Limits.getQueueableJobs() == 1){
            String hour = String.valueOf(Datetime.now().hour());
            String min = String.valueOf(Datetime.now().minute()); 
            //String ss = String.valueOf(Datetime.now().second() + 5);
            String ss = String.valueOf(Datetime.now().second());
            //parse to cron expression
            String nextFireTime = ss + ' ' + min + ' ' + hour + ' * * ?';
            System.schedule('ScheduledJob ' + String.valueOf(Math.random()), nextFireTime, new ServiceAppointmentsSchedulable(workOrders.keySet()));
        }else{
            System.enqueueJob(new ServiceAppointmentsQueueable(workOrders.keySet()));
        }
        
        //System.debug('>>Calling Future Method');
        //ServiceAppointmentFutureCalls.lastInFlightDateUpdates(workOrders.keySet());
    }*/
    
    if (!workOrders.isEmpty()) {
        for (WorkOrder wo : [SELECT Id, Next_Scheduled_Appointment__c, HasBeenDispatched__c, Order__c, Order__r.Id, Order__r.Status, Order__r.RecordTypeId, Emergency__c, Type__c, StartDate, 
                             (SELECT Id, IsPending__c, IsOpen__c, IsDispatched__c, DueDate, SchedStartTime, SchedEndTime, Status FROM ServiceAppointments WHERE IsOpen__c=TRUE ORDER BY DueDate) 
                             FROM WorkOrder WHERE Id IN :workOrders.keyset() ORDER BY Order__c NULLS LAST]) 
        {
            WorkOrder updatedWo = new WorkOrder(Id=wo.Id, HasBeenDispatched__c=false); 
            Datetime lastInflightDate;
            //Datetime lastInflightDate = wo.StartDate;
            for (ServiceAppointment sa : wo.ServiceAppointments) {
                System.debug('sa: ' + sa);
                if (updatedWo.Next_Scheduled_Appointment__c == null && sa.IsPending__c) {
                    updatedWo.Next_Scheduled_Appointment__c = (sa.SchedStartTime != null ? sa.SchedStartTime : sa.DueDate);
                }
                if (sa.IsDispatched__c) {
                    updatedWo.HasBeenDispatched__c = sa.IsDispatched__c;
                    //lastInflightDate = sa.SchedStartTime != null ? sa.SchedStartTime : wo.StartDate;
                    if(sa.Status=='Dispatched') {
                        lastInflightDate = sa.SchedStartTime != null ? sa.SchedStartTime : wo.StartDate;
                    }
                    
                    //serviceAppointmentSchedStartDate.put(wo.Id, sa.SchedStartTime != null ? sa.SchedStartTime : wo.StartDate);
                }
            }
            
            if (wo.Next_Scheduled_Appointment__c != updatedWo.Next_Scheduled_Appointment__c || wo.HasBeenDispatched__c != updatedWo.HasBeenDispatched__c) {
                System.debug('W0 >> ' + updatedWo.Next_Scheduled_Appointment__c + ' Dispatched: ' + updatedWo.HasBeenDispatched__c + ' lastinflightDate: ' + lastInflightDate);
                if(updatedWo.HasBeenDispatched__c && lastInflightDate!=null) {
                    serviceAppointmentSchedStartDate.put(wo.Id, lastInflightDate);                    
                }
                workOrders.put(wo.Id, updatedWo);
            } else {
                workOrders.remove(wo.Id);
            }
            System.debug('updated wo: ' + updatedWo);
        }
        update workOrders.values();
        
        for(WorkOrderLineItem woli : [SELECT Id, LineItemNumber, Order_Product__c, Order_Product__r.Id, Order_Product__r.OrderItemNumber, 
                                      Order_Product__r.Valid_for_Install_Remove_Replace__c, Type_of_Service__c, Order_Product__r.Last_Automation_Created_Date__c, 
                                      Order_Product__r.Last_InFlight_WO_Date__c, Order_Product__r.Active__c, WorkOrder.StartDate, WorkOrderId, WorkOrder.WorkOrderNumber, 
                                      OrderId, Order.Status, Order.RecordTypeId, WorkOrder.Type__c, WorkOrder.HasBeenDispatched__c, WorkOrder.Emergency__c, 
                                      WorkOrder.HasBeenRescheduled__c, Service_Frequency__c
                                      FROM WorkOrderLineItem WHERE Order_Product__c!=NULL AND WorkOrder.HasBeenDispatched__c=TRUE AND Order_Product__r.Active__c=TRUE 
                                      AND (NOT (WorkOrder.HasBeenRescheduled__c=TRUE AND Service_Frequency__c='Fixed Weekly')) AND WorkOrderId IN :serviceAppointmentSchedStartDate.keyset() 
                                      ORDER BY WorkOrderId] )
        {
            System.debug('Loop for Line Items');
            if(woli.WorkOrder.HasBeenDispatched__c) {
                if(woli.Order.Status==fssettings.Order_Active_Stage__c) {
                    updateOrdersSet.add(woli.Order); 
                }
                if(!woli.WorkOrder.Emergency__c && woli.WorkOrder.Type__c!='Follow-Up'){
                    workOrderLineItems.add(woli); 
                    OrderItem oi = updateOrderItems.get(woli.Order_Product__c);
                    Date startDate = serviceAppointmentSchedStartDate.get(woli.WorkOrderId) != null ? serviceAppointmentSchedStartDate.get(woli.WorkOrderId).date() : woli.WorkOrder.StartDate.date();
                    System.debug('StartDate: ' + startDate);
                    Boolean isRegularService = TRUE;
                    
                    if(oi==null){
                        oi = woli.Order_Product__r;
                        updateOrderItems.put(oi.Id, oi);
                    }
                    
                    if(woli.Type_of_Service__c!='Service' && woli.Type_of_Service__c!='Delivery') {
                        oi.Valid_for_Install_Remove_Replace__c = FALSE;
                        isRegularService =  FALSE;
                    }
                    
                    System.debug('>>Before Updating Last Automation Date from WorkOrderLineItem: ' + woli.LineItemNumber + + ' OrderItem: ' + oi.OrderItemNumber);
                    System.debug('>>Before Updating Start Date from WorkOrderLineItemDate: ' + startDate + + ' OrderItemDate: ' + oi.Last_InFlight_WO_Date__c);
                    
                    if(oi.Last_InFlight_WO_Date__c==null || (oi.Last_InFlight_WO_Date__c < startDate && isRegularService)){
                        oi.Last_InFlight_WO_Date__c = startDate;
                    }
                    System.debug('>>After Updating Last Automation Date from WorkOrderLineItem: ' + woli.LineItemNumber + + ' OrderItem: ' + oi.OrderItemNumber);
                    System.debug('>>After Updating Start Date from WorkOrderLineItemDate: ' + startDate + + ' OrderItemDate: ' + oi.Last_InFlight_WO_Date__c);
                }
            }
        }
    }
    
    if(!updateOrdersSet.isEmpty()) {
        updateOrders.addAll(updateOrdersSet);
    }
    
    for(Order o : updateOrders) {
        o.Status = o.RecordTypeId==fssettings.Regular_Order_Record_Type_Id__c ? fssettings.Regular_Order_Draft_Stage__c : fssettings.Shopping_Cart_Order_Draft_Stage__c;
    }
    update updateOrders; 
    
    System.debug('>>Updating Order Items with Last Automation Created Date from Work Order Line Item');
    System.debug(updateOrderItems);
    update updateOrderItems.values();
    
    for(Order o : updateOrders) {
        o.Status = fssettings.Order_Active_Stage__c; 
    }
    update updateOrders;
    
}