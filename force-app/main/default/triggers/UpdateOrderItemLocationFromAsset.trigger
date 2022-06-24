trigger UpdateOrderItemLocationFromAsset on Asset (after update) {

    Field_Service_Settings__c fss = Field_Service_Settings__c.getOrgDefaults();
    Map<Id, Id> assetIdMap = new Map<Id, Id>();
    Map<Id, Id> orderItemLocationMap = new Map<Id, Id>();
    Set<Id> assetIds = new Set<Id>();
    Set<Id> orderItemIds = new Set<Id>();
    List<Survey_Asset_Location__c> surveyAssets = new List<Survey_Asset_Location__c>();
    
    for(Asset a : Trigger.new) {
        Asset oldRec = Trigger.oldMap.get(a.Id);
        Boolean isValid = a.Status==fss.Scanned_In_Status__c && a.Survey_Location__c!=null && a.Survey_Location__c!=oldRec.Survey_Location__c && a.AccountId==oldRec.AccountId; 
        System.debug(' After Update Trigger to update Site Survey Information ' + a.Name + ' -- isValid ' + isValid);
        if(isValid) {
            assetIds.add(a.Id);
            assetIdMap.put(a.Id, a.Survey_Location__c);
        }
    }
    
    for(OrderItem oi : [SELECT Id, Asset__c, Parent_Order_Product__c FROM OrderItem WHERE Asset__c IN:assetIdMap.keySet()]) {
        Id theId = oi.Parent_Order_Product__c == null ? oi.Id : oi.Parent_Order_Product__c; 
        orderItemIds.add(theId);
        orderItemLocationMap.put(theId, assetIdMap.get(oi.Asset__c));
    }
    
    for(Order_Item_Location__c ol : [SELECT Id, Order_Product__c, Survey_Asset_Location__c, Survey_Asset_Location__r.Survey_Location__c FROM Order_Item_Location__c 
                                     WHERE Order_Product__c IN:orderItemLocationMap.keySet() AND Survey_Asset_Location__c<>NULL])
    {
        Survey_Asset_Location__c sl = ol.Survey_Asset_Location__r;
        sl.Survey_Location__c = orderItemLocationMap.get(ol.Order_Product__c);
        surveyAssets.add(sl); 
    }
    
    System.debug(' Updating Survey Assets ');
    System.debug(surveyAssets);
    update surveyAssets;
}