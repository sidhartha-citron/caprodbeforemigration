@isTest
public class TestWorkOrderRoomObjectTriggersPart1 {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id InvRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        
        String sysAdminProfileId = [SELECT Id FROM Profile WHERE Name ='System Administrator' LIMIT 1].Id;
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
   
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        TestDataFactory.crtBillToAcctContact(1, 0);
        Account a = TestDataFactory.accounts[0];
        
        Account testWareHouse = a.clone(false,true,false,false);
        testWareHouse.Name= 'TestWareHouse';
        testWareHouse.AccPac_Account__c= '2345';
        insert testWareHouse;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Customer_Service_Queue__c = testGroup.Id;
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Scanned_In_Status__c = 'Installed';
        fssetting.Work_Order_Line_Item_Completed_Status__c = 'Completed';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Scanned_Out_Status__c = 'Remove';
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Regular_Order_Record_Type_Id__c = devRecordTypeId;
        fssetting.Scan_Delimiter__c = '\\s+';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Work_Order_Room_Complete_Status__c = 'Completed';
        fssetting.Scanned_Out_Account_Record_ID__c = testWareHouse.Id;
        fssetting.Cannot_Complete_Status_Value__c = 'Cannot Complete';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.System_Administrator_Profile_Id__c = sysAdminProfileId;
        fssetting.Customer_Service_Profile_Id__c = sysAdminProfileId;
        fssetting.Service_Start__c = 0;
        fssetting.Invoice_Information_Case_RecordTypeId__c = InvRecordTypeId;
        
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
        insert fssetting;
        
        a.Name = 'TestAccount'; 
       // a.RecordTypeId = '012f10000015ITHAA2';
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
                    ExternalId__c = '2-20-03-30-1' + i,
                    Family= (i==0) ? 'Pest Control' : 'Hygiene'
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
        
