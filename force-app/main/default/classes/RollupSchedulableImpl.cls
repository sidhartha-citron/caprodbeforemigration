/**
 * A generic schedulable implementation that kicks off a batch job to perform roll-ups based on a specified custom setting.
 * 
 * @author Ahsan Butt
 */

public class RollupSchedulableImpl implements ICustomSchedulable {
    public String batchJobName;
    public String customSettingsRecordName;
    
    private Integer DEFAULT_BATCH_SIZE = 20;
    
    public RollupSchedulableImpl() {}
    
    public RollupSchedulableImpl(String jobName, String csRecordName) {
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
        List<RollupBatchSettings__c> rollupSettings;
        
        if (String.isNotBlank(customSettingsRecordName)) {
            rollupSettings = [SELECT Name, Source_Object__c, Source_Field__c, Merge_Field__c, Target_Object__c, Target_Field__c, Filter__c, Function__c 
                              FROM RollupBatchSettings__c
                              WHERE Name =: customSettingsRecordName LIMIT 1];
        } else {
        	rollupSettings = [SELECT Name, Source_Object__c, Source_Field__c, Merge_Field__c, Target_Object__c, Target_Field__c, Filter__c, Function__c 
                              FROM RollupBatchSettings__c LIMIT 1];
        }
        
        RollupBatchSettings__c rollup = rollupSettings[0];
        
        RollupBatchJobImpl b = new RollupBatchJobImpl(batchJobName, rollup.Source_Object__c, rollup.Source_Field__c, rollup.Merge_Field__c, rollup.Target_Object__c, rollup.Target_Field__c, rollup.Filter__c, rollup.Function__c);
        
        Database.executeBatch(b, DEFAULT_BATCH_SIZE);
    }
}