trigger SetWorkOrderLineItemFields on WorkOrderLineItem (before insert, before update, after update) {
    System.debug('Work Order Line Items Before Trigger');
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    Map<Id, WorkOrder> woMap = new Map<Id, WorkOrder>();
    Map<Id, Asset> assetMap = new Map<Id, Asset>();
    Map<String, Asset> existingBarCodeMap = new Map<String,Asset>();
    Map<Id, OrderItem> orderItemsMap = new Map<Id, OrderItem>();
    Map<Id, PricebookEntry> pricebookEntryMap = new Map<Id, PricebookEntry>();
    Map<Id, Id> assetItemMap = new Map<Id, Id>();
    
    List<Asset> newAssets = new List<Asset>();

    if(Trigger.isBefore) {
        for (WorkOrderLineItem li : Trigger.new) {
            
            if(trigger.isInsert) {
                li.isFullExchange__c = li.isFullExchangeProductCode__c;
            }
            
            WorkOrderLineItem oldRec = (Trigger.isInsert ? new WorkOrderLineItem() : Trigger.oldMap.get(li.Id));
            
            if (li.New_Asset_Bar_Code__c != null && li.New_Asset_Bar_Code__c != oldRec.New_Asset_Bar_Code__c) {
                existingBarCodeMap.put(li.New_Asset_Bar_Code__c,null);
                assetMap.put(li.Id, new Asset(
                    InstallDate = System.today(),
                    Status = dataSets.Scanned_In_Status__c,
                    Bar_Code__c = li.New_Asset_Bar_Code__c
                ));
            }
            
            if (li.Address == null) {
                woMap.put(li.WorkOrderId, null);
            }
            
            if((li.Line_Item_Description__c == null || li.Product__c == null) && li.PricebookEntryId != null) {
                pricebookEntryMap.put(li.PricebookEntryId, null);
            }
            
            if(li.Order_Product__c != null) {
                orderItemsMap.put(li.Order_Product__c, null);
            }
        }
        
        if(!pricebookEntryMap.isEmpty()) {
            for(PricebookEntry p : [SELECT Id, Product2Id, Product2.Product_Description_Rich_Text__c FROM PricebookEntry WHERE Id IN:pricebookEntryMap.keySet()]) {
                pricebookEntryMap.put(p.Id, p);
            }
        }
        
        if (!existingBarCodeMap.isEmpty()) {
            for (Asset a : [SELECT Id, Bar_Code__c FROM Asset WHERE Bar_Code__c IN :existingBarCodeMap.keyset()]) {
                existingBarCodeMap.put(a.Bar_Code__c,a);
            }
        }
        
        if (!assetMap.isEmpty()) {
            for (WorkOrderLineItem woli : [SELECT Id, WorkOrder.AccountId, PricebookEntry.Product2Id, PricebookEntry.Product2.Name, WorkOrder.Site_Survey__c, Work_Order_Location__c, Work_Order_Location__r.Survey_Location__c 
                                           FROM WorkOrderLineItem WHERE Id IN :assetMap.keyset()]) 
            {
                
                Asset ast = assetMap.remove(woli.Id); 
                
                if (existingBarCodeMap.get(ast.Bar_Code__c) == null) {
                    ast.AccountId = woli.WorkOrder.AccountId;
                    ast.Name = woli.PricebookEntry.Product2.Name;
                    ast.Product2Id = woli.PricebookEntry.Product2Id;
                    ast.Site_Survey__c = woli.WorkOrder.Site_Survey__c;
                    ast.Survey_Location__c = woli.Work_Order_Location__r.Survey_Location__c;
                    ast.Work_Order_Location__c = woli.Work_Order_Location__c;
                    assetMap.put(woli.Id, ast);
                }
            }
        }
        
        if (!assetMap.isEmpty()) {
            System.debug(assetMap.values());
            insert assetMap.values();
        }
        
        if(!orderItemsMap.isEmpty()) {
            for(OrderItem o : [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, PricebookEntry.Product2.Product_Description_Rich_Text__c, Service_Price_Per_Unit__c, Purchase_Price__c, Installation_Price__c FROM OrderItem WHERE Id IN:orderItemsMap.keySet()]) {
                orderItemsMap.put(o.Id, o);
            }
        }
        
        for (WorkOrder wo : [SELECT Id, Suite_Number__c, Street, City, State, PostalCode, Country FROM WorkOrder WHERE Id IN :woMap.keySet()]) {
            woMap.put(wo.Id, wo);
        }
        
        for (WorkOrderLineItem li : Trigger.new) {
            WorkOrderLineItem oldRec = (Trigger.isInsert ? new WorkOrderLineItem() : Trigger.oldMap.get(li.Id));
            if (li.New_Asset_Bar_Code__c != null && li.New_Asset_Bar_Code__c == oldRec.New_Asset_Bar_Code__c && assetMap.get(li.Id) != null) {
                li.New_Asset_Bar_Code__c = null;
            }
            
            PricebookEntry p = pricebookEntryMap.get(li.PricebookEntryId);
            if((li.Line_Item_Description__c == null || li.Product__c == null) && p != null) {
                li.Line_Item_Description__c = p.Product2.Product_Description_Rich_Text__c;
                li.Product__c = p.Product2Id;
            }
            OrderItem o = orderItemsMap.get(li.Order_Product__c);
            if (Trigger.isInsert && o != null){
                li.Service_Price_Per_Unit__c = o.Service_Price_Per_Unit__c;
                li.Purchase_Price__c = o.Purchase_Price__c;
                li.Installation_Price__c = o.Installation_Price__c;
            }
            if(li.OrderId == null && li.Order_Product__c != null && o!=null) {
                li.OrderId = o.OrderId;
            }
            if (li.Address == null) {
                WorkOrder wo = woMap.get(li.WorkOrderId);
                li.Suite_Number__c = wo.Suite_Number__c;
                li.Street = wo.Street;
                li.City = wo.City;
                li.State = wo.State;
                li.PostalCode = wo.PostalCode;
                li.Country = wo.Country;
            }
        }
    }
    
}