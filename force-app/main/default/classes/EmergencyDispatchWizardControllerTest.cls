@isTest
public class EmergencyDispatchWizardControllerTest {
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
        fssetting.Work_Order_Dispatched_Status__c = 'Dispatched';
        fssetting.Work_Order_Scheduled_Status__c = 'Scheduled';
        fssetting.Duration_Type_Minutes__c = 'Minutes';
        
        insert fssetting;
        
        Emergency_Dispatch_Wizard_Setttings__c edws = new Emergency_Dispatch_Wizard_Setttings__c();
        edws.Order_Name__c = 'test order ';
        edws.Maximum_Number_of_Resources__c = 10;
        edws.Order_Item_Batch_Threshold__c = 10;
        edws.Pagination_Limit__c = 25;
        edws.Activate_Warranty_Logic__c = true;
        edws.Work_Order_Multi_Res_Advance_Days__c = 40;
        edws.Service_Appointment_Minimum_Duration__c = 6;
        edws.SSRS_Multi_Res_Pest_Skill_Id__c = '0C5f1000000PB3QCAW';
        edws.SSRS_Pest_Commercial_Skill_Id__c = '0C5f1000000PB3RCAW';
        
        insert edws;
        
        List<Skill> skills = [SELECT Id FROM Skill WHERE Id = :edws.SSRS_Pest_Commercial_Skill_Id__c];
        
        TestDataFactory.crtBillToAcctContact(1,1); 
		Account a = TestDataFactory.accounts[0]; 
        Contact c = TestDataFactory.contacts[0]; 
        
        /*
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
            ShippingCountry = 'Country',
            Is_Multi_Res__c = true
        );
        insert a;
        
        Contact c = new Contact();
        c.LastName = 'test';
        c.Email = 'test@example.com';
        c.AccountId = a.Id;
        
        insert c;
*/
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        SiteSurvey_RequiredSkills__c rs = new SiteSurvey_RequiredSkills__c();
        rs.Name = 'test skills';
        rs.Skill_Level__c = 1;
        rs.Site_Survey__c = ss.Id;
        rs.Line_of_Business__c = 'Pest Control';
        rs.Skill_Name__c = 'test skill name';
        rs.Skill_Record_Id__c = skills[0].Id;
        
        insert rs;
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Number_of_Rooms__c = '1',
            Name='Location'
        );
        insert location;
        
        Survey_Location__c location2 = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Number_of_Rooms__c = 'Garden Home',
            Name='Location'
        );
        insert location2;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        WorkType wt = new WorkType();
        wt.DurationType = 'Minutes';
        wt.EstimatedDuration = 2;
        wt.Name = 'test work type';
        
        insert wt;
        
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
        product.Service_Work_Type__c = wt.Id;
        
        insert product;
        
        Product2 product2 = new Product2();
        product2.Name = 'test product2';
        product2.Allowable_Frequencies__c = 'One-Time';
        product2.Family = 'Pest Control';
        product2.ExternalID__c = '01-10-10-02';
        product2.Item_Type__c = 'Service';
        product2.Infestation_Level__c = 'General';
        product2.Treatment_Type__c = 'Bed Bug';
        product2.Number_of_Rooms__c = 'Garden Home';
        product2.IsActive = true;
        product2.Service_Work_Type__c = wt.Id;
        
        insert product2;
        
        PricebookEntry pbe = new PricebookEntry();
        pbe.UnitPrice = 5;
        pbe.Pricebook2Id = fssetting.Standard_Pricebook_Id__c;
        pbe.ExternalID__c = 'fgds';
        pbe.Product2Id = product.Id;
        pbe.IsActive = true;
        
        insert pbe;
        
        PricebookEntry pbe2 = new PricebookEntry();
        pbe2.UnitPrice = 5;
        pbe2.Pricebook2Id = fssetting.Standard_Pricebook_Id__c;
        pbe2.ExternalID__c = 'fgds2';
        pbe2.Product2Id = product2.Id;
        pbe2.IsActive = true;
        
        insert pbe2;
    }
    
    @isTest
    static void testInitializeEmergencyDispatchWizard() {
        Test.startTest();
        
        String mode = 'NEW';
        
        EDW_ViewModels.MainViewModel model = EmergencyDispatchWizardController.initializeEmergencyDispatchWizard(mode);
        
        Test.stopTest();
    }
    
    @isTest
    static void testIsAccessValid() {
        Account account = [SELECT Id FROM Account LIMIT 1];
        Contact contact = [SELECT Id, AccountId FROM Contact WHERE AccountId = :account.Id LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(account.Id);
        model.mode = 'NEW';
        model.contact = contact;
        
        String json = System.JSON.serialize(model);
        
        String modelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel mainModel = EDW_ViewModels.parseInitData(modelJson);
        mainModel.order.PoNumber = 'testpo';
        
        String createdOrderJson = System.JSON.serialize(mainModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        EmergencyDispatchWizardController.isAccessValid(returnedOrder.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testIsAccessValidOrderCancelled() {
        Account account = [SELECT Id FROM Account LIMIT 1];
        Contact contact = [SELECT Id, AccountId FROM Contact WHERE AccountId = :account.Id LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(account.Id);
        model.mode = 'NEW';
        model.contact = contact;
        
        String json = System.JSON.serialize(model);
        
        String modelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel mainModel = EDW_ViewModels.parseInitData(modelJson);
        mainModel.order.PoNumber = 'testpo';
        
        String createdOrderJson = System.JSON.serialize(mainModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        returnedOrder.Order_Cancelled__c = true;
        
        update returnedOrder;
        
        EmergencyDispatchWizardController.isAccessValid(returnedOrder.Id);
        
        Test.stopTest();
    }
}