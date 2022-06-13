/**
 * A schedulable implementation that kicks off a batch job to perform service type roll-ups based on a specified custom setting.
 * 
 * @author Ahsan Butt
 */

public class ServiceTypeRollupSchedulableImpl implements ICustomSchedulable {
    public String batchJobName;
    public String customSettingsRecordName;
    
    private Integer DEFAULT_BATCH_SIZE = 20;
    
    public ServiceTypeRollupSchedulableImpl() {}
    
    public ServiceTypeRollupSchedulableImpl(String jobName, String csRecordName) {
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
        List<ServiceTypeRollupSchedulableImpl__c> rollupSettings; 
        
        if (String.isNotBlank(customSettingsRecordName)) {
            rollupSettings = [SELECT Name, Order_Rollup_Batch_Size__c, Account_Rollup_Batch_Size__c
                              FROM ServiceTypeRollupSchedulableImpl__c
                              WHERE Name =: customSettingsRecordName LIMIT 1];
        } else {
            rollupSettings = [SELECT Name, Order_Rollup_Batch_Size__c, Account_Rollup_Batch_Size__c
                              FROM ServiceTypeRollupSchedulableImpl__c LIMIT 1];
        }
        
        ServiceTypeRollupSchedulableImpl__c rollup = rollupSettings[0];
        
        Integer acctBatchSize = rollup.Account_Rollup_Batch_Size__c != null ? (Integer) rollup.Account_Rollup_Batch_Size__c  : DEFAULT_BATCH_SIZE;
        OrderServiceTypeRollupBatchJobImpl b = new OrderServiceTypeRollupBatchJobImpl(batchJobName, acctBatchSize);
        
        Integer orderBatchSize = rollup.Order_Rollup_Batch_Size__c != null ? (Integer) rollup.Order_Rollup_Batch_Size__c  : DEFAULT_BATCH_SIZE;
        Database.executeBatch(b, orderBatchSize);
    }
}