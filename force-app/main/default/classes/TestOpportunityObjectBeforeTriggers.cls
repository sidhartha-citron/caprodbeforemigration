/*
* Revision Date        Owner                   			   Description
* -------- ----------  ----------- -------------------     -----------
* 1.0      11-03-2021  Sidhartha                		   Fixed test class to cover all validation rules.
*/
@isTest
public class TestOpportunityObjectBeforeTriggers {
    
    @TestSetup static void setup() {
        List<Account> accounts = new List<Account>();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            Id pBook = Test.getStandardPricebookId();
        
        String sysAdminProfileId = [SELECT Id FROM Profile WHERE Name ='System Administrator' LIMIT 1].Id;
        String randomProfileId = [SELECT Id, UserType FROM Profile WHERE Id !=:sysAdminProfileId AND UserType != 'PowerCustomerSuccess' LIMIT 1].Id;
        Group testGroup = new Group(Name='Customer Success', Type='Queue');
        insert testGroup;
        System.runAs(new User(Id=UserInfo.getUserId()))
        {
            QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SObjectType = 'Case');
            insert testQueue;
        }
        Id frequencyChangeRecordType1 = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Data Review').getRecordTypeId();
        Id frequencyChangeRecordType = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Changes to an Existing Service Subcategory').getRecordTypeId();
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Hygiene_Site_Survey_Approval_Queue__c = testGroup.Id;
        fssetting.Internal_Data_Review_Case_Record_Type_ID__c = frequencyChangeRecordType1;
        fssetting.System_Administrator_Profile_Id__c = sysAdminProfileId;
        fssetting.Opportunity_Case_Creation_Stage_Name__c = 'Signed Awaiting Survey Approval';
        fssetting.Opportunity_To_Order_Creation_Stage_Name__c = 'Signed';
        fssetting.Customer_Service_Profile_Id__c = randomProfileId;
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Opportunity_RecordType_Frequency_Change__c = frequencyChangeRecordType;
        fssetting.Opportunity_Frequency_Change_Stage_Name__c = 'Signed - Submit for Frequency Change';
        insert fssetting;
        
        TestDataFactory.crtAcctContact(2, 0);
        
        integer n = 0; 
        for(Account acct: TestDataFactory.accounts){ 
            acct.OperatingHoursId = TestDataFactory.opthours[1].Id; 
            acct.Service_Territory__c = TestDataFactory.srvTers[1].Id;
            acct.Name='TestAccount'+n; 
            n++;
            accounts.add(acct);
        }
        update accounts;
        
        Account a0 = accounts.get(0);
        Account a = accounts.get(1);
        a.ParentId = a0.Id;
        system.debug('aaaaa1111' + a.AccPac_Account__c);
        system.debug('aaaaa2222' + a0.AccPac_Account__c);
        update a;
        
