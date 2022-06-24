/**
 * Unit test for OrderMergeBatchExecutorImpl.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class OrderMergeBatchExecutorImplTest {
    static testmethod void testExecute() {
    	OrderMergeBatchExecutorImpl impl = new OrderMergeBatchExecutorImpl();
        impl.execute(new List<sObject>(), new Map<String,String>());
        impl.getNotes();
        impl.getNumErrors();
        impl.getTotalRecords();
    }
}