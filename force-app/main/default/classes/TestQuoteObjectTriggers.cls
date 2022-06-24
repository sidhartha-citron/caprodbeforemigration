@isTest
public class TestQuoteObjectTriggers {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.System_Administrator_Profile_Id__c  = UserInfo.getProfileId();
        insert fssetting;
        
        TestDataFactory.crtAcctContact(1, 1);
        Account a = TestDataFactory.accounts.get(0); 
        a.Name = 'TestAccount'; 
        update a;
        Contact c = TestDataFactory.contacts.get(0);
        
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
                    ProductCode='1-6-001'+i
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
        
        /*Quote testQuote = new Quote(
            OpportunityId=op.Id, 
            Name=op.Name+'Quote', 
            Pricebook2Id=pBook
        );
        
        insert testQuote;
        
        op.SyncedQuoteId = testQuote.Id;
        update op;*/
    }
    
    static testMethod void testInsertQuote() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        Id pBook = Test.getStandardPricebookId();
        List<QuoteLineItem> quoteItems = new List<QuoteLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<PricebookEntry> pEntries = [SELECT Id, Pricebook2Id FROM PricebookEntry WHERE Pricebook2Id=:pBook];
        
        Contact newContact = new Contact(
            FirstName = 'TestFirstName', 
            LastName = 'TestLastName', 
            Email = 'testUser@UserCommunity.com', 
            AccountId = op.AccountId, 
            Phone = '123456789'            
        );
        insert newContact;
        
        Quote testQuote = new Quote(
            OpportunityId=op.Id, 
            Name=op.Name+'Quote', 
            ContactId=newContact.Id, 
            Pricebook2Id=pBook
        );
        
        insert testQuote;
        
        for(Integer i=0; i<3; i++) {
            quoteItems.add(
                new QuoteLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    QuoteId=testQuote.Id
                )
            );
        } 
        insert quoteItems;
    }
    
    static testMethod void testInsertQuoteSync() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity WHERE Name='TestAccount Opportunity'];
        
        Quote testQuote = new Quote(
            OpportunityId=op.Id, 
            Name=op.Name+'Quote', 
            Pricebook2Id=fssetting.Default_Opportunity_Price_Book_ID__c
        );
        
        insert testQuote;
        
        op.SyncedQuoteId = testQuote.Id;
        update op;
    }

}