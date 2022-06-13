/**
 * A generic schedulable implementation that kicks off a batch job to deactivate merged Order Items. This is related to the Order Merge functionality.
 * 
 * @author Ahsan Butt
 */

public class DeactivateMergedOIsSchedulableImpl implements ICustomSchedulable {
    public String batchJobName;
    public String customSettingsRecordName;
    
    private Integer DEFAULT_BATCH_SIZE = 5;
    
    private final static String MERGE_STATUS_PROCESSED = 'Processed';
    private final static String ORDER_STATUS_ACTIVE = 'Activated';
    
    public DeactivateMergedOIsSchedulableImpl() {
    	setBatchJobName('Deactivate Merged OIs Batch Job');
        setCustomSettingsRecordName('Deactivate Merged OIs');
    }
    
    public DeactivateMergedOIsSchedulableImpl(String jobName, String csRecordName) {
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
        List<DeactivateMergedOIsBatchSettings__c> mergeSettings = [SELECT Name, Batch_Size__c
                                                     	  	  		FROM DeactivateMergedOIsBatchSettings__c
                                                     	  	  		WHERE Name =: customSettingsRecordName LIMIT 1];
        
        DeactivateMergedOIsBatchSettings__c mergeS = mergeSettings[0];
        
        
        String query = 'SELECT Id, Active__c FROM OrderItem WHERE Order.Order_Merge_Job_Status__c = \'' + MERGE_STATUS_PROCESSED + '\' AND Order.Status != \'' + ORDER_STATUS_ACTIVE + '\'';
        String batchExecutorClass = 'DeactivateMergedOIsBatchExecutorImpl';
        
        BatchJobImpl b = new BatchJobImpl(batchJobName, query, false, batchExecutorClass, null);
        
        Integer batchSize = mergeS.Batch_Size__c != null ? (Integer) mergeS.Batch_Size__c : DEFAULT_BATCH_SIZE;
        
        Database.executeBatch(b, batchSize);
    }
}