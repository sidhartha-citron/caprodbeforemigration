trigger SetQuoteFields on Quote (before insert, before update) {
    
    Map<Id,Set<String>> quoteMap = new Map<Id,Set<String>>();
    Map<Id,Contact> contactMap = new Map<Id,Contact>();
    Map<Id,Account> accountMap = new Map<Id,Account>();
    Set<Id> oppId = new Set<Id>();
    List<OpportunityContactRole> lstOcr = new  List<OpportunityContactRole>();
    
    for (Quote q : Trigger.new) {
         
        /*if(q.Maximum_Line_Item_Discount__c != null && q.Maximum_Line_Item_Discount__c < 30) {
            q.Approval_Status__c = 'None';    
        }*/
        oppId.add(q.OpportunityId);
        quoteMap.put(q.Id,new Set<String>());
        if (q.ContactId != null && (q.Phone == null || q.Email == null)) {
            contactMap.put(q.ContactId,null);
        }
        accountMap.put(q.AccountId,null);
    }
    contactMap.remove(null);
    
	List<String> checkEmptyRole = new List<String>();
    for(OpportunityContactRole ocr: [SELECT Id, Role FROM OpportunityContactRole WHERE OpportunityId IN :oppId]) {
        lstOcr.add(ocr);
        If(ocr.Role != null) {
            checkEmptyRole.add(ocr.Role);
        }
    }
    if((lstOcr.size() == 0 || checkEmptyRole.size() == 0)
         && QueryUtils.fieldServiceSettings.System_Administrator_Profile_Id__c != UserInfo.getProfileId()) {
        for (Quote ocrEmptychk : trigger.new){
            ocrEmptychk.addError (Label.OCREmptyCheck);
        }
    }
    
    for (Quote q : [SELECT Id, Applicable_T_C_s__c, (SELECT T_C_Code__c FROM QuoteLineItems) FROM Quote WHERE Id IN :quoteMap.keyset()]) {
        for (QuoteLineItem li : q.QuoteLineItems) {
            quoteMap.get(q.Id).add(li.T_C_Code__c);
        }
    }
    
    if (!contactMap.isEmpty()) {
        for (Contact c : [SELECT Id, Name, Email, Phone FROM Contact WHERE Id IN :contactMap.keyset()]) {
            contactMap.put(c.Id,c);
        }
    }
    
    for (Account a : [SELECT Id, Billing_Suite_Number__c, Shipping_Suite_Number__c FROM Account WHERE Id IN :accountMap.keyset()]) {
        accountMap.put(a.Id,a);
    }
    
    for (Quote q : Trigger.new) {
        q.Applicable_T_C_s__c = '';
        for (String s : quoteMap.get(q.Id)) {
            q.Applicable_T_C_s__c += s + ';';
        }
        
        if (q.ContactId != null) {
            Contact c = contactMap.get(q.ContactId);
            
            if (q.Phone == null && c != null && c.Phone != null) {
                q.Phone = c.Phone;
            }
            
            if (q.Email == null && c != null && c.Email != null) {
                q.Email = c.Email;
            }
        }
        
        Account a = accountMap.get(q.AccountId);
        if (q.Bill_To_Suite_Number__c == null && a != null && a.Billing_Suite_Number__c != null) {
            q.Bill_To_Suite_Number__c = a.Billing_Suite_Number__c;
        }
        if (q.Ship_To_Suite_Number__c == null && a != null && a.Shipping_Suite_Number__c != null) {
            q.Ship_To_Suite_Number__c = a.Shipping_Suite_Number__c;
        }
    }
}