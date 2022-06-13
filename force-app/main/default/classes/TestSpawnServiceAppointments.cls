@isTest
public class TestSpawnServiceAppointments {
    static testmethod void scheduletest1() {
        Test.startTest();
        String cronExpr = '0 0 0 15 3 ? 2022';
        spawnServiceAppointments abs= new spawnServiceAppointments(system.now() + 10, system.now() + 30);
       // String jobId = System.schedule('myJobTestJobName', cronExpr, abs);
        Test.stopTest();
    }
    
    static testmethod void scheduletest() {
        Test.startTest();
        String cronExpr = '0 0 0 15 3 ? 2022';
        spawnServiceAppointments abs= new spawnServiceAppointments();
        String jobId = System.schedule('myJobTestJobName', cronExpr, abs);
        Test.stopTest();
    }
    static testMethod void testSABatchPest() {
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        TestDataFactory.crtFieldSettings();
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Datetime todaysDate = Datetime.now();
        
        Skill testSkill = [SELECT Id FROM Skill LIMIT 1].get(0);
        
        WorkType testWorkType =  new WorkType(
        	Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        SkillRequirement testSkillReq = new SkillRequirement(
        	RelatedRecordId=testWorkType.Id, 
            SkillId=testSkill.Id, 
            SkillLevel=1
        );
        insert testSkillReq;
        
        TestDataFactory.crtAcctContact(1, 0 ); 
        Account a = TestDataFactory.accounts[0]; 
        a.OperatingHoursId = TestDataFactory.opthours[1].id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
		update a;
        
        TimeSlot testSlot = new TimeSlot(
        	DayOfWeek='Monday', 
            StartTime = Time.newInstance(07, 00, 00, 00), 
            EndTime = Time.newInstance(17, 00, 00, 00),
            OperatingHoursId = TestDataFactory.opthours[1].id
        );
        insert testSlot;
        
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft', 
            Signature_Required_For__c = 'Hygiene;Chemical;Pest Control;Life Safety',
            Pest_Duration_Calculation__c=20
        );
        insert ss;
        
        a.Site_Survey__c=ss.Id;
        update a;   
		
        SiteSurvey_RequiredSkills__c testSurveySkill = new SiteSurvey_RequiredSkills__c(
        	Site_Survey__c=a.Site_Survey__c, 
            Name='TestSkill', 
            Skill_Level__c=1,
            Skill_Name__c='TestSkill', 
            Skill_Record_Id__c=testSkill.Id, 
            Line_of_Business__c='Chemical;Hygiene;Pest Control'
        );
        
        insert testSurveySkill;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==0) ? 'Pest Control' : 'Hygiene', 
                    Item_Type__c= 'Service', 
                    Installation_Work_Type__c=testWorkType.Id, 
                    Service_Work_Type__c=testWorkType.Id,
                    ExternalId__c = 'test'+i
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
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Line_of_Business__c='Pest Control', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            Type__c='Service', 
            StartDate=Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 00, 00, 00),
            EndDate=Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 23, 59, 59)
        );
        insert testWorkOrder;
        
        SkillRequirement testSkillReqWO = new SkillRequirement(
        	RelatedRecordId=testWorkOrder.Id, 
            SkillId=testSkill.Id, 
            SkillLevel=1
        );
        insert testSkillReqWO;
        system.debug('testSkillReqWO ' + testSkillReqWO);
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Type_of_Service__c='Installation', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            WorkTypeId=testWorkType.Id
        );
        insert testWorkOrderItem;
        
        Test.startTest();
        
        SpawnServiceAppointments testRun = new SpawnServiceAppointments(testWorkOrder.Id);
        Database.executeBatch(testRun, 50);
        
        Test.stopTest();
    }
    
    static testMethod void testSABatchHygieneDelivery() {
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        TestDataFactory.crtFieldSettings();
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Datetime todaysDate = Datetime.now();
        
        Skill testSkill = [SELECT Id FROM Skill LIMIT 1].get(0);
        
        WorkType testWorkType =  new WorkType(
        	Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        SkillRequirement testSkillReq = new SkillRequirement(
        	RelatedRecordId=testWorkType.Id, 
            SkillId=testSkill.Id, 
            SkillLevel=1
        );
        insert testSkillReq;
        
        TestDataFactory.crtAcctContact(1, 0 ); 
        Account a = TestDataFactory.accounts[0]; 
        a.OperatingHoursId = TestDataFactory.opthours[1].id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
		update a;
                    
        TimeSlot testSlot = new TimeSlot(
        	DayOfWeek='Monday', 
            StartTime = Time.newInstance(07, 00, 00, 00), 
            EndTime = Time.newInstance(17, 00, 00, 00),
            OperatingHoursId = TestDataFactory.opthours[1].id
        );
        insert testSlot;
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft', 
            Min_Pest_Work_Order_Lines__c = 1,
            Signature_Required_For__c = 'Hygiene;Chemical;Pest Control;Life Safety',
            Pest_Duration_Calculation__c=20
        );
        insert ss;
        
        a.Site_Survey__c=ss.Id;
        update a;    
        
        SiteSurvey_RequiredSkills__c testSurveySkill = new SiteSurvey_RequiredSkills__c(
        	Site_Survey__c=a.Site_Survey__c, 
            Name='TestSkill', 
            Skill_Level__c=1,
            Skill_Name__c='TestSkill', 
            Skill_Record_Id__c=testSkill.Id, 
            Line_of_Business__c='Chemical;Hygiene;Pest Control'
        );
        
        insert testSurveySkill;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==0) ? 'Hygiene' : 'Pest Control', 
                    Item_Type__c= (i==0) ? 'Consumables' : 'Service', 
                    Installation_Work_Type__c=testWorkType.Id, 
                    Service_Work_Type__c=testWorkType.Id, 
                    Delivery_Work_Type__c=testWorkType.Id
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
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            Type__c='Delivery', 
            StartDate=Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 00, 00, 00),
            EndDate=Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 23, 59, 59)
        );
        insert testWorkOrder;
        
        SkillRequirement testSkillReqWO = new SkillRequirement(
        	RelatedRecordId=testWorkOrder.Id, 
            SkillId=testSkill.Id, 
            SkillLevel=1
        );
        insert testSkillReqWO;
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Type_of_Service__c='Delivery', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            WorkTypeId=testWorkType.Id
        );
        insert testWorkOrderItem;
        
        Test.startTest();
        
        SpawnServiceAppointments testRun = new SpawnServiceAppointments(testWorkOrder.Id);
        Database.executeBatch(testRun, 50);
        
        delete testSkillReqWO;
        
        //Database.executeBatch(testRun, 50);
        
        Test.stopTest();
    }
    
    static testMethod void testSABatchHygieneService() {
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        TestDataFactory.crtFieldSettings();
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Datetime todaysDate = Datetime.now();
        
        Skill testSkill = [SELECT Id FROM Skill LIMIT 1].get(0);
        
        WorkType testWorkType =  new WorkType(
        	Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        SkillRequirement testSkillReq = new SkillRequirement(
        	RelatedRecordId=testWorkType.Id, 
            SkillId=testSkill.Id, 
            SkillLevel=1
        );
        insert testSkillReq;
        
        TestDataFactory.crtAcctContact(1, 0); 
        Account a = TestDataFactory.accounts[0];
        a.OperatingHoursId = TestDataFactory.opthours[1].Id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        update a;
                    
		TimeSlot testSlot = new TimeSlot(
        	DayOfWeek='Monday', 
            StartTime = Time.newInstance(07, 00, 00, 00), 
            EndTime = Time.newInstance(17, 00, 00, 00),
            OperatingHoursId = TestDataFactory.opthours[1].Id
        );
        insert testSlot;
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft', 
            Min_Pest_Work_Order_Lines__c = 1,
            Signature_Required_For__c = 'Hygiene;Chemical;Pest Control;Life Safety',
            Pest_Duration_Calculation__c=20
        );
        insert ss;
        
        a.Site_Survey__c=ss.Id;
        update a;    
        
        SiteSurvey_RequiredSkills__c testSurveySkill = new SiteSurvey_RequiredSkills__c(
        	Site_Survey__c=a.Site_Survey__c, 
            Name='TestSkill', 
            Skill_Level__c=1,
            Skill_Name__c='TestSkill', 
            Skill_Record_Id__c=testSkill.Id, 
            Line_of_Business__c='Chemical;Hygiene;Pest Control'
        );
        
        insert testSurveySkill;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==0) ? 'Hygiene' : 'Pest Control', 
                    Item_Type__c= 'Service', 
                    Installation_Work_Type__c=testWorkType.Id, 
                    Service_Work_Type__c=testWorkType.Id, 
                    Delivery_Work_Type__c=testWorkType.Id
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
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            Type__c='Service', 
            StartDate=Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 00, 00, 00),
            EndDate=Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 23, 59, 59)
        );
        insert testWorkOrder;
        
        SkillRequirement testSkillReqWO = new SkillRequirement(
        	RelatedRecordId=testWorkOrder.Id, 
            SkillId=testSkill.Id, 
            SkillLevel=1
        );
        insert testSkillReqWO;
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id, 
            WorkTypeId=testWorkType.Id
        );
        insert testWorkOrderItem;
        
        Test.startTest();
        
        SpawnServiceAppointments testRun = new SpawnServiceAppointments(testWorkOrder.Id);
        Database.executeBatch(testRun, 50);
        
        List<ServiceAppointment> sas = [SELECt Id, ParentRecordId, AccountId, Type__c, Line_Of_Business__c, ServiceReportAlreadySent__c, Signature_Not_Captured_Reason__c, Customer_Signature_Captured__c,
                                        Is_Signature_Required__c FROM ServiceAppointment LIMIT 1];
        
        ServiceAppointmentSignatureUtilities.isSignatureRequired(sas); 
        Test.stopTest();
    }
    
}