/**
 * Unit test for SentimentSchedulableImpl.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class SentimentSchedulableImplTest {
    
    static testmethod void testExecute() {
        // Create custom settings
        SentimentBatchSettings__c sentimentSettings = new SentimentBatchSettings__c();
        sentimentSettings.Name = 'Lead Event Sentiment';
        sentimentSettings.Query__c = 'SELECT Id, Name FROM LEAD';
        sentimentSettings.Source_Field__c = 'Name';
        sentimentSettings.Target_Field__c = 'N/A';
        
        insert sentimentSettings;
        
        // Invoke schedulable
        SentimentSchedulableImpl sched = new SentimentSchedulableImpl('Test', 'Lead Event Sentiment');
        sched.execute(null);
    }
}