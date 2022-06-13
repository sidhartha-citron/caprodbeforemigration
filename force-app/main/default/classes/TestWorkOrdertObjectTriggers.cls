@isTest
public class TestWorkOrdertObjectTriggers {
    
     @TestSetup static void setup() {
        Group multiResGroup = new Group(Name='Multi_Res_Queue', type='Queue');
        insert multiResGroup;
        
        QueueSObject mappingObject = new QueueSobject(QueueId = multiResGroup.Id, SObjectType = 'Case');
        
        System.runAs(new User(Id = UserInfo.getUserId())) {
        	insert mappingObject;
        }
         
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id qaRecordTypeId = Schema.SObjectType.WorkOrder.getRecordTypeInfosByName().get('QA Work Order').getRecordTypeId();
        Id repairCaseRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
         
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;

         System.runAs(new User(Id=UserInfo.getUserId())) {
             QueuesObject testQueue = new QueueSObject(QueueID = testGroup.Id, SObjectType = 'Case');
             insert testQueue;
         }
         
        WorkType testWorkType =  new WorkType(
          Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
         
         
         
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Customer_Service_Queue__c = testGroup.Id;
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Cannot_Complete_Status_Value__c = 'Cannot Complete';
        fssetting.QA_WorkOrder_RecordTypeId__c = qaRecordTypeId;
        fssetting.Repair_WorkOrder_Case_Record_Type__c = repairCaseRecordTypeId;
        fssetting.Hygiene_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Chemical_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Pest_Control_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Life_Safety_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Hygiene_Work_Type_Non_Detailed__c = testWorkType.Id;
        fssetting.Chemical_Work_Type_Non_Detailed__c = testWorkType.Id;
        fssetting.Pest_Control_Work_Type_Non_Detailed__c = testWorkType.Id;
        fssetting.Life_Safety_Work_Type_Non_Detailed__c = testWorkType.Id;
        fssetting.Hygiene_LOB__c = 'Hygiene';
        fssetting.Chemical_LOB__c = 'Chemical';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Life_Safety_LOB__c = 'Life Safety';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        fssetting.Service_Start__c = 0;
        fssetting.Type_Value_for_FollowUp_WorkOrder__c='Follow-Up';
        fssetting.Status_Value_for_Replace_of_a_Product__c='Replace';
        fssetting.Status_Value_for_Install_of_a_Product__c='Install';
        fssetting.Customer_Success_Queue__c = testGroup.Id;
        fssetting.Ticket_Emergency_Record_Type__c = '012f1000000PUJCAA4';
        fssetting.Pest_Special_Label__c = 'Pest Special';
        fssetting.Ticket_PO_Not_Returned_Subject__c = 'test subject';
        fssetting.Ticket_Priority_High__c = 'High';
        fssetting.Internal_Data_Review_Case_Record_Type_ID__c = '012f1000000PUJFAA4';
        fssetting.Invoice_Information_Case_RecordTypeId__c = '012f1000000PUJKAA4';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Label_for_Replace_Work_Order_Type__c = 'Replace';
        fssetting.Label_for_Service_Work_Order_Type__c = 'Service';
        fssetting.Label_for_Install_Work_Order_Type__c = 'Installation';
        fssetting.Customer_Service_Queue__c =  testGroup.Id;
        fssetting.Billing_Queue__c =  testGroup.Id;

        fssetting.Multi_Res_Queue_Id__c = testGroup.Id;
        insert fssetting;
        
        Work_Order_Cannot_Complete_LoBs__c cannotCompleteLoBs = new Work_Order_Cannot_Complete_LoBs__c();
        cannotCompleteLoBs.IsActive__c = true;
        cannotCompleteLoBs.Name = 'Pest Control';
        
        insert cannotCompleteLoBs;
         
        TestDataFactory.crtBillToAcctContact(1, 1);
        Account a = TestDataFactory.accounts[0];
         
        a.OperatingHoursId = TestDataFactory.opthours[1].Id; 
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        update a;
        
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
                    Item_Type__c = 'Consumables',
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    Clean_Out_Type__c='Ants', 
                    Warranty_Period__c=10,
                    ExternalId__c = '2-20-03-30-1' + i
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
         
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId
        ); 
        insert o;
         
        for(Integer i=0; i<1; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE
                )
            );
        } 
        
        insert orderItems;
        
        for(Integer i=0; i<1; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o.Id,  
                    Originating_Record_ID__c=orderItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o.Site_Survey__c, 
                    Service_Frequency__c=orderItems.get(i).Frequency__c, 
                    Survey_Location__c = location.Id
                )
            );
        } 
        insert surveyAssetLocations;
        
        for(Integer i=0; i<1; i++) {
            orderItems.get(i).HasSurveyAssets__c=true;
            orderItemLocations.add(
                new Order_Item_Location__c(
                    Order__c=o.Id,  
                    Order_Product__c=orderItems.get(i).Id, 
                    Survey_Asset_Location__c=surveyAssetLocations.get(i).Id
                )
            );
        }
        
        insert orderItemLocations;
         
        User newCommUser = new User(
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
            Employee_Number__c = 'ABCD123TEST123'
        );
        insert newCommUser;

        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newCommUser) {
            insert testQueue;
        }
         
        WorkOrder testWorkOrder = new WorkOrder(
          AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(),
            EndDate=System.today().addDays(3),
            Status='New',
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            ServiceTerritoryId=TestDataFactory.srvTers[1].Id, 
            Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31)
        );
        insert testWorkOrder;
         
        OrderItem oItem = orderItems.get(0);
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
          WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            Quantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            Product__c=products.get(0).Id, 
            Line_Item_Description__c='TestDescription'
        );
        insert testWorkOrderItem;
                
        WorkOrderLineItem testWorkOrderItem2 = new WorkOrderLineItem(
          WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Delivery', 
            Quantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            Product__c=products.get(0).Id, 
            Line_Item_Description__c='TestDescription'
        );
        insert testWorkOrderItem2;
                
        WorkOrderLineItem testWorkOrderItem3 = new WorkOrderLineItem(
          WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Install', 
            Quantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            Product__c=products.get(0).Id, 
            Line_Item_Description__c='TestDescription'
        );
        insert testWorkOrderItem3;
         
        Work_Order_Room__c testLocation = new Work_Order_Room__c(
          Site_Survey__c=o.Site_Survey__c, 
            Building__c = location.Building__c,
            Floor__c = location.Floor__c, 
            Location_Type__c=location.Location_Type__c, 
            Location_SubType__c=location.Location_SubType__c,
            Name=location.Name, 
            Work_Order__c=testWorkOrder.Id, 
            Survey_Location__c=location.id
        );
        insert testLocation;
        
        User newUser = new User(
            Alias = 'testA', 
            Email = 'testUser1@UserTechnicianForTest.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TestFirstName',
            LastName = 'TestLastName', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testUser1@UserTechnicianForTest.com', 
            Employee_Number__c = 'ABCD123TEST'
        );
        insert newUser;
        
        ServiceResource testResource = new ServiceResource(
          Name='TestResource', 
            RelatedRecordId=newUser.Id,
            ResourceType='T', 
            isActive=TRUE
        );
        insert testResource;
        
        //testWorkOrderItem.Work_Order_Asset__c=testAsset.Id;
        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem;
         
         ServiceTerritoryMember stm = new ServiceTerritoryMember(
          OperatingHoursId=TestDataFactory.opthours[2].Id, 
            ServiceResourceId=testResource.Id, 
            ServiceTerritoryId=TestDataFactory.srvTers[1].Id, 
            EffectiveStartDate=System.today().addDays(-10),
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            TerritoryType='P'
        );
        
        insert stm;
        update testResource;
    }
    
    static testMethod void testInsertUpdate() {
    	Test.startTest();
        List<WorkOrder> workOrders = new List<WorkOrder>();
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        workOrders.add(new WorkOrder(
          AccountId=a.Id, 
            StartDate=System.today(), 
            Line_of_Business__c=fssetting.Chemical_LOB__c, 
            Status='New'
        ));
        workOrders.add(new WorkOrder(
          AccountId=a.Id, 
            StartDate=System.today(), 
            Line_of_Business__c=fssetting.Pest_LOB__c, 
            Status='New'
        ));
        workOrders.add(new WorkOrder(
          AccountId=a.Id, 
            StartDate=System.today(), 
            Line_of_Business__c=fssetting.Life_Safety_LOB__c,
            Status='New'
        ));
        
 
        
        insert workOrders;
        
        Test.stopTest();
    }
    
    static testMethod void testInsertUpdateWithOrder() {
        Test.startTest();
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id 
                   FROM Order LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = new WorkOrder(
          AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today()
        );

        insert testWorkOrder;
        
        Test.stopTest();
    }
    
    static testMethod void testUpdateForLocationError() {
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        WorkOrder testWorkOrder = new WorkOrder(
          AccountId=a.Id,
            StartDate=System.today()
        );
        insert testWorkOrder;
        
        testWorkOrder.New_Location__c = TRUE;
        
       
        
        try {
            update testWorkOrder;
        } catch (Exception e) {
          System.assert(e.getMessage().contains('value'), 'message=' + e.getMessage());
        }
        
        Test.stopTest();
    }
    
    static testMethod void testUpdateForLocation() {
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        WorkOrder testWorkOrder = new WorkOrder(
          AccountId=a.Id,
            StartDate=System.today(), 
            Site_Survey__c=a.Site_Survey__c
        );
        insert testWorkOrder;
        
        testWorkOrder.Location_Name__c = 'Location';
        testWorkOrder.Location_Type__c = 'Washroom';
        testWorkOrder.Location_SubType__c = 'Unisex';
        testWorkOrder.Floor__c = 'Floor';
        testWorkOrder.Building__c = 'Building';
        testWorkOrder.Location_Notes__c = 'Notes';
        testWorkOrder.New_Location__c = TRUE;
        System.debug('Test Work Order: ' + testWorkOrder);

        update testWorkOrder;
        
        Test.stopTest();
    }
    
    static testMethod void testUpdateRepair() {
        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        //Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id 
                   FROM Order LIMIT 1].get(0);
        
        o.Status = 'Activated';
        
        update o;
		        
        PricebookEntry pEntry = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:o.Pricebook2Id LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Test.startTest();
        WorkOrder testWorkOrder = new WorkOrder(
          AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=o.Pricebook2Id
        );
        insert testWorkOrder;
        
        ProductConsumed testProdConsumed = new ProductConsumed(
            PricebookEntryId=pEntry.Id, 
            QuantityConsumed=1,
            WorkOrderId=testWorkOrder.Id
        );
        insert testProdConsumed;
		Test.stopTest();

        testWorkOrder.Status = fssetting.Work_Order_Completion_Status__c;
        testWorkOrder.Repair_Completed__c = TRUE;
        //update testWorkOrder;
    }
    
    static testMethod void testUpdateCannotComplete() {
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, Cannot_Complete_Reason__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        testWorkOrder.Status = fssetting.Cannot_Complete_Status_Value__c;
        testWorkOrder.Cannot_Complete_Reason__c = 'Closed';

        update testWorkOrder;
        
        Test.stopTest();
    }
    
    static testMethod void testUpdateCompleteWarranty() {
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, Cannot_Complete_Reason__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        testWorkOrder.Status = fssetting.Work_Order_Completion_Status__c;
        
        update testWorkOrder;
        
        Test.stopTest();
    }
    
    static testMethod void testCompleteQA() {
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, RecordTypeId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        User newUser = [SELECT Id, UserName FROM User WHERE UserName='testUser1@UserTechnicianForTest.com'];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        WorkOrder testQAWorkOrder = new WorkOrder(
          	AccountId=a.Id,
            StartDate=System.today(), 
            ParentWorkOrderId=testWorkOrder.Id, 
            RecordTypeId=fssetting.QA_WorkOrder_RecordTypeId__c
        );
        insert testQAWorkOrder;
        
        testQAWorkOrder.Status = fssetting.Work_Order_Completion_Status__c;

        System.runAs(newUser) {
            update testQAWorkOrder;
        }
        
        Test.stopTest();
    }
    
    static testMethod void testCompleteDeliveryRecurring() {
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Status FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem woli = [SELECT Id, Type_of_Service__c, Order_Product__c, Order_Product__r.Frequency__c FROM WorkOrderLineItem WHERE WorkOrderId = :testWorkOrder.Id LIMIT 1];
        
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        //data manipulation
        update new OrderItem(Id = woli.Order_Product__c, Frequency__c = 'Monthly');
        update new WorkOrderLineItem(Id = woli.Id, Type_of_Service__c = fssetting.Label_for_Delivery_Work_Type__c);
        
        System.debug(woli);
        
        testWorkOrder.Status = 'Completed';

        update testWorkOrder;
        
        Test.stopTest();
    }
    
    static testMethod void testUpdateComplete() {
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, Cannot_Complete_Reason__c, Type__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        testWorkOrder.Type__c = 'Installation';
        testWorkOrder.Status = fssetting.Work_Order_Completion_Status__c;
        //testWorkOrder.Status = 'Installation';

        update testWorkOrder;
        
        Test.stopTest();
    }

    static testMethod void testUpdateDeinstallComplete() {
        Test.startTest();

        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        User newUser = [SELECT Id, UserName FROM User WHERE UserName='testUser1@UserTechnicianForTest.com'];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, Cannot_Complete_Reason__c, Type__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem woli = [SELECT Id, CreatedDate, Type_of_Service__c, Order_Product__c, Order_Product__r.Frequency__c, Order_Product__r.Last_Order_Active_Date__c FROM WorkOrderLineItem WHERE WorkOrderId = :testWorkOrder.Id LIMIT 1];

        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();

        String drDate = '';
        drDate = String.valueOfGmt(woli.Order_Product__r.Last_Order_Active_Date__c);

        update new OrderItem(Id = woli.Order_Product__c, Frequency__c = 'Monthly', Need_Ticket__c = 'CLEARDT|' + drDate + '\n' + 'DE-ACTIVE|' + drDate + '\n');
        update new WorkOrderLineItem(Id = woli.Id, Status = fssetting.Work_Order_Completion_Status__c);

        testWorkOrder.Type__c = 'DeInstall';
        testWorkOrder.Status = fssetting.Work_Order_Completion_Status__c;

        update testWorkOrder;

        Test.stopTest();
    }
    
    @isTest
    static void testCompletingPestControlEmergencyWorkOrder() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new CongaHttpCalloutMock()); 
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        WorkOrder testWorkOrder = [SELECT Id, Status, Type__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1];
        WorkOrderLineItem testLineItem = [SELECT Id, Order_Product__c FROM WorkOrderLineItem WHERE WorkOrderId = :testWorkOrder.Id LIMIT 1];
        OrderItem oi = [SELECT Id, Is_Replacement_From_Flow__c FROM OrderItem WHERE Id = :testLineItem.Order_Product__c LIMIT 1];
        
        oi.Is_Replacement_from_Flow__c = true;
        
        testWorkOrder.Line_of_Business__c = 'Pest Control';
        testWorkOrder.Emergency__c = true;
        testWorkOrder.Type__c = 'Service';
        testWorkOrder.Status = 'Completed';
        
        testWorkOrder.Status = fssetting.Work_Order_Completion_Status__c;
        
        
        update oi;
        update testWorkOrder;
        
        Test.stopTest();
    }
    
    @isTest
    static void testCreatingNoPOCase() {
        Test.startTest();
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        Account a = [SELECT Id, PO_Required_for_Orders__c FROM Account Limit 1];
        Order o = [SELECT Id, PoNumber FROM Order WHERE AccountId = :a.Id];
        
        o.PoNumber = null;
        
        update o;
        
        WorkOrder testWorkOrder = [SELECT Id, Type__c, Emergency__c, Line_of_Business__c, Create_PO_Number_Case__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1];
        
        testWorkOrder.Line_of_Business__c = 'Pest Control';
        testWorkOrder.Emergency__c = true;
        testWorkOrder.Type__c = 'Service';
        testWorkOrder.Create_PO_Number_Case__c = true;
 
        update testWorkOrder;
        
        Test.stopTest();
    }
    
    public class CongaHttpCalloutMock implements HttpCalloutMock {
        // Implement this interface method
        public HTTPResponse respond(HTTPRequest request) {
            // Create a fake response
            HttpResponse response = new HttpResponse();
            response.setStatusCode(200);
            return response; 
        }
    }
}