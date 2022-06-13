@isTest
public class TestAssetObjectTriggers {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        TestDataFactory.crtCPQSettings();
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Regular_Order_Record_Type_Id__c = devRecordTypeId;
        fssetting.Scanned_In_Status__c = 'Installed';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Service_Start__c = 0;
        insert fssetting;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        /*OperatingHours oh = new OperatingHours(
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
            Name='TerritoryForCaseTestScenarios'
            
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
            Name='TerritoryForCaseTestScenarios1',
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
        insert a;*/
        
        TestDataFactory.crtBillToAcctContact(1, 1);
        
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
            Name='Location'
        );
        insert location;
        
        TestDataFactory.accounts[0].Site_Survey__c = ss.Id;
        update TestDataFactory.accounts[0];
        
        Order o = new Order(
            AccountId=TestDataFactory.accounts[0].Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=TestDataFactory.accounts[0].Site_Survey__c, 
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
    
    static testMethod void testNoChild(){
        Order o = [SELECT Id, Account.Name, AccountId, Site_Survey__c, Status, RecordTypeId FROM Order LIMIT 1].get(0);
        List<Survey_Asset_Location__c> surveyAssets = [SELECT Id, Survey_Location__c, Site_Survey__c FROM Survey_Asset_Location__c WHERE Site_Survey__c=:o.Site_Survey__c];
        List<Order_Item_Location__c> orderItemLocations = [SELECT Id, Survey_Asset_Location__c, Order_Product__c, Survey_Asset_Location__r.Survey_Location__c
                                                           FROM Order_Item_Location__c WHERE Order__c=:o.Id];
        Survey_Location__c location = [SELECT Id, Site_Survey__c FROM Survey_Location__c WHERE Site_Survey__c=:o.Site_Survey__c LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        OrderItem item = [SELECT Id, Frequency__c, OrderId, UnitPrice, Quantity, Service_Price_Per_Unit__c, Product2Id, PricebookEntryId, HasSurveyAssets__c, Asset__c
                         FROM OrderItem WHERE Id=:orderItemLocations.get(0).Order_Product__c];
        
        Survey_Location__c newLocation = new Survey_Location__c(
            Site_Survey__c=o.Site_Survey__c, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Male',
            Name='Location'
        );
        insert newLocation;
        
        Asset testAsset = new Asset(
            Name='TestAsset',
        	AccountId=o.AccountId, 
            Product2Id=item.Product2Id, 
            Status=fssetting.Scanned_In_Status__c, 
            Site_Survey__c=o.Site_Survey__c,
            Survey_Location__c=location.Id
            
        );
        
        Test.startTest();
        
        insert testAsset;
        
        item.Asset__c=testAsset.Id;
        update item;
        
        testAsset.Survey_Location__c=newLocation.Id;
        update testAsset;
        
        Test.stopTest();
    }
}