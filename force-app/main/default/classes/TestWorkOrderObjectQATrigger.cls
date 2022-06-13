@isTest
public class TestWorkOrderObjectQATrigger {
    
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
        fssetting.Cannot_Complete_Status_Value__c = 'Cannot Complete';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        fssetting.QA_WorkOrder_RecordTypeId__c = qaRecordTypeId;
        fssetting.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        fssetting.Service_Start__c = 0;
        fssetting.Label_for_Delivery_Work_Type__c = 'Delivery';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        insert fssetting;
        
        TestDataFactory.crtBillToAcctContact(1, 0 ); 
        Account a = TestDataFactory.accounts[0]; 
        a.OperatingHoursId = TestDataFactory.opthours[1].id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
		update a;
        
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
                    ExternalId__c = '1-55-03-30-1' + i
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
            ServiceTerritoryId=TestDataFactory.srvTers[1].id, 
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
        
        Work_Order_Room__c testLocation = new Work_Order_Room__c(
        	Site_Survey__c=o.Site_Survey__c, 
            Building__c = location.Building__c,
            Floor__c = location.Floor__c, 
            Location_Type__c=location.Location_Type__c, 
            Location_SubType__c=location.Location_SubType__c,
            Name=location.Name, 
            Work_Order__c=testWorkOrder.Id, 
            Survey_Location__c=location.id
        );
        insert testLocation;
        
        /*Work_Order_Asset__c testAsset = new Work_Order_Asset__c(
        	Work_Order_Room__c=testLocation.Id, 
            Survey_Asset_Location__c=surveyAsset.Id,
            Product__c=surveyAsset.Product__c
        );
        insert testAsset;*/
        
        User newUser = new User(
            Alias = 'twoobjqa', 
            Email = 'twoobjqa1@UserTechnicianForTest.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'twoobjqaF',
            LastName = 'twoobjqaL', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'twoobjqa1@UserTechnicianForTest.com', 
            Employee_Number__c = 'twoobjqa1TEST'
        );
        insert newUser;
        
        ServiceResource testResource = new ServiceResource(
        	Name='TestResource', 
            RelatedRecordId=newUser.Id,
            ResourceType='T', 
            isActive=TRUE
        );
        insert testResource;
        
        //testWorkOrderItem.Work_Order_Asset__c=testAsset.Id;
        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem;
         
         ServiceTerritoryMember stm = new ServiceTerritoryMember(
        	OperatingHoursId=TestDataFactory.opthours[2].Id, 
            ServiceResourceId=testResource.Id, 
            ServiceTerritoryId=TestDataFactory.srvTers[1].id, 
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
    
    static testMethod void testUpdateQA() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        User newUser = [SELECT Id, UserName FROM User WHERE UserName='twoobjqa1@UserTechnicianForTest.com'];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        testWorkOrder.Create_Quality_Assurance__c='QA Work Order';
        testWorkOrder.Status = fssetting.Work_Order_Completion_Status__c;
        
        Test.startTest();
        
        System.runAs(newUser) {
            update testWorkOrder;
        }
        
        Test.stopTest();
    }
    
    static testMethod void testUpdateFollowUp() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        
        User newUser = [SELECT Id, UserName FROM User WHERE UserName='twoobjqa1@UserTechnicianForTest.com'];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        testWorkOrderItem.Status='Cannot Complete';
        update testWorkOrderItem;
        
        testWorkOrder.Create_Quality_Assurance__c='Follow-Up';
        testWorkOrder.Status = fssetting.Work_Order_Completion_Status__c;
        
        Test.startTest();
        
        System.runAs(newUser) {
            update testWorkOrder;
        }
        
        Test.stopTest();
    }
}