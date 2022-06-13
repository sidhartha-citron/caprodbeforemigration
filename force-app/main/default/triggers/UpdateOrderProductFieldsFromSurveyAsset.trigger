trigger UpdateOrderProductFieldsFromSurveyAsset on Survey_Asset_Location__c (after insert, after update, after delete) {
    
    System.debug(' After Insert/Update trigger on Survey_Asset_Location__c ');
    
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    Map<Id, Order> orderMap = new Map<Id, Order>();
    Map<Id, Id> orderItemSurveyLocationMap = new Map<Id, Id>();
    Map<Id, Survey_Location__c> locationMap = new Map<Id, Survey_Location__c>();
    
    Set<Id> surveyAssetIds = new Set<Id>();
    
    List<OrderItem> updateOrderItems = new List<OrderItem>();
    
    if(Trigger.isDelete) {
        for (Survey_Asset_Location__c sl : Trigger.old) {
            locationMap.put(sl.Survey_Location__c, new Survey_Location__c(Id=sl.Survey_Location__c, UpdateQuantity__c=TRUE));
        }
        locationMap.remove(null);
    } else {
        for(Survey_Asset_Location__c sl : Trigger.new) {
            Survey_Asset_Location__c oldRec = (Trigger.isInsert ? new Survey_Asset_Location__c() : Trigger.oldMap.get(sl.Id));
            System.debug('Old SA Record ' + oldRec.Survey_Location__c +' New SA Record ' + sl.Survey_Location__c);
            if (Trigger.isInsert || (Trigger.isUpdate && sl.Survey_Location__c!=oldRec.Survey_Location__c)) {
                locationMap.put(sl.Survey_Location__c, new Survey_Location__c(Id=sl.Survey_Location__c, UpdateQuantity__c=TRUE));
                locationMap.put(oldRec.Survey_Location__c, new Survey_Location__c(Id=oldRec.Survey_Location__c, UpdateQuantity__c=TRUE));
                surveyAssetIds.add(sl.Id);
            }
        }
        locationMap.remove(null);
        if(!surveyAssetIds.isEmpty()) {
            System.debug(' There are Allocated Survey Assets'); 
            
            for(Order_Item_Location__c ol : [SELECT Id, Survey_Asset_Location__c, Survey_Asset_Location__r.Survey_Location__c, Order_Product__c
                                             FROM Order_Item_Location__c WHERE Survey_Asset_Location__c <> NULL AND Survey_Asset_Location__c IN:surveyAssetIds
                                             AND Order_Product__c <> NULL]) 
            {
                Survey_Asset_Location__c theNewLocation = Trigger.newMap.get(ol.Survey_Asset_Location__c);
                System.debug(' Location to be stamped ' + theNewLocation.Survey_Location__c);
                orderItemSurveyLocationMap.put(ol.Order_Product__c, theNewLocation.Survey_Location__c);
            }
            
            if(!orderItemSurveyLocationMap.isEmpty()) {
                for(OrderItem oi : [SELECT Id, Survey_Location__c, Parent_Order_Product__c, OrderId, Order.Status, Order.RecordTypeId FROM OrderItem 
                                    WHERE Id IN:orderItemSurveyLocationMap.keySet() OR Parent_Order_Product__c IN:orderItemSurveyLocationMap.keySet()]) 
                {
                    oi.Survey_Location__c = oi.Parent_Order_Product__c == null ? orderItemSurveyLocationMap.get(oi.Id) : orderItemSurveyLocationMap.get(oi.Parent_Order_Product__c);
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
                    //System.debug(orderMap.values());
                    TriggerHandler.bypass('OrderProductTriggerHandler');
                    update orderMap.values();
                    System.debug('Updating Locations of Order Items');
                    //System.debug(updateOrderItems); 
                    update updateOrderItems;
                   
                    for(Order o : orderMap.values()) {
                        o.Status = dataSets.Order_Active_Stage__c; 
                    }
                    
                    System.debug('Activating Orders');
                    //System.debug(orderMap.values());
                    update orderMap.values();
                    TriggerHandler.clearBypass('OrderProductTriggerHandler');
                }
            }
        }
    }
    
    if(!locationMap.isEmpty()) {
        update locationMap.values();
    }
}