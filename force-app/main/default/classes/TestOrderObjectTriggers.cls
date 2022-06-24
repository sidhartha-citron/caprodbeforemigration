@isTest
public class TestOrderObjectTriggers {
    
    @TestSetup static void setup() {
        List<Account> accounts = new List<Account>();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        Id regularOrderRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Regular_Order_Record_Type_Id__c = regularOrderRecordTypeId;
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.System_Administrator_Profile_Id__c = UserInfo.getProfileId();
        fssetting.Accounts_Receivable_Queue__c = testGroup.Id;
        fssetting.Billing_Team__c = testGroup.Id;
        fssetting.Invoice_Information_Case_RecordTypeId__c = devRecordTypeId;
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        
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
        
        Frequency__c setting1 =  new Frequency__c(Name=frequencies.get(0));
        setting1.Hygiene_Minus_Days__c = 5;
        setting1.Hygiene_Plus_Days__c = 5;
        setting1.Occurrences_In_Year__c = 1;
        setting1.Discount_Percent__c = 0.0;
        setting1.Pest_Minus_Days__c = 1;
        setting1.Pest_Plus_Days__c = 1;
        insert setting1;
        
        Frequency__c setting2 =  new Frequency__c(Name=frequencies.get(1));
        setting2.Hygiene_Minus_Days__c = 5;
        setting2.Hygiene_Plus_Days__c = 5;
        setting2.Occurrences_In_Year__c = 12;
        setting2.Discount_Percent__c = 0.0;
        setting2.Pest_Minus_Days__c = 1;
        setting2.Pest_Plus_Days__c = 1;
        insert setting2;
        
        Frequency__c setting3 =  new Frequency__c(Name=frequencies.get(2));
        setting3.Hygiene_Minus_Days__c = 5;
        setting3.Hygiene_Plus_Days__c = 5;
        setting3.Occurrences_In_Year__c = 54;
        setting3.Discount_Percent__c = 0.0;
        setting3.Pest_Minus_Days__c = 1;
        setting3.Pest_Plus_Days__c = 1;
        insert setting3;
        TestDataFactory.crtCPQSettings();
        TestDataFactory.crtAcctContact(2, 0); 
        accounts = TestDataFactory.accounts; 
		ID rTBillTo = [select id from recordType where name = 'Customer Bill To'].id; 
        Id rTShipTo = [select id from recordType where name = 'Customer Ship To'].id; 
        
        Account a0 = accounts.get(0);
        a0.OperatingHoursId = TestDataFactory.opthours[1].Id;
        a0.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        a0.AccPac_Account__c='1234567-0'; 
        a0.RecordTypeId = rTBillTo;
        update a0;
        Account a = accounts.get(1);
        a.OperatingHoursId = TestDataFactory.opthours[1].Id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        a.AccPac_Account__c='1234567-1'; 
        a.ParentId = a0.Id;
        a.RecordTypeId = rTShipTo;
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
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c
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
                    Frequency__c=frequencies.get(1), 
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
            Employee_Number__c = 'ABCD123TEST'
        );
        insert newCommUser;
        
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newCommUser) {
            insert testQueue;
        }
    }
    
    static testMethod void insertOrder() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        
        Id pBook = Test.getStandardPricebookId();
        
        Order o = new Order(
          AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c
        ); 
        
        Test.startTest();
        
        insert o;
        
        Test.stopTest();
    }
    
    static testMethod void insertOrderNoSiteSurveyAndPBook() {
        Account a = [SELECT Id, Site_Survey__c, Name, BillingStreet, ShippingCity, ParentId FROM Account WHERE Name='TestAccount1'];
        a.Site_Survey__c=null;
       
        Order o = new Order(
        	AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today()
        ); 
        
        Test.startTest();
        
        update a;
        insert o;
        
        Test.stopTest();
    }
    
    static testMethod void insertOrderWithTicket() { 
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        system.debug('++++' + a);
        Id pBook = Test.getStandardPricebookId();
        
        Case testCase = new Case(
          AccountId=a.Id, 
            Type='Other', 
            Status='New', 
            Priority='Low'
        );
        
        Test.startTest();
        
        insert testCase;
        
        Order o = new Order(
            AccountId = a.Id,
        	Ticket__c=testCase.Id,
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            PoNumber='111111',
            Site_Survey__c=a.Site_Survey__c
        ); 
        
        insert o;
        
        o.PoNumber = '112222';
        update o;
        Test.stopTest();
    }
    
    static testMethod void updateOrder() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        Id pBook = Test.getStandardPricebookId();
   
        Order o = new Order(
          AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook
        ); 
        
        Test.startTest();
        
        insert o;
        
        o.Site_Survey__c=a.Site_Survey__c;
        o.Pricebook2Id=null;
        
        update o;
        
        Test.stopTest();
    }
    
    static testMethod void updateOrderRevenueChange() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        Order o = [SELECT Id, Account.Name, AccountId, RecordTypeId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        Group testGroup = [SELECT Id FROM Group WHERE Name='TestGroup' LIMIT 1].get(0);
        OrderItem oi = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status, Installation_Price__c, Installation_Status__c,
                        HasSurveyAssets__c, SurveyAssetCountChecker__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        OrderItem newItem = oi.clone(false, true, false, false);
        newItem.Service_Price_Per_Unit__c=null;
        newItem.Purchase_Price__c=111.111;
        newItem.Installation_Price__c=null;
        newItem.Installation_Status__c=null;
        newItem.HasSurveyAssets__c=FALSE;
        newItem.SurveyAssetCountChecker__c=0;
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            
        Test.startTest();
        
        o.Status='Activated';
        update o;
        
        o.Status='Draft';
        update o;
        
        oi.Frequency__c = 'Weekly';
        oi.Service_Price_Per_Unit__c = 112.0;
        oi.Purchase_Price__c = 221.0;
        oi.Installation_Price__c = 231.0;
        oi.Installation_Status__c = fssetting.Status_Value_for_Install_of_a_Product__c;
        upsert new List<OrderItem> {oi, newItem};
        
        o.Status='Activated';
        update o;
        
        Test.stopTest();
    }
    
    static testMethod void updateOrderError1() {
        List<Survey_Asset_Location__c> surveyAssets = new List<Survey_Asset_Location__c>();
        Order o = [SELECT Id, Account.Name, AccountId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        
        for(Survey_Asset_Location__c sa : [SELECT Id, Survey_Location__c, Originating_Parent_ID__c FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c=:o.Id]) {
            sa.Survey_Location__c=null;
            surveyAssets.add(sa);
        }
        
        Test.startTest();
        
        update surveyAssets;
        
        o.Status='Activated';
        
        try {
            update o;
        } catch (Exception e) {
            String message = e.getMessage();
          System.assert(e.getMessage().contains('There are Survey Asset Locations'), 'message=' + e.getMessage());
        }
        
        Test.stopTest();
    }
    
    static testMethod void updateOrderError2() {
        Account a0 = [SELECT Id, Site_Survey__c, Name, BillingStreet, ShippingCity, BillingCity FROM Account WHERE Name='TestAccount0'];
        Account a = [SELECT Id, Site_Survey__c, Name, BillingStreet, ShippingCity FROM Account WHERE Name='TestAccount1'];
        
        Order o = [SELECT Id, Account.Name, AccountId, BillingStreet, ShippingCity FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        
        o.ShippingCity=null;
        o.BillingStreet=null;
        o.Status='Activated';
        
        a0.BillingStreet=null;
        a0.BillingCity=null;
        
        Test.startTest();
        
        try {
            update a0;
          update o;
        } catch (Exception e) {
          System.assert(e.getMessage().contains('Please ensure'), 'message=' + e.getMessage());
        }
        
        Test.stopTest();
    }
    
    static testMethod void updateOrderError3() {
        Account a = [SELECT Id, Site_Survey__c, Name, BillingStreet, ShippingCity, ParentId FROM Account WHERE Name='TestAccount1'];
        a.BillingStreet=null;
        a.BillingCity=null;
        //a.ParentId=null;
        update a;
        
        Order o = [SELECT Id, Account.Name, AccountId, BillingStreet, ShippingCity FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        o.Status='Activated';
        
        Test.startTest();
        
        try {
            update o;
        } catch (Exception e) {
          System.assert(e.getMessage().contains('Please ensure'), 'message=' + e.getMessage());
        }
        
        Test.stopTest();
    }
    
    static testMethod void updateOrderError4() {
        Account a = [SELECT Id, Site_Survey__c, Name, BillingStreet, ShippingCity, ParentId, Service_Territory__c, OperatingHoursId FROM Account WHERE Name='TestAccount1'];
        a.Service_Territory__c=null;
        a.OperatingHoursId=null;
        update a;
        
        Order o = [SELECT Id, Account.Name, AccountId, BillingStreet, ShippingCity, Service_Territory__c FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        o.Service_Territory__c=null;
        o.Status='Activated';
        
        Test.startTest();
        
        try {
            update o;
        } catch (Exception e) {
          System.assert(e.getMessage().contains('Please fill in the'), 'message=' + e.getMessage());
        }
        
        Test.stopTest();
    }
    
    static testMethod void deleteOrder() {
        Order o = [SELECT Id, Account.Name, AccountId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        
        Test.startTest();

        delete o;
        
        Test.stopTest();
    }
}