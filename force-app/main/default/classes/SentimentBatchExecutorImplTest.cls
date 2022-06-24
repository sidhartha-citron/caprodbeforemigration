/**
 * Unit tests for SentimentBatchExecutorImpl.
 * 
 * @author Ahsan Butt
 */
@isTest
public class SentimentBatchExecutorImplTest {

    static testmethod void testExecute() {
        // Insert custom settings
        IndicoSentimentProviderImplTest.createSentimentProviderCustomSettings();
                
        // Set up mock with valid response
        Test.setMock(HttpCalloutMock.class, IndicoSentimentProviderImplTest.getSentimentMock());
        
        // Create record(s)
        List<Lead> leads = new List<Lead>();
        
        for (Integer i = 0; i < 3; i++) {
            Lead l = new Lead();
            l.firstName = 'Test' + i;
            l.lastName = 'Last' + i;
            l.Company = 'Acme Test Inc. #' + i;
            l.Description = 'Acme Industries #' + i;    
            l.Street = 'Acme St.';
            
            leads.add(l);
        }
        
        insert leads;
        
        // Create param map
        Map<String, String> params = new Map<String, String>();
        params.put('Source_Field__c', 'Description');
        params.put('Target_Field__c', 'Unit_Test_Sentiment_Score__c');
        
        // Invoke sentiment executor
        Test.startTest();
        
        SentimentBatchExecutorImpl sentimentExecutor = new SentimentBatchExecutorImpl();
        sentimentExecutor.execute(leads, params);
        
        Test.stopTest();
        
        System.assertEquals(0, sentimentExecutor.getNumErrors(), 'Should be no errors in executor');
        System.assertEquals(3, sentimentExecutor.getTotalRecords(), 'Should be 3 total records in executor');
    }
}