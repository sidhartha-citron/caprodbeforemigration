@isTest
public class TestSpawnWorkOrdersController {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
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
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c(Service_Start__c = 4);
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Scanned_In_Status__c = 'Installed';
        fssetting.Work_Order_Line_Item_Completed_Status__c = 'Completed';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Scanned_Out_Status__c = 'Remove';
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Work_Orders_In_Advance__c = 20;
        fssetting.Hygiene_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Chemical_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Pest_Control_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Service_Start__c = 3;
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Hygiene_LOB__c = 'Hygiene';
        fssetting.Chemical_LOB__c = 'Chemical';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Life_Safety_LOB__c = 'Life Safety';
        insert fssetting;
        
        OperatingHours oh = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHoursTerritory', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        
        insert new List<OperatingHours>{oh, territoryHours};
            
            TimeSlot testSlot = new TimeSlot(
                DayOfWeek='Monday', 
                StartTime = Time.newInstance(07, 00, 00, 00), 
                EndTime = Time.newInstance(17, 00, 00, 00),
                OperatingHoursId = oh.Id
            );
        
        insert testSlot;
        
        ServiceTerritory st1 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios1'
            
        );
        
        insert st1;
        
        ServiceTerritory st = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios',
            ParentTerritoryId = st1.Id
            
        );

        
        insert st;
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
            Inactive__c=FALSE,
            Type='Customer', 
            Phone='123456789',
            OperatingHoursId = oh.Id,
            Service_Territory__c = st.Id,
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
		*/
        TestDataFactory.crtBillToAcctContact(1, 0); 
        Account a = TestDataFactory.accounts[0];
        
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
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==0) ? 'Hygiene' : 'Pest Control', 
                    Item_Type__c= 'Service' , 
                    Installation_Work_Type__c=testWorkType.Id, 
                    Service_Work_Type__c=testWorkType.Id, 
                    Delivery_Work_Type__c=testWorkType.Id,
                    ExternalId__c = '3-55-7-02-1' + i
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
            Inventory_Allocated__c=TRUE, 
            Emergency__c=TRUE
        );
        
        insert o;
        
        Asset testAsset = new Asset(
            Name='TestAsset',
            AccountId=o.AccountId, 
            Product2Id=products.get(0).Id, 
            Status='Installed', 
            Site_Survey__c=ss.Id,
            Survey_Location__c=location.Id
            
        );
        
        insert testAsset;
        
        for(Integer i=0; i<1; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Installation_Price__c=1.0,
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE, 
                    Asset__c=testAsset.Id, 
                    Installation_Status__c='Install'
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
    }
    
    static testMethod void testEmergency() {
        WorkType testWorkType = [SELECT Id, Name FROM WorkType WHERE Name='TestWorkType'];
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            
            Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId, isValid__c, Account.isValid__c
                       //FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
                       FROM Order LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Test.startTest();
        
        Frequency__c setting =  new Frequency__c(Name=frequencies.get(0));
        setting.Hygiene_Minus_Days__c = 5;
        setting.Hygiene_Plus_Days__c = 5;
        setting.Occurrences_In_Year__c = 1;
        setting.Discount_Percent__c = 0.0;
        setting.Pest_Minus_Days__c = 1;
        setting.Pest_Plus_Days__c = 1;
        insert setting;
        
        SpawnWorkOrdersController.createWorkOrder(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testException1() {
        Test.startTest();
        
        SpawnWorkOrdersController.createWorkOrder('');
        
        Test.stopTest();
    }
    
    static testMethod void testException2() {
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId, isValid__c, Account.isValid__c, Emergency__c
                  // FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
                  FROM Order LIMIT 1].get(0);
        
        Test.startTest();
        
        o.Emergency__c=FALSE;
        update o;
        
        SpawnWorkOrdersController.createWorkOrder(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testException3() {
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId, isValid__c, Account.isValid__c, Emergency__c
                   //FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
                   FROM Order LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        Test.startTest();
        
        SpawnWorkOrdersController.createWorkOrder(oItem.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testException4() {
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId, isValid__c, Account.isValid__c, Emergency__c
                   //FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
                   FROM Order LIMIT 1].get(0);
        
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        Order_Item_Location__c oItemLocation =  [SELECT Id, Order_Product__c, Survey_Asset_Location__c FROM Order_Item_Location__c WHERE Order_Product__c=:oItem.Id LIMIT 1];
        Survey_Asset_Location__c surveyAssetLocation =  [SELECT Id, Survey_Location__c FROM Survey_Asset_Location__c WHERE Id=:oItemLocation.Survey_Asset_Location__c LIMIT 1];
        
        Test.startTest();
        
        surveyAssetLocation.Survey_Location__c=null;
        update surveyAssetLocation;
        SpawnWorkOrdersController.createWorkOrder(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testException5() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId, isValid__c, Account.isValid__c, Emergency__c
                   //FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
                   FROM Order LIMIT 1].get(0);
        
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        Product2 testProduct = [SELECT Id, Item_Type__c FROM Product2 WHERE Id=:oItem.PricebookEntry.Product2Id];
        
        Test.startTest();
        
        testProduct.Item_Type__c='Consumables';
        update testProduct;
        
        SpawnWorkOrdersController.createWorkOrder(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testException6() {
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId, isValid__c, Account.isValid__c, Emergency__c
                  // FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
                  FROM Order LIMIT 1].get(0);
        delete [SELECT Id, OrderId  FROM OrderItem WHERE OrderId=:o.Id ];
        
        Test.startTest();
        
        SpawnWorkOrdersController.createWorkOrder(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testCompareWorkOrderToAppointments() {
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId, isValid__c, Account.isValid__c
                   //FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
                   FROM Order LIMIT 1].get(0);
        
        Test.startTest();
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=o.AccountId,
            Order__c=o.Id,
            StartDate=System.today().addDays(1), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=o.Pricebook2Id, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            Duration = 20, 
            DurationType = 'Minutes'
        );
        insert testWorkOrder;
        
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=testWorkOrder.Id, 
            DueDate=System.today().addDays(10), 
            EarliestStartTime=System.today().addDays(9), 
            Status='New', 
            ServiceTerritoryId=testWorkOrder.ServiceTerritoryId, 
            Duration = 10, 
            DurationType = 'Minutes'
        );
        insert testSA;
        
        SpawnWorkOrdersController.compareWorkOrderToAppointments(testWorkOrder.Id);
        
        Test.stopTest();
    }
}