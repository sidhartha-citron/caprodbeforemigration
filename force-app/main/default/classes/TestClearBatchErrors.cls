@isTest
public class TestClearBatchErrors {
    
    static testMethod void testDelete() {
        Batch_Errors__c testError = new Batch_Errors__c();
        insert testError;
        
        Test.startTest();
        
        ClearBatchErrors testRun = new ClearBatchErrors();
        Database.executeBatch(testRun);
        
        Test.stopTest();
    }

}