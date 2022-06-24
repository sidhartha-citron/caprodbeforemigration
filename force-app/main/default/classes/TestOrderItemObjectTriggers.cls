@isTest
public class TestOrderItemObjectTriggers {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        TestDataFactory.crtFSA();
            TestDataFactory.crtCPQSettings();
        TestDataFactory.crtServiceBranch();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
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
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        insert fssetting;
        
        Account a = new Account(
            Name='TestAccount',
            RecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Customer_Bill_To').getRecordTypeId(),
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
            BillingPostalCode = 'L3R3L5',
            BillingCountry = 'Country',
            Shipping_Suite_Number__c = '1',
            ShippingStreet = 'Street', 
            ShippingCity = 'City', 
            ShippingState = 'State', 
            ShippingPostalCode = 'L3R3L5', 
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
        
        Test.startTest();
        
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
                    Family= (i==0) ? 'Hygiene' : 'Pest Control', 
                    Item_Type__c= (i==0) ? 'Consumables' : 'Service',
                    ExternalId__c = 'test' + i + '-10-30-02-11'
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
                    Need_Ticket__c ='Test',
                    //Service_Price_Per_Unit__c=1.0,
                    Purchase_Price__c=1.0,
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE
                )
            );
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
                Product2Id=pEntries.get(2).Id,  
                Frequency__c=frequencies.get(0), 
                UnitPrice=1.0,
                Installation_Price__c=1.0,
                Installation_Status__c='Install',
                Quantity=1, 
                OrderId=o.Id
            )}
        );
        
        insert orderItems;
        Test.stopTest();
        
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
    
    static testMethod void testInsertNoErrorNoChild(){
        Id pBook = Test.getStandardPricebookId();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        for(Integer i=0; i<3; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    //Service_Price_Per_Unit__c=1.0,
                    Purchase_Price__c=1.0,
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=FALSE
                )
            );
        }
        
        insert orderItems;
    }
    
    static testMethod void testInsertNoChildErrors(){
        Test.startTest();
        Id pBook = Test.getStandardPricebookId();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, RecordTypeId FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        for(Integer i=0; i<3; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Purchase_Price__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=FALSE
                )
            );
        } 
        //orderItems.get(0).Frequency__c='28 Days';
        orderItems.get(0).Installation_Price__c=1;
        Test.stopTest();
        try {
            insert orderItems;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('not applicable for the product') || e.getMessage().contains('Installation Status'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testInsertNoErrorHasChildDraft(){
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Test.startTest();
        Id pBook = Test.getStandardPricebookId();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id 
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        Order childOrder = o.clone(false,true,false,false);
        childOrder.Parent_Order__c = o.Id;
        insert childOrder;
        
        for(Integer i=0; i<3; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    //Service_Price_Per_Unit__c=1.0,
                    Purchase_Price__c=1.0,
                    Quantity=2, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=FALSE
                )
            );
        } 
        orderItems.add(
            new OrderItem(
                Product2Id=pEntries.get(2).Id,  
                Frequency__c=frequencies.get(0), 
                UnitPrice=1.0, 
                Purchase_Price__c=1.0, 
                Quantity=2, 
                OrderId=o.Id
            )
        );
        //orderItems.get(0).Frequency__c='28 Days';
        
        insert orderItems;
        Test.stopTest();
    }
    
    static testMethod void testInsertNoErrorHasChildActive(){
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Id pBook = Test.getStandardPricebookId();
        
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        
        OrderItem oi = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c 
                        FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c<>NULL LIMIT 1].get(0);
        
        Order childOrder = o.clone(false,true,false,false);
        childOrder.Parent_Order__c = o.Id;
        insert childOrder;
        
        OrderItem newItem = oi.clone(false,true,false,false);
        newItem.Parent_Order_Product__c = oi.Id;
        newItem.OrderId = childOrder.Id;
        insert newItem;
        
        childOrder.Status='Activated';
        
        update o;
        
    }
    
    static testMethod void testInsertNoErrorHasChildActiveChangeOrderItem(){
        Test.startTest();
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Id pBook = Test.getStandardPricebookId();
        
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        
        OrderItem oi = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status 
                        FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c<>NULL LIMIT 1];//.get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntry.Product2Id, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status, Related_Product__c
                        FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c=NULL LIMIT 1];//.get(0);
        
        Product2 testProduct = [SELECT Id, Family, Item_Type__c FROM Product2 WHERE Id=:oItem.PricebookEntry.Product2Id];
        testProduct.Family = 'Chemical';
        update testProduct;
        
        Order childOrder = o.clone(false,true,false,false);
        childOrder.Parent_Order__c = o.Id;
        insert childOrder;
        
        OrderItem newItem = oi.clone(false,true,false,false);
        newItem.Parent_Order_Product__c = oi.Id;
        newItem.OrderId = childOrder.Id;
        insert newItem;
        Test.stopTest();
        
        oi.Purchase_Price__c = 2;
        oi.Description ='Changed';
        oItem.Related_Product__c=oItem.PricebookEntry.Product2Id;
        update new List<OrderItem>{oi, oItem};
    }
    
    static testMethod void testFrequencyError1(){
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1];//.get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        OrderItem oi = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status 
                        FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c<>NULL LIMIT 1];//.get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntry.Product2Id, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status, Related_Product__c,
                        	Installation_Price__c, Installation_Status__c FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c=NULL LIMIT 1];//.get(0);
        
        Product2 testProduct = [SELECT Id, Family, Item_Type__c, Allowable_Frequencies__c FROM Product2 WHERE Id=:oItem.PricebookEntry.Product2Id];
        testProduct.Allowable_Frequencies__c=null;
        update testProduct;
        
        oItem.Frequency__c='28 Days';
        try {
            update oItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('cannot be a recurring service/delivery'), 'message=' + e.getMessage());
        }
        
    }
    
    static testMethod void testInstallationFieldErrors1(){
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        OrderItem oi = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status 
                        FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c<>NULL LIMIT 1];//.get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntry.Product2Id, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status, Related_Product__c,
                        	Installation_Price__c, Installation_Status__c FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c=NULL LIMIT 1];//.get(1);
        
        
        oItem.Installation_Price__c=112.1;
        oItem.Installation_Status__c=null;
        
        //update oItem;
        try {
            update oItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Installation Status'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testInstallationFieldErrors2(){
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        OrderItem oi = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status 
                        FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c<>NULL LIMIT 1];//.get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntry.Product2Id, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status, Related_Product__c,
                        	Installation_Price__c, Installation_Status__c FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c=NULL LIMIT 2].get(1);
        
        
        oItem.Installation_Status__c = fssetting.Status_Value_for_Install_of_a_Product__c;
        
        try {
            update oItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Installation Price'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testInstallationFieldErrors3(){
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        OrderItem oi = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status 
                        FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c<>NULL LIMIT 1];//.get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntry.Product2Id, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status, Related_Product__c,
                        	Installation_Price__c, Installation_Status__c FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c=NULL LIMIT 1];//.get(0);
        
        Product2 testProduct = [SELECT Id, Family, Item_Type__c FROM Product2 WHERE Id=:oItem.PricebookEntry.Product2Id];
        testProduct.Item_Type__c = fssetting.Item_Type_for_Consumables__c;
        update testProduct;
        
        oItem.Frequency__c=fssetting.Non_Recurring_Frequency_Value__c;
        oItem.Installation_Price__c=112.1;
        oItem.Installation_Status__c = fssetting.Status_Value_for_Install_of_a_Product__c;
        
        try {
            update oItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('One-Time Consumable Product'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testInActiveOrderItemError(){
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        OrderItem oi = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status 
                        FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c<>NULL LIMIT 1];//.get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntry.Product2Id, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Order.Status, Related_Product__c,
                        	Installation_Price__c, Installation_Status__c, Active__c FROM OrderItem WHERE OrderId=:o.Id AND Purchase_Price__c=NULL LIMIT 1];//.get(0);
        
        oItem.Active__c = FALSE;
        update oItem;
        
        oItem.Service_Price_Per_Unit__c = 110.0;
        try {
            update oItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Please Activate the Order Product'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testDeleteNoChild(){
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        List<OrderItem> orderItems = [SELECT Id, OrderId FROM OrderItem WHERE OrderId=:o.Id];
        delete orderItems;
    }
    
    static testMethod void testDeleteHasChild(){
        Test.startTest();
        Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId 
                   FROM Order WHERE Account.Name='TestAccount' AND Parent_Order__c=NULL LIMIT 1].get(0);
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        List<OrderItem> orderItems = [SELECT Id, OrderId, PricebookEntryId, Frequency__c, Quantity, UnitPrice, Service_Price_Per_Unit__c, Purchase_Price__c, Installation_Price__c, Installation_Status__c
                                      FROM OrderItem WHERE OrderId=:o.Id];
        List<OrderItem> childOrderItems = new List<OrderItem>();
        
        Order childOrder = o.clone(false,true,false,false);
        childOrder.Parent_Order__c = o.Id;
        insert childOrder;
        
        for(OrderItem oi : orderItems) {
            OrderItem newItem = oi.clone(false,true,false,false);
            newItem.Installation_Price__c = oi.Installation_Price__c;
            newItem.Installation_Status__c = oi.Installation_Status__c;
            newItem.Parent_Order_Product__c = oi.Id;
            newItem.OrderId = childOrder.Id;
            childOrderItems.add(newItem);
        }
        insert childOrderItems;
        
        childOrder.Status='Activated';
        
        update o;
        Test.stopTest();
        
        delete orderItems;
    }

    @IsTest
    static void setLastServicePlanInactive() {
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperServiceResource resourceWrapper = new TestUtilsWrapperServiceResource(accountWrapper);
        Route__c route = (Route__c) TestUtils.createSObject(new Route__c(Service_Resource__c = resourceWrapper.serviceResource.Id), true);
        Service_Plan__c plan = (Service_Plan__c) TestUtils.createSObject(new Service_Plan__c(Account__c = accountWrapper.account.Id, Route__c = route.Id), true);

        OrderItem item = [SELECT Id FROM OrderItem LIMIT 1];
        item.Active__c = true;
        item.Service_Plan__c = plan.Id;
        update item;

        OrderItem itemBefore = [SELECT Id, Service_Plan__c, Last_Service_Plan__c FROM OrderItem WHERE Id = :item.Id];

        Test.startTest();
        item.Active__c = false;
        update item;
        Test.stopTest();

        OrderItem itemAfter = [SELECT Id, Service_Plan__c, Last_Service_Plan__c FROM OrderItem WHERE Id = :item.Id];

        System.assertEquals(plan.Id, itemBefore.Service_Plan__c);
        System.assertEquals(null, itemBefore.Last_Service_Plan__c);
        System.assertEquals(null, itemAfter.Service_Plan__c);
        System.assertEquals(plan.Id, itemAfter.Last_Service_Plan__c);
    }

    @IsTest
    static void setLastServicePlanFrequencyChange() {
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperServiceResource resourceWrapper = new TestUtilsWrapperServiceResource(accountWrapper);
        Route__c route = (Route__c) TestUtils.createSObject(new Route__c(Service_Resource__c = resourceWrapper.serviceResource.Id), true);
        Service_Plan__c plan = (Service_Plan__c) TestUtils.createSObject(new Service_Plan__c(Account__c = accountWrapper.account.Id, Route__c = route.Id), true);

        OrderItem item = [SELECT Id FROM OrderItem LIMIT 1];
        item.Active__c = true;
        item.Service_Plan__c = plan.Id;
        update item;

        OrderItem itemBefore = [SELECT Id, Service_Plan__c, Last_Service_Plan__c FROM OrderItem WHERE Id = :item.Id];

        Test.startTest();
        item.Frequency__c = '';
        update item;
        Test.stopTest();

        OrderItem itemAfter = [SELECT Id, Service_Plan__c, Last_Service_Plan__c FROM OrderItem WHERE Id = :item.Id];

        System.assertEquals(plan.Id, itemBefore.Service_Plan__c);
        System.assertEquals(null, itemBefore.Last_Service_Plan__c);
        System.assertEquals(null, itemAfter.Service_Plan__c);
        System.assertEquals(plan.Id, itemAfter.Last_Service_Plan__c);
    }

    @IsTest
    static void setLastServicePlanServicePlanChange() {
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperServiceResource resourceWrapper = new TestUtilsWrapperServiceResource(accountWrapper);
        Route__c route = (Route__c) TestUtils.createSObject(new Route__c(Service_Resource__c = resourceWrapper.serviceResource.Id), true);
        Service_Plan__c plan = (Service_Plan__c) TestUtils.createSObject(new Service_Plan__c(Account__c = accountWrapper.account.Id, Route__c = route.Id), true);

        OrderItem item = [SELECT Id FROM OrderItem LIMIT 1];
        item.Active__c = true;
        item.Service_Plan__c = plan.Id;
        update item;

        OrderItem itemBefore = [SELECT Id, Service_Plan__c, Last_Service_Plan__c FROM OrderItem WHERE Id = :item.Id];

        Test.startTest();
        item.Service_Plan__c = null;
        update item;
        Test.stopTest();

        OrderItem itemAfter = [SELECT Id, Service_Plan__c, Last_Service_Plan__c FROM OrderItem WHERE Id = :item.Id];

        System.assertEquals(plan.Id, itemBefore.Service_Plan__c);
        System.assertEquals(null, itemBefore.Last_Service_Plan__c);
        System.assertEquals(null, itemAfter.Service_Plan__c);
        System.assertEquals(plan.Id, itemAfter.Last_Service_Plan__c);
    }
}