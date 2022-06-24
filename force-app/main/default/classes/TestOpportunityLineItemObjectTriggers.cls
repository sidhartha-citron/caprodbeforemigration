@isTest
public class TestOpportunityLineItemObjectTriggers {
    
    @TestSetup static void setup() {
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
        
        TestDataFactory.crtAcctContact(1, 1); 
        Account a = TestDataFactory.accounts[0]; 
        
        Contact c = TestDataFactory.contacts[0];
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Approved'
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
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    //Item_Type__c= (i==0) ? 'Consumables' : 'Service'
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
            Name=op.Name+'Quote', 
            Pricebook2Id=pBook
        );
        
        insert testQuote;
    }
    
    static testMethod void testInsertNoError(){
        Id pBook = Test.getStandardPricebookId();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        
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
    }
    
    static testMethod void testUpdateFrequencyError1(){
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        OpportunityLineItem opItem = oppItems.get(0);
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        insert fssetting;*/
        
        opItem.Service_Frequency__c='28 Days';
        
        try {
            update opItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Applicable frequencies are'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testUpdateFrequencyError2(){
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        OpportunityLineItem opItem = oppItems.get(0);
        
        Product2 testProduct = [SELECT Id, Family, Item_Type__c, Allowable_Frequencies__c FROM Product2 WHERE Id=:opItem.Product2Id];
        testProduct.Allowable_Frequencies__c=null;
        update testProduct;
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        insert fssetting;*/
        
        opItem.Service_Frequency__c='28 Days';
        
        try {
            update opItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('cannot be a recurring service/delivery'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testUpdateInstallationError1(){
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c, Installation_Status__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        OpportunityLineItem opItem = oppItems.get(0);
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        insert fssetting;*/
        
        opItem.Installation_Price__c=1;
        
        try {
            update opItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Installation Status'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testUpdateInstallationError2(){
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c, Installation_Status__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        OpportunityLineItem opItem = oppItems.get(0);
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        insert fssetting;*/
        
        opItem.Installation_Status__c=fssetting.Status_Value_for_Install_of_a_Product__c;
        
        try {
            update opItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Installation Price'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testUpdateInstallationError3(){
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c, Installation_Status__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];
        
        OpportunityLineItem opItem = oppItems.get(0);
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        insert fssetting;*/
        
        Product2 testProduct = [SELECT Id, Family, Item_Type__c FROM Product2 WHERE Id=:opItem.Product2Id];
        testProduct.Item_Type__c = fssetting.Item_Type_for_Consumables__c;
        update testProduct;
        
        opItem.Service_Frequency__c=fssetting.Non_Recurring_Frequency_Value__c;
        opItem.Installation_Status__c=fssetting.Status_Value_for_Install_of_a_Product__c;
        opItem.Installation_Price__c=1;
        opItem.Service_Price_Per_Unit__c = null;
        
        try {
            update opItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('One-Time Consumable Product'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testDelete(){
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        List<OpportunityLineItem> oppItems = [SELECT Id, Product2Id, Service_Frequency__c, UnitPrice, Service_Price_Per_Unit__c, Quantity, OpportunityId, Installation_Price__c
                                              FROM OpportunityLineItem WHERE OpportunityId=:op.Id];
        delete oppItems;
    }
    
    static testMethod void testDecreaseQuantityWithSurveyAsset(){
        Id pBook = Test.getStandardPricebookId();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        Opportunity op = [SELECT Id, Name, AccountId, Site_Survey__c FROM Opportunity Limit 1];
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        List<Product2> products = [SELECT Id FROM Product2];
        Survey_Location__c location = [SELECT Id, Site_Survey__c FROM Survey_Location__c WHERE Site_Survey__c=:op.Site_Survey__c LIMIT 1].get(0);        
        
        OpportunityLineItem newItem = new OpportunityLineItem(
            Product2Id=pEntries.get(0).Id,  
            Service_Frequency__c=frequencies.get(0), 
            UnitPrice=1.0, 
            Service_Price_Per_Unit__c=1.0, 
            Quantity=2, 
            OpportunityId=op.Id, 
            SurveyAssetCountChecker__c=2
        );
        insert newItem;
        
        for(Integer i=0; i<3; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=op.Id,  
                    Originating_Record_ID__c=newItem.Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=op.Site_Survey__c, 
                    Service_Frequency__c=newItem.Service_Frequency__c, 
                    Survey_Location__c=location.Id
                )
            );
        }
        insert surveyAssetLocations;
        
        newItem.Quantity=1;
        try {
            update newItem;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Unallocate Site Survey Assets'), 'message=' + e.getMessage());
        }
    }
    
    static testMethod void testtDecreaseQuantityWithSurveyAssetNoError(){
        Id pBook = Test.getStandardPricebookId();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        
        OpportunityLineItem newItem = new OpportunityLineItem(
            Product2Id=pEntries.get(0).Id,  
            Service_Frequency__c=frequencies.get(0), 
            UnitPrice=1.0, 
            Service_Price_Per_Unit__c=1.0, 
            Quantity=2, 
            OpportunityId=op.Id
        );
        insert newItem;
        
        newItem.Quantity=1;
        update newItem;
    }
    
    static testMethod void testInsertNoErrorQuoteSyncInsert(){
        Id pBook = Test.getStandardPricebookId();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<QuoteLineItem> quoteItems = new List<QuoteLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        
        Test.startTest();
            
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        Opportunity op = [SELECT Id, Name, AccountId, SyncedQuoteId FROM Opportunity Limit 1];
        
        Quote testQuote = [SELECT Id, Name, OpportunityId FROM Quote WHERE OpportunityId=:op.Id LIMIT 1];
        
        op.SyncedQuoteId = testQuote.Id;
        update op;
        
        QuoteLineItemSyncState.invoker = null;
        
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
    
    static testMethod void testInsertNoErrorQuoteSyncUpdate(){
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = new List<QuoteLineItem>();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        
        Test.startTest();
        Opportunity op = [SELECT Id, Name, AccountId, SyncedQuoteId FROM Opportunity Limit 1];
        
        Quote testQuote = [SELECT Id, Name, OpportunityId FROM Quote WHERE OpportunityId=:op.Id LIMIT 1];
        
        op.SyncedQuoteId = testQuote.Id;
        update op;
        
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
        
        QuoteLineItemSyncState.invoker = null;
        oppItems.get(0).Service_Price_Per_Unit__c =15.0;
        update oppItems.get(0);
        Test.stopTest();
    }

   // Check to see if override values and original values will be stamped on the OLI.
    static testMethod void testCommissionOverridesPositive(){
        Id pBook = Test.getStandardPricebookId();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity LIMIT 1];
        
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

        OpportunityLineItem overrideOli = [SELECT Id 
                                            FROM OpportunityLineItem 
                                            WHERE Id=:oppItems[0].Id];

        overrideOli.CPQ_Commission_Override_Quantity__c = 2;
        overrideOli.CPQ_Commission_Override_Frequency__c = frequencies.get(2);
        overrideOli.CPQ_Commission_Override_Service_Price__c = 3;
        update overrideOli;

        overrideOli = [SELECT Id,
                            Service_Frequency__c,
                            Service_Price_Per_Unit__c, 
                            Quantity, 
                            CPQ_Original_Quantity__c, 
                            CPQ_Original_Frequency__c,
                            CPQ_Original_Service_Price_Per_Unit__c  
                        FROM OpportunityLineItem 
                        WHERE Id=:oppItems[0].Id];

        system.assertEquals(frequencies.get(2), overrideOli.Service_Frequency__c);
        system.assertEquals(3, overrideOli.Service_Price_Per_Unit__c);
        system.assertEquals(2, overrideOli.Quantity);
        system.assertEquals(frequencies.get(0), overrideOli.CPQ_Original_Frequency__c);
        system.assertEquals(1, overrideOli.CPQ_Original_Quantity__c);
        system.assertEquals(1, overrideOli.CPQ_Original_Service_Price_Per_Unit__c);
    }

}