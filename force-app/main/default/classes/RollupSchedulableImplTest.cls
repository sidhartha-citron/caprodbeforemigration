/**
 * Unit test for RollupSchedulableImpl Impl.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class RollupSchedulableImplTest {
    
    static testmethod void testExecute() {
    	// Create custom settings
        RollupBatchSettings__c rollupSettings = new RollupBatchSettings__c();
        rollupSettings.Name = 'Amount Rollup';
        rollupSettings.Source_Object__c = 'Opportunity';
        rollupSettings.Source_Field__c = 'Amount';
        rollupSettings.Merge_Field__c = 'AccountId';
        rollupSettings.Target_Object__c = 'Account';
        rollupSettings.Target_Field__c = 'AnnualRevenue';
        rollupSettings.Filter__c = '';
        rollupSettings.Function__c = 'SUM';
        
        insert rollupSettings;
        
        // Invoke schedulable
        RollupSchedulableImpl sched = new RollupSchedulableImpl('Test', rollupSettings.Name);
        sched.execute(null);
    }
}

/*
        List<RollupBatchSettings__c> rollupSettings = [SELECT Name, Source_Object__c, Source_Field__c, Merge_Field__c, Target_Object__c, Target_Field__c, Filter__c, Function__c 
                                                     		 FROM RollupBatchSettings__c
                                                     		 WHERE Name =: customSettingsRecordName LIMIT 1];
*/