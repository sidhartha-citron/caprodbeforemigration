/*
 * Version		Date			Developer		Comments	
 * 1.0			15/09/2021		Sidhartha		Code Created for Convert Lead
 * 
*/
public with sharing class ConvertLeadController {
    
    public class Result{
        @AuraEnabled public Id accountId {get;set;}
        @AuraEnabled public Id opportunityId {get;set;}
        @AuraEnabled public Id contactId {get;set;}
        @AuraEnabled public Boolean isSuccess {get;set;}
        @AuraEnabled public Boolean isDupe {get;set;}
        @AuraEnabled public String message {get;set;}
        @AuraEnabled public List<Account> accountLists {get;set;}
        @AuraEnabled public List<Contact> contactLists {get;set;}
        @AuraEnabled public List<columns> columnsLists {get;set;}
        public Id convertedAccountId {get;set;}
        public Id convertedOppId {get;set;}
        public Id convertedcontactId {get;set;}
        public String errorMessage {get;set;}
        @AuraEnabled public Result accdupResults {get;set;}
        @AuraEnabled public Result condupResults {get;set;}
    }

    public ConvertLeadController(){
        
    }
    
    @AuraEnabled
    public static Result getReadyToConvert(Id leadId){
        system.debug(leadId);
        Lead lead =  [SELECT  Id, Name, Phone, OwnerId, Status,
                      Street, City, State,  PostalCode, Country, Company FROM Lead WHERE Id =:leadId];
        
        Result result = new Result();
        result.isSuccess = true;
        
        return result; 
    }
    
    @AuraEnabled
    public static Result convertLeads(String leadId, String accountId, String contactId, Boolean bypassDupeCheck) {
        Result result = new Result();
        result.isSuccess = true;
        result.isDupe = false;         
        Result leadResult = leadConvert(leadId, accountId, contactId, bypassDupeCheck);
        result.accountId = leadResult.convertedAccountId;
        result.opportunityId = leadResult.convertedOppId;
        result.contactId = leadResult.convertedcontactId;
        result.accountLists = leadResult.accountLists;
        result.contactLists = leadResult.contactLists;
        result.columnsLists =  leadResult.columnsLists;
        result.message = leadResult.errorMessage;
        
        if(result.accountLists != null || result.contactLists != null ){
            result.isDupe = true;
        }
        
        if(leadResult.convertedAccountId == null){
            result.isSuccess = false;
        }
        
        return result;
    }
    
    public static Result leadConvert(String leadId, String accountId, String contactId, Boolean dupeBypass) {        
        If(!String.isEmpty(contactId) && String.isEmpty(accountId)){
            
            Contact cont = [SELECT Id, FirstName, LastName, Email, MobilePhone, AccountId, Name
                            FROM Contact WHERE Id =:contactId];
            accountId = cont.AccountId;
        }
        LeadStatus CLeadStatus= [SELECT Id, MasterLabel FROM LeadStatus WHERE IsConverted=true Limit 1];
        Database.LeadConvert leadconvert = new Database.LeadConvert();
        leadconvert.setLeadId(leadId);
        leadconvert.setAccountId(accountId);
        leadconvert.setContactId(contactId);                   
        leadconvert.setConvertedStatus(CLeadStatus.MasterLabel);
        leadconvert.setDoNotCreateOpportunity(false); 
        Database.LeadConvertResult lcr;
        
        if(dupeBypass){
            Database.DMLOptions dml = new Database.DMLOptions(); 
            dml.DuplicateRuleHeader.AllowSave = true;
            dml.optAllOrNone = false;
            lcr = Database.convertLead(leadconvert, dml);
        } else {
            lcr = Database.convertLead(leadconvert, false);
            system.debug(lcr.getErrors());
        }
        
        Result result;
        
        if(lcr.isSuccess()){
            result = new Result();
            result.convertedAccountId = lcr.getAccountId();
            result.convertedOppId = lcr.getOpportunityId();
            result.convertedcontactId = lcr.getContactId();
        } else {
            result = getDupes(lcr);
        }
        
        return result;
    }
    
        
    public static List<Schema.FieldSetMember> readFieldSet(String fieldSetName, String ObjectName)
    {
        Map<String, Schema.SObjectType> GlobalDescribeMap = Schema.getGlobalDescribe(); 
        Schema.SObjectType SObjectTypeObj = GlobalDescribeMap.get(ObjectName);
        Schema.DescribeSObjectResult DescribeSObjectResultObj = SObjectTypeObj.getDescribe();
        
        Schema.FieldSet fieldSetObj = DescribeSObjectResultObj.FieldSets.getMap().get(fieldSetName);
        return fieldSetObj.getFields(); 
    } 
    
    private static Result getDupes(Database.LeadConvertResult lcr){
        
        Set<Id> setDuplicateIds = new Set<id>();
        Datacloud.DuplicateResult duplicateResult;
        List<String> errorMessages = new List<String>();
        
        for(Database.Error error : lcr.getErrors()){
            
            errorMessages.add(error.getMessage());
            
            if (error instanceof Database.DuplicateError) {
                duplicateResult = ((Database.DuplicateError)error).getDuplicateResult();
                for(Datacloud.MatchResult duplicateMatchResult : duplicateResult.getMatchResults()) {
                    for(Datacloud.MatchRecord duplicateMatchRecord : duplicateMatchResult.getMatchRecords()) {
                        setDuplicateIds.add(duplicateMatchRecord.getRecord().Id);
                    }
                }
            }
        }
        
        Result results = getDupeAccountsAndContacts(setDuplicateIds);
        results.errorMessage = String.Join(errorMessages, ', ');
        
        return results;
    }
    
    private static Result getDupeAccountsAndContacts(Set<Id> dupeIds){
        system.debug(dupeIds);
        Result result = new Result();
        List<Schema.FieldSetMember> lstreadFieldSet = readFieldSet('SE_Lead_Convert_Duplicate_Check', 'Account');
        String query = 'SELECT ';
        result.columnsLists = new List<columns>();
        for(Schema.FieldSetMember fieldSetMemberObj : lstreadFieldSet){
            result.columnsLists.add(new columns(fieldSetMemberObj.getLabel(), String.valueof(fieldSetMemberObj.getSObjectField()), null));
            query += fieldSetMemberObj.getFieldPath() + ', ';
        }  
        Set<Id> accountIds = new Set<Id>();
        Set<Id> contactIds = new Set<Id>();
        
        for(Id i:dupeIds){
            Schema.SObjectType sobjectType = i.getSObjectType();
            String sobjectName = sobjectType.getDescribe().getName();
            if(sobjectName == 'Account'){
                accountIds.add(i);
            } 
            if (sobjectName == 'Contact'){
                contactIds.add(i);
                system.debug(contactIds);
            } 
        }
        query += 'Id FROM Account WHERE Id IN: accountIds';
        
        result.accountLists = Database.query(query);     
        system.debug(result.accountLists);     
        result.contactLists = [SELECT Id, FirstName, LastName, Email, MobilePhone, AccountId, Name, Account.Name
                               FROM Contact WHERE Id IN: contactIds];
        system.debug(result.contactLists);
        
        return result;
    }
    
    public class columns{
        @AuraEnabled
        public string label{get;set;}
        @AuraEnabled
        public string fieldName{get;set;}
        @AuraEnabled
        public string type{get;set;}
        public columns(string label, string fieldName, string type) {
            this.label = label;
            this.fieldName = fieldName;
            this.type = type;
        }
    }
    
    @InvocableMethod(label='Get Bundle values')
    public static List<flowOutputs> createbundle(List<flowOutputs> flowOutputs){
        system.debug(flowOutputs);
        String bundleType;
        Id recId;
        for(flowOutputs fo: flowOutputs) {
           bundleType = fo.bundleSelector+'-'+fo.bundleSoap+'-'+fo.bundleHandSanitizer;
           recId = fo.recordId;
        }
        Lead ld = new Lead();
        ld.Id = recId;
        ld.SE_Opportunity_Bundle_Type__c = bundleType;
         try{
            update ld;
        }catch (exception e){
            throw new ConvertLeadController.RequiredException(e.getMessage());
        }
        return null;
    }
    
    public class flowOutputs{
        @InvocableVariable 
        public String dMLResult;
        @InvocableVariable 
        public String bundleSelector;
        @InvocableVariable 
        public String bundleSoap;
        @InvocableVariable 
        public String bundleHandSanitizer;
        @InvocableVariable 
        public String recordId;
    }
    public class RequiredException extends Exception {}
}