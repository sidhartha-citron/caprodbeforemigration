@isTest
public class AssignedResourcesWorkOrderBatchableTest {
    
    @testSetup
    static void setup() {
        FSL.GlobalAPIS.addStatusTransition('New','Scheduled');
        FSL.GlobalAPIS.addStatusTransition('Scheduled','Dispatched');
        FSL.GlobalAPIS.addStatusTransition('Dispatched','On Route');
        FSL.GlobalAPIS.addStatusTransition('On Route','Completed');
        
        Field_Service_Settings__c dataSets = new Field_Service_Settings__c(Service_Appointment_Completed_Status__c = 'Completed', Operating_Hours_Type_Employee__c = 'Employee Operating Hours', Are_Service_Crews_Active__c = true, CitronDoNotReply__c = 'donotreply@citronhygiene.com', Pest_LOB__c = 'Pest Control');
        insert dataSets;
        
        Contact c = new Contact(LastName = 'TestNoReply', Email = 'donotreply@citronhygiene.com');
        insert c;
        
        OperatingHours empHours = new OperatingHours(Operating_Hours_Type__c = 'Employee Operating Hours', Name = 'Test Hours');
        insert empHours;
        
        OperatingHours terrHours = new OperatingHours(Operating_Hours_Type__c = 'Territory Operating Hours', Name = 'Test Hours 2', TimeZone = 'America/New_York');
        insert terrHours;
        
        ServiceTerritory st = new ServiceTerritory(OperatingHoursId = terrHours.Id, Name = 'Test Territory', IsActive = true);
        insert st;
        
        WorkOrder wo1 = new WorkOrder(Completed_Date__c = System.today());
        insert wo1;
        
        WorkOrder wo2 = new WorkOrder(Completed_Date__c = System.today().addDays(1));
        insert wo2;
        
        ServiceResource resource = new ServiceResource(RelatedRecordId = UserInfo.getUserId(), IsActive = true, Name = UserInfo.getName());
        insert resource;
        
        ServiceCrew crew = new ServiceCrew(Name = 'Test Crew', CrewSize = 1);
        insert crew;
        
        ServiceCrewMember crewMember = new ServiceCrewMember(ServiceCrewId = crew.Id, ServiceResourceId = resource.Id, StartDate = System.today());
        insert crewMember;
        
        ServiceTerritoryMember member = new ServiceTerritoryMember(ServiceResourceId = resource.Id, EffectiveStartDate = System.today(), ServiceTerritoryId = st.Id);
        insert member;
        
        FSL__Scheduling_Policy__c policy = new FSL__Scheduling_Policy__c();
        policy.Name = 'Customer First';
        insert policy;
        
		List<AssignedResource> ars = new List<AssignedResource>();
        List<ServiceAppointment> appts = new List<ServiceAppointment>();
        
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=wo2.Id, 
            DueDate=System.today().addDays(5), 
            EarliestStartTime=System.today().addDays(3),
            Status='Dispatched',
            SchedStartTime = DateTime.now(),
            SchedEndTime = DateTime.now().addDays(1),                
            Signature_Not_Captured_Reason__c = 'testing testing testing testing',
            Should_Auto_Generate_Service_report__c = true,
            Should_Auto_Send_Service_report__c= true
        );
        
        insert testSA;
        
        for (Integer i = 0; i < 3; i++) {
            ServiceAppointment appt = new ServiceAppointment(EarliestStartTime = System.now(), DueDate = System.now(), SchedStartTime = System.now(), SchedEndTime = System.now(), Status = 'Scheduled', ServiceTerritoryId = st.Id);
            
            if (i == 0) { appt.ParentRecordId = wo1.Id; } 
            else { appt.ParentRecordId = wo2.Id; }
            
            appt.FSL__Scheduling_Policy_Used__c = policy.Id;
            appt.FSL__Related_Service__c = testSA.Id;
            appt.FSL__Time_Dependency__c = 'Same Start';
            appts.add(appt);
        }
        
        insert appts;
        
        for (Integer i = 0; i < appts.size(); i++) {
            if (i == 0) {
            	ars.add(new AssignedResource(ServiceAppointmentId = appts[i].Id, ServiceResourceId = resource.Id, ServiceCrewId = crew.Id));
            } else {
            	ars.add(new AssignedResource(ServiceAppointmentId = appts[i].Id, ServiceResourceId = resource.Id));
            }
        }
        
        insert ars;
        
        for (ServiceAppointment sa : appts) {
            sa.Status = 'Dispatched';
        }
        
        update appts;
    }
    
    @isTest
    static void TestOneServiceAppointmentScenario() {
        ServiceAppointment appt = [SELECT Id, Status FROM ServiceAppointment LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock(appt.Id));
        Test.startTest();

        appt.Status = 'On Route';
        
        update appt;
        
        //appt.Status = 'Completed';
        //update appt;
        
        Database.executeBatch(new AssignedResourcesWorkOrderBatchable(appt.Id));
        
        Test.stopTest();
    }
    
    @isTest
    static void TestManyServiceAppointmentsSenario() {
        List<ServiceAppointment> appts = [SELECT Id, Status FROM ServiceAppointment];
        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock(appts[0].Id));
        Test.startTest();
        
        for (ServiceAppointment appt : appts) {
            appt.Status = 'On Route';
        }
        update appts;

        /*for (ServiceAppointment appt : appts) {
            appt.Status = 'Completed';
        }
        update appts;*/
        
        Database.executeBatch(new AssignedResourcesWorkOrderBatchable());
        
        Test.stopTest();
    }
    
    @isTest
    static void TestSchedulingBatch() {
        Test.startTest();
        
        String CRON_EXP = '0 0 0 3 9 ? 2022';
        
        System.schedule('AssignedResourcesWorkOrderBatchableTest', CRON_EXP, new AssignedResourcesWorkOrderBatchable()); 

        Test.stopTest();
    }
    
    public class ExampleCalloutMock implements HttpCalloutMock{
        private Id saId;
        
        public ExampleCalloutMock(Id saId) {
            this.saId = saId;
        }
        
        public HttpResponse respond(HTTPRequest req){
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json;charset=UTF-8');
            res.setBody('{"example":"test", "contentVersionId":"' + saId + '","entityId":"' + saId + '"}');
            res.setStatusCode(200);
            return res;
        }
    }
}