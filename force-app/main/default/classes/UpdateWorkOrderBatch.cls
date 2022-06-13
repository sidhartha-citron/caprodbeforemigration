global  class UpdateWorkOrderBatch implements Database.Batchable<SObject>{
    global Database.QueryLocator Start(Database.BatchableContext bc){
        return Database.getQueryLocator([Select Id,Work_Order_Generation_Status__c from WorkOrder where Work_Order_Generation_Status__c != '' OR Work_Order_Generation_Status__c != null]);
    }
    global void execute(Database.BatchableContext BC,List<SObject> scope){

        List<WorkOrder> woList = new List<WorkOrder>();
        for(WorkOrder wo : (List<WorkOrder>)scope){
            wo.Work_Order_Generation_Status__c = '';
            woList.add(wo);
        }

        Database.update(woList,false);  
    }
    global void finish(Database.BatchableContext bc){
         CreateWorkOrderStatusBatch cwosb = new CreateWorkOrderStatusBatch();
          database.executebatch(cwosb,200);
    }
}