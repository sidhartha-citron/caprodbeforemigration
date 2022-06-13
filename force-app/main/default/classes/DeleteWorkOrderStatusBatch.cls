global  class DeleteWorkOrderStatusBatch implements Database.Batchable<SObject>{
    global Database.QueryLocator Start(Database.BatchableContext bc){
        return Database.getQueryLocator([Select Id from Work_Order_Generation_Status__c ]);
    }
    global void execute(Database.BatchableContext BC,List<SObject> scope){
        List<Work_Order_Generation_Status__c> wogslList = new List<Work_Order_Generation_Status__c>();
        Set<Id> wogsSet = new Set<Id>();
    
        for(Work_Order_Generation_Status__c wogsl : (List<Work_Order_Generation_Status__c>)scope){
            wogslList.add(wogsl);
            wogsSet.add(wogsl.Id);
        }
        Database.delete(wogslList,false);
        
    }
    global void finish(Database.BatchableContext bc){
         CreateWorkOrderStatusBatch cwosb = new CreateWorkOrderStatusBatch();
          database.executebatch(cwosb,200);
    }
}