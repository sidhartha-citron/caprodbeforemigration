@istest
public class Test_ComplexReports
{ 
    
    
   /* @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{ 'One-Time','Weekly','14 Days','28 Days','Monthly','Bi-Monthly','Quarterly','120 Days','Semi-Annually','Annually'};
            List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<workorder> listworkorders = new List<workorder>();
        Id pBook = Test.getStandardPricebookId();
        list<workorderlineitem> testworkorderitems = new list<workorderlineitem>();
        list<orderitemhistory> oli_his = new list<orderitemhistory>();
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
        
        for(Integer i=0; i<10; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,  
                    Allowable_Frequencies__c= 'One-Time;Weekly;14 Days;28 Days;Monthly;Bi-Monthly;Quarterly;120 Days;Semi-Annually;Annually',
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= i==0 ? 'Hygiene' : i == 1 ? 'Life Safety' : i == 2 ? 'Pest Control' : 'Chemical', 
                    Item_Type__c= (i==0) ? 'Consumables' : 'Service', 
                    Installation_Work_Type__c=testWorkType.Id, 
                    Service_Work_Type__c=testWorkType.Id, 
                    Delivery_Work_Type__c=testWorkType.Id,
                    ExternalId__c = '3-55-7-02-1' + i//added by pwc
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<10; i++) {
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
        Order so = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId, 
            Inventory_Allocated__c=TRUE,
            season_start_day__c='1',
            season_start_month__c='9',
            season_end_day__c='1',
            season_end_month__c='12'
            
        ); 
        insert so;
        
        Order so1 = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId, 
            Inventory_Allocated__c=TRUE,
            season_start_day__c='1',
            season_start_month__c='6',
            season_end_day__c='1',
            season_end_month__c='12'
            
        ); 
        insert so1;
        
        Order so2 = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            RecordTypeId=devRecordTypeId, 
            Inventory_Allocated__c=TRUE,
            season_start_day__c='1',
            season_start_month__c='4',
            season_end_day__c='1',
            season_end_month__c='6'
            
        ); 
        insert so2;  
        
        Asset testAsset = new Asset(
            Name='TestAsset',
            AccountId=o.AccountId, 
            Product2Id=products.get(1).Id, 
            Status='Installed', 
            Site_Survey__c=ss.Id,
            Survey_Location__c=location.Id
            
        );
        insert testAsset;
        
        for(Integer i=0; i<10; i++) {
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
                        Asset__c=testAsset.Id 
                        
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
                        Asset__c=testAsset.Id 
                        
                    )
                );
            }
            else if (i == 2) {
                orderItems.add(
                    new OrderItem(
                        Product2Id=pEntries.get(i).Id,  
                        Frequency__c=frequencies.get(i), 
                        UnitPrice=1.0, 
                        Installation_Price__c=1.0,
                        Service_Price_Per_Unit__c=1.0, 
                        Quantity=1, 
                        OrderId=so.Id, 
                        HasSurveyAssets__c=TRUE, 
                        Asset__c=testAsset.Id 
                        
                    )
                );
            }
            else if (i == 4) {
                orderItems.add(
                    new OrderItem(
                        Product2Id=pEntries.get(i).Id,  
                        Frequency__c=frequencies.get(i), 
                        UnitPrice=1.0, 
                        Installation_Price__c=1.0,
                        Service_Price_Per_Unit__c=1.0, 
                        Quantity=1, 
                        OrderId=so2.Id, 
                        HasSurveyAssets__c=TRUE, 
                        Asset__c=testAsset.Id 
                        
                    )
                );
            }
            else if (i == 3) {
                orderItems.add(
                    new OrderItem(
                        Product2Id=pEntries.get(i).Id,  
                        Frequency__c=frequencies.get(i), 
                        UnitPrice=1.0, 
                        Installation_Price__c=1.0,
                        Service_Price_Per_Unit__c=1.0, 
                        Quantity=1, 
                        OrderId=so1.Id, 
                        HasSurveyAssets__c=TRUE, 
                        Asset__c=testAsset.Id 
                        
                    )
                );
            }
            else {
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
                        Asset__c=testAsset.Id 
                        
                    )
                );
            }
        } 
        
        insert orderItems;
        
        
        
        
        
        for(Integer i=0; i<10; i++) {
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
        
        for(Integer i=0; i<10; i++) {
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
        so.Status='activated';
        update so;
        so1.Status='activated';
        update so1;
        so2.Status='activated';
        update so2;  
        
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
        
        
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            Order__c=o.Id,
            StartDate=System.today(), 
            endDate=system.today(),
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
            Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31)
        );
        insert testWorkOrder;
        
        
        
        
        for(workorder wr:[select id from workorder] ){
            
            wr.status='Inprogress';
            wr.Type__c='service';
            update wr;
        }
        listworkorders =[select id from workorder];
        
        Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(2);
        
        for (integer i=0; i<10; i++){
            OrderItem oItem = orderItems.get(i);
            workorder wo=listworkorders.get(0);
            testworkorderitems.add(
                new WorkOrderLineItem(
                    WorkOrderId=wo.Id, 
                    Order_Product__c=oItem.Id, 
                    Type_of_Service__c='Service', 
                    QUantity=1,
                    PricebookEntryId=pEntries.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Line_Item_Description__c='TestDescription'
                )
            );
        }
        insert testWorkOrderItems;
        
        Work_Order_Room__c testLocation = new Work_Order_Room__c(
            Site_Survey__c=o.Site_Survey__c, 
            Building__c = location.Building__c,
            Floor__c = location.Floor__c, 
            Location_Type__c=location.Location_Type__c, 
            Location_SubType__c=location.Location_SubType__c,
            Name=location.Name, 
            Work_Order__c=listworkorders[0].Id, 
            Survey_Location__c=location.id
        );
        insert testLocation;
        
        Work_Order_Asset__c Wo_testAsset = new Work_Order_Asset__c(
            Work_Order_Room__c=testLocation.Id, 
            Survey_Asset_Location__c=surveyAsset.Id,
            Product__c=surveyAsset.Product__c
        );
        insert Wo_testAsset;
        
    }
    
    static testMethod void testMethod1() 
    {   
        orderitem[] oliList= new list<orderitem>(); 
        
        Database.QueryLocator q =  Database.getQueryLocator (
            
            'select id from orderitem  where ( Active__c=true and orderitem.Order.Account.isValid__c=TRUE AND orderitem.order.Emergency__c=FALSE ) limit 200'
        ); 
        Database.QueryLocatorIterator it =  q.iterator();
        
        
        while (it.hasNext()){
            orderitem ol =(orderitem)it.next();
            olilist.add(ol);
        }
        
        Method2(olilist);
        
        
        Test.startTest();
        
        ComplexReports obj = new ComplexReports();
        id batchId=  DataBase.executeBatch(obj); 
        
        System.assertEquals(10, [select count() from orderitem]);
        
        Test.stopTest();
    }
    
    static void Method2(orderitem[] olilist) 
    {  
        Datetime upsertdate = Datetime.newInstance(2019, 02, 7, 12, 00, 00);
        boolean isSeasonal=false;
        Integer int1=0;
        Integer int0=2;
        Integer oli_hisSize=1;
        Integer No_days;
        List<ComplexReports__c> listcr= new List<ComplexReports__c>();
        WorkOrderLineItem[] woliList = new list<WorkOrderLineItem>(); 
        List<string> wono = new List<string>();
        Map<String, Integer> wonoUnique= new Map<string, Integer>();
        string oldvalue;
        integer unactivedays=0;
        string newvalue;
        datetime hiscreateddate;
        list<date> sys= new list<date>();
        list<datetime> createdat= new list<datetime>();
        string hisvalue;
        orderitemhistory his= new orderitemhistory();
        datetime sdate;
        list<datetime> seasonstart=new list<datetime>();
        list<datetime> seasonend= new list<datetime>();
        list<datetime> Upsertdates= new list<datetime>();
        
        workorderlineitem[] woli= new list<workorderlineitem>();
        for(orderitem oli:[select orderitem.order.ordernumber, orderitem.order.account.AccPac_Account__c, orderitem.order.account.shipping_Address__c, orderitem.order.account.name, Product_name__c, 
                           frequency__c, Line_of_Business__c, Last_Automation_created_date__c,frequencyindays__c, createddate, orderitem.order.Season_Start_Date__c, 
                           orderitem.order.effectivedate, orderitem.order.isvalid__c,  orderitem.order.Season_End_Date__c, lastmodifieddate, id, OrderItemNumber 
                           from orderitem  where ( orderitem.order.isValid__c=TRUE AND 
                                                  orderitem.Order.Account.isValid__c=TRUE AND orderitem.order.Emergency__c=FALSE AND id IN:oliList)  ] ){
                                                      orderitemhistory[] oli_his =[select id, CreatedDate, Field, orderitemid, OldValue, NewValue FROM OrderItemHistory where (field='frequency__c' and orderitemid=:oli.id) ];          
                                                      woli=  [select id, workorderlineitem.workorder.status, createddate, 
                                                              workorderlineitem.workorder.createddate, workorderlineitem.workorder.ServiceTerritory.address, workorderlineitem.workorder.type__c, 
                                                              workorderlineitem.workorder.workordernumber,  workorderlineitem.workorder.Completed_Date__c from workorderlineitem
                                                              where((workorderlineitem.workorder.type__c='service' or workorderlineitem.workorder.type__c='delivery'
                                                                     or workorderlineitem.workorder.type__c='installation')AND (workorderlineitem.workorder.status!='new'
                                                                                                                                or workorderlineitem.workorder.status!='Cannot Complete' )and workorderlineitem.order_product__c=:oli.id) ] ;                                
                                                      
                                                  }
    }*/
}