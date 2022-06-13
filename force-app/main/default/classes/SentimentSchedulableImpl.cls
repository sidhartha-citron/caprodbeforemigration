/**
 * A schedulable implementation that kicks off a batch job to retrieve sentiment scores.
 * 
 * @author Ahsan Butt
 */

public class SentimentSchedulableImpl implements ICustomSchedulable {
    public String batchJobName;
    public String customSettingsRecordName;
    
    private String BATCH_EXECUTOR_IMPL_CLASS_NAME = 'SentimentBatchExecutorImpl';
    private Integer DEFAULT_BATCH_SIZE = 15;
    
    public SentimentSchedulableImpl() {}
    
    public SentimentSchedulableImpl(String jobName, String csRecordName) {
        setBatchJobName(jobName);
        setCustomSettingsRecordName(csRecordName);
    }
    
    public void setBatchJobName(String name) {
        batchJobName = name;
    }
    
    public void setCustomSettingsRecordName(String name) {
        customSettingsRecordName = name;
    }
    
    public void execute(SchedulableContext context) {
        List<SentimentBatchSettings__c> sentimentSettings;
     
        if (String.isNotBlank(customSettingsRecordName)) {
            sentimentSettings = [SELECT Name, Query__c, Retrieve_Only_Recently_Modified__c, Source_Field__c, Target_Field__c, Batch_Size__c, Text_Transforms__c 
                                 FROM SentimentBatchSettings__c
                                 WHERE Name =: customSettingsRecordName LIMIT 1];
        } else {
            sentimentSettings = [SELECT Name, Query__c, Retrieve_Only_Recently_Modified__c, Source_Field__c, Target_Field__c, Batch_Size__c, Text_Transforms__c 
                                 FROM SentimentBatchSettings__c LIMIT 1];
        }
        
        SentimentBatchSettings__c sentiment = sentimentSettings[0];

        Map<String, String> params = new Map<String, String>();
        params.put('Source_Field__c', sentiment.Source_Field__c);
        params.put('Target_Field__c', sentiment.Target_Field__c);
        params.put('Text_Transforms__c', sentiment.Text_Transforms__c);
        
        BatchJobImpl b = new BatchJobImpl(batchJobName, sentiment.Query__c, sentiment.Retrieve_Only_Recently_Modified__c, BATCH_EXECUTOR_IMPL_CLASS_NAME, params);
        
        Integer batchSize = sentiment.Batch_Size__c != null ? (Integer) sentiment.Batch_Size__c : DEFAULT_BATCH_SIZE;
        Database.executeBatch(b, batchSize);
    }
}