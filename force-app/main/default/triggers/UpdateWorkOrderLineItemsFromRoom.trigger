trigger UpdateWorkOrderLineItemsFromRoom on Work_Order_Room__c (after update) {
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    List<WorkOrderLineItem> cannotCompleteLineItems = new List<WorkOrderLineItem>();
    Map<Id, Work_Order_Room__c> cannotCompleteWorkOrderRooms = new Map<Id, Work_Order_Room__c>();
    Map<Id, Work_Order_Room__c> roomsToGenerateLineItem = new Map<Id, Work_Order_Room__c>();
    Map<Id, Decimal> surveyLocationsAndServiceOrders = new Map<Id, Decimal>();
    
    for(Work_Order_Room__c wor : Trigger.new) {
        Work_Order_Room__c oldRec = Trigger.oldMap.get(wor.Id);
        
        if(wor.Status__c==dataSets.Cannot_Complete_Status_Value__c && wor.Cannot_Complete_Reason__c!=null /*&& wor.Cannot_Complete_Reason__c!=oldRec.Cannot_Complete_Reason__c*/) {
            cannotCompleteWorkOrderRooms.put(wor.Id, wor);
        }
        
        if (wor.Generate_Work_Order_Line_Item__c && wor.Work_Order_Pricebook__c!=null && wor.Product__c!=null) {
            roomsToGenerateLineItem.put(wor.Id, wor);
        }
        
        if (oldRec.Service_Order__c != wor.Service_Order__c) {
            surveyLocationsAndServiceOrders.put(wor.Survey_Location__c, wor.Service_Order__c);
        }
    }
    cannotCompleteWorkOrderRooms.remove(null);
    surveyLocationsAndServiceOrders.remove(null);
    
    if(!cannotCompleteWorkOrderRooms.isEmpty()) {
        for(WorkOrderLineItem woli : [SELECT Id, Cannot_Complete_Reason__c, Work_Order_Location__c FROM WorkOrderLineItem 
                                      WHERE Work_Order_Location__c IN :cannotCompleteWorkOrderRooms.keySet() AND Cannot_Complete_Reason__c=null
                                      ORDER BY Work_Order_Location__c]) 
        {
            Work_Order_Room__c wor = cannotCompleteWorkOrderRooms.get(woli.Work_Order_Location__c);
            if(wor!=null) {
                woli.Status = dataSets.Cannot_Complete_Status_Value__c;//21635 [dk]
                woli.Cannot_Complete_Reason__c = wor.Cannot_Complete_Reason__c;
                cannotCompleteLineItems.add(woli);
            }
        }
        System.debug('*LineItems Updated with Cannot Complete Reason from WorkOrderRoom*');
        System.debug(cannotCompleteLineItems);
        update cannotCompleteLineItems;
    }
    
    //case 21478 - generate a Work Order Line Item [dk]
    roomsToGenerateLineItem.remove(null);

    if (!roomsToGenerateLineItem.isEmpty() && !TriggerHelper.hasRun) {
        TriggerHelper.hasRun = true;
        
        List<WorkOrderLineItem> items = new List<WorkOrderLineItem>();
        Set<Id> productIds = new Set<Id>();
        //WOL/PBE
        Map<Id, Id> roomToPbeMap = new Map<Id, Id>();
        
        Map<Id, Map<Id, Id>> pbe_pb_p2Map = new Map<Id, Map<Id, Id>>();
        Set<Id> pricebookIds = new Set<Id>();
        List<ProductConsumed> pcs = new List<ProductConsumed>();
        
        for (Work_Order_Room__c wor : roomsToGenerateLineItem.values()) {
            productIds.add(wor.Product__c);
            pricebookIds.add(wor.Work_Order_Pricebook__c);
            pbe_pb_p2Map.put( wor.Product__c, new Map<Id,Id>{wor.Work_Order_Pricebook__c => null});
        }
        
        pricebookIds.remove(null);
        pbe_pb_p2Map.remove(null);
        productIds.remove(null);
        
        for (PricebookEntry pbe : [SELECT Id, Product2Id, Pricebook2Id FROM PricebookEntry WHERE Product2Id IN :pbe_pb_p2Map.keySet() AND Pricebook2Id IN:pricebookIds
                                   AND IsActive=TRUE AND Product2.IsActive=TRUE]) {
            pbe_pb_p2Map.get( pbe.Product2Id).put( pbe.Pricebook2Id, pbe.Id);
        }
        
        for (Work_Order_Room__c wor : roomsToGenerateLineItem.values()) {
            Id pEntryId = pbe_pb_p2Map.get(wor.Product__c).get(wor.Work_Order_Pricebook__c);
            if(pEntryId!=null) {
                items.add(
                    new WorkOrderLineItem(
                        WorkOrderId=wor.Work_Order__c, 
                        Work_Order_Location__c=wor.Id, 
                        Product__c=wor.Product__c, 
                        Quantity=1, 
                        PricebookEntryId=pEntryId
                    )
                );
            }
        }
        
        insert items;
        
        for (WorkOrderLineItem item : items) {
            pcs.add(
                new ProductConsumed(
                    WorkOrderId=item.WorkOrderId, 
                    PricebookEntryId=item.PricebookEntryId, 
                    QuantityConsumed=item.Quantity, 
                    WorkOrderLineItemId=item.Id
                )
            );
        }
        
        insert pcs;
    }
    
    if (!surveyLocationsAndServiceOrders.isEmpty() && !TriggerHelper.isWorkOrderLocationFutureCalled && !System.isFuture() && !System.isBatch()) {
        TriggerHelper.isWorkOrderLocationFutureCalled = true;
        WorkOrderLocationFutureCalls.updateServiceOrder(surveyLocationsAndServiceOrders);
    }
}