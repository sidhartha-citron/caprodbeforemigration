@isTest
public class TestProductCatalog {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id InvRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id devRecordTypeIdSH = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Shopping Cart Order').getRecordTypeId();
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        TestDataFactory.crtCPQSettings();
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c(Service_Start__c = 4);
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
        fssetting.Item_Type_for_Consumables__c =  'Consumables';
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Hygiene_LOB__c = 'Hygiene';
        fssetting.Chemical_LOB__c = 'Chemical';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Life_Safety_LOB__c = 'Life Safety';
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
        
        TestDataFactory.crtBillToAcctContact(1, 0); 
        Account a = TestDataFactory.accounts.get(0); 
        
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
        a.OperatingHoursId = TestDataFactory.opthours[1].Id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        update a;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    Display_Record_In_Portal__c=TRUE, 
                    Item_Type__c = 'Consumables',
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
            Status='Shopping Cart', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeIdSH
        ); 
        insert o;
        
        for(Integer i=0; i<1; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0,
                    Installation_Price__c=1.0,
                    //Service_Price_Per_Unit__c=1.0, 
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
        
        Contact newContact = new Contact(
            FirstName = 'TestFirstName', 
            LastName = 'TestLastName', 
            Email = 'testUser@UserCommunity.com', 
            AccountId = a.Id
            
        );
        insert newContact;
        
        User newUser = new User(
            Alias = 'testA', 
            Email = 'testUser@TempAdmin.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TestFirstName',
            LastName = 'TestLastName', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testUser@TempAdmin.com', 
            Employee_Number__c = 'ABCD123TESTZXY'
        );
        insert newUser;
        
        User newCommUser = getCommunityUser(newContact); 
        
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newUser) {
            insert testQueue;
        }
    }
    
    public static User getCommunityUser(Contact newContact) {
        Profile communityProfile = [SELECT Id FROM Profile WHERE Usertype='PowerCustomerSuccess' LIMIT 1]; 
        User newUser = new User(
            Alias = 'testA', 
            Email = newContact.Email, 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = newContact.FirstName,
            LastName = newContact.LastName, 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = newContact.Email, 
            //ContactId=newContact.Id, 
            CommunityNickname=newContact.FirstName, 
            Contact_Login__c=newContact.Email, 
            Employee_Number__c = 'ABCD123TEST'
        );
        insert newUser;
        
        return newUser;
    }
    
    static testMethod void testGetFrequencyOptions(){
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly', 'Bi-Monthly', '28 Days', '120 Days', '14 Days', 'Twice Monthly', 'Semi-Annually', 'Other', 'Annually', 'Quarterly', '56 Days'};
            
        List<Frequency__c> settings = new List<Frequency__c>();
        for(String f : frequencies) {
            Frequency__c setting =  new Frequency__c(Name=f);
            setting.Occurrences_In_Year__c = 1;
            setting.Discount_Percent__c = 0.0;
            
            setting.Hygiene_Minus_Days__c = 5;
            setting.Hygiene_Plus_Days__c = 5;
            setting.Hygiene_Reschedule_Plus_Days__c=0;
            setting.Pest_Minus_Days__c = 1;
            setting.Pest_Plus_Days__c = 1;
            setting.Pest_Reschedule_Plus_Days__c=0;
            setting.Chemical_Minus_Days__c = 0;
            setting.Chemical_Plus_Days__c = 0;
            setting.Chemical_Reschedule_Plus_Days__c = 0;
            setting.Evaluation_Priority__c=0;
            setting.Life_Safety_Minus_Days__c=0;
            setting.Life_Safety_Plus_Days__c=0;
            setting.Life_Safety_Reschedule_Plus_Days__c=0;
            settings.add(setting);
        }
        
        Test.startTest();
        
        insert settings;
        
        ProductCatalog.getFrequencyOptions();
        
        Test.stopTest();
    }
    
    static testMethod void testGetProducts(){
        Order o = [SELECT Id, Account.Name, AccountId, RecordTypeId FROM Order LIMIT 1].get(0);
        
        Test.startTest();
        
        ProductCatalog.getProducts(null, null, false, 1, false, null, o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testGetProductsSearch(){
        Order o = [SELECT Id, Account.Name, AccountId, RecordTypeId FROM Order LIMIT 1].get(0);
        
        Test.startTest();
        
        ProductCatalog.getProducts('TestProduct', new List<String>{'Hygiene'}, true, 1, false, null, o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testGetProductFamily(){
        Order o = [SELECT Id, Account.Name, AccountId, RecordTypeId FROM Order LIMIT 1].get(0);        
        Test.startTest();
        
        ProductCatalog.getProductFamily(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testGetOrderStatus(){
        Test.startTest();
        
        ProductCatalog.getOrderStatus();
        
        Test.stopTest();
    }
    
    static testMethod void testGetPreviousOrderedProds(){      
       Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order LIMIT 1].get(0);
        
        o.Status='Activated';
        
        Test.startTest();
        
        update o;
        
        ProductCatalog.getPreviousOrderedProds(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testGetOrder(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order LIMIT 1].get(0);
        
        o.Status='Activated';
        
       	Test.startTest();
        
        update o;
        
        ProductCatalog.getOrder(a.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testGetOrderCommunity(){
        User communityUser = [SELECT Id, AccountId, ContactId, UserName FROM User WHERE UserName='testUser@UserCommunity.com' LIMIT 1];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order LIMIT 1].get(0);
        
        o.Status='Activated';
        
       	Test.startTest();
        
        update o;
        
        System.runAs(communityUser) {
            ProductCatalog.getOrder(communityUser.AccountId);
        }
        
        Test.stopTest();
    }
    
    static testMethod void testGetShoppingCart(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order LIMIT 1].get(0);
        
       	Test.startTest();
        
        ProductCatalog.getShoppingCart(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testGetBannerValue(){
        Product_Discounts__c fssetting = new Product_Discounts__c(Name='Test');
        fssetting.Banner_Value__c = 'Completed';
        
       	Test.startTest();
        
        insert fssetting;
        
        ProductCatalog.getBannerValue();
        
        Test.stopTest();
    }
    
    static testMethod void testSaveOrder(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c, Quantity, UnitPrice, Frequency__c, Purchase_Price__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        List<ProductCatalog.CartItem> testItems = new List<ProductCatalog.CartItem>
        {new ProductCatalog.CartItem(oItem, 'prodRichText', 'imageURL', 'name', oItem.UnitPrice, oItem.PricebookEntryId, 1)};
        
        String orderString = JSON.serialize(o);
        String itemString = JSON.serialize(testItems);
        
       	Test.startTest();
        
        ProductCatalog.saveOrder(orderString, itemString);
        
        Test.stopTest();
    }
    
    static testMethod void testDeleteOrderItem() {
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order LIMIT 1].get(0);
        
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id, Asset__c, Quantity, UnitPrice, Frequency__c, Purchase_Price__c FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        ProductCatalog.CartItem theItem = new ProductCatalog.CartItem(oItem, 'prodRichText', 'imageURL', 'name', oItem.UnitPrice, oItem.PricebookEntryId, 1);
        
        String orderString = JSON.serialize(o);
        String itemString = JSON.serialize(theItem);
        
        Test.startTest();
        
        ProductCatalog.deleteOrderItem(itemString, orderString);
        
        Test.stopTest();
    }
}