        /*Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;*/
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newUser) {
            insert testQueue;
        }
        
        OrderItem oItem = orderItems.get(0);
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
        
        Asset testAsset = new Asset(
            Name='TestAsset',
            AccountId=o.AccountId, 
            Product2Id=products.get(0).Id, 
            Status=fssetting.Scanned_In_Status__c, 
            Survey_Location__c=location.Id, 
            Bar_Code__c='qwertyxxx007', 
            Site_Survey__c=location.Site_Survey__c
            
        );
        Asset testInventory = new Asset(
            Name='TestAsset',
            AccountId=testWareHouse.Id, 
            Product2Id=products.get(1).Id, 
            Status=fssetting.Scanned_Out_Status__c, 
            //Survey_Location__c=location.Id, 
            Bar_Code__c='zzz1234'
            
        );
        insert new List<Asset>{testAsset, testInventory} ;
        
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
            Country = 'Country', 
            Type__c='Service'
        );
        insert testWorkOrder;
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id,
            Product__c=pEntries.get(0).Product2Id, 
            Line_Item_Description__c='TestDescription', 
            //AssetId=testAsset.Id, 
            Type_of_Service__c='Service'
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
            Product__c = products.get(0).Id,
            Survey_Location__c=location.id
        );
        insert testLocation;
        
        /*Work_Order_Asset__c testWAsset = new Work_Order_Asset__c(
            Work_Order_Room__c=testLocation.Id, 
            Survey_Asset_Location__c=surveyAsset.Id,
            Product__c=surveyAsset.Product__c
        );
        insert testWAsset;
        
        testWorkOrderItem.Work_Order_Asset__c=testWAsset.Id;*/
        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem;
    }
    
    static testMethod void testScanInNoAsset(){
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        Account testWareHouse = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestWareHouse'];
        
        //Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        Asset testAsset = [SELECT Id, AccountId FROM Asset WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Location__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        //Work_Order_Asset__c testWAsset = [SELECT Id, Asset__c, Work_Order_Room__c FROM Work_Order_Asset__c WHERE Id=:testWorkOrderItem.Work_Order_Asset__c];
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c FROM Work_Order_Room__c WHERE Id=:testWorkOrderItem.Work_Order_Location__c];
        Survey_Location__c location = [SELECT Id, Site_Survey__c FROM Survey_Location__c WHERE Site_Survey__c=:a.Site_Survey__c LIMIT 1].get(0);
        
        test.startTest();
        
        oItem.Asset__c=testAsset.Id;
        update oItem;
        
        o.Status='Activated';
        update o;
        
        testLocation.Scanned_In__c = 'qwertyxxx007 zzz1234 12345';
        update testLocation;
        
		test.stopTest();        
    }
    
    static testMethod void testRoomCannotComplete(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        Work_Order_Room__c testLocation = [SELECT Id, Status__c, Work_Order__c FROM Work_Order_Room__c WHERE Work_Order__c=:testWorkOrder.Id];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        test.startTest();
        
        testLocation.Status__c = fssetting.Cannot_Complete_Status_Value__c;
        testLocation.Cannot_Complete_Reason__c = 'Closed';
        update testLocation;
        
        test.stopTest();
    }
    
    static testMethod void testScanInWithAsset(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        Account testWareHouse = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestWareHouse'];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        Asset testAsset = [SELECT Id, AccountId FROM Asset WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Location__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        //Work_Order_Asset__c testWAsset = [SELECT Id, Asset__c, Work_Order_Room__c FROM Work_Order_Asset__c WHERE Id=:testWorkOrderItem.Work_Order_Asset__c];
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c, Work_Order__c FROM Work_Order_Room__c WHERE Id=:testWorkOrderItem.Work_Order_Location__c];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
      	test.startTest();
        
        testLocation.Scanned_In__c = 'qwertyxxx007 zzz1234 12345';
        update testLocation;
        test.stopTest();
    }
    
    static testMethod void testScanOutWithAsset(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        Account testWareHouse = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestWareHouse'];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        Asset testAsset = [SELECT Id, AccountId FROM Asset WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Location__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        //Work_Order_Asset__c testWAsset = [SELECT Id, Asset__c, Work_Order_Room__c FROM Work_Order_Asset__c WHERE Id=:testWorkOrderItem.Work_Order_Asset__c];
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c FROM Work_Order_Room__c WHERE Id=:testWorkOrderItem.Work_Order_Location__c];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
      	test.startTest();
        
        testWorkOrder.Type__c='DeInstall';
        update testWorkOrder;
        
        testLocation.Scanned_Out__c = 'qwertyxxx007 zzz1234 12345';
        update testLocation;
        
        test.stopTest();
    }
    
    static testMethod void testPestLOB(){
        Account a = [SELECT Id, Site_Survey__c, Name, PEST_Auditable__c FROM Account WHERE Name='TestAccount'];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        Product2 testProduct = [SELECT Id, Family FROM Product2 WHERE Id=:oItem.PricebookEntry.Product2Id];
        
        Asset testAsset = [SELECT Id, AccountId FROM Asset WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId, Line_Of_Business__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c, Status__c, Location_Barcode__c FROM Work_Order_Room__c WHERE Work_Order__c=:testWorkOrder.Id LIMIT 1].get(0);
        //Work_Order_Asset__c testWAsset = [SELECT Id, Asset__c, Work_Order_Room__c FROM Work_Order_Asset__c WHERE Work_Order_Room__c=:testLocation.Id LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        test.startTest();
        a.PEST_Auditable__c=FALSE;
        update a;
      
        testWorkOrder.Line_Of_Business__c='Pest Control';
        update testWorkOrder;
        
        testLocation.Location_Barcode__c = 'test Bar Code Value';
        update testLocation;
        test.stopTest();
    }
    
    static testMethod void testProductWithNoScanFlag(){
        Account a = [SELECT Id, Site_Survey__c, Name, PEST_Auditable__c FROM Account WHERE Name='TestAccount'];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        Product2 testProduct = [SELECT Id, Family, Does_not_require_scanning__c FROM Product2 WHERE Id=:oItem.PricebookEntry.Product2Id];
        
        Asset testAsset = [SELECT Id, AccountId FROM Asset WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId, Line_Of_Business__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c, Status__c, Location_Barcode__c FROM Work_Order_Room__c WHERE Work_Order__c=:testWorkOrder.Id LIMIT 1].get(0);
        //Work_Order_Asset__c testWAsset = [SELECT Id, Asset__c, Work_Order_Room__c FROM Work_Order_Asset__c WHERE Work_Order_Room__c=:testLocation.Id LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        test.startTest();
        
        testProduct.Does_not_require_scanning__c=TRUE;
        update testProduct;
        
        testLocation.Status__c = 'Completed';
        update testLocation;
        testLocation.Generate_Work_Order_Line_Item__c = true;
        update testLocation;
        
        test.stopTest();
    }
}