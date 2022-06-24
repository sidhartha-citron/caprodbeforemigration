/*
 * Version		Date			Developer		Comments	
 * 1.0			15/09/2021		Sidhartha		Code Created
 * 
*/
@isTest
public class TestCallBlockController {
    @TestSetup static void setup() {
        List<Lead> leadsToUpdate = new List<Lead>();    
        TestDataFactory.crtTestLeads(1, False); 
        leadsToUpdate = TestDataFactory.newLeads; 
        leadsToUpdate[0].Add_To_Call_Block__c = true;
       // leadsToUpdate[0].SE_Opportunity_Bundle_Type__c = 'CHR-SMW-HAW';  
        leadsToUpdate[0].Email = 'test@gmail.com';  
        update leadsToUpdate;
        
        Task tk = new Task();
        tk.WhoId = leadsToUpdate[0].Id;
        tk.Type = 'Call Block';
        tk.Status = 'Not Started';
        insert tk;
    }
    static testMethod void updatTask() {
        List<Task> tsk = [SELECT Id, CreatedDate, Call_Block_Disposition__c , Scheduled_Follow_Up_on_Next_Call_Block__c , Status, 
                    Subject FROM Task WHERE Type = 'Call Block' AND Status != 'Completed' LIMIT 1];
        Test.startTest();
        CallBlockController.updateTask(tsk);
        Test.stopTest();  
    }
    
    static testMethod void updateTaskStatustoHigh() {
       Task tsk = [SELECT Id, CreatedDate, Call_Block_Disposition__c , Scheduled_Follow_Up_on_Next_Call_Block__c , Status, 
                    Subject FROM Task WHERE Type = 'Call Block' AND Status != 'Completed' LIMIT 1];
        Test.startTest();
        CallBlockController.updateTaskStatustoHigh(tsk);
        Test.stopTest();   
    }
    static testMethod void createFollowUpTask() {
      Lead ld = [SELECT Id, Email,Add_to_Call_Block__c, Status FROM Lead limit 1];
      Task tsk = [SELECT Id, CreatedDate, Call_Block_Disposition__c , Scheduled_Follow_Up_on_Next_Call_Block__c , Status, 
                    Subject FROM Task WHERE Type = 'Call Block' AND Status != 'Completed' LIMIT 1];
      CallBlockController.newfollowUpTask newF = new CallBlockController.newfollowUpTask();
        newF.recId = ld.Id;
        newF.isPriority = true;
        newF.followupcheck = true;
        newF.ActivityDate = String.valueOf(system.today());
      Test.startTest();
        CallBlockController.createCallBlockTask(newF);
      Test.stopTest();  
        
    }    
    static testMethod void deletetask() {
        Task tsk = [SELECT Id, CreatedDate, Call_Block_Disposition__c , Scheduled_Follow_Up_on_Next_Call_Block__c , Status, 
                    Subject FROM Task WHERE Type = 'Call Block' AND Status != 'Completed' LIMIT 1];
        
        Test.startTest();
        try{
            CallBlockController.deleteTask(tsk);  
            Task tsk1 = [select id from task limit 1];
            system.assert(true, 'Delete failed.');
        }
        catch(AuraHandledException e) {
            System.assert(e.getMessage().contains('Delete failed.'));
        }
        Test.stopTest();  
    }
   

    static testMethod void createEvents() {
        Lead ld = [SELECT Id, Email,Add_to_Call_Block__c, Status FROM Lead limit 1];
   
        Event evt = new Event();
        evt.StartDateTime = system.now();
        evt.WhoId = ld.Id;
        evt.DurationInMinutes = 30;
        
       Task tsk = [SELECT Id, CreatedDate, Call_Block_Disposition__c , Scheduled_Follow_Up_on_Next_Call_Block__c , Status, 
                    Subject FROM Task WHERE Type = 'Call Block' AND Status != 'Completed' LIMIT 1];
        
        Test.startTest();
        CreateEventController.createEventAndUpdate(evt, ld, tsk);
        Test.stopTest();
    }
    
