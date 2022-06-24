@isTest
public class EDW_InputLookupTest {

    @testSetup
    static void setup() {
        Group testGroup = new Group(Name='Customer_Success', type='Queue');
        insert testGroup;
        
        QueueSObject mappingObject = new QueueSobject(QueueId = testGroup.Id, SObjectType = 'Case');
        
        System.runAs(new User(Id = UserInfo.getUserId())) {
        	insert mappingObject;
        }
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Account_Ship_To_Record_Type_Id__c = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Ship To').getRecordTypeId();
        fssetting.Ticket_Emergency_Record_Type__c = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId();
        fssetting.Customer_Success_Queue__c = testGroup.Id;
        
        insert fssetting;
        
        Account a = new Account(
            Name='TestAccount', 
            AccPac_Account__c='1234-', 
            A_P_Contact_Name__c='TestContactName', 
            Credit_Check__c='Completed', 
            Industry='Institutions', 
            Industry_Code_Accpac__c='000-00 UNKNOWN', 
            Invoice_Preference__c='Email',
            Invoicing_Email_Address__c='Test@test.com', 
            LEED_Customer__c='No', 
            On_Hold__c=FALSE, 
            Type='Customer', 
            Phone='123456789',
            Billing_Suite_Number__c='1', 
            BillingStreet='Street', 
            BillingCity = 'City', 
            BillingState = 'State', 
            BillingPostalCode = 'PostalCode',
            BillingCountry = 'Country',
            Shipping_Suite_Number__c = '1',
            ShippingStreet = 'Street', 
            ShippingCity = 'City', 
            ShippingState = 'State', 
            ShippingPostalCode = 'PostalCode', 
            ShippingCountry = 'Country'
        );
        insert a;
        
        Contact c = new Contact();
        c.LastName = 'test';
        c.Email = 'test@example.com';
        c.AccountId = a.Id;
        
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
            Name='Location',
            Number_of_Rooms__c='1'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
    }
    
    @isTest
    static void searchAccount() {
        String s = 'Tes', sObjectType = 'Account', filterId = '';
        
        Test.startTest();
        
        EDW_InputLookup.searchLookup(s, sObjectType, filterId, null);
        
        Test.stopTest();
    }
    
    @isTest
    static void searchContact() {
        Account account = [SELECT Id FROM Account LIMIT 1];
        
        String s = 'tes', sObjectType = 'Contact', filterId = account.Id;
        
        Test.startTest();
        
        EDW_InputLookup.searchLookup(s, sObjectType, filterId, null);
        
        Test.stopTest();
    }
    
    @isTest
    static void searchTicket() {
        Account account = [SELECT Id FROM Account LIMIT 1];
        
        String s = '00', sObjectType = 'Case', filterId = account.Id;
        
        Test.startTest();
        
        EDW_InputLookup.searchLookup(s, sObjectType, filterId, null);
        
        Test.stopTest();
    }
    
    @isTest
    static void searchSurveyLocation() {
        Account account = [SELECT Id, Site_Survey__c FROM Account LIMIT 1];
        Survey_Location__c location = [SELECT Id, Number_of_Rooms__c FROM Survey_Location__c LIMIT 1];
        
        String s = 'Loc', sObjectType = 'Survey_Location__c', filterId = account.Site_Survey__c;
        
        Test.startTest();
        
        EDW_InputLookup.searchLookup(s, sObjectType, filterId, location.Number_of_Rooms__c);
        
        Test.stopTest();
    }
    
    @isTest
    static void selectAccount() {
        Account account = [SELECT Id FROM Account LIMIT 1];
        
        String s = account.Id, sObjectType = 'Account';
        
        Test.startTest();
        
        EDW_InputLookup.loadDefault(s, sObjectType);
        
        Test.stopTest();
    }
    
    @isTest
    static void selectContact() {
        Contact contact = [SELECT Id FROM Contact LIMIT 1];
        
        String s = contact.Id, sObjectType = 'Contact';
        
        Test.startTest();
        
        EDW_InputLookup.loadDefault(s, sObjectType);
        
        Test.stopTest();
    }
    
    @isTest
    static void selectTicket() {
        Contact contact = [SELECT Id, AccountId FROM Contact LIMIT 1];
        
        Case theCase = new Case();
        theCase.AccountId = contact.AccountId;
        theCase.ContactId = contact.Id;
        theCase.Type = 'Pest Control';
        theCase.RecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId();
        theCase.Subject = 'test case';
        
        insert theCase;
        
        String s = theCase.Id, sObjectType = 'Case';
        
        Test.startTest();
        
        EDW_InputLookup.loadDefault(s, sObjectType);
        
        Test.stopTest();
    }
    
    @isTest
    static void selectSurveyLocation() {
        Survey_Location__c location = [SELECT Id FROM Survey_Location__c LIMIT 1];
        
        String s = location.Id, sObjectType = 'Survey_Location__c';
        
        Test.startTest();
        
        EDW_InputLookup.loadDefault(s, sObjectType);
        
        Test.stopTest();
    }
    
    @isTest
    static void selectBreaking() {
        Account account = [SELECT Id, Site_Survey__c FROM Account LIMIT 1];
        
        String s = account.Site_Survey__c, sObjectType = 'Site_Survey__c';
        
        Test.startTest();
        
        EDW_InputLookup.loadDefault(s, sObjectType);
        
        Test.stopTest();
    }
}