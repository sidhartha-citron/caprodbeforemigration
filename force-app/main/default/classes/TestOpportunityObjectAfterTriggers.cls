/**
---------------------------------
 * Author            Date            Modification
 * Sidhartha		 Mar 15, 2021	 Added testAfterDeleteOpp() to cover after delete in OpportunityTriggerHandler
 *-----------------------------------------------------------
 **/
@isTest
public class TestOpportunityObjectAfterTriggers {
    
    @TestSetup 
    static void setup() {
        List<Account> accounts = new List<Account>();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        Id devRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Data Review').getRecordTypeId();
        Id newRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('New Conversion Opportunity').getRecordTypeId();
        //Id frequencyChangeRecordType = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Additional Opportunities - Penetration').getRecordTypeId();
        Id frequencyChangeRecordType = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Additional Subcategories - Penetration').getRecordTypeId();
        
        String sysAdminProfileId = [SELECT Id FROM Profile WHERE Name ='System Administrator' LIMIT 1].Id;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        TestDataFactory.crtAcctContact(3, 1);
		
        Account a0 = TestDataFactory.accounts[0];
        Account a = TestDataFactory.accounts[1];
        Id rT = [select id from recordType where name = 'Customer Ship To'].id; 
        a.RecordTypeId = rT; 
        a.ParentId = a0.Id;
        
        update a;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c(Opportunity_RecordType_New__c = newRecordTypeId);
        fssetting.Opportunity_Case_Creation_Stage_Name__c = 'Signed Awaiting Survey Approval';
        fssetting.Opportunity_Case_Rejection_Stage_Name__c = 'Closed - Site Survey Rejected';
        fssetting.Internal_Data_Review_Case_Record_Type_ID__c = devRecordTypeId;
        fssetting.Case_Type_for_Internal_Data_Review__c = 'Site Survey';
        fssetting.Opportunity_To_Order_Creation_Stage_Name__c = 'Signed';
        fssetting.Order_Start__c = 1;
        fssetting.Non_Consumables_Period__c = 1;
        fssetting.Pest_Site_Survey_Approval_Queue__c = testGroup.Id;
        fssetting.Hygiene_Site_Survey_Approval_Queue__c = testGroup.Id;
        fssetting.Default_Order_Price_Book_ID__c = Test.getStandardPricebookId();
        fssetting.Internal_Data_Review_Case_Owner__c = testGroup.Id;
        fssetting.Order_Active_Stage__c = 'Activated'; 
        fssetting.Site_Survey_Reviewed_Status__c = 'Approved';
        fssetting.System_Administrator_Profile_Id__c = sysAdminProfileId;
        fssetting.Customer_Service_Profile_Id__c = sysAdminProfileId;
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Service_Start__c=0;
        fssetting.Opportunity_RecordType_Additional__c=frequencyChangeRecordType;
        
        fssetting.Inside_Sales_Team__c = testGroup.Id;
        fssetting.Billing_Team__c = testGroup.Id;
        fssetting.Ticket_Type_for_New_Lead__c = 'New Lead';
        fssetting.Ticket_Type_for_Site_Survey__c = 'Site Survey';
        fssetting.CS_Pest_Queue__c = testGroup.Id;
        fssetting.CS_Chemical_Queue__c = testGroup.Id;
        fssetting.CS_Hygiene_Queue__c = testGroup.Id;
        fssetting.Inside_Sales_Queue__c = testGroup.Id;
        fssetting.Customer_Success_Queue__c = testGroup.Id;
        fssetting.Billing_Queue__c = testGroup.Id;
        fssetting.CS_Orders__c = testGroup.Id;
        fssetting.CS_Data_Cleanup__c = testGroup.Id;
        fssetting.App_Support_Team_Queue__c = testGroup.Id;
        fssetting.Finance_Master_Data_Queue__c = testGroup.Id;
        fssetting.Opportunity_Frequency_Change_Stage_Name__c = 'Signed - Submit for Frequency Change';
        
        insert fssetting;
        
        for(Account acct: TestDataFactory.accounts){ 
        	acct.OperatingHoursId = TestDataFactory.opthours[1].Id; 
            acct.Service_Territory__c = TestDataFactory.srvTers[1].Id;
            accounts.add(acct);
        }
        update accounts;
                
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Approved'
        );
        insert ss;
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene',
                    ExternalId__c = 'test'+i
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<5; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        insert pEntries; 
        
