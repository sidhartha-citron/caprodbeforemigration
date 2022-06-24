/**
 * A schedulable implementation that kicks off a batch job to delete *old* Survey Asset Delete records.
 * 
 * @author Ahsan Butt
 */

public class SALDeleteCleanupSchedulableImpl implements ICustomSchedulable {
    public String batchJobName;
    public String customSettingsRecordName;
    
    private Integer DEFAULT_BATCH_SIZE = 20;
    private Integer DEFAULT_EXPIRE_PERIOD = 100;
    
    public SALDeleteCleanupSchedulableImpl() {
    	setBatchJobName('SAL Delete Cleanup Batch Job');
        setCustomSettingsRecordName('SAL Delete Cleanup');
    }
    
    public SALDeleteCleanupSchedulableImpl(String jobName, String csRecordName) {
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
        List<SALDeleteCleanupBatchSettings__c> salSettings = [SELECT Name, Batch_Size__c, Expiration_Period_In_Days__c
                                                     	  	  FROM SALDeleteCleanupBatchSettings__c
                                                     	 	  WHERE Name =: customSettingsRecordName];
        
        SALDeleteCleanupBatchSettings__c cleanupS = (salSettings != null && salSettings.size() > 0) ? salSettings[0] : null;
		
        Decimal negExpireDays = (cleanupS != null && cleanupS.Expiration_Period_In_Days__c != null) ?  (-1 * cleanupS.Expiration_Period_In_Days__c) :  (-1 * DEFAULT_EXPIRE_PERIOD);
        
        SALDeleteCleanupBatchJobImpl b = new SALDeleteCleanupBatchJobImpl(batchJobName, (Integer) negExpireDays);
        
        Integer batchSize = cleanupS != null && cleanupS.Batch_Size__c != null ? (Integer) cleanupS.Batch_Size__c : DEFAULT_BATCH_SIZE;
        
        System.debug(cleanupS);
        Database.executeBatch(b, batchSize);
    }
}