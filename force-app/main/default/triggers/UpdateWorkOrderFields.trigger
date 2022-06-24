trigger UpdateWorkOrderFields on WorkOrder (after insert, after update) { 
    System.debug('Work Orders After Trigger');
    
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    Emergency_Dispatch_Wizard_Setttings__c edwSettings = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
    Id userId = UserInfo.getUserId();
    Date todaysDate = System.today();
        
    //21618 variables
    Set<String> cannotCompleteLinesOfBusiness = WorkOrderUtil.activeLinesOfBusinessForCannotComplete();
    Set<Id> workOrderPestCannotCompleteIds = new Set<Id>(),
        workOrderCompletedIds = new Set<Id>(),
        workOrderCancelledIds = new Set<Id>(),
        workOrderResetAppointmentIds = new Set<Id>(),
        workOrderPONumberCase = new Set<Id>(),
        workOrderSwappedProductIds = new Set<Id>();
    
    if (Trigger.isUpdate) {
        Set<Id> parentWorkOrderIds = new Set<Id>();
        Set<Id> repairWorkOrders = new Set<Id>();
        Set<Id> repairWorkOrdersWithProds = new Set<Id>();
        Set<Id> completedWOs = new Set<Id>();
        Set<String> productsWithExistingWarranties = new Set<String>();
        Set<Id> workOrderIdsForQA = new Set<Id>();
        Set<Id> cannotCompleteWorkorderIds = new Set<Id>();
        
        List<WorkOrder> changedWOs = new List<WorkOrder>();
        List<WorkOrder> parentWorkOrders = new List<WorkOrder>();
        List<Warranty__c> warrantiesToCreate = new List<Warranty__c>();
        
        Map<Id,Case> workOrderCases = new Map<Id,Case>();
        Map<Id,WorkOrder> processQA = new Map<Id,WorkOrder>();
        Map<Id, WorkOrder> cannotCompleteWorkorders = new Map<Id, WorkOrder>();
        Map<Id, WorkOrder> repairWorkOrdersMap = new Map<Id, WorkOrder>();
        
        for (WorkOrder wo : Trigger.new) {   
            WorkOrder oldWorkOrder = Trigger.OldMap.get(wo.Id);
            Boolean stampCompletedDates = (wo.Status == dataSets.Work_Order_Completion_Status__c ||  wo.Status == dataSets.Cannot_Complete_Status_Value__c) && oldWorkOrder.Status != wo.Status && wo.Type__c!=dataSets.Type_Value_for_FollowUp_WorkOrder__c;
            if(stampCompletedDates){
                completedWOs.add(wo.Id);
            }
            
            System.debug('**WorkOrder** ' + wo.WorkOrderNumber + ' Status ' + wo.Status + ' CannotCompleteReason ' + wo.Cannot_Complete_Reason__c);
            //filtering out pest control since it now behaves differently, 21618 [dk]
            if (wo.Cannot_Complete_Reason__c!=oldWorkOrder.Cannot_Complete_Reason__c && wo.Line_of_Business__c != dataSets.Pest_LOB__c) {
                cannotCompleteWorkorderIds.add(wo.Id);
            }
            
            //21618
            if (wo.Status != oldWorkOrder.Status && wo.Status == dataSets.Cannot_Complete_Status_Value__c && cannotCompleteLinesOfBusiness.contains(wo.Line_of_Business__c)) {
                workOrderPestCannotCompleteIds.add(wo.Id);
            } else if (wo.Status != oldWorkOrder.Status && wo.Status == dataSets.Work_Order_Completion_Status__c && wo.Line_of_Business__c == dataSets.Pest_LOB__c && wo.Emergency__c) {
                //if (wo.Number_of_Replaced_Products__c > 0) {
                    workOrderSwappedProductIds.add(wo.Id);
                //}
                
                workOrderCompletedIds.add(wo.Id);
            } else if (wo.Status != oldWorkOrder.Status && wo.Status == dataSets.Work_Order_Cancelled_Status__c && wo.Line_of_Business__c == dataSets.Pest_LOB__c && wo.Emergency__c) {
                workOrderCancelledIds.add(wo.Id);
            }
            //21618
            if (wo.Create_PO_Number_Case__c && wo.Create_PO_Number_Case__c != oldWorkOrder.Create_PO_Number_Case__c) {
                workOrderPONumberCase.add(wo.Id);
            }
            //21618
            if (wo.Is_Work_Order_Valid_for_Reset_SAs__c && wo.Is_Work_Order_Valid_for_Reset_SAs__c != oldWorkOrder.Is_Work_Order_Valid_for_Reset_SAs__c) {
                workOrderResetAppointmentIds.add(wo.Id);
            }
        }
        
        workOrderPestCannotCompleteIds.remove(null);
        workOrderCompletedIds.remove(null);
        workOrderCancelledIds.remove(null);
        completedWOs.remove(null);
        workOrderPONumberCase.remove(null);
        workOrderSwappedProductIds.remove(null);
        workOrderResetAppointmentIds.remove(null);
        
        if(!System.isBatch() && !System.isFuture()) {
            //21618
            if (!workOrderPestCannotCompleteIds.isEmpty()) {
                WorkOrderUtil.updateWorkOrderCannotComplete(workOrderPestCannotCompleteIds);
            }
            //21618
            if (!workOrderCompletedIds.isEmpty()) {
                WorkOrderUtil.createOrderProductsOnCompletedWorkOrders(workOrderCompletedIds);
                Map<Id, WorkOrder> workOrdersWithError = WorkOrderUtil.updateOrderStatusToActiveFromNotInvoicing(workOrderCompletedIds);
                WorkOrderUtil.sendDocuSignForPONumberAfterCompletion(workOrderCompletedIds);
                
                for (Id woId : workOrdersWithError.keySet()) {
                    WorkOrder triggerWorkOrder = Trigger.newMap.get(woId);
                    
                    triggerWorkOrder.addError(edwSettings.PO_Required_for_Closing_Work_Order_Error__c);
                }
            }
            //21618
            if (!workOrderSwappedProductIds.isEmpty()) {
                WorkOrderFutureCalls.sendEmailsOnSwappedOrderProducts(workOrderSwappedProductIds);
            }
            //21618
            if (!workOrderCancelledIds.isEmpty()) {
                WorkOrderUtil.cancelWorkOrderAndServiceAppointments(workOrderCancelledIds);
            }
            //21618
            if (!workOrderPONumberCase.isEmpty()) {
                WorkOrderFutureCalls.createPONumberCases(workOrderPONumberCase);
            }
            //21618
            if (!workOrderResetAppointmentIds.isEmpty()) {
                WorkOrderUtil.setAllServiceAppointmentsToSpecificStatus(workOrderResetAppointmentIds, dataSets.Work_Order_New_Status__c);
            }
            
            System.debug('>> Future Method for Cannot Complete Line Items');
            WorkOrderFutureCalls.futureUpdates(cannotCompleteWorkorderIds, completedWOs);
        }
        
        if(!completedWOs.isEmpty()) {
            for(WorkOrderLineItem woli : [SELECT Id, PricebookEntry.Product2Id, PricebookEntry.Product2.Clean_Out_Type__c, WorkOrderId, 
                                          WorkOrder.Completed_Date__c, PricebookEntry.Product2.Warranty_Period__c, WorkOrder.AccountId
                                          FROM WorkOrderLineItem WHERE WorkOrderId IN :completedWOs ORDER BY WorkOrderId]) 
            {
                if(woli.PricebookEntry.Product2.Clean_Out_Type__c != null && woli.PricebookEntry.Product2.Clean_Out_Type__c != '' && !productsWithExistingWarranties.contains(woli.PricebookEntry.Product2Id + '' + woli.WorkOrderId)){
                    productsWithExistingWarranties.add(woli.PricebookEntry.Product2Id + '' + woli.WorkOrderId);
                    warrantiesToCreate.add(new Warranty__c(
                        Product__c = woli.PricebookEntry.Product2Id, 
                        Work_Order__c = woli.WorkOrderId, 
                        Ship_To__c = woli.WorkOrder.AccountId, 
                        Warranty_Start__c = woli.WorkOrder.Completed_Date__c, 
                        Warranty_Period__c = woli.PricebookEntry.Product2.Warranty_Period__c
                    ));
                }
            }
            System.debug('>>Creating Warranties: ' + warrantiesToCreate);
            insert warrantiesToCreate;   
        }
        
        /* Case Creation block 
        * If WO is marked complete and the Repair Complete field is set to true
        * and Products Consumed is not empty 
        * create a case of "Invoice Informtaion" Record Type, Setting Type to a default value
        * assign it to Customer Success Queue
        * && wo.Repair_Completed__c!=oldRec.Repair_Completed__c 
        */
        
        for (WorkOrder wo : Trigger.new) {
            WorkOrder oldRec = Trigger.oldMap.get(wo.Id);
            Boolean isValid = wo.Status==dataSets.Work_Order_Completion_Status__c && String.isNotBlank(wo.Status) && wo.Repair_Completed__c && wo.Repair_Ticket__c==null /*&& wo.Status!=oldRec.Status wo.Repair_Completed__c!=oldRec.Repair_Completed__c*/;
            System.debug('--> Work Order Number ' + wo.WorkOrderNumber +' -- Valid for Repair Case ' + isValid);
            if(isValid) {
                repairWorkOrders.add(wo.Id);
            }
        }
        
        if (!repairWorkOrders.isEmpty()) {
            for(ProductConsumed pc : [SELECT Id, WorkOrderId FROM ProductConsumed WHERE WorkOrderId IN:repairWorkOrders]) {
                repairWorkOrdersMap.put(pc.WorkOrderId, null);
            }
        }
        
        if (!repairWorkOrdersMap.isEmpty()) {
            repairWorkOrdersMap = new Map<Id, WorkOrder>([SELECT Id, Status, Repair_Completed__c, AccountId, ContactId, Line_of_Business__c, Order__c, Unit_to_Repair_Include_Colour__c, Repair_Notes__c, 
                                                      Repair_Ticket__c FROM WorkOrder WHERE Id IN:repairWorkOrdersMap.keySet()]);
        }
        
        for(WorkOrder wo : repairWorkOrdersMap.values()) {
            Case newCase = new Case(
                AccountId=wo.AccountId, 
                ContactId=wo.ContactId, 
                Lines_of_Business__c=wo.Line_of_Business__c, 
                Order__c=wo.Order__c, 
                Subject='Repair Work Order Completed', 
                Work_Order__c = wo.Id, 
                RecordTypeId = dataSets.Repair_WorkOrder_Case_Record_Type__c, 
                OwnerId=dataSets.Customer_Service_Queue__c, 
                Type='Invoice Adjustment', 
                Repair_Notes__c = wo.Repair_Notes__c, 
                IsRepairTicket__c = TRUE
            );
            workOrderCases.put(wo.Id, newCase);
        }
        System.debug('Repair Work Order Cases from Work Order Trigger');
        System.debug(workOrderCases.values());
        upsert workOrderCases.values();
        for(WorkOrder wo : repairWorkOrdersMap.values()) {
            Id caseId = workOrderCases.get(wo.Id).Id;
            if(caseId!=null) {
                wo.Repair_Completed__c = FALSE;
                wo.Repair_Ticket__c = caseId;
            }
        }
        System.debug(repairWorkOrdersMap.values());
        
        if (!repairWorkOrdersMap.isEmpty()) {
            upsert repairWorkOrdersMap.values();
        }
        
        /* QA Work Order Section*/
        for (WorkOrder wo : trigger.new) {
            WorkOrder oldRec = Trigger.oldMap.get(wo.Id);
            if(wo.ParentWorkOrderId != null && wo.Status ==dataSets.Work_Order_Completion_Status__c && wo.RecordTypeId == dataSets.QA_WorkOrder_RecordTypeId__c) {
                parentWorkOrderIds.add(wo.ParentWorkOrderId);
            }
            Boolean process =  oldRec.Create_Quality_Assurance__c != wo.Create_Quality_Assurance__c && wo.Create_Quality_Assurance__c!=null ? true : false;
            if(process && !System.isBatch() && !System.isFuture()){
                workOrderIdsForQA.add(wo.Id);
            }
        }
        /* Completing QA Info on Parent Work Orders */
        if(!parentWorkOrderIds.isEmpty()) {
            for(WorkOrder wo : [SELECT Id, QA_Status__c FROM WorkOrder WHERE Id IN:parentWorkOrderIds]) {
                wo.QA_Status__c = 'Completed';
                wo.QA_Completed_Date__c = System.today();
                parentWorkOrders.add(wo);
            } 
            System.debug('after ' + parentWorkOrders);
            update parentWorkOrders;
        }
        
        if(!workOrderIdsForQA.isEmpty()) {
            System.debug('Future Call to CreateQA method');
            WorkOrderFutureCalls.createQA(workOrderIdsForQA, userId);
        }
        
        //WorkOrderTriggerHandler.UpdateSendPostInstallationSurvey(Trigger.new,Trigger.oldMap);
    }
    
    //only ever fire this on After Insert or After Update
    new WorkOrderPriorityFactory().executePriorityLogicV2();
}