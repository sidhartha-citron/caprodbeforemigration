/**
 * Implements Batchable interface. Contains logic for persisting Batch Job Results record at the end of the run,
 * while delegating actual batch processing logic to specified IBatchExecutor impl.
 * 
 * @author Ahsan Butt
 */
global class BatchJobImpl implements Database.Batchable<sObject>, Database.Stateful, Database.AllowsCallouts {
	global String batchJobName;
    global String query;
    global Boolean retrieveOnlyLatest;
    global String batchImplClass;
    global Map<String, String> batchImplParams;
    
    global Integer totalRecords;
    global Integer errors;
    global String notes;
    
    global BatchJobImpl(String jobName, String q, Boolean retrieveLatest, String batchImpl, Map<String, String> params) {
        batchJobName = jobName;
        query = q;
        retrieveOnlyLatest = retrieveLatest;
        batchImplclass = batchImpl;
        batchImplParams = params;

        totalRecords = 0;
        errors = 0;
        notes = '';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        if (!retrieveOnlyLatest) return Database.getQueryLocator(query);        
        
        // Get last batch job run
    	List<Batch_Job_Results__c> batchJobRuns = [SELECT Id, CreatedDate 
                                                   FROM Batch_Job_Results__c 
                                                   WHERE Name =: batchJobName ORDER BY CreatedDate DESC];
        Batch_Job_Results__c lastRun;
        
        if (batchJobRuns != null && batchJobRuns.size() > 0) {
            lastRun = batchJobRuns.get(0);
        } else {
            return Database.getQueryLocator(query);
        }
        
        String queryWithNewnessCondition = query;
        
        String lastRunDTString = lastRun.CreatedDate.format('yyyy-MM-dd\'T\'hh:mm:ss\'Z\'');
        String newnessCondition = String.format('(LastModifiedDate >= {0} OR CreatedDate >= {1})', new List<String>{lastRunDTstring, lastRunDTString});
        
        if (query.containsIgnoreCase('where')) {
        	queryWithNewnessCondition += ' AND ' + newnessCondition;     
        }  else {
            queryWithNewnessCondition += ' WHERE ' + newnessCondition;     
        }
        
        System.debug(queryWithNewnessCondition);
        
        return Database.getQueryLocator(queryWithNewnessCondition);
    }
    
    global void execute(Database.BatchableContext bc, List<sObject> scope) {
        // Instantiate executor class
        Type batchImplType = Type.forName(batchImplClass);
        IBatchExecutor executor = (IBatchExecutor) batchImplType.newInstance();
      
        try {
            // Execute
        	executor.execute(scope, batchImplParams); 
            
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