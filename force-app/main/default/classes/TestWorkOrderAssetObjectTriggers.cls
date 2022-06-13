@isTest
public class TestWorkOrderAssetObjectTriggers {
    
    @TestSetup static void setup() {
        /*List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
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
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Service_Start__c = 0;
        insert fssetting;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
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
                    Family= (i==1) ? 'Pest Control' : 'Hygiene'
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
        insert testGroup;
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newUser) {
            insert testQueue;
        }
        
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
            //Product__c=oItem.PricebookEntry.Product2Id, 
            //Line_Item_Description__c='TestDescription'
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
        
        Work_Order_Asset__c testAsset = new Work_Order_Asset__c(
            Work_Order_Room__c=testLocation.Id, 
            Survey_Asset_Location__c=surveyAsset.Id,
            Product__c=surveyAsset.Product__c
        );
        insert testAsset;
        
        testWorkOrderItem.Work_Order_Asset__c=testAsset.Id;
        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem;*/
        
    }
    
    static testMethod void testNoAsset(){
        /*Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        //Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Asset__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        Work_Order_Asset__c testWAsset = [SELECT Id, Asset__c FROM Work_Order_Asset__c WHERE Id=:testWorkOrderItem.Work_Order_Asset__c];
        Survey_Location__c location = [SELECT Id, Site_Survey__c FROM Survey_Location__c WHERE Site_Survey__c=:a.Site_Survey__c LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Asset testAsset = new Asset(
            Name='TestAsset',
            AccountId=o.AccountId, 
            Product2Id=oItem.PricebookEntry.Product2Id, 
            Status=fssetting.Scanned_In_Status__c, 
            Site_Survey__c = location.Site_Survey__c,
            Survey_Location__c=location.Id
            
        );
        insert testAsset;
        
        oItem.Asset__c=testAsset.Id;
        update oItem;
        
        o.Status='Activated';
        update o;
        
        testWAsset.Asset__c=testAsset.Id;
        update testWAsset;*/
    }
    
    static testMethod void testSameAsset(){
        /*Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        //Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, New_Asset_Bar_Code__c, Work_Order_Asset__c, AssetId FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        Work_Order_Asset__c testWAsset = [SELECT Id, Asset__c FROM Work_Order_Asset__c WHERE Id=:testWorkOrderItem.Work_Order_Asset__c];
        Survey_Location__c location = [SELECT Id, Site_Survey__c FROM Survey_Location__c WHERE Site_Survey__c=:a.Site_Survey__c LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Asset testAsset = new Asset(
            Name='TestAsset',
            AccountId=o.AccountId, 
            Product2Id=oItem.PricebookEntry.Product2Id, 
            Status=fssetting.Scanned_In_Status__c, 
            Site_Survey__c = location.Site_Survey__c,
            Survey_Location__c=location.Id
            
        );
        insert testAsset;
        
        oItem.Asset__c=testAsset.Id;
        update oItem;
        
        o.Status='Activated';
        update o;
        
        testWAsset.Asset__c=testAsset.Id;
        update testWAsset;*/
    }
}