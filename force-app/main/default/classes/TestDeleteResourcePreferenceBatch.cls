@isTest
public class TestDeleteResourcePreferenceBatch {
	
    @TestSetup
    static void setup() {
        TestDataFactory.crtBillToAcctContact(1, 1);
        
                
        ServiceResource sr = new ServiceResource();
        sr.Name = 'Test SR';
        sr.RelatedRecordId = UserInfo.getUserId();
        sr.IsActive = true;
        
        insert sr;
        
        ResourcePreference rp = new ResourcePreference();
        rp.PreferenceType = 'Preferred';
        rp.RelatedRecordId = TestDataFactory.accounts[0].Id;
        rp.ServiceResourceId = sr.Id;
        
        insert rp;
        
        Order o = new Order();
        o.AccountId = TestDataFactory.accounts[0].Id;
        o.Name = 'test order';
        o.Status = 'Draft';
        o.EffectiveDate = System.today();
        
        insert o;
    }
    
    @isTest
    static void testDeleteResourcePreferenceBatch() {
        ServiceResource sr = [SELECT Id, IsActive FROM ServiceResource LIMIT 1];
        sr.IsActive = false;
        
        update sr;
        
        Test.startTest();
        
        System.schedule('test', '0 0 23 * * ?', new DeleteResourcePreferenceBatch());
        
        Test.stopTest();
    }
    
    @isTest
    static void testDeleteResourcePreferenceBatchWithId() {
        ServiceResource sr = [SELECT Id, IsActive FROM ServiceResource LIMIT 1];
        sr.IsActive = false;
        
        update sr;
        
        Test.startTest();
        
        Database.executeBatch(new DeleteResourcePreferenceBatch(sr.Id));
        
        Test.stopTest();
    }
    
    @isTest
    static void testDeleteResourcePreferenceBatchWithAccountId() {
        ServiceResource sr = [SELECT Id, IsActive FROM ServiceResource LIMIT 1];
        sr.IsActive = false;
        
        update sr;
        
        Order o = [SELECT Id FROM Order LIMIT 1];
        
        Test.startTest();
        
        new DeleteResourcePreferenceBatch(true).handleRecords(new Set<Id> {o.Id});
        
        Test.stopTest();
    }
}