trigger SetProductConsumedFields on ProductConsumed (before insert, before update) {
    
    Map<Id, PricebookEntry> pricebookEntryMap = new Map<Id, PricebookEntry>();
    
    for (ProductConsumed p : Trigger.new) {
            pricebookEntryMap.put(p.PricebookEntryId, null);    
    }
    pricebookEntryMap.remove(null);
    
    pricebookEntryMap = new Map<Id, PricebookEntry>([SELECT Id, Product2.Always_Billable__c FROM PricebookEntry WHERE Id IN :pricebookEntryMap.keySet()]);
    
    for (ProductConsumed p : Trigger.new) {
         PricebookEntry pEntry = pricebookEntryMap.get(p.PricebookEntryId);
        if(pEntry!=null && pEntry.Product2.Always_Billable__c) {
            p.Billable__c = pEntry.Product2.Always_Billable__c; 
        }
    }
}