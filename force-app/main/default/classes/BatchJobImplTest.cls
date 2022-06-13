/**
 * Unit tests for BatchJobImpl. Ensures correctness initialization of query, execution of specified executorImpl,
 * and persisting of batch job results record.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class BatchJobImplTest {
	
    static testmethod void testStart() {
        String query = 'SELECT Id FROM Lead';
        BatchJobImpl b = new BatchJobImpl('', query, true, null, null);
        
        Database.QueryLocator qloc = b.start(null);
        
        System.assert(qloc.getQuery().contains(query), 'Query should match.');
    }
    
    static testmethod void testExecuteCases() {
        Map<String, String> params = new Map<String, String>();
		
        List<sObject> records = getTestRecords(2);
        insert records;
        
        // Test happy case
        params.put(TestBatchExecutorImpl.WHAT_CASE, TestBatchExecutorImpl.CASE_HAPPY);
        BatchJobImpl b = new BatchJobImpl('', null, false, 'TestBatchExecutorImpl', params);
        b.execute(null, records);
        
        System.assertEquals(records.size(), b.totalRecords, 'Happy case should match total records');
        System.assertEquals(0, b.errors, 'Happy case should have no errors');
        
        // Test error case
        params.put(TestBatchExecutorImpl.WHAT_CASE, TestBatchExecutorImpl.CASE_ERROR);
        b = new BatchJobImpl('', null, false, 'TestBatchExecutorImpl', params);
        b.execute(null, records);
        
        System.assertEquals(records.size(), b.errors, 'Error case should have all errors');
        
        // Test exception case
        params.put(TestBatchExecutorImpl.WHAT_CASE, TestBatchExecutorImpl.CASE_EXCEPTION);
        b = new BatchJobImpl('', null, false, 'TestBatchExecutorImpl', params);
        b.execute(null, records);
        
        System.assertEquals(records.size(), b.errors, 'Exception case should have all errors');
        System.assert(b.notes.contains(TestBatchExecutorImpl.EXCEPTION_MSG), 'Exception case notes should contain exception message.');
    }
    
    static testMethod void testFinish() {
         Map<String, String> params = new Map<String, String>();
		
        List<sObject> records = getTestRecords(2);
        insert records;
        
 		// Run execute
 		String batchJobName = 'Test Batch Run';
        params.put(TestBatchExecutorImpl.WHAT_CASE, TestBatchExecutorImpl.CASE_HAPPY);
        BatchJobImpl b = new BatchJobImpl(batchJobName, null, false, 'TestBatchExecutorImpl', params);
        b.execute(null, records);
        b.finish(null);
        
        // Assert batch job results record was persisted
        List<Batch_Job_Results__c> results = [SELECT Id, Total_Records__c FROM Batch_Job_Results__c WHERE Name =: batchJobName];
        
        System.assertEquals(1, results.size(), 'Batch should have persisted one Batch_Job_Results__c record.');
        System.assertEquals(records.size(), results.get(0).Total_Records__c, 'Batch_Job_Results__c record should have persisted total records.');
    }
    
    private static List<sObject> getTestRecords(Integer num) {
        List<Contact> records = new List<Contact>();
        
        for (Integer i = 0; i < num; i++) {
            Contact c = new Contact();
            c.FirstName = 'foo' + i;
            c.LastName = 'bar' + i;
            records.add(c);
        }
        
        return records;
        
    }
}