        Opportunity op = new Opportunity(
            Name=a.Name + ' Opportunity',
            AccountId=a.Id,
            StageName='Presentation', 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In', 
            Site_Survey__c=a.Site_Survey__c,
            RecordTypeId = newRecordTypeId
        ); 
        insert op;
        
        OpportunityContactRole oppRole = new OpportunityContactRole(
            OpportunityId=op.Id,
            ContactId=TestDataFactory.contacts[1].Id, 
            Role='Decision Maker',
            isPrimary=TRUE
        );
        insert oppRole;
        
        for(Integer i=0; i<3; i++) {
            oppItems.add(
                new OpportunityLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OpportunityId=op.Id, 
                    SurveyAssetCountChecker__c=1
                )
            );
        } 
        insert oppItems;
        
        for(Integer i=0; i<3; i++) {
            //oppItems.get(i).SurveyAssetCountChecker__c=oppItems.get(i).Quantity;
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=op.Id,  
                    Originating_Record_ID__c=oppItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=op.Site_Survey__c, 
                    Service_Frequency__c=oppItems.get(i).Service_Frequency__c, 
                    Survey_Location__c=location.Id
                )
            );
        }
        insert surveyAssetLocations;
        
        User newUser = new User(
            Alias = 'testA', 
            Email = 'testUser@UserCommunity.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TestFirstName',
            LastName = 'TestLastName', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testUser@UserCommunity.com', 
            Employee_Number__c = 'ABCD123TEST'
        );
        insert newUser;
        
        
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newUser) {
            insert testQueue;
        }
    }
    
    static testMethod void insertOpportunity() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name = 'TestAccount1'];
        a.Site_Survey__c=null;

        Opportunity op = new Opportunity(
          	Name=a.Name+' OpportunityTest',
            AccountId=a.Id,
            StageName='Presentation', 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In'
        );
        
        update a;
        insert op;
    }
    
    static testMethod void testAfterUpdateCreateCase() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Opportunity op = [SELECT Id, Name, AccountId,Account.Invoice_Preference__c,StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        System.debug('#####' + op.Account.Invoice_Preference__c);
        op.StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c;
        update op;
        
    }
    
    static testMethod void testAfterUpdateCreateCaseRejection() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        
        op.StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c;
        update op;
        
        op.StageName=fssetting.Opportunity_Case_Rejection_Stage_Name__c;
        update op;
        
        op.StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c;
        update op;
        
    }
    
    static testMethod void testAfterUpdateCreateOrder() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Test.startTest();
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName, Site_Survey__c, Seasonal_Requirements__c, Description FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        op.StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c;
        op.Seasonal_Requirements__c=TRUE;
        op.Description='test';
        update op;
        
        TriggerHelper.hasRun = false;
        op.StageName=fssetting.Opportunity_To_Order_Creation_Stage_Name__c;
        op.IsConverted__c = false;
        update op;
        Test.stopTest();
    }
    
    static testMethod void testAfterDeleteOpp() {
       Opportunity op = [SELECT Id, Name, AccountId, StageName, Site_Survey__c, Seasonal_Requirements__c, 
                          Description, RecordTypeId, Order__c, Pricebook2Id FROM Opportunity Limit 1];
        Test.startTest();
        delete op;
        Test.stopTest();
        List<Survey_Asset_Delete__c> sAd = [select Id FROM Survey_Asset_Delete__c LIMIT 1];
        system.assertEquals(1, sAd.size());
    }
    
    static testMethod void testAfterUpdateOrderUpdate() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName, Site_Survey__c, Seasonal_Requirements__c, 
                          Description, RecordTypeId, Order__c, Pricebook2Id FROM Opportunity Limit 1];
        
        
        Order o = new Order(
          AccountId=op.AccountId,
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=op.Pricebook2Id,
            Site_Survey__c=op.Site_Survey__c
        ); 
        insert o;
        
        op.StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c;
        op.RecordTypeId=fssetting.Opportunity_RecordType_Additional__c;
        op.Seasonal_Requirements__c=TRUE;
        op.Description='test';
        op.Order__c=o.Id;
        update op;
        
        op.StageName=fssetting.Opportunity_To_Order_Creation_Stage_Name__c;
        update op;
        
    }

}