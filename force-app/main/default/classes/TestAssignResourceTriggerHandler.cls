@isTest
public class TestAssignResourceTriggerHandler {
    @isTest
    static void testAssignResourceHistory(){
        
        Field_Service_Settings__c dataSets = new Field_Service_Settings__c(Service_Appointment_Completed_Status__c = 'Completed', Operating_Hours_Type_Employee__c = 'Employee Operating Hours', Are_Service_Crews_Active__c = true, CitronDoNotReply__c = 'donotreply@citronhygiene.com', Pest_LOB__c = 'Pest Control');
        dataSets.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        insert dataSets;
        
        Contact c = new Contact(LastName = 'TestNoReply', Email = 'donotreply@citronhygiene.com');
        insert c;
        
        OperatingHours empHours = new OperatingHours(Operating_Hours_Type__c = 'Employee Operating Hours', Name = 'Test Hours');
        insert empHours;
        
        OperatingHours terrHours = new OperatingHours(Operating_Hours_Type__c = 'Territory Operating Hours', Name = 'Test Hours 2', TimeZone = 'America/New_York');
        insert terrHours;
        
        ServiceTerritory st = new ServiceTerritory(OperatingHoursId = terrHours.Id, Name = 'Test Territory', IsActive = true);
        insert st;
        
        WorkOrder wo2 = new WorkOrder(Completed_Date__c = System.today().addDays(1),Status='New',Cannot_Complete_Reason__c='Closed');
        insert wo2;
        
        ServiceResource resource = new ServiceResource(RelatedRecordId = UserInfo.getUserId(), IsActive = true, Name = UserInfo.getName());
        insert resource;
        
        ServiceCrew crew = new ServiceCrew(Name = 'Test Crew', CrewSize = 1);
        insert crew;
        
        ServiceCrewMember crewMember = new ServiceCrewMember(ServiceCrewId = crew.Id, ServiceResourceId = resource.Id, StartDate = System.today());
        insert crewMember;
        
        ServiceTerritoryMember member = new ServiceTerritoryMember(ServiceResourceId = resource.Id, EffectiveStartDate = System.today(), ServiceTerritoryId = st.Id);
        insert member;
        
        ServiceAppointment appt = new ServiceAppointment(EarliestStartTime = System.now(), DueDate = System.now(), SchedStartTime = System.now(), SchedEndTime = System.now(), Status = 'New', ServiceTerritoryId = st.Id);
        appt.ParentRecordId = wo2.Id; 
        insert appt;
        
        AssignedResource ARS = new AssignedResource(ServiceAppointmentId = appt.Id, ServiceResourceId = resource.Id, ServiceCrewId = crew.Id);
        insert ARS;
        
		User newUser = new User(
            Alias = 'testA', 
            Email = 'testUser@UserTechnicianForTest.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TestFirstName',
            LastName = 'TestLastName', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testUser456@UserTechnicianForTest.com', 
            Employee_Number__c = 'ABCD123TEST'
        );
        insert newUser;
        
        ServiceResource res1 = new ServiceResource(RelatedRecordId=newUser.Id,IsActive = true,Name=UserInfo.getName());
        insert res1;
        
        ServiceCrew crew1 = new ServiceCrew(Name = 'Test Crew', CrewSize = 1);
        insert crew1;
        
        ServiceCrewMember crewMember1 = new ServiceCrewMember(ServiceCrewId = crew1.Id, ServiceResourceId = res1.Id, StartDate = System.today());
        insert crewMember1;
        
        ServiceTerritoryMember member1 = new ServiceTerritoryMember(ServiceResourceId = res1.Id, EffectiveStartDate = System.today(), ServiceTerritoryId = st.Id);
        insert member1;
		
        Test.startTest();
        ARS.ServiceResourceId = res1.Id;
        ARS.ServiceCrewId = crew1.Id;
        update ARS;
        List<Assign_Resource_History__c> listARH = [select id from Assign_Resource_History__c where Service_Appointment_Id__c =: appt.Id];
        system.assertEquals(listARH.size(),3);
        
        delete ARS;
        listARH = [select id from Assign_Resource_History__c where Service_Appointment_Id__c =: appt.Id];
        system.assertEquals(listARH.size(),4);
        Test.stopTest();
        
    }
}