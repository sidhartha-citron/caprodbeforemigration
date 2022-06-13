/**
 * Unit test for SALDeleteCleanupBatchJobImplTest.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class SALDeleteCleanupBatchJobImplTest {
    
    static testmethod void testExecute() {
    	SALDeleteCleanupBatchJobImpl impl = new SALDeleteCleanupBatchJobImpl('Test', 10);
        impl.start(null);
        impl.execute(null, new List<sObject>());
		impl.finish(null);
    }
}