@isTest
public class TestOrderItemLocationObjectTriggers {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        Id InvRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id regularOrderRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        QueueSobject testQueue = new QueueSObject(QueueId = testGroup.Id, SobjectType = 'Case');
        System.runAs(new User(Id = UserInfo.getUserId())) {   
            insert testQueue;
        }
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Regular_Order_Record_Type_Id__c = regularOrderRecordTypeId;
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
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
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
		TestDataFactory.crtCPQSettings();        
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
             
        TestDataFactory.crtBillToAcctContact(1,1); 
        Account a = TestDataFactory.accounts[0]; 
        a.name = 'TestAccount';
        a.OperatingHoursId = oh.Id;
        a.Service_Territory__c = st.Id;
        update a;
        
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
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId
        ); 
        insert o;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE,
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
        
        for(Integer i=0; i<3; i++) {
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
        
        orderItems.add(
            new OrderItem(
                Product2Id=pEntries.get(2).Id,  
                Frequency__c=frequencies.get(0), 
                UnitPrice=1.0, 
                Purchase_Price__c=1.0, 
                Quantity=1, 
                OrderId=o.Id
            )
        );
        
        insert orderItems;
        
        for(Integer i=0; i<3; i++) {
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
        
        for(Integer i=0; i<3; i++) {
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
    
    static testMethod void testChanges() {
        Order o = [SELECT Id, Account.Name, AccountId, Site_Survey__c, Status, RecordTypeId FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        List<Survey_Asset_Location__c> surveyAssets = [SELECT Id, Survey_Location__c, Site_Survey__c FROM Survey_Asset_Location__c WHERE Site_Survey__c=:o.Site_Survey__c];
        List<Order_Item_Location__c> orderItemLocations = [SELECT Id, Survey_Asset_Location__c, Order_Product__c FROM Order_Item_Location__c WHERE Order__c=:o.Id];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        o.Status = fssetting.Order_Active_Stage__c;
        
        Test.startTest();
        
        update o;
        
        Survey_Location__c newLocation = new Survey_Location__c(
            Site_Survey__c=o.Site_Survey__c, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Male',
            Name='Location'
        );
        insert newLocation;
        
        Survey_Asset_Location__c newAssetLocation = surveyAssets.get(0).clone(false,true,false,false);
        newAssetLocation.Survey_Location__c = newLocation.Id;
        insert newAssetLocation;
        
        orderItemLocations.get(0).Survey_Asset_Location__c=newAssetLocation.Id;
        update orderItemLocations.get(0);

		Test.stopTest();
    }
    
    static testMethod void testChangesWithChild() {
        Order o = [SELECT Id, Account.Name, AccountId, Site_Survey__c, Status, RecordTypeId, EffectiveDate, Pricebook2Id FROM Order WHERE Account.Name='TestAccount' LIMIT 1].get(0);
        List<Survey_Asset_Location__c> surveyAssets = [SELECT Id, Survey_Location__c, Site_Survey__c FROM Survey_Asset_Location__c WHERE Site_Survey__c=:o.Site_Survey__c];
        List<Order_Item_Location__c> orderItemLocations = [SELECT Id, Survey_Asset_Location__c, Order_Product__c FROM Order_Item_Location__c WHERE Order__c=:o.Id];
        
        OrderItem item = [SELECT Id, Frequency__c, OrderId, UnitPrice, Quantity, Service_Price_Per_Unit__c, Product2Id, PricebookEntryId, HasSurveyAssets__c
                         FROM OrderItem WHERE Id=:orderItemLocations.get(0).Order_Product__c];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        o.Status = fssetting.Order_Active_Stage__c;
        
        Test.startTest();
        
        update o;
        
        Order childOrder = o.clone(false,true,false,false);
        childOrder.Parent_Order__c = o.Id;
        childOrder.Status=fssetting.Regular_Order_Draft_Stage__c;
        insert childOrder;
        
        OrderItem newItem = item.clone(false,true,false,false);
        newItem.Parent_Order_Product__c = orderItemLocations.get(0).Order_Product__c;
        newItem.OrderId = childOrder.Id;
        insert newItem;
        
        childOrder.Status = fssetting.Order_Active_Stage__c;
        update childOrder;
        
        Survey_Location__c newLocation = new Survey_Location__c(
            Site_Survey__c=o.Site_Survey__c, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Male',
            Name='Location'
        );
        insert newLocation;
        
        Survey_Asset_Location__c newAssetLocation = surveyAssets.get(0).clone(false,true,false,false);
        newAssetLocation.Survey_Location__c = newLocation.Id;
        insert newAssetLocation;
        
        orderItemLocations.get(0).Survey_Asset_Location__c=newAssetLocation.Id;
        update orderItemLocations.get(0);

		Test.stopTest();
    }
}