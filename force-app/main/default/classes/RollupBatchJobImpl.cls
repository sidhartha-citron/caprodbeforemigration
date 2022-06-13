/**
 * Implements Batchable interface. Contains logic specific to Rollup functionality, and includes logic for persisting 
 * Batch Job Results record at the end of the run. Actual batch Rollup logic is delegated to appropriate IRollupBatchExecutor impl.
 * 
 * @author Ahsan Butt
 */
global class RollupBatchJobImpl implements Database.Batchable<sObject>, Database.Stateful, Database.AllowsCallouts {
	global String batchJobName;
    global RollupState state;
    
    global String sourceObject;
    global String sourceField;
    global String mergeField;
    global String targetObject;
    global String targetField;
    global String filter;
    global String function;
    
    global Integer totalRecords;
    global Integer errors;
    global String notes;
    
    global RollupBatchJobImpl(String jobName, String sObj, String sField, String mField, String tObj, String tField, String filt, String func) {
        batchJobName = jobName;
        state = new RollupState();
    
        sourceObject = sObj;
        sourceField = sField;
        mergeField = mField;
        targetObject = tObj;
        targetField = tField;
        filter = filt;
        function = func;

        totalRecords = 0;
        errors = 0;
        notes = '';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
    	// Construct query
        
        // Get last batch job run
    	List<Batch_Job_Results__c> batchJobRuns = [SELECT Id, CreatedDate 
                                                   FROM Batch_Job_Results__c 
                                                   WHERE Name =: batchJobName ORDER BY CreatedDate DESC];
        Batch_Job_Results__c lastRun;
        DateTime lastRunDT;
        
        if (batchJobRuns != null && batchJobRuns.size() > 0) {
            lastRun = batchJobRuns.get(0);
        }
        
        // Add filter condition and newness condition in WHERE clause
        String whereClause = '';
            
        // Add condition to only retrieve source records created or modified since last batch job run
        if (lastRun != null) {
            lastRunDT = lastRun.CreatedDate;
            whereClause = 'WHERE LastModifiedDate >= :lastRunDT OR CreatedDate >= :lastRunDT';
        }
        
        // Format query
        String query = String.format('SELECT {0}, {1} FROM {2} {3}', new List<String>{sourceField, mergeField, sourceObject, whereClause});
        System.debug(query);

        return Database.getQueryLocator(query);
    }
    
    global void execute(Database.BatchableContext bc, List<sObject> scope) {
        // Get executor impl
        IRollupBatchExecutor executor = (IRollupBatchExecutor) RollupBatchExecutorFactory.createInstance(function);
        
        try {
            // Execute
        	state = executor.executeGivenSourceRecords(state, scope, sourceObject, sourceField, mergeField, targetObject, targetField, filter); 
            
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