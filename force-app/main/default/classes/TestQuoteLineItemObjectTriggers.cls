@isTest
public class TestQuoteLineItemObjectTriggers {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<QuoteLineItem> quoteItems = new List<QuoteLineItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.Item_Type_for_Consumables__c =  'Consumables';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        insert fssetting;
      
        TestDataFactory.crtAcctContact(1,1); 
        Account a = TestDataFactory.accounts.get(0); 
        a.Name = 'TestAccount';
        Update a; 
        Contact c = TestDataFactory.contacts.get(0); 
        
       
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Approved'
        );
        insert ss;
        
        Test.startTest();
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
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    Item_Type__c= 'Service'
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
        
        Opportunity op = new Opportunity(
            Name=a.Name+' Opportunity',
            AccountId=a.Id,
            StageName='Presentation', 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In', 
            Site_Survey__c=a.Site_Survey__c
        ); 
        insert op;
        
        OpportunityContactRole oppRole = new OpportunityContactRole(
            OpportunityId=op.Id,
            ContactId=c.Id, 
            Role='Decision Maker',
            isPrimary=TRUE
        );
        insert oppRole;
        
        for(Integer i=0; i<3; i++) {
            oppItems.add(
                new OpportunityLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OpportunityId=op.Id, 
                    SurveyAssetCountChecker__c=1
                )
            );
        } 
        insert oppItems;
        
        for(Integer i=0; i<3; i++) {
            //oppItems.get(i).SurveyAssetCountChecker__c=oppItems.get(i).Quantity;
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=op.Id,  
                    Originating_Record_ID__c=oppItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=op.Site_Survey__c, 
                    Service_Frequency__c=oppItems.get(i).Service_Frequency__c, 
                    Survey_Location__c=location.Id
                )
            );
        }
        insert surveyAssetLocations;
        
        Quote testQuote = new Quote(
            OpportunityId=op.Id, 
            Name=op.Name+' Quote', 
            Pricebook2Id=pBook
        );
        
        insert testQuote;
        
        op.SyncedQuoteId = testQuote.Id;
        update op;
        QuoteLineItemSyncState.invoker = null;
        for(Integer i=0; i<3; i++) {
            quoteItems.add(
                new QuoteLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    QuoteId=testQuote.Id, 
                    OpportunityLineItem=oppItems.get(i)
                )
            );
        } 
        insert quoteItems;
        Test.stopTest();
    }
    
    static testMethod void testInsert(){
        Quote testQuote = [SELECT Id, Name FROM Quote WHERE Name='TestAccount Opportunity Quote'];
        /*Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();*/
        
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = new List<QuoteLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        
        for(Integer i=0; i<3; i++) {
            quoteItems.add(
                new QuoteLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    QuoteId=testQuote.Id,
                    OpportunityLineItem = [SELECT Id FROM OpportunityLineItem LIMIT 1]
                )
            );
        } 
        Test.startTest();
        insert quoteItems;
        Test.stopTest();
    }
    
    static testMethod void testUpdate(){
        Quote testQuote = [SELECT Id, Name FROM Quote WHERE Name='TestAccount Opportunity Quote'];
        /*Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];*/
        
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = [SELECT Id, Service_Frequency__c, Installation_Price__c, Service_Price_Per_Unit__c, Installation_Status__c, QuoteId
                                          FROM QuoteLineItem WHERE QuoteId=:testQuote.Id];
        
        QuoteLineItem qItem = quoteItems.get(0);
        qItem.Service_Price_Per_Unit__c = 67;
        update qItem;
        
    }
    
    static testMethod void testFrequencyError1(){
        Quote testQuote = [SELECT Id, Name FROM Quote WHERE Name='TestAccount Opportunity Quote'];
        /*Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];*/
        
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = [SELECT Id, Service_Frequency__c, Installation_Price__c, Service_Price_Per_Unit__c, Installation_Status__c, QuoteId
                                          FROM QuoteLineItem WHERE QuoteId=:testQuote.Id];
        
        QuoteLineItem qItem = quoteItems.get(0);
        qItem.Service_Frequency__c = '28 Days';
        
        
        try {
            update qItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Applicable frequencies are'), 'message=' + e.getMessage());
        }
        
    }
    
    static testMethod void testFrequencyError2(){
        Quote testQuote = [SELECT Id, Name FROM Quote WHERE Name='TestAccount Opportunity Quote'];
        /*Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];*/
        
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = [SELECT Id, Service_Frequency__c, Installation_Price__c, Service_Price_Per_Unit__c, Installation_Status__c, QuoteId, Product2Id
                                          FROM QuoteLineItem WHERE QuoteId=:testQuote.Id];
        
        QuoteLineItem qItem = quoteItems.get(0);
        
        Product2 testProduct = [SELECT Id, Family, Item_Type__c, Allowable_Frequencies__c FROM Product2 WHERE Id=:qItem.Product2Id];
        testProduct.Allowable_Frequencies__c=null;
        update testProduct;
        
        qItem.Service_Frequency__c = '28 Days';
        try {
            update qItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('cannot be a recurring service/delivery'), 'message=' + e.getMessage());
        }
        
    }
    
    static testMethod void testInstallationError1(){
        Quote testQuote = [SELECT Id, Name FROM Quote WHERE Name='TestAccount Opportunity Quote'];
        /*Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];*/
        
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = [SELECT Id, Service_Frequency__c, Installation_Price__c, Service_Price_Per_Unit__c, Installation_Status__c, QuoteId
                                          FROM QuoteLineItem WHERE QuoteId=:testQuote.Id];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        insert fssetting;*/
        
        QuoteLineItem qItem = quoteItems.get(0);
        qItem.Installation_Price__c = 1;
        try {
            update qItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Installation Status'), 'message=' + e.getMessage());
        }
        
    }
    
    static testMethod void testInstallationError2(){
        Quote testQuote = [SELECT Id, Name FROM Quote WHERE Name='TestAccount Opportunity Quote'];
        /*Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];*/
        
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = [SELECT Id, Service_Frequency__c, Installation_Price__c, Service_Price_Per_Unit__c, Installation_Status__c, QuoteId
                                          FROM QuoteLineItem WHERE QuoteId=:testQuote.Id];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        insert fssetting;*/
        
        QuoteLineItem qItem = quoteItems.get(0);
        qItem.Installation_Status__c = fssetting.Status_Value_for_Install_of_a_Product__c;
        try {
            update qItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Installation Price'), 'message=' + e.getMessage());
        }
        
    }
    
    static testMethod void testInstallationError3(){
        Quote testQuote = [SELECT Id, Name FROM Quote WHERE Name='TestAccount Opportunity Quote'];
        /*Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];*/
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = [SELECT Id, Service_Frequency__c, Installation_Price__c, Service_Price_Per_Unit__c, Installation_Status__c, QuoteId, Product2Id
                                          FROM QuoteLineItem WHERE QuoteId=:testQuote.Id];
        
        QuoteLineItem qItem = quoteItems.get(0);
        Product2 testProduct = [SELECT Id, Family, Item_Type__c, Allowable_Frequencies__c FROM Product2 WHERE Id=:qItem.Product2Id];
        testProduct.Item_Type__c=fssetting.Item_Type_for_Consumables__c;
        update testProduct;
        
        
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        insert fssetting;*/
        
        qItem.Service_Frequency__c=fssetting.Non_Recurring_Frequency_Value__c;
        qItem.Installation_Status__c = fssetting.Status_Value_for_Install_of_a_Product__c;
        qItem.Installation_Price__c = 1;
        qItem.Service_Price_Per_Unit__c = null;
        Test.startTest();
        try {
            update qItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Installation Status for a One-Time Consumable Product'), 'message=' + e.getMessage());
        }
        Test.stopTest();
        
    }
    
    static testMethod void testInsertNoErrorQuoteSyncInsert(){
        Id pBook = Test.getStandardPricebookId();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<QuoteLineItem> quoteItems = new List<QuoteLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        Opportunity op = [SELECT Id, Name, AccountId, SyncedQuoteId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        
        Quote testQuote = [SELECT Id, Name, OpportunityId FROM Quote WHERE OpportunityId=:op.Id LIMIT 1];
        
        QuoteLineItemSyncState.invoker = null;
        
        Test.startTest();
        for(Integer i=0; i<3; i++) {
            oppItems.add(
                new OpportunityLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OpportunityId=op.Id
                )
            );
        } 
        insert oppItems;
        
        for(Integer i=0; i<3; i++) {
            quoteItems.add(
                new QuoteLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    QuoteId=testQuote.Id, 
                    OpportunityLineItem=oppItems.get(i)
                )
            );
        } 
        insert quoteItems;
        Test.stopTest();
    }
}