trigger UpdateWorkOrderLineItemFields on Work_Order_Asset__c (after update) {
/*
    Field_Service_Settings__c fss = Field_Service_Settings__c.getOrgDefaults();
    List<WorkOrderLineItem> completedLineItems = new List<WorkOrderLineItem>();
    List<OrderItem> orderItems = new List<OrderItem>();
    List<Order> orders = new List<Order>();
    Set<Id> wAssetIds = Trigger.newMap.keySet();
    Set<Id> orderItemIds = new Set<Id>();
    Set<Id> orderIds = new Set<Id>();
    Map<Id, Id> orderItemAssetMap = new Map<Id, Id>();
    
    System.debug('Work Order Line Item Completion Trigger');
    
    List<Work_Order_Asset__c> wAssets = [SELECT Id, Asset__c, Name, Product__c, Work_Order_Room__c, Work_Order_Room__r.Work_Order__c,
                                         (SELECT Id, WorkOrderId, Order_Product__c, PricebookEntryId, Product__c, AssetId, Status, Work_Order_Asset__c, OrderId, 
                                          LineItemNumber FROM Work_Order_Line_Items__r)
                                         FROM Work_Order_Asset__c WHERE Id IN:wAssetIds AND Asset__c!=NULL AND Product__c!=NULL
                                        ];
    Map<Id, Work_Order_Asset__c> workOrderAssetMap = new Map<Id, Work_Order_Asset__c>(wAssets);
        
    if(!workOrderAssetMap.isEmpty()){
        System.debug(workOrderAssetMap);
        for(Work_Order_Asset__c wa : workOrderAssetMap.values()){
            if(!wa.Work_Order_Line_Items__r.isEmpty()){
                Set<WorkOrderLineItem> lineItems = new Set<WorkOrderLineItem>(wa.Work_Order_Line_Items__r);
                for(WorkOrderLineItem wi : lineItems){
                    if(wi.AssetId == null || wi.AssetId == wa.Asset__c) {
                        System.debug(wi.LineItemNumber + ' ' + wa.Name);
                        wi.AssetId = wa.Asset__c;
                        wi.Status = fss.Work_Order_Line_Item_Completed_Status__c;
                        wi.Completed_Date__c = System.today();
                        orderItemIds.add(wi.Order_Product__c);
                        orderItemAssetMap.put(wi.Order_Product__c, wa.Asset__c);
                        completedLineItems.add(wi);
                        lineItems.remove(wi);
                        workOrderAssetMap.remove(wi.Work_Order_Asset__c);
                        orderIds.add(wi.OrderId);
                    }
                }   
            }
        } 
    }
    
    if(!completedLineItems.isEmpty()){
        System.debug(completedLineItems);
        update completedLineItems;
    }
    
    for(Order o : [SELECT Id, Status, RecordTypeId FROM Order WHERE Id IN:orderIds AND Status=:fss.Order_Active_Stage__c]) {
        o.Status = o.RecordTypeId==fss.Regular_Order_Record_Type_Id__c ? fss.Regular_Order_Draft_Stage__c : fss.Shopping_Cart_Order_Draft_Stage__c;
        orders.add(o);
    }
    update orders; 
    
    for(OrderItem oi : [SELECT Id, Last_Scanned_Date__c, Order.OrderNumber, Asset__c FROM OrderItem WHERE Id IN:orderItemAssetMap.keySet() AND Active__c=TRUE]) {
        oi.Asset__c = orderItemAssetMap.get(oi.Id);
        oi.Last_Scanned_Date__c = System.today();
        orderItems.add(oi);
    }
    
    if(! orderItems.isEmpty()){
        System.debug( orderItems);
        update orderItems;
    }
    
    for(Order o : orders) {
        o.Status = fss.Order_Active_Stage__c;
    }
    update orders; */
}