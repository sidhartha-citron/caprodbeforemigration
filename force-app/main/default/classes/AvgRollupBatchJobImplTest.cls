/**
 * Test for AvgRollupBatchJobImplTest
 * 
 * @author Ahsan Butt
 */
@isTest
public class AvgRollupBatchJobImplTest {
	
    static testMethod void testRollup() {
        // Insert test records
        
        TestDataFactory.crtAcctContact(1,1);
        
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
        
        AvgRollupBatchExecutorImpl avgRollup = new AvgRollupBatchExecutorImpl();
        Double avg = (Double) avgRollup.rollup(opps, 'Amount', null);
        System.assertEquals(150, avg, 'Avg should return 150.');
    }
}