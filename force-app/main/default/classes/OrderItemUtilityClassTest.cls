@isTest
public class OrderItemUtilityClassTest {
    private static final Integer NUMBER_OF_RECORDS = 5;
    
    @testSetup
    static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        TestDataFactory.crtCPQSettings();
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c(Service_Start__c = 4);
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Regular_Order_Record_Type_Id__c = devRecordTypeId;
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        fssetting.Item_Type_for_Consumables__c =  'Consumables';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Item_Type_of_Services__c = 'Service';
        fssetting.Activate_Logic_for_Services__c = true;
        fssetting.Activate_Threshold_Logic_For_Orders__c = true;
        fssetting.Consumables_Discount_Threshold__c = 10;
        fssetting.Equipment_Discount_Threshold__c = 10;
        insert fssetting;
        
        TestDataFactory.crtBillToAcctContact(1,0); 
		Account a = TestDataFactory.accounts[0]; 
        
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
        
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++) {
            Product2 product;
            
            if (i < 3) {
                product = new Product2(Name='TestProduct' + i, Allowable_Frequencies__c='One-Time;Monthly;Weekly', IsActive=TRUE, Available_As_Related_Product__c=TRUE, Item_Type__c = 'Consumables', ExternalId__c = '3-55-7-02-1' + i);
            } else {
                product = new Product2(Name='TestProduct' + i, Allowable_Frequencies__c='One-Time;Monthly;Weekly', IsActive=TRUE, Available_As_Related_Product__c=TRUE, Item_Type__c = 'Service', ExternalId__c = '1-55-7-02-1' + i);
            }
            
            products.add(product);
        }
        
        insert products;
        
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=50, 
                    IsActive=TRUE
                )
            );
        }
        
        insert pEntries; 
        
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++) {
            OrderItem oi;
            
            if (i < 3) {//consumables/equipment
                oi = new OrderItem(Product2Id=pEntries.get(i).Id, Frequency__c=frequencies.get(1), UnitPrice=10, Purchase_Price__c=10, Quantity=1, OrderId=o.Id, HasSurveyAssets__c=TRUE);
            } else {//service
                oi = new OrderItem(Product2Id=pEntries.get(i).Id, Frequency__c=frequencies.get(1), UnitPrice=50, Service_Price_Per_Unit__c=50, Quantity=1, OrderId=o.Id, HasSurveyAssets__c=TRUE);
            }
            
            orderItems.add(oi);
        }
        
        orderItems.addAll(
            new List<OrderItem> {new OrderItem(
                Product2Id=pEntries.get(2).Id,  
                Frequency__c=frequencies.get(0), 
                UnitPrice=1.0,
                Installation_Price__c=1.0,
                Installation_Status__c='Install',
                Quantity=1, 
                OrderId=o.Id
            ),
                
            new OrderItem(
                    Product2Id=pEntries.get(3).Id,  
                    Frequency__c=frequencies.get(0), 
                    UnitPrice=1.0,
                    Installation_Price__c=1.0,
                    Installation_Status__c='Install',
                    Quantity=1, 
                    OrderId=o.Id
                )}
        );
        
        insert orderItems;
        
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++) {
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
        
        for (Integer i = 0; i < NUMBER_OF_RECORDS; i++) {
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
        
        Standing_Order__c so = new Standing_Order__c();
        so.Account__c = a.Id;
        so.Active__c = true;
        so.Name = 'test standing order';
        so.Order_Number__c = 'test standing order';
        insert so;
        
        Standing_Order_Line_Item__c soli = new Standing_Order_Line_Item__c();
        soli.Price__c = 10;
        soli.Service_Price_Per_Visit__c = 10;
        soli.Standing_Order__c = so.Id;
        soli.UniqueKey__c = 'test123';
        soli.Name = 'test123';
        soli.Frequency_Picklist__c = 'Monthly';
        soli.Item_Number__c = '1-55-7-02-12';
        soli.Active__c = true;
        insert soli;
        
        Standing_Order_Line_Item__c soli0 = new Standing_Order_Line_Item__c();
        soli0.Price__c = 5;
        soli0.Service_Price_Per_Visit__c = 2;
        soli0.Standing_Order__c = so.Id;
        soli0.UniqueKey__c = 'test777';
        soli0.Name = 'test777';
        soli0.Frequency_Picklist__c = 'Monthly';
        soli0.Item_Number__c = '1-55-7-02-12';
        soli0.Active__c = true;
        insert soli0;
        
        Standing_Order_Line_Item__c soli1 = new Standing_Order_Line_Item__c();
        soli1.Price__c = 10;
        soli1.Service_Price_Per_Visit__c = 10;
        soli1.Standing_Order__c = so.Id;
        soli1.UniqueKey__c = 'test345';
        soli1.Name = 'test345';
        soli1.Frequency_Picklist__c = 'Monthly';
        soli1.Item_Number__c = '3-55-7-02-12';
        soli1.Active__c = true;
        insert soli1;

    }
    
    @isTest
    static void testRequestedPriceApproved() {
        List<OrderItem> itemsUpdate = new List<OrderItem>();
        
        Test.startTest();
        
        for (OrderItem oi : [SELECT Id, Requested_Price__c, Requested_Price_Approved__c, Item_Type__c, Service_Price_Per_Unit__c, Purchase_Price__c FROM OrderItem LIMIT 5]) {
            oi.Requested_Price_Approved__c = true;
            oi.Requested_Price__c = 5;
            
            itemsUpdate.add(oi);
        }
        
        System.debug(itemsUpdate);
        
        update itemsUpdate;
        
        Test.stopTest();
    }
    
    @isTest
    static void testRequestedPriceNotApprovedWithStandingOrderPrice() {
        List<OrderItem> itemsUpdate = new List<OrderItem>();
        
        Test.startTest();
        
        for (OrderItem oi : [SELECT Id, Requested_Price__c, Requested_Price_Approved__c, Item_Type__c, Service_Price_Per_Unit__c, Purchase_Price__c FROM OrderItem WHERE Service_Price_Per_Unit__c != NULL]) {
            oi.Service_Price_Per_Unit__c = 40;
            
            itemsUpdate.add(oi);
        }
        
        update itemsUpdate;
        
        Test.stopTest();
    }
    
    @isTest
    static void testRequestedPriceNotApprovedWithoutStandingOrderPrice() {
        List<OrderItem> itemsUpdate = new List<OrderItem>();
        
        Test.startTest();
        
        for (OrderItem oi : [SELECT Id, Requested_Price__c, Frequency__c, Requested_Price_Approved__c, Item_Type__c, Service_Price_Per_Unit__c, Purchase_Price__c FROM OrderItem WHERE Service_Price_Per_Unit__c != NULL]) {
            oi.Service_Price_Per_Unit__c = 2.29;
            oi.Frequency__c = 'Weekly';
            
            itemsUpdate.add(oi);
        }
        
        update itemsUpdate;
        
        Test.stopTest();
    }

}