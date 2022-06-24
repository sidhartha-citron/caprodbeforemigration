@IsTest
public class TestWorkOrderRoomObjectTriggersPart2 {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        OperatingHours oh = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{territoryHours, oh};
            
            ServiceTerritory st1 = new ServiceTerritory(
                IsActive=true,
                Street='Street', 
                City = 'City', 
                State = 'State', 
                PostalCode = 'PostalCode',
                Country = 'Country', 
                OperatingHoursId=territoryHours.Id, 
                Name='TerritoryForCaseTestScenarios'
                
            );
        insert st1;
        ServiceTerritory st = new ServiceTerritory(
            IsActive=true,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios2',
            ParentTerritoryId = st1.Id
            
        );
        insert st;
        
        TestDataFactory.crtBillToAcctContact(1,1);
		Account a = TestDataFactory.accounts[0]; 
        a.name = 'TestAccount'; 
        update a; 
		Contact c = TestDataFactory.contacts[0]; 
        c.Email = 'test@example.com';
        update c;
        
        Account testWareHouse = a.clone(false,true,false,false);
        testWareHouse.Name= 'TestWareHouse';
        testWareHouse.AccPac_Account__c= '2345';
        insert testWareHouse;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        //fssetting.Customer_Service_Queue__c = testGroup.Id;
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
        fssetting.Enable_Automatic_WO_Completed_Status__c = true;
        fssetting.Label_for_Install_Work_Order_Type__c = 'Install';
        fssetting.Label_for_Replace_Work_Order_Type__c = 'Replace';
        fssetting.Label_for_Service_Work_Order_Type__c = 'Service';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Working_Hour_End_Time__c = '4:00';
        fssetting.CitronDoNotReply__c = 'test@example.com';
        fssetting.Label_for_Delivery_Work_Type__c = 'Delivery';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        insert fssetting;
        
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
                    IsActive=true,
                    Available_As_Related_Product__c=true,
                    ExternalID__c = '2-20-03-30-1' + i,
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
                    IsActive=true
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
                    HasSurveyAssets__c=true
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
        
        OrderItem oItem = orderItems.get(0);

        Asset testAsset = new Asset(
            Name='TestAsset',
            AccountId=o.AccountId, 
            Product2Id=products.get(0).Id, 
            Status=fssetting.Scanned_In_Status__c, 
            Survey_Location__c=location.Id, 
            Bar_Code__c='asset1',
            Site_Survey__c = ss.Id
        );
        Asset testInventory = new Asset(
            Name='TestAsset',
            AccountId=testWareHouse.Id, 
            Product2Id=products.get(1).Id, 
            Status=fssetting.Scanned_Out_Status__c, 
            Bar_Code__c='asset2'
            
        );
        
