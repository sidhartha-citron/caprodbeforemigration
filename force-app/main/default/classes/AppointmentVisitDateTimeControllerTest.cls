@isTest
public class AppointmentVisitDateTimeControllerTest {
	@testSetup
    static void setup() {
        Group testGroup = new Group(Name='Customer_Success', type='Queue');
        insert testGroup;
        
        QueueSObject mappingObject = new QueueSobject(QueueId = testGroup.Id, SObjectType = 'Case');
        
        System.runAs(new User(Id = UserInfo.getUserId())) {
        	insert mappingObject;
        }
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Account_Ship_To_Record_Type_Id__c = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Ship To').getRecordTypeId();
        fssetting.Ticket_Emergency_Record_Type__c = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId();
        fssetting.Customer_Success_Queue__c = testGroup.Id;
        fssetting.Standard_Pricebook_Id__c = Test.getStandardPricebookId();
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        fssetting.Work_Order_Dispatched_Status__c = null;//'Dispatched';
        fssetting.Work_Order_Scheduled_Status__c = 'Scheduled';
        fssetting.Working_Hour_End_Time__c = '4:00';
        fssetting.Cannot_Complete_Status_Value__c = 'Cannot Complete';
        fssetting.System_Administrator_Profile_Id__c = UserInfo.getProfileId();
        fssetting.Work_Order_Cancelled_Status__c = 'Cancelled';
        fssetting.CitronDoNotReply__c = 'donotreply@citronhygiene.com.staging';
        fssetting.Customer_Success_Queue__c = testGroup.Id;
        fssetting.Ticket_New_Status__c = 'New';
        fssetting.PO_Required_Before_Label__c = 'PO Required Before';
        
        insert fssetting;
        
        Emergency_Dispatch_Wizard_Setttings__c edws = new Emergency_Dispatch_Wizard_Setttings__c();
        edws.Order_Name__c = 'test order ';
        edws.Maximum_Number_of_Resources__c = 10;
        edws.Order_Item_Batch_Threshold__c = 10;
        edws.Pagination_Limit__c = 25;
        edws.Activate_Warranty_Logic__c = true;
        edws.Customer_Ticket_Minimum_Business_Days__c = 3;
        edws.Customer_Ticket_Maximum_Number_of_Days__c = 14;
        edws.Customer_Ticket_Subject__c = 'test subject';
        edws.Customer_Ticket_Priority__c = 'Medium';
        edws.Customer_Ticket_Origin__c = 'Web';
        edws.Work_Order_Multi_Res_Advance_Days__c = 40;
        
        insert edws;
        
        TestDataFactory.crtBillToAcctContact(1, 0); 
        Account a = TestDataFactory.accounts.get(0); 
        
        Contact con = new Contact(
            LastName = 'testCon',
            Email = 'donotreply@citronhygiene.com.staging',
            AccountId = a.Id
        );
        insert con;
        
        //Create user for the contact
        Profile portalProfile = [SELECT Id FROM Profile WHERE Name = 'Citron Hygiene Community User' Limit 1];
        UserRole portalRole = [SELECT Id,Name from UserRole WHERE NAME like '%Cadillac%' OR Name like '%Citron%' Limit 1];
        
        User user1 = new User(
            Username = 'testL586489test@test.com',
            //ContactId = con.Id,
            ProfileId = UserInfo.getProfileId(),
            Alias = 'test123',
            Email = 'testL586489test@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Kumar',
            CommunityNickname = 'testL586489test',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            LanguageLocaleKey = 'en_US',
            Employee_Number__c = '785657'
        );
        
        insert user1;
        
        Order order = new Order();
        order.ShipToContactId = con.Id;
        order.AccountId = a.Id;
        order.Emergency__c = true;
        order.Line_of_Businesses__c = 'Pest Control';
        order.EffectiveDate = System.today();
        order.Status = 'Draft';
        
        insert order;
        
        WorkOrder wo = new WorkOrder();
        wo.AccountId = a.Id;
        wo.StartDate = System.today().addDays(-1);
        wo.EndDate = System.today().addDays(1);
        wo.Status = 'New';
        wo.Duration = 15;
        wo.DurationType = 'Minutes';
        wo.Order__c = order.Id;
        
        insert wo;
        
        FSL__Scheduling_Policy__c policy = new FSL__Scheduling_Policy__c();
        policy.Name = 'Customer First';
        
        insert policy;
        
        ServiceAppointment sa = new ServiceAppointment();
        sa.ParentRecordId = wo.Id;
        sa.Account__c = a.Id;
        sa.EarliestStartTime = System.now();
        sa.DueDate = System.now().addDays(1);
        sa.FSL__Scheduling_Policy_Used__c = policy.Id;
        sa.Status = 'Scheduled';
        sa.Duration = 5;
        
        insert sa;
        
        ServiceAppointment sa2 = new ServiceAppointment();
        sa2.ParentRecordId = wo.Id;
        sa2.Account__c = a.Id;
        sa2.EarliestStartTime = System.now();
        sa2.DueDate = System.now().addDays(1);
        sa2.FSL__Scheduling_Policy_Used__c = policy.Id;
        sa2.Status = 'Scheduled';
        sa2.Duration = 5;
        
        insert sa2;
    }
    
