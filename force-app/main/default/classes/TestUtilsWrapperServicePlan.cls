/**
 * @FileName: TestUtilsWrapperServicePlan
 * @Description: Wrapper class for default Service Plan test data
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/8/2019         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class TestUtilsWrapperServicePlan {
    public Route__c route;
    public List<Service_Plan__c> servicePlans;
    public List<Schedule_Type__c> scheduleTypes;
    public List<OrderItem> orderItems;

    public TestUtilsWrapperServicePlan(Account a, ServiceResource sr, List<OrderItem> items) {
        this(a, sr, items, true);
    }

    public TestUtilsWrapperServicePlan(Account a, ServiceResource sr, List<OrderItem> items, Boolean doInsert) {
        createTestData(a, sr, items, doInsert);
    }

    private void createTestData(Account a, ServiceResource sr, List<OrderItem> items, Boolean doInsert) {
        createSchedules();

        route = (Route__c) TestUtils.createSObject(new Route__c(Service_Resource__c = sr.Id));

        servicePlans = (List<Service_Plan__c>) TestUtils.createSObjectList(
                new Service_Plan__c(
                        Account__c = a.Id
                ),
                scheduleTypes.size()
        );

        orderItems = items;

        if (doInsert) doInsert();
    }

    private void createSchedules() {
        scheduleTypes = new List<Schedule_Type__c>();

        scheduleTypes.add((Schedule_Type__c)TestUtils.createSObject(new Schedule_Type__c(
                Name = 'Weekly - Monday',
                Description__c = 'Weekly - Monday',
                Frequency__c = 'Weekly',
                Code__c = 'W-1'
        )));

        scheduleTypes.add((Schedule_Type__c)TestUtils.createSObject(new Schedule_Type__c(
                Name = 'Monthly - First Friday',
                Description__c = 'Monthly - First Friday',
                Frequency__c = 'Monthly',
                Code__c = 'M-5-1'
        )));

        scheduleTypes.add((Schedule_Type__c)TestUtils.createSObject(new Schedule_Type__c(
                Name = 'Bimonthly - FEB/APR/JUN/AUG/OCT/DEC-1st Fri',
                Description__c = 'Bimonthly - FEB/APR/JUN/AUG/OCT/DEC-1st Fri',
                Frequency__c = 'Bi-Monthly',
                Code__c = 'B-2-5-1'
        )));

        scheduleTypes.add((Schedule_Type__c)TestUtils.createSObject(new Schedule_Type__c(
                Name = 'Quarterly - FEB/MAY/AUG/NOV-1st Wed',
                Description__c = 'Quarterly - FEB/MAY/AUG/NOV-1st Wed',
                Frequency__c = 'Quarterly',
                Code__c = 'Q-2-3-1'
        )));

        scheduleTypes.add((Schedule_Type__c)TestUtils.createSObject(new Schedule_Type__c(
                Name = 'Every 14 Days - Tuesday',
                Description__c = 'Every 14 Days - Tuesday',
                Frequency__c = '14 Days',
                Code__c = '14-2'
        )));
    }

    public void doInsert() {
        insert scheduleTypes;
        insert route;

        Map<String,Service_Plan__c> servicePlanMap = new Map<String,Service_Plan__c>();

        for(Integer i = 0; i < scheduleTypes.size(); i++) {
            servicePlans[i].Route__c = route.Id;
            servicePlans[i].Schedule_Type__c = scheduleTypes[i].Id;
            servicePlans[i].Frequency__c = scheduleTypes[i].Frequency__c;

            servicePlanMap.put(scheduleTypes[i].Frequency__c, servicePlans[i]);
        }

        insert servicePlans;

        for (OrderItem item : orderItems) {
            Service_Plan__c plan = servicePlanMap.get(item.Frequency__c);

            if(plan != null) {
                item.Service_Plan__c = plan.Id;
            }
        }

        update orderItems;
    }
}