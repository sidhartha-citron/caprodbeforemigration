/**
 * @FileName: TechCapacityCtrlTest
 * @Description: Test methods for TechCapacityCtrl
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/1/2019       Created
 *-----------------------------------------------------------  
 */
@IsTest
private class TechCapacityCtrlTest {

    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void getTechnician() {
        ServiceResource sr = [
                SELECT Id, Name, Travel_Factor__c,
                    (SELECT Id, Skill.MasterLabel, SkillLevel
                    FROM ServiceResourceSkills),
                    (SELECT Id, OperatingHoursId, OperatingHours.Name
                    FROM ServiceTerritories
                    WHERE TerritoryType = 'P'
                    ORDER BY EffectiveEndDate DESC NULLS FIRST)
                FROM ServiceResource
                LIMIT 1
        ];

        TechCapacityWrappers.TechWrapper wrapper = new TechCapacityWrappers.TechWrapper(sr);
        TechCapacityWrappers.TechWrapper res;

        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        System.runAs(testUser) {
            Test.startTest();
            res = (TechCapacityWrappers.TechWrapper) JSON.deserialize(
                    TechCapacityCtrl.getTechnician(sr.Id),
                    TechCapacityWrappers.TechWrapper.class
            );
            Test.stopTest();
        }

        System.assertEquals(wrapper.skills, res.skills);
        System.assertEquals(wrapper.averageShift, res.averageShift);
    }

    @IsTest
    static void getTechnicianError() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        String errorMessage;

        System.runAs(testUser) {
            Test.startTest();
            try {
                TechCapacityCtrl.getTechnician('Error');
            } catch (Exception e) {
                errorMessage = e.getMessage();
            }
            Test.stopTest();
        }

        System.assertNotEquals(null, errorMessage);
    }

    @IsTest
    static void getServicePlans() {
        TechCapacityWrappers.ServicePlanCriteria criteria = new TechCapacityWrappers.ServicePlanCriteria();

        ServiceResource sr = [
                SELECT Id, Name, Travel_Factor__c,
                    (SELECT Id, Skill.MasterLabel, SkillLevel
                    FROM ServiceResourceSkills),
                    (SELECT Id, OperatingHoursId, OperatingHours.Name
                    FROM ServiceTerritories
                    WHERE TerritoryType = 'P'
                    ORDER BY EffectiveEndDate DESC NULLS FIRST)
                FROM ServiceResource
                LIMIT 1
        ];

        TechCapacityWrappers.TechWrapper technician = new TechCapacityWrappers.TechWrapper(sr);

        criteria.technician = technician;

        List<TechCapacityWrappers.CalendarDay> days = new List<TechCapacityWrappers.CalendarDay>();

        Date knownMonday = Date.newInstance(1900, 1, 1);
        Integer daysAfterMonday = Math.mod(knownMonday.daysBetween(Date.today()), 7);
        Date monday = Date.today().addDays(-daysAfterMonday);

        for (Integer i = 0; i < 56; i++) {
            Date d = monday.addDays(i);

            TechCapacityWrappers.CalendarDay day = new TechCapacityWrappers.CalendarDay();
            day.d = d.year() + '-' + d.month() + '-' + d.day();
            day.num = d.day();
            day.month = String.valueOf(d.month());
            day.pastDay = '';

            days.add(day);
        }

        criteria.days = days;

        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        System.runAs(testUser) {
            Test.startTest();
            criteria = (TechCapacityWrappers.ServicePlanCriteria) JSON.deserialize(
                    TechCapacityCtrl.getServicePlans(JSON.serialize(criteria)),
                    TechCapacityWrappers.ServicePlanCriteria.class
            );
            Test.stopTest();
        }

        List<OrderItem> items = [
                SELECT Id, Service_Plan__r.Schedule_Type__r.Code__c
                FROM OrderItem
                WHERE Frequency__c = 'Weekly'
                AND Service_Plan__r.Schedule_Type__r.Code__c = 'W-1'
        ];

        System.assertEquals(1, criteria.days[0].calls);
        System.assertEquals(items.size(), criteria.days[0].assets);
    }

    @IsTest
    static void getServicePlansError() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        String errorMessage;

        System.runAs(testUser) {
            Test.startTest();
            try {
                TechCapacityCtrl.getServicePlans('Error');
            } catch(Exception e) {
                errorMessage = e.getMessage();
            }
            Test.stopTest();
        }

        System.assertNotEquals(null, errorMessage);
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new User(
                ProfileId = QueryUtils.profileMap.get('Field Service Dispatcher').Id,
                Email = 'testdispatcher@test.com'
        ), true);

        TestUtils.createSObject(new Field_Service_Settings__c(), true);

        List<Frequency__c> frequencies = new List<Frequency__c>{
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Weekly', Occurrences_In_Year__c = 52)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Monthly', Occurrences_In_Year__c = 12)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Bi-Monthly', Occurrences_In_Year__c = 6)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Quarterly', Occurrences_In_Year__c = 4)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = '14 Days', Occurrences_In_Year__c = 26))
        };

        insert frequencies;

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(20);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        TestUtilsWrapperServiceResource resourceWrapper = new TestUtilsWrapperServiceResource(accountWrapper);

        new TestUtilsWrapperServicePlan(
                accountWrapper.account,
                resourceWrapper.serviceResource,
                orderWrapper.orderItems
        );
    }
}