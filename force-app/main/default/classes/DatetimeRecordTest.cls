/**
 * @FileName: DatetimeRecordTest
 * @Description: Test methods for DatetimeRecord class
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/27/2020       Created
 *                                   Moved logic from TestDatetimeRecord
 *                                   Updated setup method
 *-----------------------------------------------------------  
 */
@IsTest
private class DatetimeRecordTest {

    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void workOrderRegular() {
        Datetime todaysDate = Datetime.now();

        Account a = [SELECT Id, Site_Survey__c, Name FROM Account LIMIT 1];

        WorkOrder wo = [
                SELECT Id, Create_Quality_Assurance__c, Status, AccountId, StartDate, FSL__VisitingHours__c
                FROM WorkOrder
                WHERE AccountId = :a.Id
                LIMIT 1
        ];

        OperatingHours oh = [
                SELECT Id, Name, TimeZone, (
                        SELECT Id, DayOfWeek, StartTime, EndTime
                        FROM TimeSlots
                        ORDER BY DayOfWeek, StartTime, EndTime
                )
                FROM OperatingHours
                WHERE Id = :wo.FSL__VisitingHours__c
        ];

        Test.startTest();
        DatetimeRecord param = new DatetimeRecord(
                todaysDate.addDays(3),
                todaysDate.addDays(3),
                false,
                false,
                oh
        );
        DatetimeRecord values = DatetimeRecord.getWODates(param, todaysDate);
        Test.stopTest();
    }

    @IsTest
    static void workOrderEmergencyFuture1() {
        Datetime todaysDate = Datetime.now();

        Account a = [SELECT Id, Site_Survey__c, Name FROM Account LIMIT 1];

        WorkOrder wo = [
                SELECT Id, Create_Quality_Assurance__c, Status, AccountId, StartDate, FSL__VisitingHours__c
                FROM WorkOrder
                WHERE AccountId = :a.Id
                LIMIT 1
        ];

        OperatingHours oh = [
                SELECT Id, Name, TimeZone, (
                        SELECT Id, DayOfWeek, StartTime, EndTime
                        FROM TimeSlots
                        ORDER BY DayOfWeek, StartTime, EndTime
                )
                FROM OperatingHours
                WHERE Id = :wo.FSL__VisitingHours__c
        ];

        Test.startTest();
        DatetimeRecord param = new DatetimeRecord(
                todaysDate.addDays(3),
                todaysDate.addDays(3),
                false,
                true,
                oh
        );

        DatetimeRecord values = DatetimeRecord.getWODates(param, todaysDate);
        Test.stopTest();
    }

    @IsTest
    static void workOrderEmergencyFuture2() {
        Datetime todaysDate = Datetime.now();

        Account a = [SELECT Id, Site_Survey__c, Name FROM Account LIMIT 1];

        WorkOrder wo = [
                SELECT Id, Create_Quality_Assurance__c, Status, AccountId, StartDate, FSL__VisitingHours__c
                FROM WorkOrder
                WHERE AccountId = :a.Id
                LIMIT 1
        ];

        OperatingHours oh = [
                SELECT Id, Name, TimeZone, (
                        SELECT Id, DayOfWeek, StartTime, EndTime
                        FROM TimeSlots
                        ORDER BY DayOfWeek, StartTime, EndTime
                )
                FROM OperatingHours
                WHERE Id = :wo.FSL__VisitingHours__c
        ];

        Test.startTest();
        DatetimeRecord param = new DatetimeRecord(
                todaysDate.addDays(3),
                todaysDate.addDays(3),
                true,
                false,
                oh);

        DatetimeRecord values = DatetimeRecord.getWODates(param, todaysDate);
        Test.stopTest();
    }

    @IsTest
    static void workOrderEmergencyPast() {
        Datetime todaysDate = Datetime.now();

        Account a = [SELECT Id, Site_Survey__c, Name FROM Account LIMIT 1];

        WorkOrder wo = [
                SELECT Id, Create_Quality_Assurance__c, Status, AccountId, StartDate, FSL__VisitingHours__c
                FROM WorkOrder
                WHERE AccountId = :a.Id
                LIMIT 1
        ];

        OperatingHours oh = [
                SELECT Id, Name, TimeZone, (
                        SELECT Id, DayOfWeek, StartTime, EndTime
                        FROM TimeSlots
                        ORDER BY DayOfWeek, StartTime, EndTime
                )
                FROM OperatingHours
                WHERE Id = :wo.FSL__VisitingHours__c
        ];

        Test.startTest();
        DatetimeRecord param = new DatetimeRecord(
                todaysDate.addDays(3),
                todaysDate.addDays(3),
                true,
                true,
                oh
        );

        DatetimeRecord values = DatetimeRecord.getWODates(param, todaysDate);
        Test.stopTest();
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new Field_Service_Settings__c(), true);
        TestUtils.createSObject(new Emergency_Dispatch_Wizard_Setttings__c(), true);
        TestUtils.createSObject(new Province_Time_Zones_Operating_Hours__c(), true);

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(20);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        new TestUtilsWrapperWorkOrder(accountWrapper, orderWrapper);
    }
}