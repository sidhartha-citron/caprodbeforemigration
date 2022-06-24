@isTest
public class TestCreateChildOrder {
    
    @TestSetup static void setup() {
        Date todaysDate = System.today();
        List<Account> accounts = new List<Account>();
        List<Site_Survey__c> siteSurveys = new List<Site_Survey__c>();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        TestDataFactory.crtCPQSettings();
            TestDataFactory.crtBillToAcctContact(3,0); 
            accounts = TestDataFactory.accounts;
        /*
        for(Integer i=1; i<4; i++) {
            accounts.add(
                new Account(
                    Name='TestAccount'+i, 
                    AccPac_Account__c='1234-'+i, 
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
                )
            );
        }
        insert accounts;
        */
        System.debug(accounts);
        for(Integer i=1; i<3; i++) {
            siteSurveys.add(
                new Site_Survey__c(
                    Account__c=accounts.get(i).Id, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                )
            );
        }
        insert siteSurveys;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE,
                    ExternalId__c = '3-55-7-02-1' + i
                )       
            );
        }
        
        insert products;
        
        Id pBook = Test.getStandardPricebookId();
        
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
        
        Account a1 = accounts.get(1);
        Account a2 = accounts.get(2);
		a1.Site_Survey__c = siteSurveys.get(0).Id;
        a2.Site_Survey__c = siteSurveys.get(1).Id;
        update new List<Account>{a1, a2};
        
        Order o = new Order(
        	AccountId=accounts.get(0).Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook
        ); 
        insert o;
        
        for(Integer i=0; i<2; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=false
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
    }
    
    static testMethod void testCreateChildOrder() {
        //Order o = [SELECT Id, Account.Name, AccountId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId FROM Order WHERE Account.Name='TestAccount0' LIMIT 1].get(0);
        
        Test.startTest();
        
        CreateChildOrder.createChildOrder(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testCreateChildOrderForChildOrder() {
        //Order o = [SELECT Id, Account.Name, AccountId, Parent_Order__c FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        Order o = [SELECT Id, Account.Name, AccountId FROM Order WHERE Account.Name='TestAccount0' LIMIT 1].get(0);
        
        Order parentOrder = new Order(
        	AccountId=o.AccountId, 
            Status='Draft', 
            EffectiveDate=System.today()
        ); 
        
        Test.startTest();
        
        insert parentOrder;
        
        o.Parent_Order__c = parentOrder.Id;
        update o;
        
        CreateChildOrder.createChildOrder(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testCreateException1() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount2'];
        Order parentOrder = new Order(
        	AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today()
        ); 
                
        Test.startTest();
        
        CreateChildOrder.createChildOrder(a.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testCreateException2() {
        Test.startTest();
        
        CreateChildOrder.createChildOrder(null);
        
        Test.stopTest();
    }
}