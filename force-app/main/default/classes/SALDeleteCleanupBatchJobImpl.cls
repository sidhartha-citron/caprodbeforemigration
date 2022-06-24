/**
 * Implements Batchable interface. Delete old Survey Asset Delete records and includes logic for persisting 
 * Batch Job Results record at the end of the run. 
 * 
 * @author Ahsan Butt
 */
global class SALDeleteCleanupBatchJobImpl implements Database.Batchable<sObject>, Database.Stateful, Database.AllowsCallouts {
	global String batchJobName;
    global Integer negExpireDays;
    global Integer totalRecords;
    global Integer errors;
    global String notes;
    
    global SALDeleteCleanupBatchJobImpl(String jobName, Integer expireDays) {
        batchJobName = jobName;
        negExpireDays = expireDays;

        totalRecords = 0;
        errors = 0;
        notes = '';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
    	DateTime expireDate = DateTime.now().addDays(negExpireDays);
        String query = 'SELECT Id FROM Survey_Asset_Delete__c WHERE CreatedDate < :expireDate';
        System.debug(query);
        return Database.getQueryLocator(query);
    }
    
    global void execute(Database.BatchableContext bc, List<sObject> scope) {

        try {
            // Execute
        	delete scope;
            
            // Record metrics
            totalRecords += scope.size();
            
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