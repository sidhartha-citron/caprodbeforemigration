/**
 * A generic schedulable implementation that kicks off a batch job to perform Work Order merges based on a specified custom setting. This is related to the Order Merge functionality.
 * 
 * @author Ahsan Butt
 */

public class WorkOrderMergeSchedulableImpl implements ICustomSchedulable {
    public String batchJobName;
    public String customSettingsRecordName;
    
    private Integer DEFAULT_BATCH_SIZE = 10;
    
    private final static String MERGE_STATUS_READY_FOR_WO_REPARENTING = 'Ready for Work Order Reparenting';
    
    public WorkOrderMergeSchedulableImpl() {
    	setBatchJobName('Work Order Merge Batch Job');
        setCustomSettingsRecordName('Work Order Merge');
    }
    
    public WorkOrderMergeSchedulableImpl(String jobName, String csRecordName) {
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
        List<WorkOrderMergeBatchSettings__c> mergeSettings = [SELECT Name, Batch_Size__c
                                                     	  	  FROM WorkOrderMergeBatchSettings__c
                                                     	  	  WHERE Name =: customSettingsRecordName LIMIT 1];
        
        WorkOrderMergeBatchSettings__c mergeS = mergeSettings[0];
        
        
        String query = 'SELECT Id, Order__c, Order__r.Surviving_Order__c, (SELECT Id, Order_Product__c, OrderId FROM WorkOrderLineItems WHERE Order_Product__c != null) FROM WorkOrder WHERE Order__r.Surviving_Order__c != null AND Order__r.Order_Merge_Job_Status__c = \'' + MERGE_STATUS_READY_FOR_WO_REPARENTING + '\'';
        String batchExecutorClass = 'WorkOrderBatchExecutorImpl';
        
        BatchJobImpl b = new BatchJobImpl(batchJobName, query, false, batchExecutorClass, null);
        
        Integer batchSize = mergeS.Batch_Size__c != null ? (Integer) mergeS.Batch_Size__c : DEFAULT_BATCH_SIZE;
        
        Database.executeBatch(b, batchSize);
    }
}