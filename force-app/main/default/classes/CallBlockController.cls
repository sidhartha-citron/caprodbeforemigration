/*
 * Version		Date			Developer		Comments	
 * 1.0			15/09/2021		Sidhartha		Code Created for Call Block Manager
 * 
*/
public with sharing  class CallBlockController {
    
    public class newfollowUpTask {
        @auraenabled
        public Id recId{get;set;}
        @auraenabled
        public String ActivityDate{get;set;}
        @AuraEnabled
        public Boolean isPriority {get; set;}   
        @AuraEnabled
        public Boolean followupcheck {get; set;}  
    }
    
    @AuraEnabled()
    public static String createCallBlockTask(newfollowUpTask followUpTask){
        system.debug('newfollowUpTask ' + followUpTask.recId);
        String sObjName = followUpTask.recId.getSObjectType().getDescribe().getName();
        Map<String, Object> params = new Map<String, Object>();
        params.put('recordId',followUpTask.recId);
        params.put('sObjName',sObjName);
        params.put('ActivityDate',followUpTask.ActivityDate);
        if(followUpTask.isPriority) {
            params.put('isPriority','High');   
        }else{
             params.put('isPriority','Normal'); 
        }
        
        if(followUpTask.followupcheck) {
           params.put('followupcheck',true); 
        } else{
           params.put('followupcheck',false);  
        }
        system.debug('params ' + params);
        Flow.Interview.create_call_block_task stage = new Flow.Interview.create_call_block_task(params);
        stage.start();
        return 'Success';
    }
    
    @AuraEnabled()
    public static List<Task>  getRecords(){
        List<Task> latestTasks = new List<Task>();
        Integer calBlockLimit = Integer.ValueOf(System.Label.CallBlockLimit);
        List<Task> taskList = [SELECT Id, CreatedDate, Priority, ActivityDate,Call_Block_Disposition__c , Scheduled_Follow_Up_on_Next_Call_Block__c , Status, 
                               Subject,
                               TYPEOF who
                               WHEN Contact THEN MailingCity,MailingCountry,MailingPostalCode,MailingState,MailingStreet, Email,Phone, Name, Account.Name, Account.Phone, Account.Industry,Account.ShippingStreet ,
                               Account.Shipping_Address__c, Account.ShippingCity, Account.ShippingState, Account.ShippingPostalCode, Account.ShippingCountry
                               WHEN Lead THEN Id, Name, Email, Company, Phone, Industry, CreatedDate, 
                               State , Country, Postalcode , Street, City
                               END
                               FROM Task WHERE Type = 'Call Block' AND Status != 'Completed'
                               AND (Who.Type = 'Lead' OR Who.Type = 'Contact') AND OwnerId =:UserInfo.getUserId()
                               ORDER BY ActivityDate, Id ASC LIMIT :calBlockLimit];
        
        system.debug('taskList ' + taskList);
        return taskList;
    }
    
    @AuraEnabled()
    public static void deleteTask(Task tskId){
        if(tskId !=null) {
            try{
              delete tskId;  
            } catch (exception e){
                
            } 
        }
    }
    
    @AuraEnabled()
    public static void updateTask(List<Task> tskIds){
        if(tskIds !=null && !tskIds.isEmpty()) {
            try{
                update tskIds;  
            } catch (exception e){
               throw new AuraHandledException(e.getMessage() + e.getStackTraceString()); 
            } 
        }
    }
    
    @AuraEnabled()
    public static void updateTaskStatustoHigh(Task tskId){
        if(tskId !=null) {
            try{
                Task tskPriority = [SELECT Id, Priority from Task WHERE Id =:tskId.Id];
                if(tskPriority.Priority == 'High') {
                    tskPriority.Priority = 'Normal';
                }else{
                    tskPriority.Priority = 'High';
                }
                update tskPriority;  
            } catch (exception e){
              throw new AuraHandledException(e.getMessage() + e.getStackTraceString());  
            } 
        }
    }
    
    @AuraEnabled()
    public static void saveRecords(Task tsk , Lead ld, Contact cont, Event evtdetails){
        Lead ldtoupdate = ld;
        Contact conToUpdate = cont;
        system.debug('conToUpdate ' + conToUpdate);
        if(tsk !=null) {
            try{
                tsk.ActivityDate = system.today();
                update tsk;
            } catch(exception e) {
                system.debug('e ' + e.getMessage());
                throw new AuraHandledException(e.getMessage() + e.getStackTraceString());
            }
        }
        Id evt;
        if(evtdetails !=null) {
            evtdetails.DurationInMinutes = Integer.valueof(System.Label.EventDuration);
            evt = CreateEventController.createEventfromFlowNLWC(null,evtdetails);
        }

        if(ldtoupdate !=null && (ldtoupdate.Add_to_Call_Block__c || ldtoupdate.Status !=Null)) {
            try{
                update ld;
            } catch(exception e) {
                system.debug('e ' + e.getMessage());
                throw new AuraHandledException(e.getMessage() + e.getStackTraceString());
            }
        }
        
        if(conToUpdate !=null) {
            try{
                update conToUpdate;
            } catch(exception e) {
                system.debug('e ' + e.getMessage());
                throw new AuraHandledException(e.getMessage() + e.getStackTraceString());
            }
        }    
        
    }
}