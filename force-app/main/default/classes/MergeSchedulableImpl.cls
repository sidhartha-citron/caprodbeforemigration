/**
 * A generic schedulable implementation that kicks off a batch job to perform merges based on a specified custom setting.
 * 
 * @author Ahsan Butt
 */

public class MergeSchedulableImpl implements ICustomSchedulable {
    public String batchJobName;
    public String customSettingsRecordName;
    
    private Integer DEFAULT_BATCH_SIZE = 20;
    
    private String STATUS_TO_BE_PROCESSED = 'To be Processed';
    
    public MergeSchedulableImpl() {
    	setBatchJobName('Order Merge Batch Job');
        setCustomSettingsRecordName('Order Merge');
    }
    
    public MergeSchedulableImpl(String jobName, String csRecordName) {
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
        List<OrderMergeBatchSettings__c> mergeSettings = [SELECT Name,Batch_Size__c, Order_Item_Filters__c, 
                                                          	Order_Item_Field_Set__c, Order_Item_Filter_Product_Codes__c
                                                     	  FROM OrderMergeBatchSettings__c
                                                     	  WHERE Name =: customSettingsRecordName LIMIT 1];
        
        OrderMergeBatchSettings__c mergeS = mergeSettings[0];
        
        Map<String, String> params = new Map<String, String>();
        params.put('OrderItemFilters', mergeS.Order_Item_Filters__c);
        params.put('OrderItemFieldSet', mergeS.Order_Item_Field_Set__c);
        params.put('OrderItemFilterProductCodes', mergeS.Order_Item_Filter_Product_Codes__c);
        
        String query = 'SELECT Id, Surviving_Order__c, Status, Prevent_Invoice_Change_Ticket__c, Order_Merge_Job_Status__c, Order_Merge_Job_Message__c FROM Order WHERE Surviving_Order__c != null AND Order_Merge_Job_Status__c = \'' + STATUS_TO_BE_PROCESSED + '\'';
        String batchExecutorClass = 'OrderMergeBatchExecutorImpl';
        
        BatchJobImpl b = new BatchJobImpl(batchJobName, query, false, batchExecutorClass, params);
        
        Integer batchSize = mergeS.Batch_Size__c != null ? (Integer) mergeS.Batch_Size__c : DEFAULT_BATCH_SIZE;
        Database.executeBatch(b, batchSize);
    }
}