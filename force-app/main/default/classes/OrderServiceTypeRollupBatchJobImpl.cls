/**
 * Implements Batchable interface. Contains logic specific to Service Type rollup functionality, and includes logic for persisting 
 * Batch Job Results record at the end of the run. Actual rollup logic is delegated to appropriate IRollupBatchExecutor impl.
 * 
 * @author Ahsan Butt
 */
global class OrderServiceTypeRollupBatchJobImpl implements Database.Batchable<sObject>, Database.Stateful, Database.AllowsCallouts {
	global String batchJobName;
    global RollupState state;
    
    global String sourceObject;
    global String sourceField;
    global String mergeField;
    global String targetObject;
    global String targetField;
    global String filter;
    global String function;
    
    global Integer accountRollupBatchSize;
    
    global Integer totalRecords;
    global Integer errors;
    global String notes;
    
    global OrderServiceTypeRollupBatchJobImpl(String jobName, Integer acctRollupBatchSize) {
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        
        batchJobName = jobName;
        state = new RollupState();

        sourceObject = 'OrderItem';
        sourceField = 'Service_Type_Mapping__c';
        mergeField = 'OrderId';
        targetObject = 'Order';
        targetField = 'Service_Types__c';
        filter = 'Order.Status = \'' + dataSets.Order_Active_Stage__c + '\' AND Active__c = true';
        function = 'CONCAT';        
        
        accountRollupBatchSize = acctRollupBatchSize;
        
        totalRecords = 0;
        errors = 0;
        notes = '';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {        
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
            
        if (lastRun != null) {
        	// Add condition to only retrieve source records created or modified since last batch job run
        	// Note: We do not want to restrict to filter records, since we may need to re-calculate if an order becomes deactivated etc.
            lastRunDT = lastRun.CreatedDate;
            whereClause = 'WHERE LastModifiedDate >= :lastRunDT OR CreatedDate >= :lastRunDT';

        } else {
            // Restrict to active orders
            Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
            whereClause += 'WHERE Order.Status = \'' + dataSets.Order_Active_Stage__c + '\'';
        }
        
        // Format query
        String query = String.format('SELECT Id FROM {0} {1}', new List<String>{targetObject, whereClause});
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
        batchResults.Notes__c = notes.length() > 30000 ? notes.substring(0, 30000) : notes;
        
        insert batchResults;

        // Execute Account rollup batch
        AccountServiceTypeRollupBatchJobImpl batch = new AccountServiceTypeRollupBatchJobImpl(batchJobName + ': Account Rollup step', state.processedIds);
        Database.executeBatch(batch, accountRollupBatchSize);
    }
}