/**
 * Unit test for WorkOrderMergeSchedulableImplTest.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class WorkOrderMergeSchedulableImplTest {
    
    static testmethod void testExecute() {
        // Create custom settings
        WorkOrderMergeBatchSettings__c settings = new WorkOrderMergeBatchSettings__c();
        settings.Name = 'Work Order Merge';
        settings.Batch_Size__c = 10;
        
        insert settings;
        
        // Invoke schedulable
        WorkOrderMergeSchedulableImpl sched = new WorkOrderMergeSchedulableImpl('Test', settings.Name);
        sched.execute(null);
    }
}