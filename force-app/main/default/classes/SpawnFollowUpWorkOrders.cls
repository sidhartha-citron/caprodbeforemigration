global class SpawnFollowUpWorkOrders implements Database.Batchable<SObject> {
    public String queryString { get; set; }
    
    global SpawnFollowUpWorkOrders() {}

    global SpawnFollowUpWorkOrders(String s) {
        queryString = 'SELECT Id, Valid_For_FollowUp__c ' +
                'FROM WorkOrder WHERE Id=\'' + s + '\' ' +
                'AND Valid_For_FollowUp__c = TRUE';
    }
        
    global Database.QueryLocator start(Database.BatchableContext bc){
        if (String.isBlank(queryString)) {
            return Database.getQueryLocator([
                    SELECT Id
                    FROM WorkOrder
                    WHERE Account.isValid__c = TRUE
                    AND Valid_For_FollowUp__c=TRUE
            ]);
        } else {
            return Database.getQueryLocator(queryString);
        }        
    }

    global void execute(Database.BatchableContext bc, List<SObject> batch){
        Set<Id> workOrderIds = new Set<Id>();
        
        for(WorkOrder wo : (List<WorkOrder>) batch) {
            workOrderIds.add(wo.Id);
        }

        processWorkOrders(workOrderIds); 
    }
    
    global void processWorkOrders(Set<Id> workOrderIds) {
       
        Datetime todaysDateTime = Datetime.now();
        Date todaysDate = Date.today();
        
        Set<Id> woIds = new Set<Id>();
        Map<Id, Map<Id, Id>> pbe_pb_p2Map = new Map<Id, Map<Id, Id>>();
        Map<Id, OperatingHours> workOrderOperatingHours = new Map<Id, OperatingHours>();
        List<WorkOrder> updateParentWorkOrders = new List<WorkOrder>();
        List<WorkOrder> workOrderInsert = new List<WorkOrder>();
        
        List<WorkOrder> workOrders = new List<WorkOrder>([
                SELECT Id, WorkOrderNumber, Pricebook2Id, Opportunity__c, StartDate, Valid_For_FollowUp__c, WorkTypeId,
                        FSL__VisitingHours__c, Follow_Up_Created__c, ServiceTerritoryId, AccountId, ContactId, Priority,
                        Emergency__c, Order__c, Line_of_Business__c, Last_Batch_Updated_Date__c
                FROM WorkOrder
                WHERE Id IN :workOrderIds
        ]);
        
        for(WorkOrder wo : workOrders){
            woIds.add(wo.Id);
            pbe_pb_p2Map.put(wo.Pricebook2Id, new Map<Id,Id>());
            workOrderOperatingHours.put(wo.FSL__VisitingHours__c, null);  
        }
        
        workOrderOperatingHours.remove(null);

        workOrderOperatingHours = new Map<Id, OperatingHours>([
                SELECT Id, Name, TimeZone,
                        (SELECT Id, DayOfWeek, StartTime, EndTime
                        FROM TimeSlots
                        ORDER BY DayOfWeek, StartTime, EndTime)
                FROM OperatingHours
                WHERE Id IN :workOrderOperatingHours.keySet()
        ]);
        
        //existing line item to cloned line itemmap
        Map<Id, WorkOrderLineItem> updLineItem = new Map<Id,WorkOrderLineItem>();
        
        //existing parentworkorder+productId to cloned work order line items
        Map<String,List<WorkOrderLineItem>> woLineItemsMap = new Map<String,List<WorkOrderLineItem>>();
        
        //existing parentworkorder+productId to cloned work order
        Map<String,WorkOrder> woMap = new Map<String,WorkOrder>();
        
        if(!pbe_pb_p2Map.isEmpty()) {
            for(PricebookEntry pbe : [SELECT Id, Product2Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id IN :pbe_pb_p2Map.keySet()]) {
                pbe_pb_p2Map.get(pbe.Pricebook2Id).put( pbe.Product2Id, pbe.Id);
            }
        }
        
        Map<Id,List<WorkOrderLineItem>> existingWOLiMap = new Map<Id,List<WorkOrderLineItem>>();
        //Begin:11-21-2019:Irfan:Do not clone workorderlineitem with inactive order products
        List<WorkOrderLineItem> lis = [
                SELECT Id, WorkOrderId, WorkOrder.Pricebook2Id, PricebookEntry.Product2.Follow_up_After_N_Days__c,
                        PricebookEntry.Product2.Follow_up_Product__c, OrderId, Order_Product__c,
                        PricebookEntry.Product2.Follow_up_Product__r.Service_Work_Type__c, AssetId
                FROM WorkOrderLineItem
                WHERE Spawn_Follow_Up_Work_Order__c = TRUE
                AND Order_Product__r.IsActive__c = TRUE
                AND WorkOrderId = :woIds
        ];

        for (WorkOrderLineItem li: lis) {
            List<WorkOrderLineItem> lli = existingWOLiMap.get(li.WorkOrderId) == null ? new List<WorkOrderLineItem>() : existingWOLiMap.get(li.WorkOrderId);
            lli.add(li);
            existingWOLiMap.put(li.WorkOrderId, lli); 
            
        }
        //End

        for (WorkOrder wo: workOrders) {
            Map<Id, List<WorkOrderLineItem>> groupLineItemByProduct = new Map<Id,List<WorkOrderLineItem>>();            
            Map<Id,Integer> productFollowUpDays = new Map<Id,Integer>();  

            updateParentWorkOrders.add(new WorkOrder(Id = wo.Id, Follow_Up_Created__c = true));

            if (existingWOLiMap.get(wo.Id) != null) {
                for (WorkOrderLineItem li: existingWOLiMap.get(wo.Id)) {
                    
                    WorkOrderLineItem cli = li.clone(false, false, false, false);
                    cli.ParentWorkOrderLineItemId = li.Id;
                    Id followUpProd = li.PricebookEntry.Product2.Follow_up_Product__c;
                    cli.Status='New';
                    cli.Product__c = followUpProd;                     
                    cli.WorkTypeId = li.PricebookEntry.Product2.Follow_up_Product__r.Service_Work_Type__c;
                    cli.PricebookEntryId = pbe_pb_p2Map.get(wo.Pricebook2Id).get(followUpProd);
                    cli.Quantity = 1;   
                    
                    List<WorkOrderLineItem> wolis = groupLineItemByProduct.get(followUpProd) == null ? new List<WorkOrderLineItem>(): groupLineItemByProduct.get(followUpProd);
                    wolis.add(cli);
                    groupLineItemByProduct.put(followUpProd,wolis);
                    updLineItem.put(li.Id,cli);
                    
                    //maintain map for followup days for prod
                    productFollowUpDays.put(followUpProd,(Integer)li.PricebookEntry.Product2.Follow_up_After_N_Days__c);
                }
            }
            
            if (!groupLineItemByProduct.isEmpty()) {
                for (Id i: groupLineItemByProduct.keySet()) {
                    WorkOrder clonedWo = wo.clone(false,false,false,false);
                    clonedWo.Status = 'New';
                    clonedWo.Type__c = 'Follow-Up';
                    clonedWo.ParentWorkOrderId = wo.Id;
                    clonedWo.Last_Batch_Updated_Date__c = todaysDate;

                    Date startDate = wo.StartDate.addDays(productFollowUpDays.get(i)).date();
                    Datetime startDateTime =  Datetime.newInstance(startDate.year(), startDate.month(), startDate.day(), 00, 00, 00);
                    OperatingHours oh = workOrderOperatingHours.get(wo.FSL__VisitingHours__c);
                    DatetimeRecord woDates = new DatetimeRecord(startDateTime, startDateTime);

                    if(oh != null) {
                        woDates.opHours = oh;
                        woDates.emergency = wo.Emergency__c;
                        woDates.hasPestControlMonthly = false;
                        woDates = DatetimeRecord.getWODates(woDates, todaysDateTime);
                    }

                    clonedWo.StartDate = woDates.startDate;
                    clonedWo.EndDate = woDates.endDate;

                    //add wo, and corresponding line items to the map
                    String key = (String) wo.Id + (String) i;

                    woLineItemsMap.put(key, groupLineItemByProduct.get(i)); 
                    woMap.put(key, clonedWo); 
                }
            }
        }

        workOrderInsert.addAll(woMap.values());
        Database.SaveResult[] insertWOSR = Database.insert(workOrderInsert, false);
        
        if (!updateParentWorkOrders.isEmpty()) {
            update updateParentWorkOrders;
        }

        List<WorkOrderLineItem> insertLineItems = new List<WorkOrderLineItem>();

        //link new work order to cloned line items
        for (String s: woLineItemsMap.keySet()) {
            Id workOrderId = woMap.get(s).Id;

            for (WorkOrderLineItem li: woLineItemsMap.get(s)) {
                li.WorkOrderId = workOrderId;
                li.ParentWorkOrderLineItemId = null;
                insertLineItems.add(li);
            }
        }
        
        //now insert cloned line items
        Database.SaveResult[] insertWOLISR = Database.insert(insertLineItems, false);

        //update existing line items with the new cloned followup ids
        List<WorkOrderLineItem> updExistingLineItems = new List<WorkOrderLineItem>();
        
        //loop to update follow-up and new line item
        for (Id i : updLineItem.keySet()) {
            updExistingLineItems.add(new WorkOrderLineItem( Id=i, Follow_Up_Work_Order_Line_Item__c = updLineItem.get(i).Id ));
        }
        
        List<Batch_Errors__c> tErrorsList = new List<Batch_Errors__c>();

        //update existing line items
        if (!updExistingLineItems.isEmpty()) {
            //Begin:Shashi:10-21-2019: Changing this because upsert error is rolling back the batch
            Database.UpsertResult[] upsertExistinWOLineItems = Database.upsert(updExistingLineItems, false);
            
            for (Integer i = 0; i < upsertExistinWOLineItems.size(); i++) {
                if (!upsertExistinWOLineItems[i].isSuccess()) {//only look at failures, or NOT Successes
                    String errors = '';

                    for (Database.Error err : upsertExistinWOLineItems[i].getErrors()) {
                        errors = errors + err.getMessage();
                    }

                    WorkOrderLineItem woli = updExistingLineItems[i];

                    tErrorsList.add(new Batch_Errors__c(
                        Name=String.valueOf(System.today()), 
                        Error_Messages__c=errors, 
                        OrderId__c = woli.Id, 
                        OrderProductId__c = woli.Follow_Up_Work_Order_Line_Item__c, 
                        Failed_Batch__c = 'SpawnFollowUpWorkOrders'
                    ));
                }
        	}
            //End
        }
        
        for (Integer i = 0; i < insertWOSR.size(); i++) {
            if(!insertWOSR[i].isSuccess()){//only look at failures, or NOT Successes
                String errors = '';

                for (Database.Error err : insertWOSR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }

                WorkOrder wo = workOrderInsert[i];

                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c = errors, 
                    StartTime__c = wo.StartDate, 
                    EndTime__c = wo.EndDate, 
                    OrderId__c = wo.Order__c, 
                    OperatingHoursId__c = wo.FSL__VisitingHours__c, 
                    Failed_Batch__c = 'SpawnFollowUpWorkOrders'
                ));
            }
        }
        
        for (Integer i = 0;i < insertWOLISR.size(); i++) {
            if (!insertWOLISR[i].isSuccess()) {//only look at failures, or NOT Successes
                String errors = '';

                for (Database.Error err : insertWOLISR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }

                WorkOrderLineItem woli = insertLineItems[i];

                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c= errors, 
                    OrderId__c = woli.OrderId, 
                    OrderProductId__c = woli.Order_Product__c, 
                    Failed_Batch__c = 'SpawnFollowUpWorkOrders'
                ));
            }
        }
        
        insert tErrorsList;
    }

    global void finish(Database.BatchableContext bc){
        if(!Test.isRunningTest()){
            Database.executeBatch(new SpawnWorkOrderRooms(), 30);
        }
    }
}