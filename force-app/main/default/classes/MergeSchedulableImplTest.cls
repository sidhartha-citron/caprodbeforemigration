/**
 * Unit test for MergeSchedulableImpl.
 * 
 * @author: Ahsan Butt
 */
@isTest
private class MergeSchedulableImplTest {
    
    static testmethod void testExecute() {
        // Create custom settings
        OrderMergeBatchSettings__c settings = new OrderMergeBatchSettings__c();
        settings.Name = 'Order Merge';
        settings.Batch_Size__c = 10;
        settings.Order_Item_Filters__c = 'LastAutomationCreatedDateOrderItemFilter,LastInflightWODateOrderItemFilter,ProductCodesOrderItemFilter,ActiveOrderItemFilter,FrequencyOrderItemFilter';
        settings.Order_Item_Field_Set__c = 'Clone_Fields';
        settings.Order_Item_Filter_Product_Codes__c = '1-43-12,1-40-23,1-40-33,1-40-43';
        
        insert settings;
        
        // Invoke schedulable
        MergeSchedulableImpl sched = new MergeSchedulableImpl('Test', settings.Name);
        sched.execute(null);
    }
}