@isTest
public class TestWorkOrdertObjectTriggers2 {
    @isTest
    static void testUpdateSendPostInstallationSurvey(){
        List<OrderItem> orderItems2 = new List<OrderItem>();
        List<Product2> products2 = new List<Product2>();
        List<PricebookEntry> pEntries1 = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook2 = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id qaRecordTypeId = Schema.SObjectType.WorkOrder.getRecordTypeInfosByName().get('QA Work Order').getRecordTypeId();
        Id repairCaseRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        Id invoiceInformationRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
         
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
        //fssetting.Customer_Service_Queue__c = testGroup.Id;
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Cannot_Complete_Status_Value__c = 'Cannot Complete';
        fssetting.QA_WorkOrder_RecordTypeId__c = qaRecordTypeId;
        fssetting.Repair_WorkOrder_Case_Record_Type__c = repairCaseRecordTypeId;
        fssetting.Hygiene_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Chemical_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Pest_Control_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Life_Safety_Work_Type_Detailed__c = testWorkType.Id;
        fssetting.Hygiene_Work_Type_Non_Detailed__c = testWorkType.Id;
        fssetting.Chemical_Work_Type_Non_Detailed__c = testWorkType.Id;
        fssetting.Pest_Control_Work_Type_Non_Detailed__c = testWorkType.Id;
        fssetting.Life_Safety_Work_Type_Non_Detailed__c = testWorkType.Id;
        fssetting.Hygiene_LOB__c = 'Hygiene';
        fssetting.Chemical_LOB__c = 'Chemical';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Life_Safety_LOB__c = 'Life Safety';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Order_Price_Book_ID__c = pBook2;
        fssetting.Working_Hour_End_Time__c = String.valueOf(DateTime.now()).split(' ')[1].left(5);
        fssetting.Service_Start__c = 0;
        fssetting.Type_Value_for_FollowUp_WorkOrder__c='Follow-Up';
        fssetting.Status_Value_for_Replace_of_a_Product__c='Replace';
        fssetting.Status_Value_for_Install_of_a_Product__c='Install';
        fssetting.Internal_Data_Review_Case_Record_Type_ID__c = '012f1000000PUJFAA4';
        fssetting.Invoice_Information_Case_RecordTypeId__c = '012f1000000PUJKAA4';
        fssetting.Customer_Service_Queue__c = '00Gf1000003DrDbEAK';
        fssetting.Ticket_Type_for_Sales_Inquiry__c = 'Sales Inquiry - Sent to Account Executive';
        fssetting.Billing_Queue__c = '00Gf1000003DrDaEAK';
        insert fssetting;
        
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
         OperatingHours oh = new OperatingHours(
          Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{territoryHours, employeeHours, oh};
        
        ServiceTerritory st2 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios2'            
        );
        insert st2;
        ServiceTerritory st3 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios3',
            ParentTerritoryId = st2.Id
            
        );
        insert st3;
      
        
      	ID rT1 = [select id from recordType where name = 'Customer Bill To'].id; 
        ID rT2 = [select id from recordType where name = 'Customer Ship To'].id; 
        TestDataFactory.crtAcctContact(2, 0);
     
        Account BillingAccount = TestDataFactory.accounts[0];
        BillingAccount.RecordTypeId = rT1;
        update BillingAccount; 
        Account a1 = TestDataFactory.accounts[1]; 
        a1.RecordTypeId = rT2;
        a1.ParentId = BillingAccount.id; 
   		update a1;
        Case c = new Case(
         Subject = 'TestCase',
            RecordTypeId = invoiceInformationRecordTypeId,
            AccountId = a1.Id,
            Type=fssetting.Ticket_Type_for_Sales_Inquiry__c, 
            Status='New', 
            Priority='Low'
            );
            
        insert c;   
        
        Contact con = new Contact(
                    LastName = 'testCon',
                    Email = 'testContact@citronhygiene.com',
                    AccountId = a1.Id,
                    Send_Post_Installation_Survey__c = false,
                    Related_Survey_Account__c = ''
                   );
        insert con;
               
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a1.Id, 
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
        
        a1.Site_Survey__c = ss.Id;
        update a1;
         
         for(Integer i=0; i<5; i++){
            products2.add(
                new Product2(
                    Name='TestProduct1'+i,
                    Allowable_Frequencies__c='Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene', 
                    Clean_Out_Type__c='Ants', 
                    Warranty_Period__c=10,
                    ExternalId__c = '2-20-03-30-2' + i
                )       
            );
        }
        
        insert products2;
        
