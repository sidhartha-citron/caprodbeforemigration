@isTest
public class TestProductConsumedObjectTriggers {
    
    @TestSetup static void setup() {
        Id pBook = Test.getStandardPricebookId();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        TestDataFactory.crtCPQSettings();
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        insert fssetting;
        
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
        
        WorkOrder testWorkOrder = new WorkOrder(
        	AccountId=a.Id,
            Status='New',
            StartDate=System.today(), 
            Pricebook2Id=pBook
        );
        insert testWorkOrder;
        
        for(Integer i=0; i<2; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Item_Type__c = 'Consumables',
                    Available_As_Related_Product__c=TRUE, 
                    Always_Billable__c=TRUE
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<2; i++) {
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
    }
    
    static testMethod void insertProductConsumed() {
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        PricebookEntry pEntry = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:fssetting.Default_Order_Price_Book_ID__c LIMIT 1].get(0);
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount'];
        WorkOrder testWorkOrder = [SELECT Id, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        
        ProductConsumed testProdConsumed = new ProductConsumed(
            PricebookEntryId=pEntry.Id, 
            QuantityConsumed=1,
            WorkOrderId=testWorkOrder.Id
        );
        insert testProdConsumed;
        
    }

}