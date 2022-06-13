@isTest
public class TestContentVersionTrigger {
    
    @testSetup
    static void setup() {
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<QuoteLineItem> quoteItems = new List<QuoteLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.System_Administrator_Profile_Id__c  = UserInfo.getProfileId();
        insert fssetting;
        
        TestDataFactory.crtAcctContact(1,1);
        
        Test.startTest();
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
            Name=TestDataFactory.accounts[0].Name+' Opportunity',
            AccountId=TestDataFactory.accounts[0].Id,
            StageName='Presentation', 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In', 
            Site_Survey__c=TestDataFactory.accounts[0].Site_Survey__c
        ); 
        insert op;
        
        OpportunityContactRole oppRole = new OpportunityContactRole(
            OpportunityId=op.Id,
            ContactId=TestDataFactory.contacts[0].Id, 
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
        Test.stopTest();
    }
    
    private static testMethod void testCreate() {
        List<Group> grp = [SELECT Id from group where name like 'Cash%']; 
        System.debug('##GROUP##' + grp.size());
        DocuSign_Status_Ticket__c dst = new DocuSign_Status_Ticket__c();
        dst.Name = 'FILEUPLOAD';
        dst.File_Name__c = 'Invoicing and Payment';
        dst.Associated_Object__c = 'dsfs__DocuSign_Status__c';
        if(grp.size()>0){dst.Ticket_Owner__c = grp[0].Id;}
        dst.Ticket_Record_Type__c = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        dst.Ticket_Status__c = 'New';
        dst.Ticket_Subject__c = 'Payment Options Submitted';
        dst.Ticket_Type__c = 'A/R Inquiry';
        
        insert dst;
        
        Account a = [SELECT Id FROM Account LIMIT 1];
        Contact c = [SELECT Id FROM Contact WHERE AccountId = :a.Id LIMIT 1];
        Quote q = [SELECT Id,OpportunityId FROM Quote Limit 1];
        dsfs__DocuSign_Status__c dstatus = new dsfs__DocuSign_Status__c();
        dstatus.dsfs__Company__c = a.Id;
        dstatus.dsfs__Contact__c = c.Id;
        dstatus.Quote__c = q.Id;
        dstatus.dsfs__Opportunity__c = q.OpportunityId;
        insert dstatus;
        
        ContentVersion contentVersion_1 = new ContentVersion(
            Title = 'English Invoicing and Payment Options',
            PathOnClient = 'English Invoicing and Payment Options.pdf',
            VersionData = Blob.valueOf('Test Content'),
            IsMajorVersion = true
        );
        insert contentVersion_1;
        
        ContentVersion contentVersion_2 = [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion_1.Id LIMIT 1];
        List<ContentDocument> documents = [SELECT Id, Title, LatestPublishedVersionId FROM ContentDocument];
        
        ContentDocumentLink contentlink = new ContentDocumentLink();
        contentlink.LinkedEntityId = dstatus.id;
        contentlink.contentdocumentid = contentVersion_2.contentdocumentid;
        contentlink.ShareType = 'V';
        insert contentlink; 
        
        System.assertEquals(documents.size(), 1);
        System.assertEquals(documents[0].Id, contentVersion_2.ContentDocumentId);
        System.assertEquals(documents[0].LatestPublishedVersionId, contentVersion_2.Id);
        System.assertEquals(documents[0].Title, contentVersion_2.Title);
    }
}