        insert new List<Asset>{testAsset, testInventory};
            
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
            Quantity=1,
            PricebookEntryId=pEntries.get(0).Id,
            Product__c=pEntries.get(0).Product2Id, 
            Line_Item_Description__c='TestDescription',
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
            Survey_Location__c=location.Id
        );
        insert testLocation;

        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem;
    }

    static testMethod void testScanInstallWithAsset(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];

        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Location__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c FROM Work_Order_Room__c WHERE Id=:testWorkOrderItem.Work_Order_Location__c];

        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=testWorkOrder.Id,
            DueDate=System.today().addDays(10),
            EarliestStartTime=System.today().addDays(9),
            Status='In Progress',
            SchedStartTime = Datetime.now(),
            SchedEndTime = Datetime.now().addDays(1)
        );
        insert testSA;

        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock(testSA.Id));
        
        Test.startTest();
        testWorkOrder.Line_of_Business__c='Hygiene';
        update testWorkOrder;

        testWorkOrderItem.Type_of_Service__c='Install';
        testWorkOrderItem.Status = 'New';
        update testWorkOrderItem;
        testLocation.Location_Barcode__c = null;
        testLocation.Status__c = 'In Progress';
        update testLocation;
        testLocation.Scanned_In__c = 'asset1';
        update testLocation;

        Test.stopTest();

    }

    static testMethod void testScanServiceWithAsset(){
		Test.startTest();        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];

        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Location__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c FROM Work_Order_Room__c WHERE Id=:testWorkOrderItem.Work_Order_Location__c];
        Asset scannedAsset = [SELECT Id FROM Asset WHERE Bar_Code__c = 'asset1'];

        ServiceAppointment testSA = new ServiceAppointment(
                ParentRecordId=testWorkOrder.Id,
                DueDate=System.today().addDays(10),
                EarliestStartTime=System.today().addDays(9),
                Status='In Progress',
                SchedStartTime = Datetime.now(),
                SchedEndTime = Datetime.now().addDays(1)
        );
        insert testSA;

        
        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock(testSA.Id));
		
        
        testWorkOrder.Line_of_Business__c='Hygiene';
        update testWorkOrder;

        testWorkOrderItem.Type_of_Service__c='Service';
        testWorkOrderItem.Asset = scannedAsset;
        testWorkOrderItem.Status = 'New';
        update testWorkOrderItem;
        testLocation.Scanned_In__c = 'asset2 fdsoids8';
        update testLocation;
        Test.stopTest();
    }

    static testMethod void testScanReplaceWithAsset(){
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];

        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Location__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c FROM Work_Order_Room__c WHERE Id=:testWorkOrderItem.Work_Order_Location__c];
        Asset scannedAsset = [SELECT Id FROM Asset WHERE Bar_Code__c = 'asset1'];

        ServiceAppointment testSA = new ServiceAppointment(
                ParentRecordId=testWorkOrder.Id,
                DueDate=System.today().addDays(10),
                EarliestStartTime=System.today().addDays(9),
                Status='In Progress',
                SchedStartTime = Datetime.now(),
                SchedEndTime = Datetime.now().addDays(1)
        );
        insert testSA;

        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock(testSA.Id));

        testWorkOrder.Line_of_Business__c='Hygiene';
        update testWorkOrder;

        testWorkOrderItem.Type_of_Service__c='Replace';
        testWorkOrderItem.Asset = scannedAsset;
        testWorkOrderItem.Status = 'New';
        update testWorkOrderItem;
        testLocation.Scanned_In__c = 'asset1 asset2';
        update testLocation;

        Test.stopTest();

    }

    static testMethod void testScanOutWithAsset(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];

        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Location__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c FROM Work_Order_Room__c WHERE Id=:testWorkOrderItem.Work_Order_Location__c];
        Asset scannedAsset = [SELECT Id FROM Asset WHERE Bar_Code__c = 'asset1'];


        Test.startTest();
        testWorkOrder.Line_of_Business__c='Hygiene';
        update testWorkOrder;

        testWorkOrderItem.Type_of_Service__c='DeInstall';
        testWorkOrderItem.Asset = scannedAsset;
        testWorkOrderItem.Status = 'In Progress';
        update testWorkOrderItem;

        testLocation.Location_Barcode__c = null;
        testLocation.Status__c = 'In Progress';
        update testLocation;

        testLocation.Scanned_Out__c = 'asset1 asset2 12345';
        update testLocation;
        Test.stopTest();
    }
    
    static testMethod void testPestLOB(){
        Account a = [SELECT Id, Site_Survey__c, Name, PEST_Auditable__c FROM Account WHERE Name='TestAccount'];
        
        WorkOrder testWorkOrder = [SELECT Id, Type__c, Status, AccountId, Line_of_Business__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        Work_Order_Room__c testLocation = [SELECT Id, Scanned_In__c, Scanned_Out__c, Status__c, Location_Barcode__c FROM Work_Order_Room__c WHERE Work_Order__c=:testWorkOrder.Id LIMIT 1].get(0);

        Test.startTest();
        a.PEST_Auditable__c=false;
        update a;
        
        testWorkOrder.Line_of_Business__c='Pest Control';
        update testWorkOrder;

        testLocation.Location_Barcode__c = 'test Bar Code Value';
        update testLocation;
        Test.stopTest();
    }

    public class ExampleCalloutMock implements HttpCalloutMock{
        private Id saId;

        public ExampleCalloutMock(Id saId) {
            this.saId = saId;
        }

        public HttpResponse respond(HTTPRequest req){
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json;charset=UTF-8');
            res.setBody('{"example":"test", "contentVersionId":"' + saId + '","entityId":"' + saId + '"}');
            res.setStatusCode(200);
            return res;
        }
    }
}