public class OppCloneController {
	private static final String STAGE_NAME_PROPOSAL = 'Proposal';
    
    @AuraEnabled
    public static List<Account> getRecords(List<String> ids) {
        List<Account> records = [SELECT Id, Name, Parent.Name, AccPac_Account__c, Recurring_SO__c, On_Hold__c, BillingAddress, Type, Owner.Name
                                 FROM Account
                                 WHERE Id IN :ids];
        return records;
    }
    
    @AuraEnabled
    public static Opportunity getOpp(String oppId) {
        Opportunity opp = [SELECT Id, Name FROM Opportunity WHERE Id = :oppId LIMIT 1];
        
        return opp;
    }
    
    @AuraEnabled
    public static CloneResultMap cloneOpp(String oppId, List<String> acctIds, Boolean setStage) {
        // Get acct map
        Map<Id, Account> acctMap = getAcctMap(acctIds);
        
        // Get clone fields
        Schema.FieldSet cloneFS = getCloneFields();
        Opportunity opp = getOpp(oppId, cloneFS);
        
        if (opp == null) return null;
        
        // Create cloned opp for every acct
        List<Opportunity> clonedOpps = new List<Opportunity>();
        for (String acctId : acctIds) {
            Opportunity clonedOpp = new Opportunity();
            
            // Populate clone obj with source opp's field values
            for (Schema.FieldSetMember fsm : cloneFS.getFields()) {
                String fieldName = fsm.getFieldPath();
                clonedOpp.put(fieldName, opp.get(fieldName));
            }
 
            // Overwrite certain fields
            clonedOpp.Name = 'Cloned: ' + opp.Name;
            clonedOpp.AccountId = acctId;
            clonedOpp.OwnerId = acctMap.get(acctId).OwnerId;
            clonedOpp.RecordTypeId = opp.RecordTypeId;
            
            // Set StageName to 'Proposal', if specified
            if (setStage) {
                clonedOpp.StageName = STAGE_NAME_PROPOSAL;
            }
 
            
            clonedOpps.add(clonedOpp);
        }
        
        System.debug(clonedOpps);
        
        List<Database.SaveResult> oppSaveResults = Database.insert(clonedOpps, false);
        
        // Populate AcctId -> cloneResult map -- for now, populate errors
		// Generate list of successfully cloned opps
        Map<Id, CloneResult> acctToCloneResultMap = new Map<Id, CloneResult>();
        Map<Id, Opportunity> successOpps = new Map<Id, Opportunity>();
        Map<Id, Opportunity> acctToNewOppsMap = new Map<Id, Opportunity>();
        Integer i = 0;
        for (Database.SaveResult oppSR : oppSaveResults) {
            Opportunity attemptedOpp = clonedOpps.get(i);
            if (oppSR.isSuccess()) {
                successOpps.put(attemptedOpp.Id, attemptedOpp);
                acctToNewOppsMap.put(attemptedOpp.AccountId, attemptedOpp);
            } else {
                acctToCloneResultMap.put(attemptedOpp.AccountId, getErrorResult(oppSR.getErrors(), acctMap.get(attemptedOpp.AccountId)));
            }
            i++;
        }
        
		if (successOpps.size() == 0) return compileResults(acctIds, acctMap, acctToCloneResultMap, acctToNewOppsMap);
        
        // Clone OLI for each successfully cloned opp
        // Get OLI clone fields
        Schema.FieldSet oliCloneFS = getOLICloneFields();
        List<OpportunityLineItem> olis = getOlis(oppId, oliCloneFs);
        
        List<OpportunityLineItem> clonedOLIs = new List<OpportunityLineItem>();
        for (Opportunity clonedOpp : successOpps.values()) {
            
            for (OpportunityLineItem oli : olis) {
                OpportunityLineItem clonedOLI = new OpportunityLineItem();
                clonedOLI.OpportunityId = clonedOpp.Id;
                
                // Populate clone oli with source oli's field values
                for (Schema.FieldSetMember fsm : oliCloneFS.getFields()) {
                    String fieldName = fsm.getFieldPath();
                    clonedOLI.put(fieldName, oli.get(fieldName));
                }
                
                clonedOLIs.add(clonedOLI);    
            }
        }

        Database.SaveResult[] oliSaveResults = Database.insert(clonedOLIs, false);
        Map<Id, Opportunity> oppsToRollBack = new Map<Id, Opportunity>();
        i = 0;
        for (Database.SaveResult oliSaveResult : oliSaveResults) {
            if (!oliSaveResult.isSuccess()) {
                Opportunity oppToRollBack = successOpps.get(clonedOLIS.get(i).OpportunityId);
                if (!oppsToRollBack.containsKey(oppToRollBack.Id)) {
                	oppsToRollBack.put(oppToRollBack.Id, oppToRollBack);    
                }
                
                acctToCloneResultMap.put(oppToRollBack.AccountId, getErrorResult(oliSaveResult.getErrors(), acctMap.get(oppToRollBack.AccountId)));
            } 
            i++;
        }
        
        // Roll back opps with failed OLIs
        delete oppsToRollBack.values();
        
        return compileResults(acctIds, acctMap, acctToCloneResultMap, acctToNewOppsMap);
    }
    
