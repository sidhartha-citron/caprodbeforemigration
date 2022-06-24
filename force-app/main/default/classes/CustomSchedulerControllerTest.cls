/**
 * Unit test for CustomSchedulerController.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class CustomSchedulerControllerTest {

    static testMethod void testGetCurrentlyRunningJobs() {
        String jobName = 'Test';
        
        // Insert custom settings
        RollupBatchSettings__c rollupSettings = createTestBatchSettings();
        insert rollupSettings;
        
        ICustomSchedulable sched = (ICustomSchedulable) new RollupSchedulableImpl(jobName, rollupSettings.Name);
        
        // Create cron string 
        String cron = '0 0 0 * * ?';
        
        // Schedule job
        System.schedule(jobName, cron, sched);    
        
        // Test getCurrentlyRunningJobs
        List<CustomSchedulerController.BatchJobState> runningJobs = CustomSchedulerController.getCurrentlyRunningJobs(new List<String>{jobName});
        
        System.assertEquals(1, runningJobs.size(), '1 job should be running!');
    }
    
    static testMethod void testScheduleJob() {
        // Insert custom settings
        RollupBatchSettings__c rollupSettings = createTestBatchSettings();
        insert rollupSettings;
        
        BatchJobSchedulerSettings__c schedSettings = createTestSchedulerSettings();
        insert schedSettings;
        
        // Invoke schedule job   
        CustomSchedulerController.ScheduleJobResult result = CustomSchedulerController.scheduleJob(schedSettings.Name, rollupSettings.Name, '00');
        
        System.assert(result.success, 'Schedule Job result should be true.');
        
        // Assert it's running
		List<CustomSchedulerController.BatchJobState> runningJobs = CustomSchedulerController.getCurrentlyRunningJobs(new List<String>{schedSettings.Name});
        
        System.assertEquals(1, runningJobs.size(), 'Should be 1 running job.');
        
        // Delete the job
        runningJobs = CustomSchedulerController.deleteJob(runningJobs.get(0).id, new List<String>{schedSettings.Name});
        
        // Assert it's not
        System.assertEquals(0, runningJobs.size(), 'Should be 0 running jobs.');
    }
    
    static testMethod void testGetInitialState() {
        // Insert custom settings
        RollupBatchSettings__c rollupSettings = createTestBatchSettings();
        insert rollupSettings;
        
        BatchJobSchedulerSettings__c schedSettings = createTestSchedulerSettings();
        insert schedSettings;
        
        // Invoke schedule job   
        CustomSchedulerController.ScheduleJobResult result = CustomSchedulerController.scheduleJob(schedSettings.Name, rollupSettings.Name, '00');
        
        // Get initial State
        CustomSchedulerController.SchedulerState state = CustomSchedulerController.getInitialState();
        
        // Assert running jobs
        System.assertEquals(1, state.runningJobs.size(), 'Should be 1 running jobs.');
        
        // Assert configured batchJob is returned
        System.assertEquals(1, state.batchJobs.size(), 'Should be 1 batch job configured.');
    }
    
    private static RollupBatchSettings__c createTestBatchSettings() {
        RollupBatchSettings__c rollupSettings = new RollupBatchSettings__c();
        rollupSettings.Name = 'Amount Rollup';
        rollupSettings.Source_Object__c = 'Opportunity';
        rollupSettings.Source_Field__c = 'Amount';
        rollupSettings.Merge_Field__c = 'AccountId';
        rollupSettings.Target_Object__c = 'Account';
        rollupSettings.Target_Field__c = 'AnnualRevenue';
        rollupSettings.Filter__c = '';
        rollupSettings.Function__c = 'SUM';

        return rollupSettings;
    }
    
    private static BatchJobSchedulerSettings__c createTestSchedulerSettings() {
        BatchJobSchedulerSettings__c schedSettings = new BatchJobSchedulerSettings__c();
		schedSettings.Name = 'Test Sched Setting';
        schedSettings.Scheduler_Class__c = 'RollupSchedulableImpl';
        schedSettings.Custom_Setting_Object_Name__c = 'RollupBatchSettings__c';
        
        return schedSettings;
    }
}