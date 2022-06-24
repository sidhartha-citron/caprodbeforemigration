trigger SetInvoiceLineFields on Invoice_Line__c (before insert, before update) {
    Map<String,Product2> prodMap = new Map<String,Product2>();
    
    for (Invoice_Line__c li : Trigger.new) {
        if (li.Item_Number__c != null && li.Product__c == null) {
            prodMap.put(li.Item_Number__c,null);
        }
    }
    
    if (!prodMap.isEmpty()) {
        for (Product2 p : [SELECT Id, ProductCode FROM Product2 WHERE ProductCode IN :prodMap.keyset()]) {
            if (prodMap.get(p.ProductCode) == null) {
                prodMap.put(p.ProductCode, p);
            }
        }
    }
    
    for (Invoice_Line__c li : Trigger.new) {
        if (li.Item_Number__c != null && li.Product__c == null && prodMap.get(li.Item_Number__c) != null) {
            li.Product__c = prodMap.get(li.Item_Number__c).Id;
        }
    }
}