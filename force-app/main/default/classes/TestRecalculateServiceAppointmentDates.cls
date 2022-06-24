@isTest
public class TestRecalculateServiceAppointmentDates {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Service_Start__c = 3;
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Hygiene_LOB__c = 'Hygiene';
        fssetting.Chemical_LOB__c = 'Chemical';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Life_Safety_LOB__c = 'Life Safety';
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Scanned_In_Status__c = 'Installed';
        fssetting.Work_Order_Line_Item_Completed_Status__c = 'Completed';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Scanned_Out_Status__c = 'Remove';
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Work_Orders_In_Advance__c = 20;
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Emergency_Service_Start_Time__c = '4:30';
        fssetting.Emergency_Service_End_Time__c = '4:31';
        fssetting.System_Administrator_Profile_Id__c = UserInfo.getProfileId();
        fssetting.Regular_Order_Record_Type_Id__c = devRecordTypeId;
        insert fssetting;
        
        TestDataFactory.crtBillToAcctContact(1, 0); 
        Account a = TestDataFactory.accounts.get(0); 
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
        
        OrderItem oItem = orderItems.get(0);
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=o.Pricebook2Id, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country'
        );
        insert testWorkOrder;
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id 
        );
        insert testWorkOrderItem;
         
        User newUser = new User(
            Alias = 'testA', 
            Email = 'testUser@UserCommunity.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TestFirstName',
            LastName = 'TestLastName', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testUser@UserCommunity.com', 
            Employee_Number__c = 'ABCD123TEST'
        );
        insert newUser;
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newUser) {
            insert testQueue;
        }
    }
    
    static testMethod void testDefault(){
        List<String> frequencies = new List<String>{'Weekly','Monthly','One-Time'};
            
        Frequency__c setting1 =  new Frequency__c(Name=frequencies.get(0));
        setting1.Chemical_Reschedule_Plus_Days__c = 5;
        setting1.Hygiene_Reschedule_Plus_Days__c = 5;
        setting1.Life_Safety_Reschedule_Plus_Days__c = 1;
        setting1.Pest_Reschedule_Plus_Days__c = 2;
        insert setting1;
        
        Frequency__c setting2 =  new Frequency__c(Name=frequencies.get(1));
        setting2.Chemical_Reschedule_Plus_Days__c = 5;
        setting2.Hygiene_Reschedule_Plus_Days__c = 5;
        setting2.Life_Safety_Reschedule_Plus_Days__c = 2;
        setting2.Pest_Reschedule_Plus_Days__c = 1;
        insert setting2;
        
        Frequency__c setting3 =  new Frequency__c(Name=frequencies.get(2));
        setting3.Chemical_Reschedule_Plus_Days__c = 5;
        setting3.Hygiene_Reschedule_Plus_Days__c = 5;
        setting3.Life_Safety_Reschedule_Plus_Days__c = 5;
        setting3.Pest_Reschedule_Plus_Days__c = 1;
        insert setting3;
        
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id 
                   FROM Order LIMIT 1].get(0);
        WorkOrder wo = [SELECT Id, Order__c FROM WorkOrder WHERE Order__c=:o.Id LIMIT 1].get(0);
        
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=wo.Id, 
            DueDate=System.today().addDays(-8), 
            EarliestStartTime=System.today().addDays(-10), 
            Status='New'
        );
        insert testSA;
        
        FSL.GlobalAPIS.addStatusTransition('New','Missed Service');
        
		testSA.Status = 'Missed Service';
		update testSA;
        
        Test.startTest();
        
        RecalculateServiceAppointmentDates testRun = new RecalculateServiceAppointmentDates();
        Database.executeBatch(testRun);
        
        Test.stopTest();
    }
}