global class ClearWorkOrderAssets implements Database.Batchable<SObject> {
    public String queryString { get; set; }
    
    global ClearWorkOrderAssets() {
        queryString = 'SELECT Id FROM Work_Order_Asset__c WHERE Work_Order_Room__c = null';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc){
        return Database.getQueryLocator(queryString);
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch){
        delete ((List<Work_Order_Asset__c>) batch);
        
    }
    
    global void finish(Database.BatchableContext bc){
        if(!Test.isRunningTest()){
            Database.executeBatch(new ClearBatchErrors());
        }
    }
}