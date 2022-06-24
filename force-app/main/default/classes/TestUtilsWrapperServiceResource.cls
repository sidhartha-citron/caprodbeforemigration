/**
 * @FileName: TestUtilsWrapperServiceResource
 * @Description: Wrapper class for default Service Resource test data
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/11/2019         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class TestUtilsWrapperServiceResource {
    private final List<String> DAYS = new List<String>{
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday'
    };

    public User user;
    public ServiceResource serviceResource;
    public ServiceCrew serviceCrew;
    public ServiceCrewMember serviceCrewMember;
    public OperatingHours employeeOperatingHours;
    public List<TimeSlot> timeSlots;
    public ServiceTerritory serviceTerritory;
    public ServiceTerritoryMember serviceTerritoryMember;
    
    public TestUtilsWrapperServiceResource()
    {
        
    }

    public TestUtilsWrapperServiceResource(TestUtilsWrapperAccount accountWrapper) {
        this(accountWrapper, true);
    }

    public TestUtilsWrapperServiceResource(TestUtilsWrapperAccount accountWrapper, Boolean doInsert) {
        createTestData(accountWrapper, doInsert);
    }

    private void createTestData(TestUtilsWrapperAccount accountWrapper, Boolean doInsert) {
        user = (User)TestUtils.createSObject(new User(ProfileId = QueryUtils.profileMap.get('FSL Tech - Hygiene').Id));
        serviceResource = (ServiceResource)TestUtils.createSObject(new ServiceResource());
        serviceCrew = (ServiceCrew) TestUtils.createSObject(new ServiceCrew());
        serviceCrewMember = (ServiceCrewMember) TestUtils.createSObject(new ServiceCrewMember());

        serviceTerritory = (ServiceTerritory)TestUtils.createSObject(
                new ServiceTerritory(
                        OperatingHoursId = accountWrapper.territoryOperatingHours.Id
                )
        );

        employeeOperatingHours = (OperatingHours)TestUtils.createSObject(new OperatingHours());

        timeSlots = (List<TimeSlot>)TestUtils.createSObjectList(
                new TimeSlot(),
                DAYS.size()
        );

        for (Integer i = 0; i < DAYS.size(); i++) {
            timeSlots[i].DayOfWeek = DAYS[i];
        }

        serviceTerritoryMember = (ServiceTerritoryMember)TestUtils.createSObject(new ServiceTerritoryMember());

        if (doInsert) doInsert();
    }

    public void doInsert() {
        insert user;

        serviceResource.RelatedRecordId = user.Id;
        insert serviceResource;

        insert serviceCrew;

        serviceCrewMember.ServiceCrewId = serviceCrew.Id;
        serviceCrewMember.ServiceResourceId = serviceResource.Id;
        insert serviceCrewMember;

        insert serviceTerritory;

        insert employeeOperatingHours;

        for (TimeSlot ts : timeSlots) {
            ts.OperatingHoursId = employeeOperatingHours.Id;
        }

        insert timeSlots;

        serviceTerritoryMember.ServiceTerritoryId = serviceTerritory.Id;
        serviceTerritoryMember.ServiceResourceId = serviceResource.Id;
        serviceTerritoryMember.OperatingHoursId = employeeOperatingHours.Id;
        insert serviceTerritoryMember;
    }
}