@isTest
public class EDW_SelectCustomerControllerTest {
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
        fssetting.Standard_Pricebook_Id__c = Test.getStandardPricebookId();
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        
        insert fssetting;
        
        Emergency_Dispatch_Wizard_Setttings__c edws = new Emergency_Dispatch_Wizard_Setttings__c();
        edws.Order_Name__c = 'test order ';
        edws.Maximum_Number_of_Resources__c = 10;
        edws.Order_Item_Batch_Threshold__c = 10;
        edws.Work_Order_Multi_Res_Advance_Days__c = 40;
        
        insert edws;
        
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
            Name='Location'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        Product2 product = new Product2();
        product.Name = 'test product';
        product.Allowable_Frequencies__c = 'One-Time';
        product.Family = 'Pest Control';
        product.ExternalID__c = '01-10-10-01';
        product.Item_Type__c = 'Service';
        product.Infestation_Level__c = 'General';
        product.Treatment_Type__c = 'Bed Bug';
        product.Number_of_Rooms__c = '1';
        product.IsActive = true;
        
        insert product;
        
        PricebookEntry pbe = new PricebookEntry();
        pbe.UnitPrice = 5;
        pbe.Pricebook2Id = fssetting.Standard_Pricebook_Id__c;
        pbe.ExternalID__c = 'fgds';
        pbe.Product2Id = product.Id;
        pbe.IsActive = true;
        
        insert pbe;
        
        Case theCase = new Case();
        theCase.AccountId = c.AccountId;
        theCase.ContactId = c.Id;
        theCase.Type = 'Pest Control';
        theCase.RecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId();
        theCase.Subject = 'test case';
        
        insert theCase;
    }
    
    @isTest
    static void testSelectCustomerScreenInitializationFromGlobalTab() {
        Test.startTest();
        
        EDW_SelectCustomerController.initializeSelectCustomer(null);
        
        Test.stopTest();
    }
    
    @isTest
    static void testSelectCustomerScreenInitializationFromAccount() {
        Account account = [SELECT Id FROM Account LIMIT 1];
        
        Test.startTest();
        
        EDW_SelectCustomerController.initializeSelectCustomer(account.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testSelectCustomerScreenInitializationFromTicket() {
        Contact contact = [SELECT Id, AccountId FROM Contact LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        
        Test.stopTest();
    }
}