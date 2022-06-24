@isTest
public class TestCreateWorkOrderGenerationStatus{
    
   /* @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'Weekly','Monthly','One-Time'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
        List<Frequency__c> frequency = new List<Frequency__c>();
        frequency.add(new Frequency__c(Name = 'Weekly',Chemical_Minus_Days__c = 1, Chemical_Plus_Days__c = 1, Hygiene_Minus_Days__c = 1, Hygiene_Plus_Days__c = 1, Discount_Percent__c = 20, Life_Safety_Minus_Days__c = 1, Life_Safety_Plus_Days__c = 1,Pest_Plus_Days__c=1,Pest_Minus_Days__c=1));
        frequency.add(new Frequency__c(Name = 'Monthly',Chemical_Minus_Days__c = 1, Chemical_Plus_Days__c = 1, Hygiene_Minus_Days__c = 1, Hygiene_Plus_Days__c = 1, Discount_Percent__c = 20, Life_Safety_Minus_Days__c = 1, Life_Safety_Plus_Days__c = 1,Pest_Plus_Days__c=1,Pest_Minus_Days__c=1));
        frequency.add(new Frequency__c(Name = 'One-Time',Chemical_Minus_Days__c = 1, Chemical_Plus_Days__c = 1, Hygiene_Minus_Days__c = 1, Hygiene_Plus_Days__c = 1, Discount_Percent__c = 20, Life_Safety_Minus_Days__c = 1, Life_Safety_Plus_Days__c = 1,Pest_Plus_Days__c=1,Pest_Minus_Days__c=1));
        //frequency.add(new Frequency__c(Name = 'One-Time',Chemical_Minus_Days__c = 1, Chemical_Plus_Days__c = 1, Hygiene_Minus_Days__c = 1, Hygiene_Plus_Days__c = 1, Discount_Percent__c = 20, Life_Safety_Minus_Days__c = 1, Life_Safety_Plus_Days__c = 1,Pest_Plus_Days__c=1,Pest_Minus_Days__c=1));
        insert frequency;

        
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
        fssetting.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        fssetting.System_Administrator_Profile_Id__c = UserInfo.getProfileId();
        insert fssetting;
        
        OperatingHours oh = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHoursTerritory', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        
        insert new List<OperatingHours>{oh, territoryHours};
            
        TimeSlot testSlot = new TimeSlot(
            DayOfWeek='Monday', 
            StartTime = Time.newInstance(07, 00, 00, 00), 
            EndTime = Time.newInstance(17, 00, 00, 00),
            OperatingHoursId = oh.Id
        );
        insert testSlot;
        
        ServiceTerritory st1 = new ServiceTerritory(
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
        insert a;
        
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
                    Family= (i==0) ? 'Hygiene' : 'Pest Control', 
                    Item_Type__c= (i==1) ? 'Consumables' : 'Service', 
                    Installation_Work_Type__c=testWorkType.Id, 
                    Service_Work_Type__c=testWorkType.Id, 
                    Delivery_Work_Type__c=testWorkType.Id,
                    ExternalId__c = 'test'+i
                )       
            );
        }
        
        insert products;
         system.debug('#########' + products );
        Product2 testProduct = products.get(0);
        testProduct.Follow_up_Product__c = products.get(1).Id;
        testProduct.Follow_up_After_N_Days__c = 10;
        update testProduct;
        
        
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
            Inventory_Allocated__c=TRUE,
            Season_Start_Month__c = '8',
            Season_Start_Day__c = '17', 
            Season_End_Month__c = '12',
            Season_End_Day__c='30',
            Emergency__c = false
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
                    Installation_Status__c='Install',
                    Last_Automation_Created_Date__c = System.today().addDays(i),
                    Last_InFlight_WO_Date__c = System.Today().addDays(i + 1),
                    Active__c = true
                )
            );
        }  
        insert orderItems;
        orderItems = [select Frequency__c,FrequencyInDays__c,line_of_business__c,Product2Id,PricebookEntryId,Active__c from OrderItem where id  =: orderItems[0].Id OR id  =: orderItems[1].Id OR id  =: orderItems[2].Id];

        
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
            Country = 'Country',
            Type__c = 'Service',
            Status = 'New'
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
            //Product__c=oItem.PricebookEntry.Product2Id, 
            //Line_Item_Description__c='TestDescription'
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
        
        Work_Order_Asset__c testWAsset = new Work_Order_Asset__c(
            Work_Order_Room__c=testLocation.Id, 
            Survey_Asset_Location__c=surveyAsset.Id,
            Product__c=surveyAsset.Product__c
        );
        insert testWAsset;
        
        testWorkOrderItem.Work_Order_Asset__c=testWAsset.Id;
        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem;
}

 static testMethod void testCreateWOGSL() {
         Test.startTest();
            //List<OrderItem> testListOrderItem = new List<OrderItem>();
            CreateWorkOrderStatusBatch testRun = new CreateWorkOrderStatusBatch();
            Database.executeBatch(testRun);
         Test.stopTest();
         List<Work_Order_Generation_Status__c> lstWOGSL = new List<Work_Order_Generation_Status__c>([Select Id,Status__c from Work_Order_Generation_Status__c]);
         system.assertEquals(lstWOGSL.size(),4);
         //System.AssertNotEquals(lstWOGSL[0].Status__c,null);
         //System.AssertEquals(lstWOGSL[0].Status__c,'WO Found');
         
     } */

}