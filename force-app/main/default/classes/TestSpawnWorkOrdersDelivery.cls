@isTest
public class TestSpawnWorkOrdersDelivery {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'Weekly','Monthly','One-Time'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id caseRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        
        WorkType testWorkType =  new WorkType(
        	Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
       
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
        fssetting.Emergency_Service_Start_Time__c = '4:30';
        fssetting.Emergency_Service_End_Time__c = '4:31';
        fssetting.System_Administrator_Profile_Id__c = UserInfo.getProfileId();
        fssetting.Regular_Order_Record_Type_Id__c = devRecordTypeId;
        fssetting.Invoice_Information_Case_RecordTypeId__c = caseRecordTypeId;
        fssetting.Accounts_Receivable_Queue__c = testGroup.Id;
        fssetting.Billing_Team__c = testGroup.Id;
        fssetting.Inside_Sales_Team__c = testGroup.Id;
        fssetting.Ticket_Type_for_New_Lead__c = 'New Lead';
        fssetting.Ticket_Type_for_Site_Survey__c = 'Site Survey';
        fssetting.CS_Pest_Queue__c = testGroup.Id;
        fssetting.CS_Chemical_Queue__c = testGroup.Id;
        fssetting.CS_Hygiene_Queue__c = testGroup.Id;
        fssetting.Inside_Sales_Queue__c = testGroup.Id;
        fssetting.Customer_Success_Queue__c = testGroup.Id;
        fssetting.Billing_Queue__c = testGroup.Id;
        fssetting.CS_Orders__c = testGroup.Id;
        fssetting.CS_Data_Cleanup__c = testGroup.Id;
        fssetting.App_Support_Team_Queue__c = testGroup.Id;
        fssetting.Finance_Master_Data_Queue__c = testGroup.Id;
        
        insert fssetting;
        
        TestDataFactory.crtBillToAcctContact(1, 0); 
        Account a = TestDataFactory.accounts[0];
        
        TimeSlot testSlot = new TimeSlot(
        	DayOfWeek='Monday', 
            StartTime = Time.newInstance(07, 00, 00, 00), 
            EndTime = Time.newInstance(17, 00, 00, 00),
            OperatingHoursId = TestDatafactory.opthours[0].Id
        );
        insert testSlot;
        
        ServiceTerritory st1 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=TestDatafactory.opthours[0].Id, 
            Name='TerritoryForCaseTestScenarios0'
            
        );
        insert st1;
        ServiceTerritory st = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=TestDatafactory.opthours[0].Id, 
            Name='TerritoryForCaseTestScenarios11',
            ParentTerritoryId = st1.Id
            
        );
        insert st;
        a.OperatingHoursId = TestDatafactory.opthours[1].Id;
        a.Service_Territory__c = st.Id;
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
                    Family= i==0 ? 'Hygiene' : i == 1 ? 'Life Safety' : i == 2 ? 'Pest Control' : 'Chemical', 
                    Item_Type__c= (i==0) ? 'Consumables' : 'Service', 
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
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
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
            if (i == 0) {
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
                        Installation_Status__c ='Install'
                    )
                );
            } else if (i == 1) {
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
                        Installation_Status__c ='Replace'
                    )
                );
            } else {
                orderItems.add(
                    new OrderItem(
                        Product2Id=pEntries.get(i).Id,  
                        Frequency__c=frequencies.get(i), 
                        UnitPrice=1.0, 
                        //Installation_Price__c=1.0,
                        Service_Price_Per_Unit__c=1.0, 
                        Quantity=1, 
                        OrderId=o.Id, 
                        HasSurveyAssets__c=TRUE, 
                        Asset__c=testAsset.Id, 
                        Installation_Status__c ='Remove'
                    )
                );
            }
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
        
        User newCommUser = new User(
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
            Employee_Number__c = 'ABCD123TESTVBN'
        );
        insert newCommUser;
        
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        System.runAs(newCommUser) {
            insert testQueue;
        }
        
        o.Status='Activated';
        update o;
        
        
    }
    
    static testMethod void testAll(){
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        WorkType testWorkType = [SELECT Id, Name FROM WorkType WHERE Name='TestWorkType'];
        Order o = [SELECT Id, Account.Name, AccountId, Status, Site_Survey__c, EffectiveDate, Pricebook2Id, RecordTypeId, isValid__c, Account.isValid__c
                   FROM Order LIMIT 1].get(0);
        OrderItem oItem = [SELECT Id, OrderId, PricebookEntryId, PricebookEntry.Product2Id FROM OrderItem WHERE OrderId=:o.Id LIMIT 1].get(0);
        
        System.debug('Account ' + o.Account.isValid__c + ' Order ' + o.isValid__c);
        
        List<String> frequencies = new List<String>{'Weekly','Monthly','One-Time'};
        
        Frequency__c setting1 =  new Frequency__c(Name=frequencies.get(0));
        setting1.Hygiene_Minus_Days__c = 5;
        setting1.Hygiene_Plus_Days__c = 5;
        setting1.Occurrences_In_Year__c = 1;
        setting1.Discount_Percent__c = 0.0;
        setting1.Pest_Minus_Days__c = 1;
        setting1.Pest_Plus_Days__c = 1;
        setting1.Life_Safety_Plus_Days__c = 1;
        setting1.Life_Safety_Minus_Days__c = 1;
        setting1.Chemical_Plus_Days__c = 1;
        setting1.Chemical_Minus_Days__c = 1;
        insert setting1;
        
        Frequency__c setting2 =  new Frequency__c(Name=frequencies.get(1));
        setting2.Hygiene_Minus_Days__c = 5;
        setting2.Hygiene_Plus_Days__c = 5;
        setting2.Occurrences_In_Year__c = 12;
        setting2.Discount_Percent__c = 0.0;
        setting2.Pest_Minus_Days__c = 1;
        setting2.Pest_Plus_Days__c = 1;
        setting2.Life_Safety_Plus_Days__c = 1;
        setting2.Life_Safety_Minus_Days__c = 1;
        setting2.Chemical_Plus_Days__c = 1;
        setting2.Chemical_Minus_Days__c = 1;
        insert setting2;
        
        Frequency__c setting3 =  new Frequency__c(Name=frequencies.get(2));
        setting3.Hygiene_Minus_Days__c = 5;
        setting3.Hygiene_Plus_Days__c = 5;
        setting3.Occurrences_In_Year__c = 54;
        setting3.Discount_Percent__c = 0.0;
        setting3.Pest_Minus_Days__c = 1;
        setting3.Pest_Plus_Days__c = 1;
        setting3.Life_Safety_Plus_Days__c = 1;
        setting3.Life_Safety_Minus_Days__c = 1;
        setting3.Chemical_Plus_Days__c = 1;
        setting3.Chemical_Minus_Days__c = 1;
        insert setting3;
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=o.AccountId,
            Order__c=o.Id,
            StartDate=System.today().addDays(1), 
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
            PricebookEntryId=oItem.PricebookEntryId
        );
        insert testWorkOrderItem;
        
        testWorkOrder.Status='Scheduled';
        update testWorkOrder;
        
        Test.startTest();
        
        SpawnWorkOrderDelivery testRun = new SpawnWorkOrderDelivery();
        Database.executeBatch(testRun);
        
        Test.stopTest();
    }
    
    @isTest
    static void testSetSchedule() {
        Test.startTest();
        
        WorkOrder testWorkOrder = new WorkOrder(
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene',
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country'
        );
        insert testWorkOrder;
        
        WorkType testWorkType = [SELECT Id, Name FROM WorkType WHERE Name='TestWorkType'];
        
        List<Product2> prods = [SELECT Id, Family FROM Product2];
        
        for (Product2 p : prods) {
            p.Family = 'Chemical';
        }
        
        update prods;
        
        System.debug(testWorkOrder.StatusCategory);
        
        ServiceAppointment appointment = new ServiceAppointment();
        appointment.ParentRecordId = testWorkOrder.Id;
        insert appointment;
        
        List<String> frequencies = new List<String>{'Weekly','Monthly','One-Time'};
        
        Frequency__c setting1 =  new Frequency__c(Name=frequencies.get(0));
        setting1.Hygiene_Minus_Days__c = 5;
        setting1.Hygiene_Plus_Days__c = 5;
        setting1.Occurrences_In_Year__c = 1;
        setting1.Discount_Percent__c = 0.0;
        setting1.Pest_Minus_Days__c = 1;
        setting1.Pest_Plus_Days__c = 1;
        setting1.Life_Safety_Plus_Days__c = 1;
        setting1.Life_Safety_Minus_Days__c = 1;
        setting1.Chemical_Plus_Days__c = 1;
        setting1.Chemical_Minus_Days__c = 1;
        insert setting1;
        
        Frequency__c setting2 =  new Frequency__c(Name=frequencies.get(1));
        setting2.Hygiene_Minus_Days__c = 5;
        setting2.Hygiene_Plus_Days__c = 5;
        setting2.Occurrences_In_Year__c = 12;
        setting2.Discount_Percent__c = 0.0;
        setting2.Pest_Minus_Days__c = 1;
        setting2.Pest_Plus_Days__c = 1;
        setting2.Life_Safety_Plus_Days__c = 1;
        setting2.Life_Safety_Minus_Days__c = 1;
        setting2.Chemical_Plus_Days__c = 1;
        setting2.Chemical_Minus_Days__c = 1;
        insert setting2;
        
        Frequency__c setting3 =  new Frequency__c(Name=frequencies.get(2));
        setting3.Hygiene_Minus_Days__c = 5;
        setting3.Hygiene_Plus_Days__c = 5;
        setting3.Occurrences_In_Year__c = 54;
        setting3.Discount_Percent__c = 0.0;
        setting3.Pest_Minus_Days__c = 1;
        setting3.Pest_Plus_Days__c = 1;
        setting3.Life_Safety_Plus_Days__c = 1;
        setting3.Life_Safety_Minus_Days__c = 1;
        setting3.Chemical_Plus_Days__c = 1;
        setting3.Chemical_Minus_Days__c = 1;
        insert setting3;
        
        SpawnWorkOrderDelivery testRun = new SpawnWorkOrderDelivery();
        
        System.schedule('SpawnWorkOrderDelivery', '0 0 0 15 3 ? 2022', testRun);
        
        Test.stopTest();
    }

}