    static testMethod void createflowEvents() {
        
        Lead ld = [SELECT Id, Email,Add_to_Call_Block__c, Status FROM Lead];
        
        List<CreateEventController.flowInputVar> lstflowvar = new List<CreateEventController.flowInputVar>();
        CreateEventController.flowInputVar flowVar = new CreateEventController.flowInputVar();
        
        flowVar.evtCountry = 'Canada';
        flowVar.evtPostal = 'L3R 3L5';
        flowVar.evtState = 'ON';
        flowVar.evtStreet = '555 Alden Road';
        flowVar.followUpDate = system.now();
        flowVar.recId = ld.Id;
        lstflowvar.add(flowVar);
        system.debug('flowVar ' + lstflowvar);
        Test.startTest();
        CreateEventController.getEventData(lstflowvar);
        Test.stopTest();
    }
    
    
    static testMethod void getleadtoconvert() {
        Lead ld = [SELECT Id, Email,Add_to_Call_Block__c, Status FROM Lead];
        Test.startTest();
        ConvertLeadController.getReadyToConvert(ld.Id);
        Test.stopTest();
    }
    
    static testMethod void createBundle() {
       /* Lead ld = [SELECT Id, Email,Add_to_Call_Block__c, Status FROM Lead];
        ConvertLeadController.flowOutputs flOt = new ConvertLeadController.flowOutputs();
        flOt.bundleSelector = 'CHR';
        flOt.bundleSoap = 'SMW';
        flOt.bundleHandSanitizer = 'HMW';
        flOt.recordId = ld.Id;
        List<ConvertLeadController.flowOutputs> request = new List<ConvertLeadController.flowOutputs>();
		request.add(flOt);
        Test.startTest();
        ConvertLeadController.createbundle(request);
        Test.stopTest();*/
    }
    
    static testMethod void getCallBlockRecords() {
        Test.startTest();
        CallBlockController.getRecords();
        Test.stopTest();
    }
    
    static testMethod void saveCallBlockRecords() {
        /*TestDataFactory.crtOperatingHrs();
        TestDataFactory.crtSrvTerritory();
        TestDataFactory.crtTimeZoneSettings();
        TestDataFactory.crtFieldServiceSetting();*/
        TestDataFactory.crtAcctContact(1, 1);
        Contact cont = [SELECT Id, Add_to_Call_Block__c, AccountId FROM Contact];
        Lead ld = [SELECT Id, Add_to_Call_Block__c, Status FROM Lead];
        Event evt = new Event();
        evt.StartDateTime = system.now();
        evt.WhoId = ld.Id;
        evt.DurationInMinutes = 30;
        Task tsk = [SELECT Id, CreatedDate, Call_Block_Disposition__c , Scheduled_Follow_Up_on_Next_Call_Block__c , Status, 
                    Subject FROM Task WHERE Type = 'Call Block' AND Status != 'Completed' LIMIT 1];
        
        Test.startTest();
        CallBlockController.saveRecords(tsk, ld, cont, evt);
        Test.stopTest();
    }
    
    static testMethod void convertleadWithDupeByPass() {
      /*  Id pBook = Test.getStandardPricebookId();
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Item_Type_for_Consumables__c =  'Consumables';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        insert fssetting;*/
        Lead ld = [SELECT Id, Email,Add_to_Call_Block__c, Status FROM Lead];
        Test.startTest();
        ConvertLeadController.convertLeads(ld.Id, null, null, true);
        Test.stopTest();
    }
    
    static testMethod void convertleadWithoutDupeCheck() {
      /*  Id pBook = Test.getStandardPricebookId();
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Item_Type_for_Consumables__c =  'Consumables';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        insert fssetting;*/
        Lead ld = [SELECT Id, Country, State, City, PostalCode, Street, Email,Add_to_Call_Block__c, Status FROM Lead];
        Test.startTest();
        ConvertLeadController.convertLeads(ld.Id, null, null, false);
        Test.stopTest();
        
    }
}