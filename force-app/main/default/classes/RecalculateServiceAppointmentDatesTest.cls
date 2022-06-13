/**
 * @FileName: RecalculateServiceAppointmentDatesTest
 * @Description: Test class for RecalculateServiceAppointmentDates
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/10/2020         Created
 *-----------------------------------------------------------  
 */
@IsTest
private class RecalculateServiceAppointmentDatesTest {
    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void recalculateServiceAppointmentDates() {
        List<Frequency__c> frequencySettings = (List<Frequency__c>) TestUtils.createSObjectList(
                new Frequency__c(
                        Chemical_Reschedule_Plus_Days__c = 5,
                        Hygiene_Reschedule_Plus_Days__c = 5,
                        Pest_Reschedule_Plus_Days__c = 1
                ),
                3,
                false
        );

        frequencySettings[0].Name = 'Weekly';
        frequencySettings[0].Life_Safety_Reschedule_Plus_Days__c = 1;
        frequencySettings[0].Pest_Reschedule_Plus_Days__c = 2;

        frequencySettings[1].Name = 'Monthly';
        frequencySettings[1].Life_Safety_Reschedule_Plus_Days__c = 2;

        frequencySettings[2].Name = 'One-Time';
        frequencySettings[2].Life_Safety_Reschedule_Plus_Days__c = 5;

        insert frequencySettings;

        WorkOrder wo = [SELECT Id, Order__c FROM WorkOrder LIMIT 1];

        ServiceAppointment testSA = new ServiceAppointment(
                ParentRecordId = wo.Id,
                DueDate = System.today().addDays(-8),
                EarliestStartTime = System.today().addDays(-10),
                Status='New'
        );
        insert testSA;

        FSL.GlobalAPIS.addStatusTransition('New','Missed Service');

        testSA.Status = 'Missed Service';
        update testSA;

        Test.startTest();
        Database.executeBatch(new RecalculateServiceAppointmentDates());
        Test.stopTest();
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new Field_Service_Settings__c(), true);
        TestUtils.createSObject(new Province_Time_Zones_Operating_Hours__c(), true);

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(5, false);

        for(Product2 p : pricebookWrapper.products) {
            p.Allowable_Frequencies__c = 'One-Time;Monthly;Weekly';
        }

        pricebookWrapper.doInsert();

        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        new TestUtilsWrapperWorkOrder(accountWrapper, orderWrapper);

        User newUser = new User(
                Alias = 'testA',
                Email = 'testUser@UserCommunity.com',
                EmailEncodingKey = 'ISO-8859-1',
                FirstName = 'TestFirstName',
                LastName = 'TestLastName',
                LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_CA',
                ProfileId = UserInfo.getProfileId(),
                TimeZoneSidKey = 'America/New_York',
                UserName = 'testUser@UserCommunity.com',
                Employee_Number__c = 'ABCD123TEST'
        );
        insert newUser;

        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        QueueSobject testQueue = new QueueSobject(QueueId = testGroup.Id, SobjectType = 'Case');

        System.runAs(newUser) {
            insert testQueue;
        }
    }
}