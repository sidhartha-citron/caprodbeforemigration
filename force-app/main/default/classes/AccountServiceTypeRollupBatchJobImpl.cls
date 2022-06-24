/**
 * Implements Batchable interface. Contains logic specific to Service Type rollup functionality, and includes logic for persisting 
 * Batch Job Results record at the end of the run. Actual rollup logic is delegated to appropriate IRollupBatchExecutor impl.
 * 
 * @author Ahsan Butt
 */
global class AccountServiceTypeRollupBatchJobImpl implements Database.Batchable<sObject>, Database.Stateful, Database.AllowsCallouts {
	global String batchJobName;
    global RollupState state; 
    
    global String sourceObject;
    global String sourceField;
    global String mergeField;
    global String targetObject;
    global String targetField;
    global String filter;
    global String function;
    
    global Set<Id> sourceIds;
    
    global Integer totalRecords;
    global Integer errors;
    global String notes;
    
    global AccountServiceTypeRollupBatchJobImpl(String jobName, Set<Id> sIds) {
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        
        batchJobName = jobName;
        state = new RollupState();
        
        sourceObject = 'Order';
        sourceField = 'Service_Types__c';
        mergeField = 'AccountId';
        targetObject = 'Account';
        targetField = 'Service_Types__c';
        function = 'CONCAT';
        filter = 'Status = \'' + dataSets.Order_Active_Stage__c + '\'';  
        sourceIds = sIds;
        
        totalRecords = 0;
        errors = 0;
        notes = '';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
    	// Construct query
        String query = String.format('SELECT Id FROM {0} WHERE Id IN (SELECT {1} FROM {2} WHERE Id IN :sourceIds)', new List<String>{targetObject, mergeField, sourceObject});
        System.debug(query);
        return Database.getQueryLocator(query);
    }
    
    global void execute(Database.BatchableContext bc, List<sObject> scope) {
        // Get executor impl
        IRollupBatchExecutor executor = (IRollupBatchExecutor) RollupBatchExecutorFactory.createInstance(function);
        
        try {
            // Execute
        	state = executor.executeGivenTargetRecords(state, scope, sourceObject, sourceField, mergeField, targetObject, targetField, filter); 
            
            // Record metrics
            totalRecords += executor.getTotalRecords();
            errors += executor.getNumErrors();
            notes += executor.getNotes();
        } catch (Exception e) {
        	notes += e.getMessage();
            errors += scope.size();
        }
    }
    
	global void finish(Database.BatchableContext bc) {
        // Insert record for batch job run
        Batch_Job_Results__c batchResults = new Batch_Job_Results__c();
        batchResults.Name = batchJobName;
        batchResults.Total_Records__c = totalRecords;
        batchResults.Total_Errors__c = errors;
        batchResults.Notes__c = notes;
        
        insert batchResults;
    }
}