    private static Opportunity getOpp(String oppId, Schema.FieldSet cloneFS) {
		String cloneFields = FieldSetUtils.getFieldsCommaDelimitedString(cloneFS);
        if (!cloneFields.containsIgnoreCase(' Name')) {
            cloneFields += ', Name';
        }
        if (!cloneFields.containsIgnoreCase('StageName')) {
            cloneFields += ', StageName';
        }
        if (!cloneFields.containsIgnoreCase('RecordTypeId')) {
            cloneFields += ', RecordTypeId';
        }
        
        String query = 'SELECT ' + cloneFields + ' FROM Opportunity WHERE Id = :oppId';
        
        List<Opportunity> result = Database.query(query);
        
        if (result != null && result.size() == 1) return result[0];
        
        return null;
    }
    
    private static List<OpportunityLineItem> getOlis(String oppId, Schema.FieldSet cloneFS) {
		String cloneFields = FieldSetUtils.getFieldsCommaDelimitedString(cloneFS);
        if (!cloneFields.containsIgnoreCase('Name')) {
            cloneFields += ', Name';
        }
        
        String query = 'SELECT ' + cloneFields + ' FROM OpportunityLineItem WHERE OpportunityId = :oppId';
        
        List<OpportunityLineItem> olis = Database.query(query);
        return olis;
    }
    
    private static Schema.FieldSet getCloneFields() {
        OpportunityCloneSettings__c cloneSettings = [SELECT field_set_name__c FROM OpportunityCloneSettings__c LIMIT 1];
        
        if (cloneSettings == null) return null;

        return FieldSetUtils.getFieldSet('Opportunity', cloneSettings.field_set_name__c);
    }
    
    private static Schema.FieldSet getOLICloneFields() {
        OpportunityCloneSettings__c cloneSettings = [SELECT Opp_Product_Field_Set__c FROM OpportunityCloneSettings__c LIMIT 1];
        
        if (cloneSettings == null) return null;

        return FieldSetUtils.getFieldSet('OpportunityLineItem', cloneSettings.Opp_Product_Field_Set__c);
    }
    
    private static Map<Id, Account> getAcctMap(List<String> acctIds) {
        return new Map<Id, Account>([SELECT Id, Name, OwnerId FROM Account WHERE Id IN :acctIds]);
    }
    
    private static CloneResultMap compileResults(List<String> acctIds, Map<Id, Account> acctMap, Map<Id, CloneResult> acctToCloneResultMap, Map<Id, Opportunity> acctToOppMap) {
        List<CloneResult> successes = new List<CloneResult>();
        List<CloneResult> failures = new List<CloneResult>();
        for (String acctId : acctIds) {
            if (acctToCloneResultMap.containsKey(acctId)) {
                failures.add(acctToCloneResultMap.get(acctId));
            } else {
                // Since only failure results were populated in the map, this must have been a success
                CloneResult clResult = new CloneResult();
                clResult.isSuccess = true;
                clResult.acct = acctMap.get(acctId);
                clResult.opp = acctToOppMap.get(acctId);
                successes.add(clResult);
            }
        }
        
        CloneResultMap resultMap = new CloneResultMap();
        resultMap.successes = successes;
        resultMap.failures = failures;
        
        return resultMap;
    }
    
    @TestVisible
    private static CloneResult getErrorResult(List<Database.Error> errs, Account acct) {
        CloneResult clResult = new CloneResult();
        clResult.isSuccess = false;
        String errMsg = '';
        for (Database.Error err : errs) {
            errMsg += err.getMessage();
        }
        clResult.msg = errMsg;
        clResult.acct = acct;
        
        return clResult;
    }
    
    public class CloneResultMap {
        @AuraEnabled public List<CloneResult> successes;
        @AuraEnabled public List<CloneResult> failures;
    }
    
    public class CloneResult {
        @AuraEnabled public Boolean isSuccess;
        @AuraEnabled public String msg;
        @AuraEnabled public Account acct;
        @AuraEnabled public Opportunity opp;
    }
}