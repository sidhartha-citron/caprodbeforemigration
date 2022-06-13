/**
 * Unit test for DeactivateMergedOIsSchedulableImplTest.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class DeactivateMergedOIsSchedulableImplTest {
    
    static testmethod void testExecute() {
        // Create custom settings
        DeactivateMergedOIsBatchSettings__c settings = new DeactivateMergedOIsBatchSettings__c();
        settings.Name = 'Deactivate Merged OIs';
        settings.Batch_Size__c = 10;
        
        insert settings;
        
        // Invoke schedulable
        DeactivateMergedOIsSchedulableImpl sched = new DeactivateMergedOIsSchedulableImpl('Test', settings.Name);
        sched.execute(null);
    }
}