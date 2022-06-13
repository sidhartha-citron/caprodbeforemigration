/**
 * Unit test for DeactivateMergedOIsBatchExecutorImplTest.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class DeactivateMergedOIsBatchExecutorImplTest {
    static testmethod void testExecute() {
    	DeactivateMergedOIsBatchExecutorImpl impl = new DeactivateMergedOIsBatchExecutorImpl();
        impl.execute(new List<sObject>(), new Map<String,String>());
        impl.getNotes();
        impl.getNumErrors();
        impl.getTotalRecords();
    }
}