@isTest
public class TestWorkOrderItemObjectTriggers {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        TestDataFactory.crtCPQSettings();
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Customer_Service_Queue__c = testGroup.Id;
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Scanned_In_Status__c = 'Installed';
        fssetting.Work_Order_Line_Item_Completed_Status__c = 'Completed';
        fssetting.Cannot_Complete_Status_Value__c = 'Cannot Complete';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Scanned_Out_Status__c = 'Remove';
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Regular_Order_Record_Type_Id__c = devRecordTypeId;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Service_Start__c = 0;
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Item_Type_for_Consumables__c = 'Consumables';
        insert fssetting;
        
        TestDataFactory.crtBillToAcctContact(1,1);
		Account a = TestDataFactory.accounts[0]; 
        a.name = 'TestAccount'; 
        update a;
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        Test.startTest();
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
                    Item_Type__c = 'Consumables',
                    ExternalId__c = '2-20-03-30-1' + i,
                    Family= (i==0) ? 'Hygiene' : i == 1 ? 'Pest Control' : 'Hygiene'
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
            RecordTypeId=devRecordTypeId,
            Line_of_Businesses__c='Hygiene'
        ); 
        insert o;
        
        for(Integer i=0; i<1; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Purchase_Price__c=1.0,
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
        
        testDataFactory.crtTestUsers(1); 
        User newUser = TestDataFactory.lUsers[0]; 
        
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newUser) {insert testQueue;}
        
        OrderItem oItem = orderItems.get(0);
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=o.Pricebook2Id, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country'
        );
        insert testWorkOrder;
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id 
        );
        
        insert testWorkOrderItem;

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
        
        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem;
        
        Test.stopTest();
    }
    
    static testMethod void testInsertUpdate(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        //Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id 
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        Survey_Asset_Location__c surveyAsset = [SELECT Id, Survey_Location__c, Site_Survey__c, Originating_Record_ID__c, Product__c 
                                                FROM Survey_Asset_Location__c WHERE Originating_Record_ID__c=:oItem.Id LIMIT 1].get(0);
        Order_Item_Location__c orderItemLocation = [SELECT Id, Survey_Asset_Location__c, Order_Product__c 
                                                    FROM Order_Item_Location__c WHERE Order_Product__c=:oItem.Id LIMIT 1].get(0);
        Survey_Location__c location = [SELECT Id, Name, Building__c, Floor__c, Location_Type__c, Location_SubType__c, Site_Survey__c 
                                       FROM Survey_Location__c WHERE Site_Survey__c=:o.Site_Survey__c LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        test.startTest();
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
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=oItem.PricebookEntryId,
            Work_Order_Location__c = testLocation.Id
        );
        
        insert testWorkOrderItem;
        

        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        testWorkOrderItem.Status = 'Completed';
        update testWorkOrderItem;
        test.stopTest();
        testWorkOrderItem.Status = 'New';
        update testWorkOrderItem;
    }
    
    static testMethod void testDelete(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        //Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Customer_Service_Queue__c = testGroup.Id;
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        insert fssetting;*/
        
        delete testWorkOrderItem;
    }
    
    static testMethod void testNewAsset(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        //Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
       
        testWorkOrderItem.New_Asset_Bar_Code__c='zxyqwerty';
        test.startTest();
        update testWorkOrderItem;
        test.stopTest();
        
    }
    
    static testMethod void testDeleteOrderItem(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        //Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Installation_Status__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Type_of_Service__c, AssetId FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        //Work_Order_Asset__c testWAsset = [SELECT Id, Asset__c FROM Work_Order_Asset__c WHERE Id=:testWorkOrderItem.Work_Order_Asset__c];
        Survey_Location__c location = [SELECT Id, Site_Survey__c FROM Survey_Location__c WHERE Site_Survey__c=:a.Site_Survey__c LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Asset testAsset = new Asset(
            Name='TestAsset',
            AccountId=o.AccountId, 
            Product2Id=oItem.PricebookEntry.Product2Id, 
            Status=fssetting.Scanned_In_Status__c, 
            Site_Survey__c=a.Site_Survey__c,
            Survey_Location__c=location.Id
            
        );
        insert testAsset;
        
        oItem.Asset__c=testAsset.Id;
        update oItem;
        
        testAsset.Status=fssetting.Scanned_Out_Status__c;
        update testAsset;
        
        testWorkOrderItem.AssetId=testAsset.Id;
        testWorkOrderItem.Type_of_Service__c=fssetting.DeInstall_Work_Order_Type__c;
        testWorkOrderItem.Status='Completed';
        test.startTest();
        update testWorkOrderItem;
        test.stopTest();
    }
}