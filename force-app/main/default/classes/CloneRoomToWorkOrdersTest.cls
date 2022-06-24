/**
 * @FileName: CloneRoomToWorkOrdersTest
 * @Description: Test Methods for CloneRoomToWorkOrders class
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/28/2020       Created
 *-----------------------------------------------------------  
 */
@IsTest
private class CloneRoomToWorkOrdersTest {
    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void cloneRoom() {
        ServiceResource resource = [SELECT Id, RelatedRecordId FROM ServiceResource LIMIT 1];
        User testUser = [SELECT Id FROM User WHERE Id = :resource.RelatedRecordId];

        WorkOrder workOrderBefore = [
                SELECT Id,
                        (SELECT Id FROM Survey_Locations__r),
                        (SELECT Id FROM Work_Order_Rooms__r)
                FROM WorkOrder
                LIMIT 1
        ];

        Test.startTest();
        ServiceAppointment appointment = (ServiceAppointment) TestUtils.createSObject(
                new ServiceAppointment(
                        ParentRecordId = workOrderBefore.Id,
                        Status = 'In Progress'
                ),
                true
        );

        TestUtils.createSObject(new AssignedResource(
                ServiceAppointmentId = appointment.Id,
                ServiceResourceId = resource.Id
        ), true);

        System.runAs(testUser) {
            CloneRoomToWorkOrders.cloneRoom(workOrderBefore.Survey_Locations__r[0].Id);
        }
        Test.stopTest();

        WorkOrder workOrderAfter = [
                SELECT Id,
                        (SELECT Id FROM Work_Order_Rooms__r)
                FROM WorkOrder
                LIMIT 1
        ];

        System.assert(workOrderBefore.Work_Order_Rooms__r.isEmpty());
        System.assert(!workOrderAfter.Work_Order_Rooms__r.isEmpty());
    }

    @IsTest
    static void cloneRoomException() {
        ServiceResource resource = [SELECT Id, RelatedRecordId FROM ServiceResource LIMIT 1];
        User testUser = [SELECT Id FROM User WHERE Id = :resource.RelatedRecordId];

        List<String> response;

        Test.startTest();
        System.runAs(testUser) {
            response = CloneRoomToWorkOrders.cloneRoom('errorid');
        }
        Test.stopTest();

        System.assertEquals('error', response[0]);
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new Field_Service_Settings__c(), true);
        TestUtils.createSObject(new Province_Time_Zones_Operating_Hours__c(), true);

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(20);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        TestUtilsWrapperWorkOrder workOrderWrapper = new TestUtilsWrapperWorkOrder(accountWrapper, orderWrapper);

        accountWrapper.surveyLocation.Work_Order__c = workOrderWrapper.workOrder.Id;
        update accountWrapper.surveyLocation;

        delete workOrderWrapper.location;

        new TestUtilsWrapperServiceResource(accountWrapper);
    }
}