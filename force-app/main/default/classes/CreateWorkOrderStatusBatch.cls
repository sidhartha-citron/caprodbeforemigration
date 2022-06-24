global class CreateWorkOrderStatusBatch implements Database.Batchable<SObject>{
          
    global Database.QueryLocator Start(Database.BatchableContext bc){
        Date compareDate = date.today();    
        string query = 'Select Id,isValid__c,IsActive__c,Last_Automation_Created_Date__c,Last_InFlight_WO_Date__c,Product2Id,Product2.Allowable_Frequencies__c,Order.AccountId,Order.Account.Customer_Status__c,Order.ScheduledDate__c,Order.Status,OrderId,Order.Emergency__c,Order.Inventory_Allocated__c,Line_of_Business__c,Active__c,FrequencyInDays__c,Frequency__c,Is_Never_Generate_Work_order__c,'+
                        'Order.Season_Start_Date__c ,Order.Season_End_Date__c,Order.EffectiveDate,Order.EndDate,Service_Price_Per_Unit__c,Installation_Status__c,First_Installation_Completed_Date__c,Inventory_Allocated__c,Valid_for_Install_Remove_Replace__c,Purchase_Price__c,ServiceDate from OrderItem where   Active__c = true  AND Order.Emergency__c = false AND Is_Never_Generate_Work_order__c = False AND' + 
                        '(((Order.Season_End_Date__c >=:compareDate AND Order.Season_Start_Date__c <= : compareDate) AND (Order.Season_End_Date__c <> null AND Order.Season_Start_Date__c <> null)) OR (Order.Season_Start_Date__c = null AND Order.Season_End_Date__c = null))' + 
                        'AND Service_Price_Per_Unit__c != Null AND FrequencyInDays__c != 0 AND Valid_for_Install_Remove_Replace__c = False';
                                
        return Database.getQueryLocator(query);                     

    }
    global void execute(Database.BatchableContext BC, List<SObject> scope) {
        
        CreateWorkOrderGenerationStatus.CreateGenerationStatus(scope);
   
    }
    
    global void finish(Database.BatchableContext bc){
        UpdateWorkOrderGenerationStatusBatch uwogsb = new UpdateWorkOrderGenerationStatusBatch();
          database.executebatch(uwogsb,50);
    }
}