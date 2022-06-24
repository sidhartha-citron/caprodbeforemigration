trigger UpdateOrderProductFieldsFromOrderItemLocation on Order_Item_Location__c (after insert, after update) {
    System.debug(' After Insert/Update trigger on Order Item Location ');
    
    Map<Id, Id> orderItemSurveyLocationMap = new Map<Id, Id>();
    Set<Id> orderItemLocationIds = new Set<Id>();
    List<OrderItem> updateOrderItems = new List<OrderItem>();
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    Map<Id, Order> orderMap = new Map<Id, Order>();
    
    for(Order_Item_Location__c ol : Trigger.new) {
        Order_Item_Location__c oldRec = (Trigger.isInsert ? new Order_Item_Location__c() : Trigger.oldMap.get(ol.Id));
        
        if (ol.Order_Product__c != null && ol.Survey_Asset_Location__c!=null && (Trigger.isInsert || (Trigger.isUpdate && ol.Survey_Asset_Location__c!=oldRec.Survey_Asset_Location__c))) {
            orderItemLocationIds.add(ol.Id);
        }
    }
    
    if(!orderItemLocationIds.isEmpty()) {
        System.debug(' There are Order Item Locations with Survey Assets and Order Products '); 
        for(Order_Item_Location__c ol : [SELECT Id, Survey_Asset_Location__c, Survey_Asset_Location__r.Survey_Location__c, Order_Product__c 
                                         FROM Order_Item_Location__c WHERE Survey_Asset_Location__c <> NULL AND Survey_Asset_Location__r.Survey_Location__c <> NULL
                                        AND Id IN:orderItemLocationIds]) 
        {
            System.debug(' The Location ' + ol.Survey_Asset_Location__r.Survey_Location__c);
            orderItemSurveyLocationMap.put(ol.Order_Product__c, ol.Survey_Asset_Location__r.Survey_Location__c);
        }
        
        for(OrderItem oi : [SELECT Id, Parent_Order_Product__c, Survey_Location__c, OrderId, Order.Status, Order.RecordTypeId FROM OrderItem 
                            WHERE Id IN:orderItemSurveyLocationMap.keySet() AND Parent_Order_Product__c = NULL ])
        {
            oi.Survey_Location__c = orderItemSurveyLocationMap.get(oi.Id);
            System.debug('The new survey location ' + oi.Survey_Location__c);
            updateOrderItems.add(oi);
            if(!orderMap.containsKey(oi.OrderId)) {
                Order o = oi.Order;
                if(o.Status==dataSets.Order_Active_Stage__c) {
                    o.Status = o.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c;
                    orderMap.put(o.Id, o);
                }
            }
        }
        
        for(OrderItem oi : [SELECT Id, Parent_Order_Product__c, Survey_Location__c, OrderId, Order.Status, Order.RecordTypeId FROM OrderItem 
                            WHERE Parent_Order_Product__c <> NULL AND Parent_Order_Product__c IN:orderItemSurveyLocationMap.keySet()])
        {
            oi.Survey_Location__c = orderItemSurveyLocationMap.get(oi.Parent_Order_Product__c);
            System.debug('The new survey location ' + oi.Survey_Location__c);
            updateOrderItems.add(oi);
            if(!orderMap.containsKey(oi.OrderId)) {
                Order o = oi.Order;
                if(o.Status==dataSets.Order_Active_Stage__c) {
                    o.Status = o.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c;
                    orderMap.put(o.Id, o);
                }
            }
        }
        
        if(!updateOrderItems.isEmpty()) {
            System.debug('Deactivating Orders');
            TriggerHandler.bypass('OrderTriggerHandler');
            System.debug(orderMap.values());
            TriggerHandler.clearBypass('OrderTriggerHandler');
            update orderMap.values();
            
            System.debug('Updating Order Items ');
            System.debug(updateOrderItems);
            update updateOrderItems;
            
            for(Order o : orderMap.values()) {
                o.Status = dataSets.Order_Active_Stage__c; 
            }
            System.debug('Activating Orders');
            TriggerHandler.bypass('OrderTriggerHandler');
            System.debug(orderMap.values());
            update orderMap.values();
            TriggerHandler.clearBypass('OrderTriggerHandler');
        }
    }
}