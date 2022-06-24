/**
 * @FileName: WorkOrderMergerTest
 * @Description: Test class for WorkOrderMerger class
 * @Author: Ahsan Butt
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Ahsan Butt        N/A             Created
 * Graeme Ward       02/10/2020      Fixed test method, updated to new test framework
 *-----------------------------------------------------------
 */
@IsTest
public class WorkOrderMergerTest {

    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void doMerges() {
        Order o = [
                SELECT Id, AccountId, Status, EffectiveDate, Pricebook2Id,
                        (SELECT Id, Description, Product2Id, Frequency__c, UnitPrice, Service_Price_Per_Unit__c,
                                Quantity, OrderId, PricebookEntryId
                        FROM OrderItems)
                FROM Order LIMIT 1
        ];

        Order survivingOrder = o.clone(false, true);
        insert survivingOrder;

        List<OrderItem> survivingItems = new List<OrderItem>();

        for(OrderItem item : o.OrderItems) {
            OrderItem itemClone = item.clone(false, true);
            itemClone.OrderId = survivingOrder.Id;
            itemClone.Cloned_From_Order_Line__c = item.Id;
            survivingItems.add(itemClone);
        }

        o.Surviving_Order__c = survivingOrder.Id;
        update o;

        List<Order> srcOrders = [
                SELECT Id, Surviving_Order__c, Status, Prevent_Invoice_Change_Ticket__c, Order_Merge_Job_Status__c,
                        Order_Merge_Job_Message__c
                FROM Order
                WHERE Id = :o.Id
        ];

        WorkOrder wo = [
                SELECT Id, Order__c, Order__r.Surviving_Order__c,
                        (SELECT Id, Order_Product__c, OrderId FROM WorkOrderLineItems)
                FROM WorkOrder
                LIMIT 1
        ];

        Test.startTest();
        // inside start test due to SOQL governor limits
        insert survivingItems;

        OrderMerger.doMerges(
                srcOrders,
                'Clone_Fields',
                new List<String>{'FrequencyOrderItemFilter'},
                new List<String>()
        );

        WorkOrderMerger.doMerges(new List<WorkOrder>{wo});
        Test.stopTest();

        List<WorkOrder> wosAfter = [SELECT Id FROM WorkOrder WHERE Id = :wo.Id AND Order__c = :survivingOrder.Id];

        System.assertEquals(1, wosAfter.size(), 'Work Order should be reparented');
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new Field_Service_Settings__c(), true);

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(1);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        new TestUtilsWrapperWorkOrder(accountWrapper, orderWrapper);
    }
}