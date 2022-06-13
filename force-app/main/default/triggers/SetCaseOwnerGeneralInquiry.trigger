trigger SetCaseOwnerGeneralInquiry on Case (after insert) {
    
    
    Id generalInquiryRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('General Inquiry').getRecordTypeId();
    Field_Service_Settings__c fssettings = Field_Service_Settings__c.getOrgDefaults();
    Map<Id,Account> accMap = new Map<Id,Account>();
    Map<Id, Case> caseMap = new Map<Id, Case>();
    List<Case> cases = new List<Case>();
    
    for(Case c : Trigger.new) {
        
        if(c.RecordTypeId==generalInquiryRecordTypeId && c.Type==fssettings.Ticket_Type_for_New_Lead__c) {
            System.debug('Entered 12');
            accMap.put(c.AccountId, null);
            caseMap.put(c.Id, null);
        }
    }
    accMap.remove(null);
    caseMap.remove(null);
    
    if(!caseMap.isEmpty() && !accMap.isEmpty()) {
        accMap = new Map<Id, Account>([SELECT Id, OwnerId FROM Account WHERE Id IN :accMap.keyset()]);
        caseMap = new Map<Id, Case>([SELECT Id, OwnerId, AccountId, Account.OwnerId FROM Case WHERE Id IN :caseMap.keyset()]);
        
        for(Case c : caseMap.values()){
            Account a = accMap.get(c.AccountId);
            System.debug(a);
            if(a!=null) {
                c.OwnerId = a.OwnerId;
            }
        }
        System.debug('>>Case After Trigger With Owners:');
        System.debug(caseMap.values());
        update caseMap.values();
    }
    
}