/**
 * Controller for Custom Scheduler lightning controller. Retrieves custom setting info re: batch jobs,
 * as well as info re: currently running jobs.
 * 
 * @author Ahsan Butt
 */
public with sharing class CustomSchedulerController {

    @AuraEnabled
    public static SchedulerState getInitialState() {
        SchedulerState state = new SchedulerState();
        
        List<BatchJobSchedulerSettings__c> results = [SELECT Name, Custom_Setting_Object_Name__c FROM BatchJobSchedulerSettings__c];
        List<String> batchJobs = new List<String>();
        
        for (BatchJobSchedulerSettings__c result : results) {
        	batchJobs.add(result.Name);
        }
        
        state.customSettingRecordNames = getBatchToCustomSetting(results[0].Name);
        state.batchJobs = batchJobs;

        // Get currently running jobs
        state.runningJobs = getCurrentlyRunningJobs(state.batchJobs);

        return state;
    }
    
    @AuraEnabled
    public Static List<BatchJobState> getCurrentlyRunningJobs(List<String> batchNames) {
       // Create query filter based on batch job names
       List<String> filters = new List<String>();
        for (String name : batchNames) {
            filters.add(name + '%');
        }
        
        // Query cron triggers
        List<CronTrigger> jobs = [SELECT Id, CronJobDetail.Id, NextFireTime, CronJobDetail.Name, CronJobDetail.JobType 
                                  FROM CronTrigger 
                                  WHERE CronJobDetail.Name like :filters];
        
        // Create BatcJobState list based on query results
        List<BatchJobState> states = new List<BatchJobState>();
        for (CronTrigger job : jobs) {
            BatchJobState state = new BatchJobState();
            state.jobName = job.CronJobDetail.Name;
            state.nextFire = job.NextFireTime;
            state.id = job.id;
            
            states.add(state);
        }
        
        return states;
    }
    
    @AuraEnabled
    public static List<String> getBatchToCustomSetting(String batchName) {
        return getBatchToCustomSetting(batchName, null);
    }
    
    @AuraEnabled
    public static List<String> getBatchToCustomSetting(String batchName, String customSettingObj) {
        if (String.isBlank(customSettingObj)) {
        	List<BatchJobSchedulerSettings__c> results = [SELECT Name, Custom_Setting_Object_Name__c FROM BatchJobSchedulerSettings__c WHERE Name =: batchName];
            customSettingObj = results[0].Custom_Setting_Object_Name__c;
        }
        
        String query = 'SELECT Name FROM ' + customSettingObj;
        List<sObject> records = Database.query(query);
        
        List<String> customSettingRecordNames = new List<String>();
        for (sObject record : records) {
            customSettingRecordNames.add((String) record.get('Name'));
        }
        
        return customSettingRecordNames;
    }
    
    @AuraEnabled
    public static ScheduleJobResult scheduleJob(String batchName, String customSettingRecordName, String hr) {
        // Get batch job specific Scheduler class
        List<BatchJobSchedulerSettings__c> results = [SELECT Name, Scheduler_Class__c FROM BatchJobSchedulerSettings__c WHERE Name =: batchName];
        
        if (results == null || results.size() != 1) {
        	return new ScheduleJobResult(false, 'Batch job not found.');
        }
        
        // Instantiate scheduler
        Type schedType = Type.forName(results.get(0).Scheduler_Class__c);
        ICustomSchedulable sched = (ICustomSchedulable) schedType.newInstance();
       
        // Set job name and custom setting records name
        String jobName = batchName + ' -- ' + customSettingRecordName;
        sched.setBatchJobName(jobName);
        sched.setCustomSettingsRecordName(customSettingRecordName);
        
        // Create cron string 
        String hrStr = String.valueOf(hr); // enforce type conversion (work-around for weird serialization issues)
        String cron = '0 0 ' + hrStr + ' * * ?'; // every day at hrStr o'clock
        
        try {
        	System.schedule(jobName, cron, sched);    
        } catch (Exception e) {
            return new ScheduleJobResult(false, 'Failed to schedule batch job: ' + e.getMessage());
        }
        
        return new ScheduleJobResult(true, '');
    }
    
    @AuraEnabled
    public static  List<BatchJobState> deleteJob(String jobId, List<String> batchNames) {
        System.abortJob(jobId);
        return getCurrentlyRunningJobs(batchNames);
    }
     
    public class SchedulerState {
        @AuraEnabled
        public List<String> customSettingRecordNames;
        @AuraEnabled
        public List<String> batchJobs;
        @AuraEnabled
        public List<BatchJobState> runningJobs;
    }
    
    public class BatchJobState {
        @AuraEnabled
        public String jobName;
        @AuraEnabled
        public DateTime nextFire;
        @AuraEnabled
        public String id;
    }
    
    public class ScheduleJobResult {
        @AuraEnabled
        public Boolean success;
        @AuraEnabled
        public String errMsg;
        
        public ScheduleJobResult(Boolean isSuccess, String msg) {
            success = isSuccess;
            errMsg = msg;
        }
    }
}