    @isTest
    static void testInitializeAppointmentVisitDateTimeScreen() {
        WorkOrder wo = [SELECT Id FROM WorkOrder LIMIT 1];
        
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.initializeAppointmentVisitDateTimeScreen(wo.Id);
        
        Test.stopTest();
    }
   
    @isTest
    static void testGetInstanceUrl() {
        
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.getInstanceUrl();
        
        Test.stopTest();
    }
    
    @isTest
    static void testGetServiceAppointmentsOnWorkOrder() {
        WorkOrder wo = [SELECT Id FROM WorkOrder LIMIT 1];
        
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.getServiceAppointmentsOnWorkOrder(wo.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testGetSchedulingPolicies() {
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.getSchedulingPolicies();
        
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateServiceAppointmentPolicy() {
        ServiceAppointment sa = [SELECT Id, FSL__Scheduling_Policy_Used__c FROM ServiceAppointment LIMIT 1];
        
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.updateServiceAppointmentPolicy(sa.FSL__Scheduling_Policy_Used__c, sa);
        
        Test.stopTest();
    }
    
    @isTest
    static void testCancelSpecifiedServiceAppointment() {
        ServiceAppointment sa = [SELECT Id, FSL__Scheduling_Policy_Used__c, ParentRecordId, Status FROM ServiceAppointment LIMIT 1];
        
        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock(sa.Id));
        
        Test.startTest();
        
        sa.Status = null;
        update sa;
        
        EDW_AppointmentVisitDateTimeController.cancelSpecifiedServiceAppointment(sa);
        
        Test.stopTest();
    }
    
    @isTest
    static void testCheckForAppointmentAssignment() {
        ServiceAppointment sa = [SELECT Id, ParentRecordId FROM ServiceAppointment LIMIT 1];
        
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.deleteSpecifiedServiceAppointment(sa);
        
        Test.stopTest();
    }
    
    @isTest
    static void testDeleteSpecifiedServiceAppointment() {
        ServiceAppointment sa = [SELECT Id FROM ServiceAppointment LIMIT 1];
        
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.checkForAppointmentAssignment(sa.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testGetTimeBlocks() {
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.getTimeBlocks();
        
        Test.stopTest();
    }
    
    @isTest
    static void testGetDefaultRequestedDate() {
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.getDefaultRequestedDate();
        
        Test.stopTest();
    }
    
    @isTest
    static void testValidateRequestedDate() {
        Test.startTest();
        
        String requestedDateNotInRange = String.valueOf(System.today()),
            requestedDateValid = String.valueOf(System.today().addDays(5)),
            requestedDateNotInPast = String.valueOf(System.today().addDays(-1));
        
        EDW_AppointmentVisitDateTimeController.validateRequestedDate(requestedDateNotInRange);
        EDW_AppointmentVisitDateTimeController.validateRequestedDate(requestedDateValid);
        EDW_AppointmentVisitDateTimeController.validateRequestedDate(requestedDateNotInPast);
        
        Test.stopTest();
    }
    
    @isTest
    static void testCreateAppointmentRequest() {
        Test.startTest();
        
        String requestedDateValid = String.valueOf(System.today().addDays(5)),
            timeBlock = 'Morning';
        
        User portalUser = [SELECT Id FROM User WHERE Username = 'testL586489test@test.com' LIMIT 1];
        
        System.runAs(portalUser) {
        	EDW_AppointmentVisitDateTimeController.createAppointmentRequest(requestedDateValid, timeBlock);
        }
        
        Test.stopTest();
    }
    
    @isTest
    static void exitEmergencyDispatchWizard() {
        Test.startTest();
        Order order = [SELECT Id FROM Order LIMIT 1];
        String requestedDateValid = String.valueOf(System.today().addDays(5)),
            timeBlock = 'Morning';
        
        User portalUser = [SELECT Id FROM User WHERE Username = 'testL586489test@test.com' LIMIT 1];
        
        System.runAs(portalUser) {
            EDW_AppointmentVisitDateTimeController.exitEmergencyDispatchWizard(JSON.serialize(order));
        }
        
        Test.stopTest();
    }
    
    @isTest
    static void testCompleteEmergencyDispatchWizard() {
        Order order = [SELECT Id FROM Order LIMIT 1];
        String orderJson = System.JSON.serialize(order);
        
        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock(order.Id));
        
        Test.startTest();
        
        EDW_AppointmentVisitDateTimeController.completeEmergencyDispatchWizard(orderJson);
        
        Test.stopTest();
    }

    public class CongaCalloutMock implements HttpCalloutMock{
        private String contentId;
        
        public CongaCalloutMock(String contentId) {
            this.contentId = contentId;
        }
        
        public CongaCalloutMock() {
            this.contentId = 'test';
        }
        
        public HttpResponse respond(HTTPRequest req){
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json;charset=UTF-8');
            res.setBody('{"contentVersionId":"' + contentId + '","entityId"}');
            res.setStatusCode(200);
            return res;
        }
    }
}