@isTest private class QuoteTest {
    
    @testSetup
    static void setup() {
        Id pricebookId = Test.getStandardPricebookId();
        
        Product2 product1 = new Product2(
            Name='Product1',
            ProductCode='Code',
            isActive=true
        );
        Product2 product2 = new Product2(
            Name='Product2',
            ProductCode='Code',
            isActive=true
        );
        insert new list<Product2> { product1, product2 };
        
        PricebookEntry pbe1 = new PricebookEntry(
            Pricebook2Id = pricebookId, 
            Product2Id = product1.Id,
            UnitPrice = 10000, 
            IsActive = true
        );
        PricebookEntry pbe2 = new PricebookEntry(
            Pricebook2Id = pricebookId, 
            Product2Id = product2.Id,
            UnitPrice = 10000, 
            IsActive = true
        );
        insert new list<PricebookEntry> { pbe1, pbe2 };
        
        TestDataFactory.crtAcctContact(1, 1);
        
        Opportunity op = new Opportunity(
            AccountId=TestDataFactory.accounts[0].Id,
            Name='Opportunity',
            StageName='Qualified Prospect',
            CloseDate=Date.today(),
            PriceBook2Id=pricebookId
        );
        insert op;

        OpportunityContactRole oppRole = new OpportunityContactRole(
            OpportunityId=op.Id,
            ContactId=TestDataFactory.contacts[0].Id, 
            Role='Decision Maker',
            isPrimary=TRUE
        );
        insert oppRole;
        
        Quote quote = new Quote(
            Name='Quote',
            OpportunityId=op.Id,
            PriceBook2Id=pricebookId
        );
        insert quote;
    }
    
    static testMethod void QuoteLineItemTriggerTest() {
        Quote quote = [SELECT Id FROM Quote LIMIT 1];
        List<PricebookEntry> pbeList = [SELECT Id, UnitPrice FROM PricebookEntry LIMIT 2];
        
        PricebookEntry pbe1 = pbeList[0];
        PricebookEntry pbe2 = pbeList[1];
        
        QuoteLineItem qli1 = new QuoteLineItem(
            QuoteId=quote.Id,
            PriceBookEntryId=pbe1.Id,
            UnitPrice=pbe1.UnitPrice,
            Quantity=1, 
			Service_Price_Per_Unit__c=1.0
        );
        QuoteLineItem qli2 = new QuoteLineItem(
            QuoteId=quote.Id,
            PriceBookEntryId=pbe2.Id,
            UnitPrice=pbe2.UnitPrice,
            Quantity=1, 
			Service_Price_Per_Unit__c=1.0
        );
        
        Test.startTest();
        
        insert new List<QuoteLineItem> { qli1, qli2 };
    
        Blob attachBody = Blob.valueOf('attachment body');
        Attachment attach = new Attachment(Name = 'TestAttachment', ParentId = quote.Id, Body = attachBody);
        insert attach;
        
        dsfs__DocuSign_Status__c dsStatus = new dsfs__DocuSign_Status__c(
            Quote__c=quote.Id,
            dsfs__Envelope_Status__c='Completed'
        );
        insert dsStatus;
        
        Test.stopTest();
    }
    
    static testMethod void QuoteAutoSyncUtil_syncQuoteTest() {
        Quote quote = [SELECT Id FROM Quote LIMIT 1];
        
        Test.startTest();
        
        QuoteAutoSyncUtil.syncQuote(new Set<Id>{quote.Id});
        QuoteAutoSyncUtil.signedQuote(new Set<Id>{quote.Id});
        
        Test.stopTest();
    }
}