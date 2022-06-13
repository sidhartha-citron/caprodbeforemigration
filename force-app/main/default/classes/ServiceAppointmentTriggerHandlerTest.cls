@isTest
public class ServiceAppointmentTriggerHandlerTest{
    
    @TestSetup static void setup() {
        EmailTemplate testEmailTemplate = new EmailTemplate (DeveloperName = 'NotificationTest', 
                                                            FolderId = userInfo.getUserId(), 
                                                            TemplateType= 'visualforce',
                                                            Name = 'Test', 
                                                            Subject = 'Test Subject' );
        testEmailTemplate.Markup = '<messaging:emailTemplate subject="Test Subject" ><messaging:htmlEmailBody ></messaging:htmlEmailBody ></messaging:emailTemplate>';                                                    
        insert testEmailTemplate;
    }

    static testMethod void test_sendNotificationEmails(){
        
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id qaRecordTypeId = Schema.SObjectType.WorkOrder.getRecordTypeInfosByName().get('QA Work Order').getRecordTypeId();
        List<string> lsstr= new List<string> ();

        
        
        WorkType testWorkType =  new WorkType(
            Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
       
        EmailTemplate testEmailTemplate = [SELECT Id FROM EmailTemplate WHERE DeveloperName = 'NotificationTest'];
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.QA_WorkOrder_RecordTypeId__c = qaRecordTypeId;
        fssetting.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        fssetting.Service_Start__c = 0;
        fssetting.CitronDoNotReply__c = 'donotreply@citronhygiene.com';
        fssetting.Service_Notification_Email_Template_Id__c = testEmailTemplate.Id;
        insert fssetting;
        
        User thisUser = [ select Id from User where Id = :UserInfo.getUserId() ];
        User[] testUsers = new User[0];
        ServiceResource[] serviceResourceArray = new ServiceResource[0];
        
        System.runAs ( thisUser ) {
            testUsers = TestingUtils.createUsers(2, new Profile[] {new Profile(Id = Label.Profile_Hygiene_Tech), new Profile(Id = Label.Profile_Pest_Tech)}, new UserRole[] {new                                           UserRole(Id = Label.CEO_Role)},True);
            insert testUsers;
        }
        System.runAs ( thisUser ) {             
            serviceResourceArray.add(new ServiceResource(Name = 'test1', RelatedRecordId = testUsers[0].id, ResourceType= 'T',
                                                         Region__c = 'Markham', IsActive = true));
            
            serviceResourceArray.add(new ServiceResource(Name = 'test2', RelatedRecordId = testUsers[1].id, ResourceType= 'T',
                                                         Region__c = 'Markham', IsActive = true));
            
            insert serviceResourceArray;
        }
        TestDataFactory.crtBillToAcctContact(1,0); 
        Account a = TestDataFactory.accounts[0]; 
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    Clean_Out_Type__c='Ants', 
                    Warranty_Period__c=10,
                    ExternalId__c = '3-55-7-02-1' + i
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<5; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        insert pEntries; 
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId
        ); 
        insert o;
        
        
        for(Integer i=0; i<1; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE
                )
            );
        } 
        
        insert orderItems;
        
        for(Integer i=0; i<1; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o.Id,  
                    Originating_Record_ID__c=orderItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o.Site_Survey__c, 
                    Service_Frequency__c=orderItems.get(i).Frequency__c, 
                    Survey_Location__c = location.Id
                )
            );
        } 
        insert surveyAssetLocations;
        
        for(Integer i=0; i<1; i++) {
            orderItems.get(i).HasSurveyAssets__c=true;
            orderItemLocations.add(
                new Order_Item_Location__c(
                    Order__c=o.Id,  
                    Order_Product__c=orderItems.get(i).Id, 
                    Survey_Asset_Location__c=surveyAssetLocations.get(i).Id
                )
            );
        }
        
        insert orderItemLocations;
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        
        OperatingHours employeeHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Employee Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{territoryHours, employeeHours};
            
            
        ServiceTerritory st = TestDataFactory.srvTers[0];
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            ServiceTerritoryId=st.Id, 
            Status='New',
            Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31),
            Cannot_Complete_Reason__c = 'Broken Unit'
        );
        insert testWorkOrder;
        
        OrderItem oItem = orderItems.get(0);
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            Product__c=products.get(0).Id, 
            Line_Item_Description__c='TestDescription'
        );
        insert testWorkOrderItem;
        
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
            UserName = 'testUser@UserTechnicianForTest.com123', 
            Employee_Number__c = 'ABCD123TEST',
            IsActive = true
        );
        insert newUser;
        
        ServiceResource testResource = new ServiceResource(
            Name='TestResource', 
            RelatedRecordId=newUser.Id,
            ResourceType='T', 
            isActive=TRUE
        );
        insert testResource;
        
        ServiceTerritoryMember stm = new ServiceTerritoryMember(
            OperatingHoursId=employeeHours.Id, 
            ServiceResourceId=testResource.Id, 
            ServiceTerritoryId=st.Id, 
            EffectiveStartDate=System.today().addDays(-10),
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            TerritoryType='P'
        );
        insert stm;
        update testResource;
        System.debug(stm);
        
        Contact con = new Contact(
            LastName = 'testCon',
            Email = 'testContact@citronhygiene.com',
            AccountId = a.Id
        );
        insert con;
        
        AccountContactRelation acr = [Select Id,Roles from AccountContactRelation where ContactId =: con.Id];
        acr.Roles = 'Appointment Notification Opt-In';
        update acr;
        
        
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=testWorkOrder.id, 
            DueDate=System.today().addDays(5), 
            EarliestStartTime=System.today().addDays(3),
            Status='New',
            SchedStartTime = DateTime.now(),
            SchedEndTime = DateTime.now().addDays(1),
            Email_Sent__c = false,
            Account__c = a.Id
        );
        
        insert testSA;
        ServiceAppointment oldSA = [Select Id,Email_Sent__c,AccountId,ParentRecordId from ServiceAppointment where id =: testSA.Id];
        
        Map<Id,ServiceAppointment> oldMap = new Map<Id,ServiceAppointment>();
        oldMap.put(oldSA.Id,oldSA);
        
        Test.startTest();
        
        testSA.Email_Sent__c = true;
        update testSA;
        ServiceAppointment newSA = [Select Id,Email_Sent__c,AccountId,Account__c,ParentRecordId from ServiceAppointment where id =: testSA.Id];
        List<ServiceAppointment> listSA = new List<ServiceAppointment>();
        listSA.add(newSA);
        
        ServiceAppointmentTriggerHandler sahand = new ServiceAppointmentTriggerHandler();
        sahand.serviceAppointments=listSA;
        sahand.oldMap = oldMap;
        sahand.sendNotificationEmails(); 
        Integer invocations = Limits.getEmailInvocations();
        List<Task> taskList = new List<task>();
        taskList = [Select id,whoid from task where whoid =: con.id];
        system.assertNotEquals(taskList.size(),null);
        system.assertEquals(2, invocations);
        Test.stopTest();
        
    }
    
    static testMethod void test_callCreateSendServiceReport(){
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id qaRecordTypeId = Schema.SObjectType.WorkOrder.getRecordTypeInfosByName().get('QA Work Order').getRecordTypeId();
        List<string> lsstr= new List<string> ();
        List<ServiceReport> listServiceReport = new List<ServiceReport>();
        
        WorkType testWorkType =  new WorkType(
            Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Service_Appointment_Completed_Status__c = 'Completed';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.QA_WorkOrder_RecordTypeId__c = qaRecordTypeId;
        fssetting.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        fssetting.Service_Start__c = 0;
        fssetting.CitronDoNotReply__c = 'donotreply@citronhygiene.com';
        insert fssetting;
        
        User thisUser = [ select Id from User where Id = :UserInfo.getUserId() ];
        User[] testUsers = new User[0];
        ServiceResource[] serviceResourceArray = new ServiceResource[0];
        
        System.runAs ( thisUser ) {
            testUsers = TestingUtils.createUsers(2, new Profile[] {new Profile(Id = Label.Profile_Hygiene_Tech), new Profile(Id = Label.Profile_Pest_Tech)}, new UserRole[] {new                                           UserRole(Id = Label.CEO_Role)},True);
            insert testUsers;
        }
        System.runAs ( thisUser ) {             
            serviceResourceArray.add(new ServiceResource(Name = 'test1', RelatedRecordId = testUsers[0].id, ResourceType= 'T',
                                                         Region__c = 'Markham', IsActive = true));
            
            serviceResourceArray.add(new ServiceResource(Name = 'test2', RelatedRecordId = testUsers[1].id, ResourceType= 'T',
                                                         Region__c = 'Markham', IsActive = true));
            
            insert serviceResourceArray;
        }
        
        TestDataFactory.crtBillToAcctContact(1,2); 
        Account a = TestDataFactory.accounts[0]; 
        Contact c = TestDataFactory.contacts[0]; 
        Contact b = TestDataFactory.contacts[1]; 
        b.Email = fssetting.CitronDoNotReply__c;
        update b;
        
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    Clean_Out_Type__c='Ants', 
                    Warranty_Period__c=10,
                    ExternalId__c = '3-55-7-02-1' + i
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<5; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        insert pEntries; 
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId
        ); 
        insert o;
        
        
        for(Integer i=0; i<1; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE
                )
            );
        } 
        
        insert orderItems;
        
        for(Integer i=0; i<1; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o.Id,  
                    Originating_Record_ID__c=orderItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o.Site_Survey__c, 
                    Service_Frequency__c=orderItems.get(i).Frequency__c, 
                    Survey_Location__c = location.Id
                )
            );
        } 
        insert surveyAssetLocations;
        
        for(Integer i=0; i<1; i++) {
            orderItems.get(i).HasSurveyAssets__c=true;
            orderItemLocations.add(
                new Order_Item_Location__c(
                    Order__c=o.Id,  
                    Order_Product__c=orderItems.get(i).Id, 
                    Survey_Asset_Location__c=surveyAssetLocations.get(i).Id
                )
            );
        }
        
        insert orderItemLocations;
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        
        OperatingHours employeeHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Employee Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{territoryHours, employeeHours};
            
            
        ServiceTerritory st = TestDataFactory.srvTers[0];
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            ServiceTerritoryId=st.Id, 
            Status='New',
            Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31),
            Cannot_Complete_Reason__c = 'Broken Unit'
        );
        insert testWorkOrder;
        
        OrderItem oItem = orderItems.get(0);
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            Product__c=products.get(0).Id, 
            Line_Item_Description__c='TestDescription'
        );
        insert testWorkOrderItem;
        
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
            UserName = 'testUser@UserTechnicianForTest.com123', 
            Employee_Number__c = 'ABCD123TEST',
            IsActive = true
        );
        insert newUser;
        
        ServiceResource testResource = new ServiceResource(
            Name='TestResource', 
            RelatedRecordId=newUser.Id,
            ResourceType='T', 
            isActive=TRUE
        );
        insert testResource;
        
        ServiceTerritoryMember stm = new ServiceTerritoryMember(
            OperatingHoursId=employeeHours.Id, 
            ServiceResourceId=testResource.Id, 
            ServiceTerritoryId=st.Id, 
            EffectiveStartDate=System.today().addDays(-10),
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            TerritoryType='P'
        );
        insert stm;
        update testResource;
        System.debug(stm);
        
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=testWorkOrder.Id, 
            DueDate=System.today().addDays(5), 
            EarliestStartTime=System.today().addDays(3),
            Status='Completed',
            SchedStartTime = DateTime.now(),
            SchedEndTime = DateTime.now().addDays(1),                
            Signature_Not_Captured_Reason__c = 'testing testing testing testing',
            Should_Auto_Generate_Service_report__c = true,
            Should_Auto_Send_Service_report__c= true
        );
        
        insert testSA;
        
        Set<Id> saAutoGenerateSendReports = new Set<Id>();
        Set<Id> completedSAParentIds = new Set<Id>();
        
        
        
        update testWorkOrder;
        
        saAutoGenerateSendReports.add(testSA.Id);
        completedSAParentIds.add(testWorkOrder.Id);
        
        Test.startTest();
        
        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock(testSA.id));  
        ServiceAppointmentTriggerHandler.createSendServiceReport(saAutoGenerateSendReports,completedSAParentIds,userInfo.getSessionId());
        Test.stopTest(); 
    }
    
    static testMethod void test_MultiRessendNotificationEmails(){
        
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id qaRecordTypeId = Schema.SObjectType.WorkOrder.getRecordTypeInfosByName().get('QA Work Order').getRecordTypeId();
        List<string> lsstr= new List<string> ();
        
        WorkType testWorkType =  new WorkType(
            Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.QA_WorkOrder_RecordTypeId__c = qaRecordTypeId;
        fssetting.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        fssetting.Service_Start__c = 0;
        fssetting.CitronDoNotReply__c = 'donotreply@citronhygiene.com';
        fssetting.Activate_Pest_Emergency_Email_Logic__c = true;
        insert fssetting;
        
        User thisUser = [ select Id from User where Id = :UserInfo.getUserId() ];
        User[] testUsers = new User[0];
        ServiceResource[] serviceResourceArray = new ServiceResource[0];
        
        System.runAs ( thisUser ) {
            testUsers = TestingUtils.createUsers(2, new Profile[] {new Profile(Id = Label.Profile_Hygiene_Tech), new Profile(Id = Label.Profile_Pest_Tech)}, new UserRole[] {new                                           UserRole(Id = Label.CEO_Role)},True);
            insert testUsers;
        }
        System.runAs ( thisUser ) {             
            serviceResourceArray.add(new ServiceResource(Name = 'test1', RelatedRecordId = testUsers[0].id, ResourceType= 'T',
                                                         Region__c = 'Markham', IsActive = true));
            
            serviceResourceArray.add(new ServiceResource(Name = 'test2', RelatedRecordId = testUsers[1].id, ResourceType= 'T',
                                                         Region__c = 'Markham', IsActive = true));
            
            insert serviceResourceArray;
        }
        
        
        TestDataFactory.crtBillToAcctContact(1,0); 
        Account a = TestDataFactory.accounts[0]; 
        
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    Clean_Out_Type__c='Ants', 
                    Warranty_Period__c=10,
                    ExternalId__c = '3-55-7-02-1' + i
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<5; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        insert pEntries; 
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId
        ); 
        insert o;
        
        
        for(Integer i=0; i<1; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE
                )
            );
        } 
        
        insert orderItems;
        
        for(Integer i=0; i<1; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o.Id,  
                    Originating_Record_ID__c=orderItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o.Site_Survey__c, 
                    Service_Frequency__c=orderItems.get(i).Frequency__c, 
                    Survey_Location__c = location.Id
                )
            );
        } 
        insert surveyAssetLocations;
        
        for(Integer i=0; i<1; i++) {
            orderItems.get(i).HasSurveyAssets__c=true;
            orderItemLocations.add(
                new Order_Item_Location__c(
                    Order__c=o.Id,  
                    Order_Product__c=orderItems.get(i).Id, 
                    Survey_Asset_Location__c=surveyAssetLocations.get(i).Id
                )
            );
        }
        
        insert orderItemLocations;
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        
        OperatingHours employeeHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Employee Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{territoryHours, employeeHours};
            
            
            
        ServiceTerritory st = TestDataFactory.srvTers[0]; 
        st.OperatingHoursId = territoryHours.Id; 
        update st; 
        
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            ServiceTerritoryId=st.Id, 
            Status='New',
            Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31),
            Cannot_Complete_Reason__c = 'Broken Unit'
        );
        insert testWorkOrder;
        
        OrderItem oItem = orderItems.get(0);
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            Product__c=products.get(0).Id, 
            Line_Item_Description__c='TestDescription'
        );
        insert testWorkOrderItem;
        
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
            UserName = 'testUser@UserTechnicianForTest.com123', 
            Employee_Number__c = 'ABCD123TEST',
            IsActive = true
        );
        insert newUser;
        
        ServiceResource testResource = new ServiceResource(
            Name='TestResource', 
            RelatedRecordId=newUser.Id,
            ResourceType='T', 
            isActive=TRUE
        );
        insert testResource;
        
        ServiceTerritoryMember stm = new ServiceTerritoryMember(
            OperatingHoursId=employeeHours.Id, 
            ServiceResourceId=testResource.Id, 
            ServiceTerritoryId=st.Id, 
            EffectiveStartDate=System.today().addDays(-10),
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            TerritoryType='P'
        );
        insert stm;
        update testResource;
        System.debug(stm);
        
        Contact con = new Contact(
            LastName = 'testCon',
            Email = 'testContact@citronhygiene.com',
            AccountId = a.Id
        );
        insert con;
        
        AccountContactRelation acr = [Select Id,Roles from AccountContactRelation where ContactId =: con.Id];
        acr.Roles = 'Appointment Notification Opt-In';
        update acr;
        
        
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=testWorkOrder.id, 
            DueDate=System.today().addDays(5), 
            EarliestStartTime=System.today().addDays(3),
            Status='New',
            SchedStartTime = DateTime.now(),
            SchedEndTime = DateTime.now().addDays(1),
            Email_Sent__c = false,
            Account__c = a.Id,
            Send_Pest_Emergency_Dispatch_Not__c = false
        );
        
        insert testSA;
        ServiceAppointment oldSA = [Select Id,Email_Sent__c,AccountId,ParentRecordId from ServiceAppointment where id =: testSA.Id];
        
        Map<Id,ServiceAppointment> oldMap = new Map<Id,ServiceAppointment>();
        oldMap.put(oldSA.Id,oldSA);
        
        testSA.Send_Pest_Emergency_Dispatch_Not__c = true;
        update testSA;
        
        Test.startTest();
        
        List<EmailMessage> listEmailMessage = new List<EmailMessage>();
        listEmailMessage = [ Select Id,relatedToId from EmailMessage where relatedToId =: testSA.id];
        
        Test.stopTest();
    }
    
    
    static testMethod void test_sid(){
         List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id qaRecordTypeId = Schema.SObjectType.WorkOrder.getRecordTypeInfosByName().get('QA Work Order').getRecordTypeId();
        List<string> lsstr= new List<string> ();
        
        WorkType testWorkType =  new WorkType(
            Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Work_Order_Completion_Status__c = 'Dispatched';
        fssetting.Service_Appointment_Completed_Status__c = 'Dispatched';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.QA_WorkOrder_RecordTypeId__c = qaRecordTypeId;
        fssetting.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        fssetting.Service_Start__c = 0;
        fssetting.CitronDoNotReply__c = 'donotreply@citronhygiene.com';
        fssetting.Activate_Pest_Emergency_Email_Logic__c = true;
        insert fssetting;
        
        User thisUser = [ select Id from User where Id = :UserInfo.getUserId() ];
        User[] testUsers = new User[0];
        ServiceResource[] serviceResourceArray = new ServiceResource[0];
        
        System.runAs ( thisUser ) {
            testUsers = TestingUtils.createUsers(2, new Profile[] {new Profile(Id = Label.Profile_Hygiene_Tech), new Profile(Id = Label.Profile_Pest_Tech)}, new UserRole[] {new                                           UserRole(Id = Label.CEO_Role)},True);
            insert testUsers;
        }
        System.runAs ( thisUser ) {             
            serviceResourceArray.add(new ServiceResource(Name = 'test1', RelatedRecordId = testUsers[0].id, ResourceType= 'T',
                                                         Region__c = 'Markham', IsActive = true));
            
            serviceResourceArray.add(new ServiceResource(Name = 'test2', RelatedRecordId = testUsers[1].id, ResourceType= 'T',
                                                         Region__c = 'Markham', IsActive = true));
            
            insert serviceResourceArray;
        }
        
        
        TestDataFactory.crtBillToAcctContact(1,0); 
        Account a = TestDataFactory.accounts[0]; 
        
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Signature_Required_For__c = 'Hygiene;Chemical;Pest Control;Life Safety',
            Status__c = 'Draft'
        );
        insert ss;
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    Clean_Out_Type__c='Ants', 
                    Warranty_Period__c=10,
                    ExternalId__c = '3-55-7-02-1' + i
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<5; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        insert pEntries; 
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId
        ); 
        insert o;
        
        
        for(Integer i=0; i<1; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE
                )
            );
        } 
        
        insert orderItems;
        
        for(Integer i=0; i<1; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o.Id,  
                    Originating_Record_ID__c=orderItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o.Site_Survey__c, 
                    Service_Frequency__c=orderItems.get(i).Frequency__c, 
                    Survey_Location__c = location.Id
                )
            );
        } 
        insert surveyAssetLocations;
        
        for(Integer i=0; i<1; i++) {
            orderItems.get(i).HasSurveyAssets__c=true;
            orderItemLocations.add(
                new Order_Item_Location__c(
                    Order__c=o.Id,  
                    Order_Product__c=orderItems.get(i).Id, 
                    Survey_Asset_Location__c=surveyAssetLocations.get(i).Id
                )
            );
        }
        
        insert orderItemLocations;
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        
        OperatingHours employeeHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Employee Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{territoryHours, employeeHours};
            
            
            
        ServiceTerritory st = TestDataFactory.srvTers[0]; 
        st.OperatingHoursId = territoryHours.Id; 
        update st; 
        
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            ServiceTerritoryId=st.Id, 
            Status='New',
            Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31),
            Cannot_Complete_Reason__c = 'Broken Unit'
        );
        insert testWorkOrder;
        
        OrderItem oItem = orderItems.get(0);
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            Product__c=products.get(0).Id, 
            Line_Item_Description__c='TestDescription'
        );
        insert testWorkOrderItem;
        
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
            UserName = 'testUser@UserTechnicianForTest.com123', 
            Employee_Number__c = 'ABCD123TEST',
            IsActive = true
        );
        insert newUser;
        
        ServiceResource testResource = new ServiceResource(
            Name='TestResource', 
            RelatedRecordId=newUser.Id,
            ResourceType='T', 
            isActive=TRUE
        );
        insert testResource;
        
        ServiceTerritoryMember stm = new ServiceTerritoryMember(
            OperatingHoursId=employeeHours.Id, 
            ServiceResourceId=testResource.Id, 
            ServiceTerritoryId=st.Id, 
            EffectiveStartDate=System.today().addDays(-10),
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            TerritoryType='P'
        );
        insert stm;
        update testResource;
        System.debug(stm);
        
        Contact con = new Contact(
            LastName = 'testCon',
            Email = 'testContact@citronhygiene.com',
            AccountId = a.Id
        );
        insert con;
        
        AccountContactRelation acr = [Select Id,Roles from AccountContactRelation where ContactId =: con.Id];
        acr.Roles = 'Appointment Notification Opt-In';
        update acr;
        
        
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=testWorkOrder.id, 
            DueDate=System.today().addDays(5), 
            EarliestStartTime=System.today().addDays(3),
            Status='Scheduled',
            SchedStartTime = DateTime.now(),
            SchedEndTime = DateTime.now().addDays(1),
            Email_Sent__c = false,
            Account__c = a.Id,
            Signature_Not_Captured_Reason__c = 'testing testing testing testing',
            Send_Pest_Emergency_Dispatch_Not__c = false
        );
        
        insert testSA;

        testSA.Status = 'Dispatched';
        
        update testSA;
        
        ServiceAppointment oldSA = [Select Id,Email_Sent__c,AccountId,ParentRecordId from ServiceAppointment where id =: testSA.Id];
        
        Map<Id,ServiceAppointment> oldMap = new Map<Id,ServiceAppointment>();
        oldMap.put(oldSA.Id,oldSA);
        
        Test.startTest();
        
        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock(testSA.id));  
        //ServiceAppointmentTriggerHandler.createSendServiceReport(saAutoGenerateSendReports,completedSAParentIds,userInfo.getSessionId());
        Test.stopTest(); 
        

    }
    
}