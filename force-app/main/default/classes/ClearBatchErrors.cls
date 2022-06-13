global class ClearBatchErrors implements Database.Batchable<SObject> {
    
    public String queryString { get; set; }
    
    global ClearBatchErrors() {
        queryString = 'SELECT Id, CreatedDate FROM Batch_Errors__c WHERE CreatedDate < LAST_N_DAYS:7';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc){
        return Database.getQueryLocator(queryString);
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch){
        delete ((List<Batch_Errors__c>) batch);
        
    }
    
    global void finish(Database.BatchableContext bc){
        
    }

}