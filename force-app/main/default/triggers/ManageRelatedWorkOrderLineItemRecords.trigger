trigger ManageRelatedWorkOrderLineItemRecords on WorkOrderLineItem (after insert, after update, after delete) {
    System.debug('Work Order Line Items After Trigger');
    
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    Set<Id> workOrderLocationIds = new Set<Id>();
    Set<Id> woliAssetIds = new Set<Id>();
    Set<Id> scannedOutAssetIds = new Set<Id>();
    Set<Id> orderItemDeleteList = new Set<Id>();
    Set<Id> orderIds = new Set<Id>();
    
    List<Order> orders = new List<Order>();
    List<OrderItem> itemsToDeactivate = new List<OrderItem>();
    List<Id> futureRooms = new List<Id>();
    List<Id> futureWolis = new List<Id>();
    
    Map<Id, Id> orderItemAssetMap = new Map<Id, Id>();
    
    Integer conditionCheck = 0;
    
    //21618 variables
    Set<Id> cannotCompleteWOLIIds = new Set<Id>();
    Set<Id> pestCommercialPriceChangeWOLIIds = new Set<Id>();
    
    if (Trigger.isDelete) {
        for (WorkOrderLineItem woli : Trigger.old) {
            workOrderLocationIds.add(woli.Work_Order_Location__c);
        }
    } 
    else {
        for (WorkOrderLineItem woli : Trigger.new) {
            WorkOrderLineItem oldRec = (Trigger.isInsert ? new WorkOrderLineItem() : Trigger.oldMap.get(woli.Id));
            
            if (woli.Work_Order_Location__c != null) { //21530 - MD
                if (Trigger.isUpdate) {
                    if (woli.Status == 'Completed' && oldRec.Status != 'Completed') {
                        conditionCheck = 1;
                    } else if (woli.Status != 'Completed' && oldRec.Status == 'Completed') {
                        conditionCheck = 2;
                    }
                }
                
                futureRooms.add(woli.Work_Order_Location__c);
                futureWolis.add(woli.Id);
            }
            
            if (woli.Work_Order_Location__c != oldRec.Work_Order_Location__c) {
                workOrderLocationIds.add(woli.Work_Order_Location__c);
                workOrderLocationIds.add(oldRec.Work_Order_Location__c);
            } else if (woli.Related_Product__c != oldRec.Related_Product__c || woli.Product__c!=oldRec.Product__c || woli.Quantity != oldRec.Quantity) {
                workOrderLocationIds.add(woli.Work_Order_Location__c);
            }
            
            //build map for deactivating order items on cannot complete, 21618 [dk], Feb 11, 2019
            if (woli.Status != oldRec.Status && woli.Status == dataSets.Cannot_Complete_Status_Value__c) {
                cannotCompleteWOLIIds.add(woli.Id);
            }
            //21618
            if (woli.Product_Service_Price_Per_Unit__c != null && woli.Product_Service_Price_Per_Unit__c != oldRec.Product_Service_Price_Per_Unit__c) {
                pestCommercialPriceChangeWOLIIds.add(woli.Id);
            }
            
            if (Trigger.isUpdate) {
            
                if (woli.AssetId != null && woli.Order_Product__c != null) {
                    
                    orderItemAssetMap.put(woli.Order_Product__c, woli.AssetId);
                    Boolean isOrderItemDelete = woli.Status==dataSets.Work_Order_Line_Item_Completed_Status__c && woli.Type_of_Service__c==dataSets.DeInstall_Work_Order_Type__c && oldRec.Status!=woli.Status;
                    system.debug('aaaaaaaaaaa' + isOrderItemDelete);
                    if (isOrderItemDelete) {
                        system.debug('bbbbbbbbbb' + isOrderItemDelete);
                        /*if(woli.Asset.Status == dataSets.Scanned_Out_Status__c){
                            system.debug('mmmmmmmmmmm');
                            scannedOutAssetIds.add(woli.AssetId);
                        }*/
                        woliAssetIds.add(woli.AssetId); //AD : QUERY CLEANUP
                        //system.debug('ccccccccccc' + scannedOutAssetIds);
                    }
                    
                }
            }
        }
    }
    
    workOrderLocationIds.remove(null);
    orderItemAssetMap.remove(null);
    
    if (!System.isBatch() && !System.isFuture()) {// 21530 - MD
        try {
            if (Trigger.isInsert){
                FutureCalls.futureUpdateRoom(futureWolis, futureRooms, true, conditionCheck);
            } else if (Trigger.isUpdate){
                FutureCalls.futureUpdateRoom(futureWolis,futureRooms, false, conditionCheck);    
            }
        } catch (Exception e){
            System.debug('Work Order Location Update Failed: ' + e.getMessage());
        }
    }
    
    for (Asset a : [SELECT Id, Status FROM Asset WHERE Id IN :woliAssetIds AND Status=:dataSets.Scanned_Out_Status__c]) {
        scannedOutAssetIds.add(a.Id);
    } //AD : QUERY CLEANUP
    system.debug('ddddddddddd'+scannedOutAssetIds);
    
    if (Trigger.isUpdate) {
        system.debug('eeeeeeeeeee');
        for (WorkOrderLineItem li : Trigger.new) {
            system.debug('ffffffffffff' + li);
            WorkOrderLineItem oldRec = Trigger.oldMap.get(li.Id);
            Boolean isOrderItemDelete = li.Status==dataSets.Work_Order_Line_Item_Completed_Status__c && li.Type_of_Service__c==dataSets.DeInstall_Work_Order_Type__c && oldRec.Status!=li.Status;
            system.debug('hhhhhhhhh'+isOrderItemDelete);
            if (isOrderItemDelete && scannedOutAssetIds.contains(li.AssetId)) {
                
                System.debug('Deleting deinstall order products in work order line item trigger' + scannedOutAssetIds + isOrderItemDelete);
                orderItemDeleteList.add(li.Order_Product__c);
            }
         
            orderIds.add(li.OrderId);
        }
            
        for (Order o : [SELECT Id, Status, RecordTypeId FROM Order WHERE Id IN:orderIds AND Status=:dataSets.Order_Active_Stage__c]) {
            o.Status = o.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c;
            orders.add(o);
        }
        
        update orders; 
        
        //deactivating order items from a deinstallation
        if (!orderItemDeleteList.isEmpty()) {
            system.debug('eeeeeeeeeeee');
            for (OrderItem oi : [SELECT Id, Installation_Status__c, Order.Season_Start_Date__c, Order.Season_End_Date__c, Active__c FROM OrderItem WHERE Id IN :orderItemDeleteList 
                                 AND Installation_Status__c=:dataSets.Scanned_Out_Status__c AND Order.Season_Start_Date__c=NULL AND Order.Season_End_Date__c=NULL]) 
            {
                system.debug('fffffffffff'+oi);
                oi.Active__c = false;
                oi.Asset__c = null;//case 21627
                itemsToDeactivate.add(oi);
                system.debug('gggggggggg'+itemsToDeactivate);
            }
            
            System.debug('**Order Items to be Deactivated**');
            System.debug(itemsToDeactivate);
            
            update itemsToDeactivate;
        }
        
        //everything else
        if (!orderItemAssetMap.isEmpty()) {
            Map<Id, OrderItem> oisToUpdate = new Map<Id, OrderItem>();
            
            for (OrderItem oi : [SELECT Id, Last_Scanned_Date__c, Order.OrderNumber, Asset__c FROM OrderItem WHERE Id IN :orderItemAssetMap.keySet() AND Active__c=TRUE]) {
                oi.Asset__c = orderItemAssetMap.get(oi.Id);
                oi.Last_Scanned_Date__c = System.today();
                oisToUpdate.put(oi.Id, oi);
            }
            
            if (!oisToUpdate.isEmpty()) {
                update oisToUpdate.values();
            }
        }
         
        for (Order o : orders) {
            o.Status = dataSets.Order_Active_Stage__c;
        }
        
        update orders;
    }
    
    System.debug('woRoomMap' + workOrderLocationIds);
    if (!workOrderLocationIds.isEmpty()) {
        List<Work_Order_Room__c> roomUpdates = new List<Work_Order_Room__c>();
        Map<Id, Work_Order_Room__c> workOrderRoomMap = new Map<Id, Work_Order_Room__c>([SELECT Id, Notes__c FROM Work_Order_Room__c WHERE Id IN :workOrderLocationIds]);
        Map<Id, Map<String, Map<String,Integer>>> workOrderNotes = new Map<Id, Map<String, Map<String,Integer>>>();
        
        for (WorkOrderLineItem woli : [SELECT Id, Product__r.Name, Related_Product__r.Name, Quantity, Work_Order_Location__c, Work_Order_Location__r.Notes__c, Work_Order_Location__r.Id 
                                      FROM WorkOrderLineItem WHERE Work_Order_Location__c!=NULL AND Work_Order_Location__c IN :workOrderLocationIds])
        {
            Map<String, Map<String,Integer>> relProdMap = workOrderNotes.get(woli.Work_Order_Location__c) == null ? new Map<String, Map<String,Integer>>() : workOrderNotes.get(woli.Work_Order_Location__c);
            Map<String, Integer> prodMap;
            
            Work_Order_Room__c wRoom = woli.Work_Order_Location__r;
            
            if (woli.Related_Product__r.Name!=null) {                  
                prodMap = relProdMap.get(woli.Related_Product__r.Name)== null ? new Map<String,Integer>() : relProdMap.get(woli.Related_Product__r.Name);
            } else {
                prodMap = relProdMap.get('NoRelatedProduct') == null ? new Map<String, Integer>() : relProdMap.get('NoRelatedProduct');
            }
            
            Integer quantity = woli.Quantity == null ? 0 : (Integer) ( woli.Quantity ) ; 
                
            prodMap.put(woli.Product__r.Name, prodMap.get(woli.Product__r.name) == null ? quantity : prodMap.get(woli.Product__r.name) + quantity);
            relProdMap.put(woli.Related_Product__r.Name!=null ? woli.Related_Product__r.Name : 'NoRelatedProduct', prodMap);   
            
            workOrderNotes.put(woli.Work_Order_Location__c, relProdMap);
            workOrderRoomMap.put(woli.Work_Order_Location__c, wRoom);
        }
        
        for (Work_Order_Room__c wor : workOrderRoomMap.values()) {
            Map<String, Map<String,Integer>> relProdMap = workOrderNotes.get(wor.Id);
            String noteString = '';
            
            if (relProdMap!=null) {
                for (String rp : relProdMap.keyset()) {
                    Map<String, Integer> prodMap = relProdMap.get(rp);
                    String relatedProductName = (rp == 'NoRelatedProduct' ? '' : ' ( ' + rp + ' )' );
                    
                    for (String p : prodMap.keySet()) {
                        noteString += '\n' + p + relatedProductName + ' x ' + prodMap.get(p);                    
                    }
                }
                
                if (noteString.trim() != wor.Notes__c) {
                    roomUpdates.add(new Work_Order_Room__c(Id=wor.Id,Notes__c=noteString));
                }
            }
        }
        
        if (!roomUpdates.isEmpty()) {
            update roomUpdates;
        }
    }
    
    //21618 logic
    cannotCompleteWOLIIds.remove(null);
    pestCommercialPriceChangeWOLIIds.remove(null);
    
    if (!System.isBatch() && !System.isFuture()) {
        if (!cannotCompleteWOLIIds.isEmpty()) {
            WorkOrderUtil.updateWorkOrderLineItemsCannotComplete(cannotCompleteWOLIIds);
        }
        
        if (!pestCommercialPriceChangeWOLIIds.isEmpty()) {
            WorkOrderUtil.setOrderItemServicePricePerUnit(pestCommercialPriceChangeWOLIIds);
        }
    }
}