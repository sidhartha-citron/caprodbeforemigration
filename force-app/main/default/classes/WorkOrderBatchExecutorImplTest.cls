/**
 * Unit test for WorkOrderBatchExecutorImplTest.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class WorkOrderBatchExecutorImplTest {
    static testmethod void testExecute() {
    	WorkOrderBatchExecutorImpl impl = new WorkOrderBatchExecutorImpl();
        impl.execute(new List<sObject>(), new Map<String,String>());
        impl.getNotes();
        impl.getNumErrors();
        impl.getTotalRecords();
    }
}