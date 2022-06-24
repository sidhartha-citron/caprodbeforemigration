/**
 * Unit test for ServiceTypeRollupSchedulableImpl.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class ServiceTypeRollupSchedulableImplTest {
    
    static testmethod void testExecute() {
    	// Create custom settings
        ServiceTypeRollupSchedulableImpl__c rollupSettings = new ServiceTypeRollupSchedulableImpl__c();
        rollupSettings.Name = 'Service Type Rollup';
        
        insert rollupSettings;
        
        // Invoke schedulable
        ServiceTypeRollupSchedulableImpl sched = new ServiceTypeRollupSchedulableImpl('Test', rollupSettings.Name);
        sched.execute(null);
    }
}