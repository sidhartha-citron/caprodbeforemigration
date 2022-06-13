@isTest 
public class TestCloneRoomToWorkOrders {
	@TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id qaRecordTypeId = Schema.SObjectType.WorkOrder.getRecordTypeInfosByName().get('QA Work Order').getRecordTypeId();
        
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
        insert fssetting;
        
        TestDataFactory.crtBillToAcctContact(1,1);
        
        /*Account a = new Account(
            Name='TestAccount', 
            AccPac_Account__c='1234-', 
            A_P_Contact_Name__c='TestContactName', 
            Credit_Check__c='Completed', 
            Industry='Institutions', 
            Industry_Code_Accpac__c='000-00 UNKNOWN', 
            Invoice_Preference__c='Email',
            Invoicing_Email_Address__c='Test@test.com', 
            LEED_Customer__c='No', 
            On_Hold__c=FALSE, 
            Type='Customer', 
            Phone='123456789',
            Billing_Suite_Number__c='1', 
            BillingStreet='Street', 
            BillingCity = 'Toronto', 
            BillingState = 'ON', 
            BillingPostalCode = 'L3R3L5',
            BillingCountry = 'CA',
            Shipping_Suite_Number__c = '1',
            ShippingStreet = 'Street', 
            ShippingCity = 'Toronto', 
            ShippingState = 'ON', 
            ShippingPostalCode = 'L3R3L5', 
            ShippingCountry = 'ON'
        );
        insert a;*/
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=TestDataFactory.accounts[0].Id, 
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
        
        TestDataFactory.accounts[0].Site_Survey__c = ss.Id;
        update TestDataFactory.accounts[0];
         
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
            AccountId=TestDataFactory.accounts[0].Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=TestDataFactory.accounts[0].Site_Survey__c, 
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
        
        Test.startTest();
        
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
         
        /*OperatingHours territoryHours = new OperatingHours(
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
        
        ServiceTerritory st1 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios1'
            
        );
        insert st1;
        
        ServiceTerritory st = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios',
            ParentTerritoryId = st1.Id
            
        );
        insert st;*/
         
         WorkOrder testWorkOrder = new WorkOrder(
        	AccountId=TestDataFactory.accounts[0].Id,
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
            ServiceTerritoryId=TestDataFactory.srvTers[0].Id, 
            Status='New',
            Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31)
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
            Employee_Number__c = 'ABCD123TEST'
        );
        insert newUser;
        
        ServiceResource testResource = new ServiceResource(
        	Name='TestResource', 
            RelatedRecordId=newUser.Id,
            ResourceType='T', 
            isActive=TRUE
        );
        insert testResource;
        
        Test.stopTest();
         
        ServiceTerritoryMember stm = new ServiceTerritoryMember(
        	OperatingHoursId=TestDataFactory.opthours[2].Id, 
            ServiceResourceId=testResource.Id, 
            ServiceTerritoryId=TestDataFactory.srvTers[0].Id, 
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
    }
    
    static testMethod void testCloneRoom() {
        WorkOrder testWorkOrder = [SELECT Id, Status, Site_Survey__c FROM WorkOrder LIMIT 1].get(0);
        ServiceResource testResource = [SELECT Id FROM ServiceResource WHERE Name='TestResource' LIMIT 1].get(0);
        User newUser = [SELECT Id FROM User WHERE UserName='testUser@UserTechnicianForTest.com123' LIMIT 1].get(0);
        
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=testWorkOrder.Id, 
            DueDate=System.today().addDays(5), 
            EarliestStartTime=System.today().addDays(-1), 
            Status='Scheduled',
            SchedStartTime = DateTime.now(),
            SchedEndTime = DateTime.now().addDays(1)
        );
        
        System.debug('1.NOF.SOQL BEFORE SRV:' + Limits.getQueries());
        System.debug('2.NOF.DMLS BEFORE SRV:' + Limits.getDmlStatements());
        
        Test.startTest();
        insert testSA;
        
        System.debug('1.NOF.SOQL AFTER SRV:' + Limits.getQueries());
        System.debug('2.NOF.DMLS AFTER SRV:' + Limits.getDmlStatements());
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=testWorkOrder.Site_Survey__c, 
            Building__c = 'Building1',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'
        );
        insert location;
        
        AssignedResource newResource = new AssignedResource(
            ServiceAppointmentId = testSA.Id,
            ServiceResourceId = testResource.Id
        );
        insert newResource;
        Test.stopTest();
        
        System.debug('1.NOF.SOQL AFTER RES:' + Limits.getQueries());
        System.debug('2.NOF.DML AFTER RES:' + Limits.getDmlStatements());
        
        System.runAs(newUser){
            CloneRoomToWorkOrders.cloneRoom(location.Id);
        }
        
        System.debug('1.NOF.SOQL AFTER CLONE: ' + Limits.getQueries());
        System.debug('2.NOF.DML AFTER CLONE:' + Limits.getDmlStatements());
    }
}