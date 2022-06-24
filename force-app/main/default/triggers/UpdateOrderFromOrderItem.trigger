trigger UpdateOrderFromOrderItem on OrderItem (after insert, after update, after delete) {
    Set<Id> orderIds = new Set<Id>();
    List<Order> updateOrders = new List<Order>();
    Map<Id,OrderItem> orderItemMap = new Map<Id,OrderItem>();
    Set<Id> orderItemDeletes = new Set<Id>();
    List<OrderItem> orderItemUpdates = new List<OrderItem>();
    Map<Id,Order> originalOrderStates = new Map<Id,Order>();
    Map<Id,Order> tempOrderStates = new Map<Id,Order>();
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    if(Trigger.isDelete) {
        for(OrderItem oi : Trigger.old) {
            orderIds.add(oi.OrderId);
        }
    } else {
        for (OrderItem oi : Trigger.new) {
            OrderItem oldRec = Trigger.isInsert ? new OrderItem() : Trigger.oldMap.get(oi.Id);
            Boolean isValid = oi.Line_of_Business__c!=oldRec.Line_of_Business__c || oi.Item_Type__c!=oldRec.Item_Type__c || oi.Active__c!=oldRec.Active__c;
            orderItemMap.put(oi.Id,oi);
            if(isValid) {
                orderIds.add(oi.OrderId);
            }
        }
    }
        
    
    for(Order o : [SELECT Id, Product_Categories__c, Line_of_Businesses__c, Status, RecordTypeId, 
                    (SELECT Id, Item_Type__c, Product2Id, ServiceDate, EndDate, Active__c, Asset__c, Related_Product__c, Separate_Delivery__c, Service_Price_Per_Unit__c, 
                     Installation_Price__c, Purchase_Price__c, Inventory_Allocated__c, Description, Line_of_Business__c, Order.Status, Order.RecordTypeId FROM OrderItems WHERE Active__c=TRUE) 
                    FROM Order WHERE Id IN :orderIds]) 
    {
        Set<String> categorySet = new Set<String>();
        Set<String> lobSet = new Set<String>();
        String categories;
        String lob;
        Boolean areAllLineItemsInactive = true;//21618
        
        for(OrderItem oi : o.OrderItems){
            categorySet.add(oi.Item_Type__c);
            lobSet.add(oi.Line_of_Business__c);
            orderItemMap.put(oi.Id, oi);
            
            if (oi.Active__c && areAllLineItemsInactive) {
                areAllLineItemsInactive = false;
            }
        }
        
        if(!categorySet.isEmpty()){
            List<String> categoryList = new List<String>();
            categoryList.addAll(categorySet);
            categories = String.join(categoryList, ';');
        }
        
        if(!lobSet.isEmpty()) {
            List<String> lobList = new List<String>();
            lobList.addAll(lobSet);
            lob = String.join(lobList, ';');
        }
        
        if (o.Product_Categories__c != categories || o.Line_of_Businesses__c != lob) {
            o.Product_Categories__c = categories;
            //o.Line_of_Businesses__c = lob;
            //21618 - bypass this piece so the line of business doesn't get wiped and inadvertently throwing a validation rule
            if (!areAllLineItemsInactive) {
                o.Line_of_Businesses__c = lob;
            }
            
            updateOrders.add(o);
        }
    }
    orderItemMap.remove(null);
    if (!orderItemMap.isEmpty()) {
        
        for (OrderItem oi : [SELECT Id, Parent_Order_Product__c, OrderId, Order.Status, Product2Id, ServiceDate, EndDate, Active__c, Asset__c, Order.RecordTypeId,
                             Related_Product__c, Separate_Delivery__c, Service_Price_Per_Unit__c, Installation_Price__c, Purchase_Price__c, Inventory_Allocated__c, Description 
                             FROM OrderItem WHERE Parent_Order_Product__c IN :orderItemMap.keyset()]) {
            OrderItem mainRec = orderItemMap.get(oi.Parent_Order_Product__c);
            
            if (oi.Product2Id != mainRec.Product2Id ||
                oi.ServiceDate != mainRec.ServiceDate || 
                oi.EndDate != mainRec.EndDate ||
                oi.Active__c != mainRec.Active__c ||
                oi.Asset__c != mainRec.Asset__c ||
                oi.Related_Product__c != mainRec.Related_Product__c || 
                oi.Separate_Delivery__c != mainRec.Separate_Delivery__c || 
                oi.Service_Price_Per_Unit__c != mainRec.Service_Price_Per_Unit__c ||
                oi.Installation_Price__c != mainRec.Installation_Price__c || 
                oi.Purchase_Price__c != mainRec.Purchase_Price__c ||
                oi.Inventory_Allocated__c != mainRec.Inventory_Allocated__c ||
                oi.Description != mainRec.Description
            ) {
            
                originalOrderStates.put(oi.OrderId, new Order(
                    Id = oi.OrderId,
                    Status = oi.Order.Status
                ));
                tempOrderStates.put(oi.OrderId, new Order(
                    Id = oi.OrderId,
                    Status = oi.Order.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c
                ));
                
                oi.ServiceDate = mainRec.ServiceDate;
                oi.EndDate = mainRec.EndDate;
                oi.Active__c = mainRec.Active__c;
                oi.Asset__c = mainRec.Asset__c;
                oi.Related_Product__c = mainRec.Related_Product__c;
                oi.Separate_Delivery__c = mainRec.Separate_Delivery__c;
                oi.Service_Price_Per_Unit__c = mainRec.Service_Price_Per_Unit__c;
                oi.Installation_Price__c = mainRec.Installation_Price__c;
                oi.Purchase_Price__c = mainRec.Purchase_Price__c;
                oi.Inventory_Allocated__c = mainRec.Inventory_Allocated__c;
                oi.Description = mainRec.Description;
                orderItemUpdates.add(oi);
            }
        }
    }
    
    if (!updateOrders.isEmpty()) {
        update updateOrders;
    }
    
    if (!orderItemUpdates.isEmpty()) {
        System.debug(tempOrderStates.values());
        update tempOrderStates.values();
        update orderItemUpdates;
        update originalOrderStates.values();
    }
}