@isTest
public class TestSpawnWorkOrderFiles {
    
    static testMethod void testSpawnFiles(){
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'Weekly','Monthly','One-Time'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
        ContentVersion contentVersionInsert = new ContentVersion(
            Title = 'Test_11-28-2019-7-35',
            PathOnClient = 'Test.jpg',
            VersionData = Blob.valueOf('Test Content Data'),
            IsMajorVersion = true
        );
        insert contentVersionInsert;
        
        ContentVersion contentVersionSelect = [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE Id = :contentVersionInsert.Id LIMIT 1];
        List<ContentDocument> testFile = [SELECT Id, Title, LatestPublishedVersionId FROM ContentDocument WHERE Title = 'Test_11-28-2019-7-35'];
        System.assertEquals(testFile.size(), 1);
        
        TestDataFactory.crtBillToAcctContact(1, 0); 
        Account a = TestDataFactory.accounts[0];
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        WorkType testWorkType =  new WorkType(
            Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
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
        
        Opportunity op = new Opportunity(
            Name=a.Name+' Opportunity',
            AccountId=a.Id,
            StageName='Presentation', 
            CloseDate=System.today().addDays(1),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In', 
            Site_Survey__c=a.Site_Survey__c
        ); 
        insert op;
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today().addDays(3), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId, 
            Inventory_Allocated__c=TRUE, 
            OpportunityId=op.Id
        ); 
        insert o;
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=o.AccountId,
            Order__c=o.Id,
            StartDate=System.today().addDays(1), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=o.Pricebook2Id, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            Opportunity__c=op.Id, 
            Type__c='Installation'
        );
        insert testWorkOrder;
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        ContentDocumentLink testLinkOp = new ContentDocumentLink(
            ContentDocumentId=testFile[0].Id, 
            LinkedEntityId=op.Id, 
            ShareType='V'
        );
        ContentDocumentLink testLinkSs = new ContentDocumentLink(
            ContentDocumentId=testFile[0].Id, 
            LinkedEntityId=ss.Id, 
            ShareType='V'
        );
        insert new List<ContentDocumentLink>{testLinkOp, testLinkSs};
        
        Test.startTest();
	    SpawnWorkOrderFiles testRun = new SpawnWorkOrderFiles(testWorkOrder.Id);
        Database.executeBatch(testRun);
        Test.stopTest();
    }
}