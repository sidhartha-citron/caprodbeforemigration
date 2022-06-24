trigger SetOrderProductFields on OrderItem (before insert, before update, before delete, after insert, after update) {
    
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    Id userProfileId = UserInfo.getProfileId();
    Date todaysDate = System.today();
    
    List<OrderItem> spawnedOrderItems = new List<OrderItem>();
    
    Map<Id, Order> orderMapforSpawning = new Map<Id, Order>();
    Map<Id, Order> orderMap = new Map<Id, Order>();
    Map<Id,Product2> prodMap = new Map<Id,Product2>();
    Map<Id,Id> prodPricebookEntryMap = new Map<Id,Id>();
    Map<String,Frequency__c> freqMap = Frequency__c.getAll();
    Map<Id, Integer> spawnQuantityMap = new Map<Id, Integer>();
    //Map<String, Datetime> accountProductUniqueKeys = new Map<String, Datetime>();
    
    Set<Id> pricebookEntryIds = new Set<Id>();
    Set<Id> orderItemDeletes = new Set<Id>();
    
  
    if (Trigger.isDelete) {
        Set<Id> parentOrderIds = new Set<Id>();
        List<Order_Product_Delete__c> orderproductdeletes = new List<Order_Product_Delete__c>();
        for (OrderItem oi : Trigger.old) {
            orderproductdeletes.add(new Order_Product_Delete__c(
                    Date_Deleted__c=System.today(), 
                    Order__c=oi.OrderId, 
                    Order_Item_Status__c=oi.Installation_Status__c, 
                    Order_Item_Number__c=oi.OrderItemNumber, 
                    Order_Product_ID__c=oi.Id
                )
            ); 
            parentOrderIds.add(oi.OrderId);
            orderItemDeletes.add(oi.Id);
        }
        System.debug('Creating Order Product Delete Records for deleted Order Items');
        System.debug(orderproductdeletes);
        insert orderproductdeletes;
        
        List<Order> childOrders = [SELECT Id, Status, Parent_Order__c, RecordTypeId FROM Order WHERE Parent_Order__c IN:parentOrderIds AND Status='Activated'];
        
        for(Order o : childOrders) {
            o.Status = o.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c;
        }
        update childOrders;
        
        if (!orderItemDeletes.isEmpty()) {
            delete [SELECT Id FROM OrderItem WHERE Parent_Order_Product__c IN :orderItemDeletes];
        }
        for(Order o : childOrders) {
            o.Status = dataSets.Order_Active_Stage__c;
        }
        update childOrders;
        
        Set<Id> surveyAssetIds = new Set<Id>();
        List<Order_Item_Location__c> orderLocationDeletes = new List<Order_Item_Location__c>();
        for(Order_Item_Location__c oil : [SELECT Id, Survey_Asset_Location__c, Order_Product__c, Order_Product__r.Order.Emergency__c 
                                          FROM Order_Item_Location__c WHERE Order_Product__c IN:orderItemDeletes]) 
        {
            orderLocationDeletes.add(oil);
            if(!oil.Order_Product__r.Order.Emergency__c) {
                surveyAssetIds.add(oil.Survey_Asset_Location__c);
            }
        }
        
        if(!orderLocationDeletes.isEmpty()) {
            delete orderLocationDeletes;
            if(!surveyAssetIds.isEmpty()) {
                delete [SELECT Id FROM Survey_Asset_Location__c WHERE Id IN: surveyAssetIds];
            }
        }
    } 
    
    if(Trigger.isBefore && !Trigger.isDelete) {
        //21506, Dec 11, 2018
        OrderItemUtilityClass.orderItemPriceController((List<OrderItem>)Trigger.New, (Map<Id, OrderItem>)Trigger.oldMap);
        
        for (OrderItem oi : Trigger.new) {
            pricebookEntryIds.add(oi.PricebookEntryId);
            prodPricebookEntryMap.put(oi.PricebookEntryId, null);
            orderMap.put(oi.OrderId, null);
            
            //if (oi.Is_Generated_From_Ticket__c) { oi.Is_Generated_From_Ticket__c = false; }
        }
        
        orderMap.remove(null);
        prodPricebookEntryMap.remove(null);
        
        System.debug(pricebookEntryIds);
        for (PricebookEntry p : [SELECT Id, Name, Product2Id FROM PricebookEntry WHERE Id IN :prodPricebookEntryMap.keySet()]) {
            prodPricebookEntryMap.put(p.Id, p.Product2Id);
            prodMap.put(p.Product2Id,null);
        }
        prodMap.remove(null);
        System.debug(prodPricebookEntryMap);
        System.debug(prodMap);
        
        for (Product2 p : [SELECT Id, Item_Type__c, Allowable_Frequencies__c, Name FROM Product2 WHERE Id IN :prodMap.keySet()]) {
            prodMap.put(p.Id,p);
        }
        System.debug(prodMap);
        
        orderMap = new Map<Id, Order>([SELECT ID, Status, EffectiveDate, Parent_Order__c, Site_Survey__c, Emergency__c FROM Order WHERE ID IN : orderMap.keySet()]);
        System.debug(orderMap);

        // Check permission set
        List<PermissionSetAssignment> isUserAuthenticated = [SELECT PermissionSetId, AssigneeId FROM PermissionSetAssignment WHERE AssigneeId =: Userinfo.getUserId() AND PermissionSetId =: dataSets.FSLAllowActivatedOrderUpdateId__c LIMIT 1];
        
        for (OrderItem oi : Trigger.new) {
            OrderItem oldRec = Trigger.isInsert ? new OrderItem() : Trigger.oldMap.get(oi.Id);
            Order o = orderMap.get(oi.OrderId);
            
            if(!oi.Active__c && oi.Active__c!=oldRec.Active__c){
                oi.Deactivated_Date__c = System.today();
            }
            if(!oi.Active__c && oi.Active__c==oldRec.Active__c) {
                oi.addError('This Order Product is not Active, Please Activate the Order Product before updating it');
            }
            
            if(oi.Installation_Status__c!=NULL && oi.Installation_Status__c!=oldRec.Installation_Status__c && !TriggerHelper.isCompletionTrigger) {
                oi.Valid_for_Install_Remove_Replace__c = TRUE;
            } else if(oi.Installation_Status__c==NULL){
                oi.Valid_for_Install_Remove_Replace__c = FALSE;
            }
            
            oi.Inventory_Consumed__c = oi.Inventory_Allocated__c && !oldRec.Inventory_Allocated__c ? FALSE :  oi.Inventory_Consumed__c; //for case 21528 to detect inventory allocated change
            
            //21528 - set Next Service Date field
            if(oi.Last_Automation_Created_Date__c!=NULL || oi.Last_InFlight_WO_Date__c!=NULL) {
                oi.Next_Service_Date__c = oi.Last_Automation_Created_Date__c;
                oi.Next_Service_Date__c = (oi.Last_InFlight_WO_Date__c!=NULL && oi.Last_InFlight_WO_Date__c > oi.Next_Service_Date__c) || oi.Next_Service_Date__c==NULL ? oi.Last_InFlight_WO_Date__c : oi.Next_Service_Date__c;
                oi.Next_Service_Date__c = oi.Next_Service_Date__c.addDays(Integer.valueOf(oi.FrequencyInDays__c));
                
            } else if (dataSets.Service_Start__c!=null){
                System.debug('EFFECTIVE DATE VALUE: ' + o);
                oi.Next_Service_Date__c = o.EffectiveDate.addDays(Integer.valueOf(dataSets.Service_Start__c));
            }
            
            oi.Next_Service_Date__c = oi.Next_Service_Date__c >= todaysDate ? oi.Next_Service_Date__c : todaysDate;
            
            Boolean isValid = oldRec.Installation_Price__c!=oi.Installation_Price__c || oi.Installation_Status__c!=oldRec.Installation_Status__c;            
            if(isValid) {
                Boolean isConsumableOneTime = (oi.Installation_Status__c != null && oi.Installation_Status__c != dataSets.Status_Value_for_Install_of_a_Product__c) && oi.Frequency__c.equalsIgnoreCase(dataSets.Non_Recurring_Frequency_Value__c) && oi.Item_Type__c.equalsIgnoreCase(dataSets.Item_Type_for_Consumables__c);
                System.debug('isConsumableOneTime ' + isConsumableOneTime);
                
                if(isConsumableOneTime) {
                    oi.addError(' You cannot provide Installation Price or Installation Status for a One-Time Consumable Product. ');
                } else {
                    Boolean requireStatus = oi.Installation_Price__c!=NULL && (oi.Installation_Status__c!=dataSets.Status_Value_for_Install_of_a_Product__c && oi.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c);
                        /*&& oldRec.Installation_Price__c!=oi.Installation_Price__c &&  */
                    System.debug('RequireStatus ' + requireStatus);
                    
                    if(requireStatus && oi.Installation_Status__c!=dataSets.Status_Value_for_Removal_of_a_Product__c) {
                        oi.Installation_Status__c.addError('Please fill in Installation Status picklist for this item');
                    }
                    Boolean requireInstallPrice = String.isNotBlank(oi.Installation_Status__c) && (oi.Installation_Status__c==dataSets.Status_Value_for_Install_of_a_Product__c || oi.Installation_Status__c==dataSets.Status_Value_for_Replace_of_a_Product__c) && oi.Installation_Price__c==NULL; 
                    if(requireInstallPrice) {
                        oi.Installation_Price__c.addError('Please enter a value for the Installation Price field for Installation Statuses of ' + dataSets.Status_Value_for_Install_of_a_Product__c +' or ' + dataSets.Status_Value_for_Replace_of_a_Product__c +', zero dollars are accepted, if customer should not be charged. ');
                    }
                }
            }
            
            Id productId = prodPricebookEntryMap.get(oi.PricebookEntryId);
            Product2 prod = prodMap.get(productId);
            if (prod != null) {
                oi.Product_Type__c = prod.Item_Type__c;
            }
            
            if (prod != null) {
                if(prod.Allowable_Frequencies__c != null) {
                    Set<String> allowableFreq = new Set<String>(); 
                    allowableFreq.addAll(prod.Allowable_Frequencies__c.split(';'));
                    if (oi.Service_Price_Per_Unit__c != null && oi.Frequency__c != null && !allowableFreq.contains(oi.Frequency__c )) {
                        oi.Frequency__c.addError(oi.Frequency__c + ' is not applicable for the product. Applicable frequencies are ' + prod.Allowable_Frequencies__c);
                    }
                } else if(oi.Frequency__c != 'One-Time'){
                    oi.Frequency__c.addError(prod.Name + ' cannot be a recurring service/delivery');
                }
                
            }
            //Price calculation
            Frequency__c frequency = freqMap.get(oi.Frequency__c);
            
            //Standard UnitPrice, represents total first year cost for quantity of 1
            oi.UnitPrice = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (oi.Service_Price_Per_Unit__c != null ? oi.Service_Price_Per_Unit__c : 0) : 0) + (oi.Installation_Price__c != null ? oi.Installation_Price__c : 0) + (oi.Purchase_Price__c != null ? oi.Purchase_Price__c : 0);
            
            //Monthly Revenue =  ((# of Occurrences * Service Price / 12)
            oi.Monthly_Revenue__c = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (oi.Service_Price_Per_Unit__c != null ? oi.Service_Price_Per_Unit__c : 0) : 0)/12;
            
            if (Trigger.isInsert) {    
                if(oi.Order.EffectiveDate <= System.today()) {
                    oi.ServiceDate = System.today();
                } else {
                    oi.ServiceDate = orderMap.get(oi.OrderId).EffectiveDate;
                }
                oi.Active__c = TRUE;
            }
            
            if(o.Status==dataSetS.Order_Active_Stage__c && userProfileId!=dataSets.System_Administrator_Profile_Id__c && userProfileId!=dataSets.Integration_User_Profile__c && isUserAuthenticated.isEmpty()) {
                oi.addError('Please deactivate the order before editing the line items. ');
            }
        }
        
        for (OrderItem oi : Trigger.new) {
            Order o = orderMap.get(oi.OrderId); 
            System.debug('**Quantity Block** ' + oi.OrderItemNumber + ' ' + oi.Quantity);
            
            if(oi.Quantity > 1 && oi.Active__c) {
                System.debug('**Quantity Block Inside** ' + oi.OrderItemNumber + ' ' + oi.Quantity);
                Integer originalQuantity = Integer.valueOf(oi.Quantity - 1); 
                System.debug('**Oringinal Quantity ** ' + oi.Id + ' ' + oi.Quantity);
                oi.Quantity = 1;
                
                if(o!=null && originalQuantity!=null) {
                    if(o.Status!=dataSetS.Order_Active_Stage__c || userProfileId==dataSets.System_Administrator_Profile_Id__c || userProfileId==dataSets.Integration_User_Profile__c) {
                        for(Integer i=0; i<originalQuantity; i++) {
                            OrderItem newItem = oi.clone(false, true, false, false);
                            newItem.HasSurveyAssets__c = false;
                            newItem.Quantity = 1;
                            newItem.Survey_Location__c = null;
                            spawnedOrderItems.add(newItem);
                        }
                    } else{
                        oi.addError('Please deactivate the order before editing the line items. ');
                    }
                }
            }
        }
        
        if(!spawnedOrderItems.isEmpty()) {
            System.debug('Spawned ' + spawnedOrderItems.size() + ' items');
            upsert spawnedOrderItems;
        }
        //21618
        OrderItemUtilityClass.setActiveLookupToOrder((List<OrderItem>)Trigger.New);
    }
        /* site survey asset creation, executed only for order line items with a site survey attached to parent order, has either installation/service price filled in and if the order is
         * the parent order. If order is spawned from an opportunity, then site survye information is already copied over,  
         * Order qty is always 1 -- hence no logic is implemented to facilitate qty increase or decrease and site survey details maintanence
         * if order line items are deleted then all associated site survey information is deleted -- done in the beginning of this trigger -- this is in the case of parent order
         * After insert of an orderItem , if it is on a parent order site survey records would be created if those details arent already in the system
         * if order item is inserted from a child order, a corresponding one wouldbe added to the parent order and it would have site survey information -- confirm this with Tu
         */
    if(Trigger.isAfter) {
        System.debug('after trigger');
        Map<Id, OrderItem> newOrderItems = new Map<Id, OrderItem>([SELECT Id, OrderId, Order.Parent_Order__c, Parent_Order_Product__c, isPurchaseOnly__c, PricebookEntry.Product2Id, Frequency__c, Active__c, Survey_Location__c,
                                                                   HasSurveyAssets__c, Order.Site_Survey__c, Order.Parent_Order__r.Site_Survey__c, Quantity, Order.Emergency__c, Related_Product__c, Order.RecordTypeId
                                                                   FROM OrderItem WHERE Id IN: Trigger.new AND Active__c=TRUE AND Is_Replacement_from_Flow__c=FALSE]);//21618, filtering these out to have logic run in flow
        
        System.debug('After Trigger on OrderItem to generate Site Survey Details');
        
        
        List<OrderItem> newChildOrderItems = new List<OrderItem>();
        Set<Id> orderIds = new Set<Id>();
        List<OrderItem> newParentItems = new List<OrderItem>();
        Map<Id, List<Order>> childOrders = new Map<Id, List<Order>>();
        List<Order> childOrderList = new List<Order>();
        List<Order> originalChildOrders = new List<Order>();
        List<Order_Item_Location__c> newOrderItemLocations = new List<Order_Item_Location__c>();
        Map<Id, Survey_Asset_Location__c> newAssetMap = new Map<Id, Survey_Asset_Location__c>();
        List<OrderItem> emergencyOrderItems = new List<OrderItem>();
        List<Order_Item_Location__c> emergencyOrderItemLocations = new List<Order_Item_Location__c>();
        Map<Id, OrderItem> updateSurveyAssetsIds = new Map<Id, OrderItem>();
        List<Survey_Asset_Location__c> updateSurveyAssets = new List<Survey_Asset_Location__c>();
        
        for(OrderItem oi : Trigger.new) 
        {
            if(oi.Active__c) {
                OrderItem theItem = newOrderItems.get(oi.Id);
                Boolean isValid = theItem != null && theItem.Order.Parent_Order__c == null && theItem.Order.Site_Survey__c != null /*&& !theItem.Order.Emergency__c*/;
                if(isValid) {
                    if(Trigger.isUpdate) {
                        OrderItem oldRec = Trigger.oldMap.get(oi.Id);
                        if(oldRec.Related_Product__c != oi.Related_Product__c || oldRec.Frequency__c != oi.Frequency__c) {
                            System.debug(' -- Changed Related Prod or Frequency -- ' + oi.OrderItemNumber);
                            updateSurveyAssetsIds.put(oi.Id, oi);
                        }
                    }
                    if(Trigger.isInsert) {
                        orderIds.add(oi.OrderId);
                        newParentItems.add(theItem);
                    }
                }
            }
        }
        
        if(!updateSurveyAssetsIds.isEmpty()) {
            for(Order_Item_Location__c ol : [SELECT Order_Product__c, Survey_Asset_Location__r.Related_Product__c, Survey_Asset_Location__r.Service_Frequency__c 
                                                                       FROM Order_Item_Location__c WHERE Order_Product__c=:updateSurveyAssetsIds.keySet()]) 
            {
                OrderItem oi = updateSurveyAssetsIds.get(ol.Order_Product__c);
                ol.Survey_Asset_Location__r.Related_Product__c = oi.Related_Product__c; 
                ol.Survey_Asset_Location__r.Service_Frequency__c = oi.Frequency__c;
                updateSurveyAssets.add(ol.Survey_Asset_Location__r);
            }
            if(!updateSurveyAssets.isEmpty()) {
                System.debug(updateSurveyAssets);
                update updateSurveyAssets;
            }
        }
        
        if(Trigger.isInsert) {
            if(!orderIds.isEmpty() && !newParentItems.isEmpty()) {
                for(Order o : [SELECT Id, Parent_Order__c, Status, RecordTypeId, Parent_Order__r.RecordTypeId FROM Order WHERE Parent_Order__c IN:orderIds]) {
                    if(o.Status.equalsIgnoreCase(dataSets.Order_Active_Stage__c)) {
                        childOrderList.add(o);
                        originalChildOrders.add(o);
                    }
                    if(childOrders.containsKey(o.Parent_Order__c)) {
                        childOrders.get(o.Parent_Order__c).add(o);
                    } else {
                        childOrders.put(o.Parent_Order__c, new List<Order>{o});
                    }
                }
                
                if(!childOrderList.isEmpty()) {
                    for(Order o : childOrderList) {
                        o.Status = o.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c;
                    }
                    System.debug(' deactivating child orders ');
                    System.debug(childOrderList);
                    update childOrderList;
                }
                
                for(OrderItem oi : Trigger.new) {
                    if(childOrders.containsKey(oi.OrderId) && oi.Active__c) {
                        for(Order o : childOrders.get(oi.OrderId)) {
                            OrderItem newItem = oi.clone(false, true, false, false);
                            newItem.Quantity = 1;
                            newItem.OrderId = o.Id;
                            newItem.Parent_Order_Product__c = oi.Id; 
                            newChildOrderItems.add(newItem);
                        }
                    }
                }
                
                if(!newChildOrderItems.isEmpty()) {
                    System.debug(' inserting new child orders items ');
                    System.debug(newChildOrderItems);
                    insert newChildOrderItems;
                    System.debug(' re-activating the child orders '); 
                    System.debug(originalChildOrders);
                    if(!originalChildOrders.isEmpty()){
                        for(Order o : originalChildOrders) {
                            o.Status = dataSets.Order_Active_Stage__c;
                        }
                    }
                    update originalChildOrders;
                }
                
                if(!newParentItems.isEmpty()) {
                    System.debug(' newParentItems ' + newParentItems);
                    for(OrderItem oi : newParentItems) {
                        if(!oi.isPurchaseOnly__c && !oi.HasSurveyAssets__c && oi.Active__c) {
                            OrderItem theItem = newOrderItems.get(oi.Id);
                            Survey_Asset_Location__c newAsset = new Survey_Asset_Location__c(
                                Site_Survey__c = theItem.Order.Site_Survey__c, 
                                Product__c = theItem.PricebookEntry.Product2Id, 
                                Related_Product__c = oi.Related_Product__c, 
                                Quantity__c = 1, 
                                Originating_Record_ID__c = oi.Id, 
                                Originating_Parent_ID__c = oi.OrderId, 
                                Service_Frequency__c = oi.Frequency__c,
                                //21618, add Survey Location immediately if one exists
                                Survey_Location__c = theItem.Survey_Location__c
                            );
                            newAssetMap.put(oi.Id, newAsset);
                        }
                    }
                    if(!newAssetMap.isEmpty()) {
                        insert newAssetMap.values();
                        System.debug('new survey assets ' + newAssetMap);
                        for(OrderItem oi : newParentItems) {
                            if(!oi.isPurchaseOnly__c && !oi.HasSurveyAssets__c && oi.Active__c) {
                                newOrderItemLocations.add(new Order_Item_Location__c(
                                    Order__c = oi.OrderId, 
                                    Order_Product__c = oi.Id, 
                                    Survey_Asset_Location__c = (newAssetMap.get(oi.Id) != null ? newAssetMap.get(oi.Id).Id : null)
                                )); 
                            }
                            oi.HasSurveyAssets__c = true;
                            oi.SurveyAssetCountChecker__c = oi.Quantity;
                        }
                        
                        insert newOrderItemLocations;
                        System.debug(' new order item locations ' + newOrderItemLocations);
                        System.debug(' changed order items ' + newParentItems);
                        update newParentItems;
                    } 
                }
            }
        }
    }
}