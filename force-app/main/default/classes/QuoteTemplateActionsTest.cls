@isTest private class QuoteTemplateActionsTest {
    
    static testMethod void QuoteTemplateActionsTest_1() {
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
        
        QuoteLineItem qli1 = new QuoteLineItem(
            QuoteId=quote.Id,
            PriceBookEntryId=pbe1.Id,
            UnitPrice=pbe1.UnitPrice,
            Quantity=1, 
			Service_Price_Per_Unit__c=pbe1.UnitPrice
        );
        QuoteLineItem qli2 = new QuoteLineItem(
            QuoteId=quote.Id,
            PriceBookEntryId=pbe2.Id,
            UnitPrice=pbe2.UnitPrice,
            Quantity=1, 
			Service_Price_Per_Unit__c=pbe1.UnitPrice
        );
        insert new List<QuoteLineItem> { qli1, qli2 };
    
        QuoteTemplateActions con = new QuoteTemplateActions(new ApexPages.StandardController(Quote));
        con.SelectTemplateRedirect();
    }
    
    static testMethod void QuoteTemplateActionsTest_2() {
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
        
        QuoteLineItem qli1 = new QuoteLineItem(
            QuoteId=quote.Id,
            PriceBookEntryId=pbe1.Id,
            UnitPrice=pbe1.UnitPrice,
            Quantity=1, 
			Service_Price_Per_Unit__c=pbe1.UnitPrice
        );
        QuoteLineItem qli2 = new QuoteLineItem(
            QuoteId=quote.Id,
            PriceBookEntryId=pbe2.Id,
            UnitPrice=pbe2.UnitPrice,
            Quantity=1, 
			Service_Price_Per_Unit__c=pbe1.UnitPrice
        );
        insert new List<QuoteLineItem> { qli1, qli2 };
    
        QuoteTemplateActions con = new QuoteTemplateActions(new ApexPages.StandardController(Quote));
        con.AutoPdfRedirect();
    }
    
    static testMethod void QuoteTemplateActionsTest_3() {
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
        
        QuoteLineItem qli1 = new QuoteLineItem(
            QuoteId=quote.Id,
            PriceBookEntryId=pbe1.Id,
            UnitPrice=pbe1.UnitPrice,
            Quantity=1, 
			Service_Price_Per_Unit__c=pbe1.UnitPrice
        );
        QuoteLineItem qli2 = new QuoteLineItem(
            QuoteId=quote.Id,
            PriceBookEntryId=pbe2.Id,
            UnitPrice=pbe2.UnitPrice,
            Quantity=1, 
			Service_Price_Per_Unit__c=pbe1.UnitPrice
        );
        insert new List<QuoteLineItem> { qli1, qli2 };
    
        QuoteTemplateActions con = new QuoteTemplateActions(new ApexPages.StandardController(Quote));
        con.SendDocusignRedirect();
    }
}