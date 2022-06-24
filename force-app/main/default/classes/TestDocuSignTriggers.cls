@isTest
public class TestDocuSignTriggers {
  
    @testSetup
    static void setup() {
        Group testGroup = new Group(Name='Customer_Success', type='Queue');
        insert testGroup;
        
        QueueSObject mappingObject = new QueueSobject(QueueId = testGroup.Id, SObjectType = 'Case');
        
        System.runAs(new User(Id = UserInfo.getUserId())) {
          insert mappingObject;
        }
        
        Conga_and_DocuSign_Settings__c congaSettings = new Conga_and_DocuSign_Settings__c();
        congaSettings.DocuSign_Envelope_Completed_Status__c = 'Completed';
        
        insert congaSettings;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.PO_Required_Before_Label__c = 'PO Required Before';
        fssetting.PO_Required_After_Label__c = 'PO Required After';
        fssetting.Ticket_Closed_Status__c = 'Closed';
        fssetting.Work_Order_Dispatched_Status__c = 'Dispatched';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        fssetting.Customer_Success_Queue__c = testGroup.Id;
        fssetting.Multi_Res_Queue_Id__c = testGroup.Id;
        
        insert fssetting;
        
                
        TestDataFactory.crtBillToAcctContact(1,1);
        
        TestDataFactory.accounts[0].OperatingHoursId = TestDataFactory.opthours[1].Id;
        TestDataFactory.accounts[0].Service_Territory__c = TestDataFactory.srvTers[1].Id;
        TestDataFactory.accounts[0].PO_Required_for_Orders__c = fssetting.PO_Required_Before_Label__c;
        TestDataFactory.accounts[0].Is_Multi_Res__c = true;
        update TestDataFactory.accounts[0];
            
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=TestDataFactory.accounts[0].Id, 
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
            Number_of_Rooms__c = '1',
            Name='Location'
        );
        insert location;
        
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
        
        PricebookEntry pbe = new PricebookEntry();
        pbe.UnitPrice = 5;
        pbe.Pricebook2Id = Test.getStandardPricebookId();
        pbe.ExternalID__c = 'fgds';
        pbe.Product2Id = product.Id;
        pbe.IsActive = true;
        
        insert pbe;

        Order o = new Order(
            AccountId = TestDataFactory.accounts[0].Id,
            ShipToContactId = TestDataFactory.contacts[0].Id,
            Status = 'Draft', 
            EffectiveDate = System.today(), 
            Pricebook2Id = Test.getStandardPricebookId(),
            RecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId(),
            Inventory_Allocated__c = true,
            Pest_Emergency_Not_Invoicing__c = true,
            Emergency__c = true,
            Line_of_Businesses__c = 'Pest Control',
            Site_Survey__c = ss.Id
        );
        
        insert o;
        
        OrderItem oi = new OrderItem();
        oi.OrderId = o.Id;
        oi.PricebookEntryId = pbe.Id;
        oi.Service_Price_Per_Unit__c = 10;
        oi.Active__c = true;
        oi.Survey_Location__c = location.Id;
        oi.Quantity = 1;
        oi.UnitPrice = 10;
        oi.Frequency__c = 'One-Time';
        
        insert oi;
        
        WorkOrder wo = new WorkOrder();
        wo.Status = 'Scheduled';
        wo.AccountId = TestDataFactory.accounts[0].Id;
        wo.ContactId = TestDataFactory.contacts[0].Id;
        wo.Order__c = o.Id;
        wo.StartDate = System.today();
        wo.EndDate = System.today().addDays(1);
        
        insert wo;
        
        Case ca = new Case();
        ca.Pest_Emergency_Order_Draft_Override__c = true;
        ca.Status = 'New';
        ca.AccountId = TestDataFactory.accounts[0].Id;
        ca.ContactId = TestDataFactory.contacts[0].Id;
        ca.Order__c = o.Id;
        ca.RecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId();
        ca.Type = 'Pest Special';
        
        insert ca;
    }
    
    @isTest
    static void testDocuSignStatusOnPORequiredBeforeAndCloseTicket() {
        Account a = [SELECT Id FROM Account LIMIT 1];
        Contact c = [SELECT Id FROM Contact WHERE AccountId = :a.Id LIMIT 1];
        Order o = [SELECT Id FROM Order WHERE AccountId = :a.Id LIMIT 1];
        
        dsfs__DocuSign_Status__c status = new dsfs__DocuSign_Status__c();
        status.dsfs__Company__c = a.Id;
        status.dsfs__Contact__c = c.Id;
        status.Order__c = o.Id;
        
        Test.startTest();
        
        insert status;
        
        status.dsfs__Envelope_Status__c = 'Completed';
        
        update status;
        
        Test.stopTest();
    }
    
    @isTest
    static void testDocuSignStatusOnPORequiredAfter() {
        Account a = [SELECT Id FROM Account LIMIT 1];
        
        a.PO_Required_for_Orders__c = 'PO Required After';
        
        update a;
        
        Contact c = [SELECT Id FROM Contact WHERE AccountId = :a.Id LIMIT 1];
        Order o = [SELECT Id FROM Order WHERE AccountId = :a.Id LIMIT 1];
        OrderItem oi = [SELECT Id, PO_Number__c FROM OrderItem WHERE OrderId = :o.Id LIMIT 1];
        
        oi.PO_Number__c = 'test123';
        
        update oi;
        
        dsfs__DocuSign_Status__c status = new dsfs__DocuSign_Status__c();
        status.dsfs__Company__c = a.Id;
        status.dsfs__Contact__c = c.Id;
        status.Order__c = o.Id;
        
        Test.startTest();
        
        insert status;
        
        status.dsfs__Envelope_Status__c = 'Completed';
        
        update status;
        
        Test.stopTest();
    }
}