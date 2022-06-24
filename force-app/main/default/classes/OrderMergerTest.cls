/**
 * Test class for OrderMerger class.
 * @author Ahsan Butt
 */
@isTest
public class OrderMergerTest {

        static testMethod void testMerge() {
            // Create necessary FSS custom settings
            MergeTestUtils.createFSSCustomSettings();
            
            // Create account
            Account acct = MergeTestUtils.createAccount();
            
            // Create price book entries / products
            List<PricebookEntry> pbookEntries = MergeTestUtils.createPricebookEntries(1);
            
            // Create Order
            Order o = MergeTestUtils.createOrder(acct, pbookEntries, false);
            
            // Create surviving order and set on source order
            Order survivingOrder = MergeTestUtils.createOrder(acct, new List<PricebookEntry>(), false);
            
            o.Surviving_Order__c = survivingOrder.Id;
            
            update o;
            
            // Run merge
            List<Order> srcOrders = [SELECT Id, Surviving_Order__c, Status, Prevent_Invoice_Change_Ticket__c, Order_Merge_Job_Status__c, Order_Merge_Job_Message__c FROM Order WHERE Id = :o.Id];
            List<String> filters =  new List<String>{'FrequencyOrderItemFilter'};
            String oiFS = 'Clone_Fields';
            
            OrderMerger.doMerges(srcOrders, oiFS, filters, new List<String>());
            
            // Check end conditions
            o = [SELECT Id, Status, Order_Merge_Job_Status__c FROM Order WHERE Id = :o.Id LIMIT 1];
            survivingOrder  = [SELECT Id, Status FROM Order WHERE Id = :survivingOrder.Id LIMIT 1];
            
            System.assertNotEquals('Activated', o.Status, 'Source Order should be deactivated');
            System.assertEquals('Ready for Work Order Reparenting', o.Order_Merge_Job_Status__c, 'Source Order Merge job status should be ready for WO reparenting');
            System.assertEquals('Activated', survivingOrder.Status, 'Surviving Order should be activated');
        }
    
    	static testMethod void testRollback() {
            // Create necessary FSS custom settings
            MergeTestUtils.createFSSCustomSettings();
            
            // Create account
            Account acct = MergeTestUtils.createAccount();
            
            // Create price book entries / products
            List<PricebookEntry> pbookEntries = MergeTestUtils.createPricebookEntries(1);
            
            // Create Order -- with one-time frequency such that it fails filter
            Order o = MergeTestUtils.createOrder(acct, pbookEntries, true);
            
            // Create surviving order and set on source order
            Order survivingOrder = MergeTestUtils.createOrder(acct, new List<PricebookEntry>(), false);
            
            o.Surviving_Order__c = survivingOrder.Id;
            
            update o;
            
            // Run merge
            List<Order> srcOrders = [SELECT Id, Surviving_Order__c, Status, Prevent_Invoice_Change_Ticket__c, Order_Merge_Job_Status__c, Order_Merge_Job_Message__c FROM Order WHERE Id = :o.Id];
            List<String> filters =  new List<String>{'FrequencyOrderItemFilter'};
            String oiFS = 'Clone_Fields';
            
            OrderMerger.doMerges(srcOrders, oiFS, filters, new List<String>());
            
            // Check end conditions
            o = [SELECT Id, Status, Order_Merge_Job_Status__c FROM Order WHERE Id = :o.Id LIMIT 1];
            
            System.assertEquals('Error', o.Order_Merge_Job_Status__c, 'Source Order Merge job status should be error');
        }
}