@IsTest
public class WorkOrderPriorityFactoryTest {

    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void testWorkOrderPriorityFactory() {
        Account a = [SELECT Id, Account_at_Risk__c, Customer_Tiers__c FROM Account LIMIT 1];

        ServiceAppointment sa = [
                SELECT Id, Account__c, Duration, Account__r.Account_at_Risk__c, Account__r.Customer_Tiers__c
                FROM ServiceAppointment
                WHERE Account__c = :a.Id
                LIMIT 1
        ];

        WorkOrder wo = [
                SELECT Id, Service_Appointment__c, Customer_Tier__c, Account_at_Risk__c,
                        Service_Appointment_Duration__c, Service_Appointment_Due_Date__c ,
                        Service_Appointment__r.Account__r.Customer_Tiers__c,
                        Service_Appointment__r.Account__r.Account_at_Risk__c
                FROM WorkOrder LIMIT 1
        ];

        Test.startTest();
        wo.Service_Appointment__c = sa.Id;
        update wo;
        Test.stopTest();

        WorkOrder woAfter = [
                SELECT Service_Appointment__r.Account__r.Customer_Tiers__c
                FROM WorkOrder
                WHERE Service_Appointment__c = :sa.Id LIMIT 1
        ];

        System.assert(woAfter.Service_Appointment__r.Account__r.Customer_Tiers__c == a.Customer_Tiers__c);
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new Field_Service_Settings__c(), true);

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(20);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount(false);
        accountWrapper.account.Account_at_Risk__c = true;
        accountWrapper.doInsert();

        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        TestUtilsWrapperWorkOrder workOrderWrapper = new TestUtilsWrapperWorkOrder(accountWrapper, orderWrapper);
        new TestUtilsWrapperServiceResource(accountWrapper);

        TestUtils.createSObject(new Contact(AccountId = accountWrapper.account.Id));

        List<Work_Order_Priority_Weights__c> weights = (List<Work_Order_Priority_Weights__c>) TestUtils.createSObjectList(
                new Work_Order_Priority_Weights__c(),
                10
        );

        for (Integer i = 0; i < 10; i++) {
            Work_Order_Priority_Weights__c w = weights[i];
            w.Due_Date__c = String.valueOf(i);
            w.Priority_Ranking__c = i;
        }

        insert weights;

        TestUtils.createSObject(new ServiceAppointment(
                ServiceTerritoryId = accountWrapper.serviceTerritories[0].Id,
                ParentRecordId = workOrderWrapper.workOrder.Id,
                Account__c = accountWrapper.account.Id
        ), true);
    }
}