        Contact c = new Contact(
            FirstName = 'TestFirstName', 
            LastName = 'TestLastName', 
            Email = 'testUser@UserCommunity.com', 
            AccountId = a.Id, 
            Title = 'title',
            Phone = '12345678',
            Fax = '12345678',
            MobilePhone = '12345678',
            Customer_Satisfaction_eSurveys__c = FALSE,
            Customer_Opinion_eSurveys__c = TRUE,
            Customer_eNewsletters__c = FALSE,
            Promotional_Offer_Emails__c = TRUE,
            Promotional_Mailings__c = FALSE
            
        );
        insert c;
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
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
                    Available_As_Related_Product__c=TRUE
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
            Name=a.Name+' Opportunity',
            AccountId=a.Id,
            //  RecordTypeId = frequencyChangeRecordType,
            StageName='Presentation', 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In', 
            Site_Survey__c=a.Site_Survey__c
        ); 
        insert op;
        
        OpportunityContactRole oppRole = new OpportunityContactRole(
            OpportunityId=op.Id,
            ContactId=c.Id, 
            Role='Decision Maker',
            isPrimary=TRUE
        );
        insert oppRole;
        
        for(Integer i=0; i<3; i++) {
            oppItems.add(
                new OpportunityLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    Related_Product__c = products.get(0).Id,
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=i+2, 
                    OpportunityId=op.Id
                )
            );
        } 
        insert oppItems;
        
        for(Integer i=0; i<2; i++) {
            oppItems.get(i).SurveyAssetCountChecker__c=1;
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=op.Id,  
                    Originating_Record_ID__c=oppItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=op.Site_Survey__c, 
                    Survey_Location__c = location.Id,
                    Service_Frequency__c=oppItems.get(i).Service_Frequency__c
                )
            );
        }
        surveyAssetLocations.get(0).Survey_Location__c=location.Id;
        insert surveyAssetLocations;
    }
    
    static testMethod void insertOpportunity() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        
        Id pBook = Test.getStandardPricebookId();
        
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
        insert op;
    }
    
    static testMethod void insertOpportunityError1() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        
        a.Site_Survey__c=null; 
        
        Opportunity op1 = new Opportunity(
            Name=a.Name+' OpportunityTest Signed Awaiting Survey Approval',
            AccountId=a.Id,
            StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c,
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In'
        ); 
        
        Opportunity op2 = new Opportunity(
            Name=a.Name+' OpportunityTest Signed',
            AccountId=a.Id,
            StageName=fssetting.Opportunity_To_Order_Creation_Stage_Name__c, 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In'
        ); 
        
        update a;
        
        try {
            insert new List<Opportunity>{op1};
                } catch (Exception e) {
                    //2021-02-25 Darcy: updated for validation rule message
                    System.assert(e.getMessage().contains('Please associate a Site Survey and Submit it for approval'), 'message=' + e.getMessage());
                    //System.assert(e.getMessage().contains('Site Survey Approval Process'), 'message=' + e.getMessage());  
                }
        
    }
    
    
    static testMethod void insertOpportunityError2() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        
        Opportunity op1 = new Opportunity(
            Name=a.Name+' OpportunityTest',
            AccountId=a.Id,
            StageName=fssetting.Opportunity_To_Order_Creation_Stage_Name__c, 
            //'Signed - Submit for Frequency Change',
            
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In', 
            RecordTypeId=fssetting.Opportunity_RecordType_Frequency_Change__c
        ); 
        
        try {
            insert new List<Opportunity>{op1};
                } catch (Exception e) {
                    System.assert(e.getMessage().contains('to indicate that Opportunity'), 'message=' + e.getMessage());
                }
        
    }
    
    static testMethod void deleteOpportunityNotConverted() {
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        Test.startTest();
        delete op;
        Test.stopTest();
    }
    
    static testMethod void deleteOpportunityConverted() {
        Opportunity op = [SELECT Id, Name, AccountId, isConverted__c FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        op.isConverted__c=TRUE;
        Test.startTest();
        update op;
        delete op;
        Test.stopTest();
    }
    
    
    static testMethod void updateOpportunityAccountAddressError1() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a0 = [SELECT Id, Site_Survey__c, Name, BillingStreet, ShippingCity, BillingCity FROM Account WHERE Name='TestAccount0'];
        Account a = [SELECT Id, Site_Survey__c, Name, BillingStreet, ShippingCity FROM Account WHERE Name='TestAccount1'];
        a0.BillingStreet='bangalore';
        a0.BillingCity='bangalore';
        
        update a0;
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        op.StageName='Verbal Commitment';
        
        try {
            Test.startTest();
            update op;
            Test.stopTest();
        } catch (Exception e) {
            System.assert(e.getMessage().contains('Please ensure'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void updateOpportunityOHSTError() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a = [SELECT Id, Site_Survey__c, Name, BillingStreet, ShippingCity, Service_Territory__c, OperatingHoursId FROM Account WHERE Name='TestAccount1'];
        //a.Service_Territory__c=null;
        //a.OperatingHoursId=null;
        //update a;
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        op.StageName='Verbal Commitment';
        
        try {
            Test.startTest();
            update op;
            Test.stopTest();
        } catch (Exception e) {
            System.assert(e.getMessage().contains('Please fill in the'), 'message=' + e.getMessage());
        }
    }
    
    
    static testMethod void updateOpportunitySignedProfileError() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        String sysAdminProfileId = [SELECT Id FROM Profile WHERE Name ='System Administrator' LIMIT 1].Id;
        User newUser = new User(
            Alias = 'testA', 
            Email = 'testUser@TempAdmin.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TestFirstName',
            LastName = 'TestLastName', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = sysAdminProfileId,
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testUser@TempAdmin.com', 
            Employee_Number__c = 'ABCD123TEST'
        );
        insert newUser;
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        op.StageName=fssetting.Opportunity_To_Order_Creation_Stage_Name__c;
        System.runAs(newUser){
            try {
                Test.startTest();
                update op;
                test.stopTest();
            } catch (Exception e) {
                System.assert(e.getMessage().contains('Site Survey Approval Process'), 'message=' + e.getMessage());
            }
        }
    }
    
    
    static testMethod void updateOpportunitySignedError() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        op.StageName=fssetting.Opportunity_To_Order_Creation_Stage_Name__c;
        
        try {
            Test.startTest();
            update op;
            Test.stopTest();
        } catch (Exception e) {
            System.assert(e.getMessage().contains('Site Survey Approval Process'), 'message=' + e.getMessage());
        }
    }
    
    
    static testMethod void updateOpportunitySiteSurveyErrorsError() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        List<Survey_Asset_Location__c> surveyAssets = new List<Survey_Asset_Location__c>();
        
        Opportunity op = [SELECT Id, RecordTypeId, Name, AccountId, StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        system.debug('op ' + op);
        for(Survey_Asset_Location__c sa : [SELECT Id, Survey_Location__c, Originating_Parent_ID__c FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c=:op.Id])
        {
            sa.Survey_Location__c=null;
            surveyAssets.add(sa);
        }
        
        //  update surveyAssets;
        
        op.StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c;
        
        try {
            Test.startTest();
            update op;
            Test.stopTest();
        } catch (Exception e) {
            System.assert(e.getMessage().contains('Survey Asset Locations that are unallocated'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void updateOpportunityContactRoleError() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Survey_Location__c ss = [Select Id from Survey_Location__c limit 1];
        List<Survey_Asset_Location__c> surveyAssets = new List<Survey_Asset_Location__c>();
         List<Survey_Asset_Location__c> lstsurveyAssets = new List<Survey_Asset_Location__c>();
        surveyAssets = [Select Status__c, Survey_Location__c  from Survey_Asset_Location__c];
        for(Survey_Asset_Location__c bb : surveyAssets) {
            bb.Survey_Location__c = ss.Id;
            lstsurveyAssets.add(bb);
        }
        update lstsurveyAssets;
        Opportunity op = [SELECT Id, Name, AccountId, StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        Boolean exceptionThrown = false;
        OpportunityContactRole role = [SELECT Id, OpportunityId FROM OpportunityContactRole WHERE OpportunityId=:op.Id LIMIT 1].get(0);
        try{
        delete role;
        }catch(exception e){
        }
        op.StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c;
        
        try {
            Test.startTest();
            update op;
            Test.stopTest();
        } catch (Exception e) {
                      /* exceptionThrown = true;
            Boolean expectedExceptionThrown =  (e.getMessage().contains(Label.OCREmptyCheck)) ? true : false; 
            System.AssertEquals(true, expectedExceptionThrown, e.getMessage()); */
        }
    }
    
    static testMethod void updateOpportunityPriceBookError() {
        
        Pricebook2 pBook = new Pricebook2(Name='TestPricebook', IsActive=TRUE);
        insert pBook;
        Pricebook2 pb = [SELECT Id from Pricebook2 LIMIT 1].get(0);
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName FROM Opportunity WHERE Name='TestAccount1 Opportunity'];
        op.Pricebook2Id=pb.Id;
        
        try {
            update op;
            Test.stopTest();
        } catch (Exception e) {
            System.assert(e.getMessage().contains('cannot change pricebook'), 'message=' + e.getMessage());
        }
        
    }

}