        for(Integer i=0; i<5; i++) {
            pEntries1.add(
                new PricebookEntry(
                    Pricebook2Id=pBook2, 
                    Product2Id=products2.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        insert pEntries1; 
         
        Order o1 = new Order(
            AccountId=a1.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook2,
            Site_Survey__c=a1.Site_Survey__c, 
            RecordTypeId=devRecordTypeId,
            ShipToContactId = con.Id
        ); 
        insert o1;
         
        for(Integer i=0; i<1; i++) {
            orderItems2.add(
                new OrderItem(
                    Product2Id=pEntries1.get(i).Id,  
                    Frequency__c='Weekly', 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o1.Id,
                    HasSurveyAssets__c=TRUE,
                    Active__c = true
                )
            );
        } 
        
        insert orderItems2;
        
       
        for(Integer i=0; i<1; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o1.Id,  
                    Originating_Record_ID__c=orderItems2.get(i).Id, 
                    Product__c=products2.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o1.Site_Survey__c, 
                    Service_Frequency__c=orderItems2.get(i).Frequency__c, 
                    Survey_Location__c = location.Id
                )
            );
        } 
        insert surveyAssetLocations;
        
        for(Integer i=0; i<1; i++) {
            orderItems2.get(i).HasSurveyAssets__c=true;
            orderItemLocations.add(
                new Order_Item_Location__c(
                    Order__c=o1.Id,  
                    Order_Product__c=orderItems2.get(i).Id, 
                    Survey_Asset_Location__c=surveyAssetLocations.get(i).Id
                )
            );
        }
        
        insert orderItemLocations;
                 
        WorkOrder testWorkOrder = new WorkOrder(
          AccountId=a1.Id,
            Order__c=o1.Id,
            StartDate=System.today(), 
            Status='New',
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook2, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            ServiceTerritoryId=st3.Id,
            Type__c = 'Installation',
            Installation_Ticket__c = c.Id
            //Next_Scheduled_Appointment__c = Datetime.newInstanceGmt(2018, 12, 31)
        );
        insert testWorkOrder;
        
         system.debug('aaaaaaaaaaa'+testWorkOrder.Type__c);
         
         system.debug('dddddddddd'+ BillingAccount.Installation_Survey_Sent__c);
        
        Test.startTest();
                    
        OrderItem oItem = [Select Id,Frequency__c,Product2Id,UnitPrice,Service_Price_Per_Unit__c,Quantity,OrderId,HasSurveyAssets__c from OrderItem where id =: orderItems2.get(0).Id];
        
        //Survey_Asset_Location__c surveyAsset = surveyAssetLocations.get(0);
                
        WorkOrderLineItem testWorkOrderItem3 = new WorkOrderLineItem(
          WorkOrderId=testWorkOrder.Id, 
            Order_Product__c = oItem.Id, 
            Type_of_Service__c='Install', 
            Quantity=1,
            PricebookEntryId=pEntries1.get(0).Id, 
            Product__c=products2.get(0).Id, 
            Line_Item_Description__c='TestDescription'
            //Service_Frequency__c = 'Weekly'
        );
        insert testWorkOrderItem3;
        
        update testWorkOrderItem3;
         
         WorkOrderLineItem woli = [Select id,Service_Frequency__c from WorkOrderLineItem where id =: testWorkOrderItem3.Id];
         
        system.debug('eeeeeeeeeee11111111'+oItem.Frequency__c);
        
        system.debug('cccccccccc'+testWorkOrderItem3.Service_Frequency__c + testWorkOrderItem3 + woli.Service_Frequency__c); 
        
        update o1;
        
        Order o = [Select Recurring_Lines__c from Order where id =: o1.Id];
        
        system.debug('bbbbbbbbbb'+o.Recurring_Lines__c);
        
        Work_Order_Room__c testLocation = new Work_Order_Room__c(
          Site_Survey__c=o1.Site_Survey__c, 
            Building__c = location.Building__c,
            Floor__c = location.Floor__c, 
            Location_Type__c=location.Location_Type__c, 
            Location_SubType__c=location.Location_SubType__c,
            Name=location.Name, 
            Work_Order__c=testWorkOrder.Id, 
            Survey_Location__c=location.id
        );
        insert testLocation;
        
        User newUser = new User(
            Alias = 'UsrWObjT', 
            Email = 'testUsrWOObjTrig@UserTechnician4Test.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TstFName1',
            LastName = 'TstLName1', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testUsrWOObjTrig@UserTechnicianForTest.com', 
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
        
        //testWorkOrderItem.Work_Order_Asset__c=testAsset.Id;
        testWorkOrderItem3.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem3;
        
        
        
        testWorkOrder.Status = 'Completed';
        update testWorkOrder;
        
        
        system.debug('fffffffffffff' + testWorkOrder.Status + testWorkOrder.Order__r.Recurring_Lines__c+testWorkOrder.Type__c+testWorkOrder.Account.Parent.Installation_Survey_Sent__c);
        
        Account acc = [Select id,Installation_Survey_Sent__c,Install_Survey_Received_by_Work_Order__c from Account where id =: BillingAccount.Id];
        //system.assertequals(acc.Installation_Survey_Sent__c,true);
        //system.assertnotequals(acc.Install_Survey_Received_by_Work_Order__c,null);
        Test.stopTest();
        
    }
}