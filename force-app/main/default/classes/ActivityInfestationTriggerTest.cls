/**
 * @FileName: ActivityInfestationTriggerTest
 * @Description: Test methods for the Activity Infestation trigger
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/27/2020         Created
 *-----------------------------------------------------------  
 */
@IsTest
private class ActivityInfestationTriggerTest {

    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void insertWithLineItem(){
        WorkOrderLineItem li = [
                SELECT Id, WorkOrderId, WorkOrder.AccountId, OrderId, WorkOrder.Site_Survey__c, Work_Order_Location__c,
                        Work_Order_Location__r.Survey_Location__c
                FROM WorkOrderLineItem
                LIMIT 1
        ];

        Activity_Infestation__c ai = (Activity_Infestation__c) TestUtils.createSObject(
                new Activity_Infestation__c(
                        Work_Order_Line_Item__c = li.Id
                )
        );

        Test.startTest();
        insert ai;
        Test.stopTest();

        Activity_Infestation__c aiAfter = [
                SELECT Work_Order__c, Account__c, Order__c, Site_Survey__c, Survey_Location__c, Work_Order_Room__c
                FROM Activity_Infestation__c
                WHERE Id = :ai.Id
        ];

        System.assertEquals(li.WorkOrderId, aiAfter.Work_Order__c);
        System.assertEquals(li.WorkOrder.AccountId, aiAfter.Account__c);
        System.assertEquals(li.OrderId, aiAfter.Order__c);
        System.assertEquals(li.WorkOrder.Site_Survey__c, aiAfter.Site_Survey__c);
        System.assertEquals(li.Work_Order_Location__c, aiAfter.Work_Order_Room__c);
        System.assertEquals(li.Work_Order_Location__r.Survey_Location__c, aiAfter.Survey_Location__c);
    }

    @IsTest
    static void updateWithLocation(){
        Work_Order_Room__c wor = [
                SELECT Id, Work_Order__c, AccountId__c, Work_Order__r.Order__c, Site_Survey__c, Survey_Location__c
                FROM Work_Order_Room__c
                LIMIT 1
        ];

        Activity_Infestation__c ai = (Activity_Infestation__c) TestUtils.createSObject(
                new Activity_Infestation__c(),
                true
        );

        Activity_Infestation__c aiBefore = [
                SELECT Work_Order__c, Account__c, Order__c, Site_Survey__c, Survey_Location__c, Work_Order_Room__c
                FROM Activity_Infestation__c
                WHERE Id = :ai.Id
        ];

        Test.startTest();
        ai.Work_Order_Room__c = wor.Id;
        update ai;
        Test.stopTest();

        Activity_Infestation__c aiAfter = [
                SELECT Work_Order__c, Account__c, Order__c, Site_Survey__c, Survey_Location__c, Work_Order_Room__c
                FROM Activity_Infestation__c
                WHERE Id = :ai.Id
        ];

        System.assertNotEquals(wor.Work_Order__c, aiBefore.Work_Order__c);
        System.assertNotEquals(wor.AccountId__c, aiBefore.Account__c);
        System.assertNotEquals(wor.Work_Order__r.Order__c, aiBefore.Order__c);
        System.assertNotEquals(wor.Site_Survey__c, aiBefore.Site_Survey__c);
        System.assertNotEquals(wor.Id, aiBefore.Work_Order_Room__c);
        System.assertNotEquals(wor.Survey_Location__c, aiBefore.Survey_Location__c);
        System.assertEquals(wor.Work_Order__c, aiAfter.Work_Order__c);
        System.assertEquals(wor.AccountId__c, aiAfter.Account__c);
        System.assertEquals(wor.Work_Order__r.Order__c, aiAfter.Order__c);
        System.assertEquals(wor.Site_Survey__c, aiAfter.Site_Survey__c);
        System.assertEquals(wor.Id, aiAfter.Work_Order_Room__c);
        System.assertEquals(wor.Survey_Location__c, aiAfter.Survey_Location__c);
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new Field_Service_Settings__c(), true);

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(20);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        new TestUtilsWrapperWorkOrder(accountWrapper, orderWrapper);
    }
}