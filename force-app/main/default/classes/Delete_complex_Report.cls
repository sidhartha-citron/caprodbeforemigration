global class Delete_complex_Report implements Database.Batchable<sObject>, Database.Stateful{


	
	ComplexReports__c[] crlist = new list<ComplexReports__c>();
	
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator (
           'select id from complexreports__c'
            ); 
}
   
      global void execute(Database.BatchableContext bc, List<complexreports__c> scope){
         
          for(complexreports__c cr: scope){
              crlist.add(cr);
          }      
          delete crlist;
          crlist.clear();
        }
      
        
    global void finish(Database.BatchableContext bc){
     
        AsyncApexJob job = [SELECT Id, Status, NumberOfErrors, 
            JobItemsProcessed,
            TotalJobItems, CreatedBy.Email
            FROM AsyncApexJob
            WHERE Id = :bc.getJobId()];
        system.debug('AsyncApexJog' + job);
       
    }
}