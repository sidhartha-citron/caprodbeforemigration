/**
 * Unit tests for OppCloneController.
 * @author Ahsan Butt
 */
@isTest
private class OppCloneControllerTest {
    private static final String FIELD_SET_NAME_OPP = 'Clone_Fields';
    private static final String FIELD_SET_NAME_OLI = 'Clone_Fields';
    
    static testMethod void testClone() {
        // Create custom setting (field set names)
        OpportunityCloneSettings__c cloneSettings = new OpportunityCloneSettings__c();
        cloneSettings.Name = 'Opp Clone';
        cloneSettings.field_set_name__c = FIELD_SET_NAME_OPP;
        cloneSettings.Opp_Product_Field_Set__c = FIELD_SET_NAME_OLI;
        
        insert cloneSettings;
        
        // Create accounts
        TestDataFactory.crtAcctContact(2, 0); 
        List<Account> a = TestDataFactory.accounts;
        
        
        // Create Opp and OLI (as well as underlying product, etc.) 
		Product2 prod = new Product2(
            Name='TestProduct',
            Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
            IsActive=TRUE, 
            Available_As_Related_Product__c=TRUE, 
            Family='Pest Control', 
            //Item_Type__c= (i==0) ? 'Consumables' : 'Service'
            Item_Type__c= 'Service'
        );
        
        insert prod;
        
        PricebookEntry pe = new PricebookEntry(
            Pricebook2Id=Test.getStandardPricebookId(), 
            Product2Id=prod.Id, 
            UnitPrice=1.0, 
            IsActive=TRUE
        );
        
        insert pe;
        
        Opportunity opp = new Opportunity();
        opp.Name =' Test opp';
        opp.AccountId = a[0].Id;
        opp.Amount = 100;
        opp.StageName = 'Prospect';
        opp.CloseDate = Date.today();
        opp.Pricebook2Id = Test.getStandardPricebookId();
        
        insert opp;
        
        OpportunityLineItem oli = new OpportunityLineItem(
            Product2Id=pe.Id,  
            Service_Frequency__c= 'One-Time', 
            UnitPrice=1.0, 
            Service_Price_Per_Unit__c=1.0, 
            Quantity=1, 
            OpportunityId=opp.Id
        );
        
        insert oli;
        
        // Test successful clone
        OppCloneController.CloneResultMap resultMap = OppCloneController.cloneOpp(opp.Id, new List<String>{a[1].Id}, false);
        
        System.assertEquals(1, resultMap.successes.size(), 'Should be 1 successful clone result');
    }
    
    static testMethod void testGets() {
        //Insert acct and Opp to "get"
        TestDataFactory.crtAcctContact(1, 0); 
		Account a = TestDataFactory.accounts[0]; 
        
        Opportunity opp = new Opportunity();
        opp.Name =' Test opp';
        opp.AccountId = a.Id;
        opp.Amount = 100;
        opp.StageName = 'Prospect';
        opp.CloseDate = Date.today();
        
        insert opp;
        
        // Invoke getOpp()
        Opportunity actualOpp = OppCloneController.getOpp(opp.Id);
        
        System.assertEquals(opp.Id, actualOpp.Id, 'getOpp should return correct oppId');
        
        // Invoke getRecords()
        List<Account> actualAccts = OppCloneController.getRecords(new List<String>{a.Id});
        
        System.assertEquals(a.Id, actualAccts.get(0).Id, 'getRecords should return correct accts');
        
        // Invoke getErrorResult()
        OppCloneController.getErrorResult(new List<Database.Error>(), a);
    }
}