/**
 * @FileName: TestUtilsWrapperAccount
 * @Description: Wrapper class for default Account test data
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/11/2019         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class TestUtilsWrapperAccount {
    private final List<String> DAYS = new List<String>{
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday'
    };

    public Account account;
    public OperatingHours accountOperatingHours;
    public OperatingHours territoryOperatingHours;
    public List<TimeSlot> timeSlots;
    public List<ServiceTerritory> serviceTerritories;
    public Site_Survey__c survey;
    public Survey_Location__c surveyLocation;

    public TestUtilsWrapperAccount() {
        this(true);
    }

    public TestUtilsWrapperAccount(Boolean doInsert) {
        createTestData(doInsert);
    }

    private void createTestData(Boolean doInsert) {
        accountOperatingHours = (OperatingHours) TestUtils.createSObject(new OperatingHours(Operating_Hours_Type__c = 'Account Operating Hours'));
        territoryOperatingHours = (OperatingHours) TestUtils.createSObject(new OperatingHours(Operating_Hours_Type__c = 'Territory Operating Hours'));

        timeSlots = (List<TimeSlot>)TestUtils.createSObjectList(new TimeSlot(), DAYS.size());

        for (Integer i = 0; i < DAYS.size(); i++) {
            timeSlots[i].DayOfWeek = DAYS[i];
        }

        serviceTerritories = new List<ServiceTerritory>{
                (ServiceTerritory) TestUtils.createSObject(new ServiceTerritory()),
                (ServiceTerritory) TestUtils.createSObject(new ServiceTerritory())
        };

        account = (Account)TestUtils.createSObject(new Account());

        survey = (Site_Survey__c) TestUtils.createSObject(new Site_Survey__c());
        surveyLocation = (Survey_Location__c) TestUtils.createSObject(new Survey_Location__c());

        if (doInsert) doInsert();
    }

    public void doInsert() {
        insert new List<OperatingHours>{accountOperatingHours, territoryOperatingHours};

        for(TimeSlot ts : timeSlots) {
            ts.OperatingHoursId = accountOperatingHours.Id;
        }

        insert timeSlots;

        serviceTerritories[0].OperatingHoursId = territoryOperatingHours.Id;
        insert serviceTerritories[0];

        serviceTerritories[1].OperatingHoursId = territoryOperatingHours.Id;
        serviceTerritories[1].ParentTerritoryId = serviceTerritories[0].Id;
        insert serviceTerritories[1];

        account.OperatingHoursId = accountOperatingHours.Id;
        account.Service_Territory__c = serviceTerritories[1].Id;
        insert account;

        survey.Account__c = account.Id;
        insert survey;

        surveyLocation.Site_Survey__c = survey.Id;
        insert surveyLocation;

        account.Site_Survey__c = survey.Id;
        update account;
    }
}