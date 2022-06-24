@isTesT
public class TestDatetimeRecord {
    
     @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'Weekly','Monthly','One-Time'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
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
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c(Service_Start__c = 4);
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
        fssetting.Hygiene_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Chemical_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Pest_Control_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Hygiene_LOB__c = 'Hygiene';
        fssetting.Chemical_LOB__c = 'Chemical';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Life_Safety_LOB__c = 'Life Safety';
        fssetting.System_Administrator_Profile_Id__c = UserInfo.getProfileId();
        fssetting.Emergency_Service_Start_Time__c = '4:30';
        fssetting.Emergency_Service_End_Time__c = '4:31';
        insert fssetting;
         
        TestDataFactory.crtBillToAcctContact(1, 1);
        
        /*OperatingHours oh = new OperatingHours(
        	Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHoursTerritory', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        
        insert new List<OperatingHours>{oh, territoryHours};*/
            
        TimeSlot testSlot1 = new TimeSlot(
        	DayOfWeek='Monday', 
            StartTime = Time.newInstance(07, 00, 00, 00), 
            EndTime = Time.newInstance(17, 00, 00, 00),
            OperatingHoursId = TestDataFactory.opthours[1].Id
        );
        TimeSlot testSlot2 = testSlot1.clone(false,true,false,false);
        testSlot2.DayOfWeek = 'Wednesday';
        insert new List<TimeSlot>{testSlot1, testSlot2};
        
        /*ServiceTerritory st1 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios'
            
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
            Name='TerritoryForCaseTestScenarios1',
            ParentTerritoryId = st1.Id
            
        );
        insert st;
        
        Account a = new Account(
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
            Inactive__c=FALSE,
            Type='Customer', 
            Phone='123456789',
            OperatingHoursId = oh.Id,
            Service_Territory__c = st.Id,
            Billing_Suite_Number__c='1', 
            BillingStreet='Street', 
            BillingCity = 'City', 
            BillingState = 'State', 
            BillingPostalCode = 'PostalCode',
            BillingCountry = 'Country',
            Shipping_Suite_Number__c = '1',
            ShippingStreet = 'Street', 
            ShippingCity = 'City', 
            ShippingState = 'State', 
            ShippingPostalCode = 'PostalCode', 
            ShippingCountry = 'Country'
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
        System.debug('##' + TestDataFactory.srvTers[1]);
        TestDataFactory.accounts[0].Site_Survey__c = ss.Id;
        TestDataFactory.accounts[0].Service_Territory__c = TestDataFactory.srvTers[1].Id;
        TestDataFactory.accounts[0].OperatingHoursId = TestDataFactory.opthours[1].Id;
        update TestDataFactory.accounts[0];
         
         for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==0) ? 'Hygiene' : 'Pest Control', 
                    Item_Type__c= (i==1) ? 'Consumables' : 'Service', 
                    Installation_Work_Type__c=testWorkType.Id, 
                    Service_Work_Type__c=testWorkType.Id, 
                    Delivery_Work_Type__c=testWorkType.Id,
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
            RecordTypeId=devRecordTypeId, 
            Inventory_Allocated__c=TRUE
        ); 
        insert o;
        
        
        Asset testAsset = new Asset(
            Name='TestAsset',
            AccountId=o.AccountId, 
            Product2Id=products.get(0).Id, 
            Status='Installed', 
            Site_Survey__c=ss.Id,
            Survey_Location__c=location.Id
            
        );
        insert testAsset;
         
        for(Integer i=0; i<3; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Installation_Price__c=1.0,
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE, 
                    Asset__c=testAsset.Id, 
                    Installation_Status__c='Install'
                )
            );
        } 
        
        insert orderItems;
        
        for(Integer i=0; i<3; i++) {
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
        
        for(Integer i=0; i<3; i++) {
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
        o.Status='Activated';
        update o;
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=TestDataFactory.accounts[0].Id,
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
        
        OrderItem oItem = orderItems.get(0);
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=testWorkOrder.Id, 
            Order_Product__c=oItem.Id, 
            Type_of_Service__c='Service', 
            QUantity=1,
            PricebookEntryId=pEntries.get(0).Id
        );
        insert testWorkOrderItem;
    } 
    
    static testMethod void testWORegular() {
        Datetime todaysDate = Datetime.now();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, StartDate, FSL__VisitingHours__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        OperatingHours opHours = [SELECT Id, Name, TimeZone, (SELECT Id, DayOfWeek, StartTime, EndTime FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime) FROM OperatingHours 
                                  WHERE Id  =:testWorkOrder.FSL__VisitingHours__c];
        
        Test.startTest();
        
        DatetimeRecord param = new DatetimeRecord(todaysDate.addDays(3), todaysDate.addDays(3), false, false, opHours);
        DatetimeRecord values = DatetimeRecord.getWODates(param, todaysDate);
        
        Test.stopTest();
    }
    
    static testMethod void testWOEmergencyFuture1() {
        Datetime todaysDate = Datetime.now();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, StartDate, FSL__VisitingHours__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        OperatingHours opHours = [SELECT Id, Name, TimeZone, (SELECT Id, DayOfWeek, StartTime, EndTime FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime) FROM OperatingHours 
                                  WHERE Id  =:testWorkOrder.FSL__VisitingHours__c];
        
        Test.startTest();
        
        DatetimeRecord param = new DatetimeRecord(todaysDate.addDays(3), todaysDate.addDays(3), false, true, opHours);
        DatetimeRecord values = DatetimeRecord.getWODates(param, todaysDate);
        
        Test.stopTest();
    } 
    
    static testMethod void testWOEmergencyFuture2() {        
        Datetime todaysDate = Datetime.now();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, StartDate, FSL__VisitingHours__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        OperatingHours opHours = [SELECT Id, Name, TimeZone, (SELECT Id, DayOfWeek, StartTime, EndTime FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime) FROM OperatingHours 
                                  WHERE Id  =:testWorkOrder.FSL__VisitingHours__c];
        
        Test.startTest();
        
        DatetimeRecord param = new DatetimeRecord(todaysDate.addDays(3), todaysDate.addDays(3), true, false, opHours);
        DatetimeRecord values = DatetimeRecord.getWODates(param, todaysDate);
        
        Test.stopTest();
    }
    
    static testMethod void testWOEmergencyPast() {
        Datetime todaysDate = Datetime.now();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId, StartDate, FSL__VisitingHours__c FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        OperatingHours opHours = [SELECT Id, Name, TimeZone, (SELECT Id, DayOfWeek, StartTime, EndTime FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime) FROM OperatingHours 
                                  WHERE Id  =:testWorkOrder.FSL__VisitingHours__c];
        
        Test.startTest();
        
        DatetimeRecord param = new DatetimeRecord(todaysDate.addDays(3), todaysDate.addDays(3), true, true, opHours);
        DatetimeRecord values = DatetimeRecord.getWODates(param, todaysDate);
        
        Test.stopTest();
    }
}