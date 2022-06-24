/**
 * Test for LastRollupBatchJobImplTest
 * 
 * @author Ahsan Butt
 */
@isTest
public class LastRollupBatchJobImplTest {
	
    static testMethod void testRollup() {
        // Insert test records
        TestDataFactory.crtAcctContact(1, 1);
               
        Opportunity opp = new Opportunity();
        opp.Name =' Test opp';
        opp.AccountId = TestDataFactory.accounts[0].Id;
        opp.Amount = 100;
        opp.StageName = 'Prospect';
        opp.CloseDate = Date.today().addDays(-14);
        
        Opportunity oppTwo = new Opportunity();
        oppTwo.Name =' Test opp 2';
        oppTwo.AccountId = TestDataFactory.accounts[0].Id;
        oppTwo.Amount = 100;
        oppTwo.StageName = 'Prospect';
        oppTwo.CloseDate = Date.today().addDays(-7);
        
        insert opp;
        insert oppTwo;
        List<Opportunity> opps = new List<Opportunity>{opp, oppTwo};
        //insert opps;
        
        LastRollupBatchExecutorImpl lastRollup = new LastRollupBatchExecutorImpl();
        Date last = (Date) lastRollup.rollup(opps, 'CloseDate', Schema.DisplayType.DATE);
        System.assertEquals(Date.today().addDays(-7), last, 'Most recent date should be the last date');
        lastRollup.rollup(opps, 'CreatedDate', Schema.DisplayType.DATETIME);
    }
}