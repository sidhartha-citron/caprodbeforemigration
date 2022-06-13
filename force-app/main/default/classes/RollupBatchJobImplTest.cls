/**
 * Test class for RollupBatchJobImpl.
 * 
 * @author Ahsan Butt
 */
@isTest
public class RollupBatchJobImplTest {
	
    static testMethod void testQuery() {
        String jobName = 'Test Job';
        String sObj = 'Opportunity';
        String sField = 'Amount';
        String mField = 'AccountId';
        
        String tObj = '';
        String tField = '';
        String filt = '';
        String func = '';
        
        // 1. Test simple 'SELECT sourceField, mergeField FROM sourceObj'
        String q = 'SELECT ' + sField + ', ' + mField + ' FROM ' + sObj;
		RollupBatchJobImpl b = new RollupBatchJobImpl(jobName, sObj, sField, mField, tObj, tField, filt, func);
        Database.QueryLocator qloc = b.start(null);
        System.assertEquals(q, qloc.getQuery().trim(), 'Simple query should match');
        
        // 2. Test w/filter and last mod 'SELECT sourceField, mergeField FROM sourceObj WHERE filt AND (LastModifiedDate ...)'
        // first persist record for previous batch run
        b.finish(null);
        b = new RollupBatchJobImpl(jobName, sObj, sField, mField, tObj, tField, filt, func);
        qloc = b.start(null);
        System.assert(qloc.getQuery().contains('LastModifiedDate'), 'Query with last modified should match');
    }
    
    static testMethod void testExecute() {
        String jobName = 'Test Job';
        String sObj = 'Opportunity';
        String sField = 'Amount';
        String mField = 'AccountId';
        
        String tObj = 'Account';
        String tField = 'AnnualRevenue';
        String filt = '';
        String func = 'COUNT';
        
        // Insert test records
        TestDataFactory.crtAcctContact(1, 1);
               
        Opportunity opp = new Opportunity();
        opp.Name =' Test opp';
        opp.AccountId = TestDataFactory.accounts[0].Id;
        opp.Amount = 100;
        opp.StageName = 'Prospect';
        opp.CloseDate = Date.today();
        
        insert opp;
        
		RollupBatchJobImpl b = new RollupBatchJobImpl(jobName, sObj, sField, mField, tObj, tField, filt, func);
        b.execute(null, new List<Opportunity>{opp});
        
        System.assertEquals(1, b.totalRecords, 'Total Records should be 1 after execute()');
    }
}