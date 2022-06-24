/**
 * Unit test for SALDeleteCleanupSchedulableImpl.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class SALDeleteCleanupSchedulableImplTest {
    
    static testmethod void testExecute() {
        // Invoke schedulable
        SALDeleteCleanupSchedulableImpl sched = new SALDeleteCleanupSchedulableImpl('Test', 'SAL Delete Cleanup');
        sched.execute(null);
    }
}