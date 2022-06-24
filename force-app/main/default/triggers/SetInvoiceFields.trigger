trigger SetInvoiceFields on Invoice__c (before insert, before update) {
    Map<String,Account> accountMap = new Map<String,Account>();

    for (Invoice__c i : Trigger.new) {

        if (i.Account__c == null && i.Customer_Number__c != null) {
            accountMap.put(i.Customer_Number__c ,null);
        }
    }
    
    if (!accountMap.isEmpty()) {
        for (Account a : [SELECT Id, AccPac_Account__c FROM Account WHERE AccPac_Account__c IN :accountMap.keyset()]) {
            accountMap.put(a.AccPac_Account__c,a);
        }
    }

    for (Invoice__c i : Trigger.new) {
        if (i.Invoice__c != null) {
            i.Name = i.Invoice__c;
        }

        Account a = accountMap.get(i.Customer_Number__c);
        if (i.Account__c == null && i.Customer_Number__c != null && a != null) {
            i.Account__c = a.Id;
        }

    }
}