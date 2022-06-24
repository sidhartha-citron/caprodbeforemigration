/**
 * Test for CountRollupBatchJobImplTest
 * 
 * @author Ahsan Butt
 */
@isTest
public class CountRollupBatchJobImplTest {
	
    static testMethod void testRollup() {
        // Insert test records
        TestDataFactory.crtAcctContact(1, 1);
                
        Opportunity opp = new Opportunity();
        opp.Name =' Test opp';
        opp.AccountId = TestDataFactory.accounts[0].Id;
        opp.Amount = 100;
        opp.StageName = 'Prospect';
        opp.CloseDate = Date.today();
        
        Opportunity oppTwo = new Opportunity();
        oppTwo.Name =' Test opp 2';
        oppTwo.AccountId = TestDataFactory.accounts[0].Id;
        oppTwo.Amount = 200;
        oppTwo.StageName = 'Prospect';
        oppTwo.CloseDate = Date.today();
        
        insert opp;
        insert oppTwo;
        List<Opportunity> opps = new List<Opportunity>{opp, oppTwo};
        //insert opps;
        
        CountRollupBatchExecutorImpl countRollup = new CountRollupBatchExecutorImpl();
        Integer count = (Integer) countRollup.rollup(opps, 'Amount', null);
        System.assertEquals(opps.size(), count, 'Count should return 2.');
    }
}