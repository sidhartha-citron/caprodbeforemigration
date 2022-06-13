@isTest
public class TestActivityInfestationObjectTriggers {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c(Service_Start__c = 0);
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Cannot_Complete_Status_Value__c = 'Cannot Complete';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
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
        
        TestDataFactory.accounts[0].Site_Survey__c = ss.Id;
        update TestDataFactory.accounts[0];
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    ExternalId__c = '2-20-03-30-1' + i,
                    Family= (i==0) ? 'Hygiene' : i == 1 ? 'Pest Control' : 'Hygiene'
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
        insert st;*/
        
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
            Country = 'Country', 
            ServiceTerritoryId=TestDataFactory.srvTers[0].Id
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
        
        testWorkOrderItem.Work_Order_Location__c=testLocation.Id;
        update testWorkOrderItem;
    }
    
    static testMethod void testInsertUpdateWithLineItem(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        
        Activity_Infestation__c testInfestation = new Activity_Infestation__c(
            Account__c=a.Id, 
            Activity_Level__c='0',
            Activity_Type__c='Birds',
            Activity_Subtype__c='Seagull',
            Work_Order_Line_Item__c=testWorkOrderItem.Id,
            Work_Order__c=testWorkOrder.Id
        );
        
        Test.startTest();
        
        insert testInfestation;
        
        Test.stopTest();
    }
    
    static testMethod void testInsertUpdateWithLocation(){
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        WorkOrder testWorkOrder = [SELECT Id, Create_Quality_Assurance__c, Status, AccountId FROM WorkOrder WHERE AccountId=:a.Id LIMIT 1].get(0);
        WorkOrderLineItem testWorkOrderItem = [SELECT Id, Status, WorkOrderId, Work_Order_Location__c FROM WorkOrderLineItem WHERE WorkOrderId=:testWorkOrder.Id LIMIT 1].get(0);
        
        Activity_Infestation__c testInfestation = new Activity_Infestation__c(
            Account__c=a.Id, 
            Activity_Level__c='0',
            Activity_Type__c='Birds',
            Activity_Subtype__c='Seagull',
            Work_Order_Room__c=testWorkOrderItem.Work_Order_Location__c,
            Work_Order__c=testWorkOrder.Id, 
            Asset_Bar_Code__c='ohiqw'
        );
        
        Test.startTest();
        
        insert testInfestation;
        
        Test.stopTest();
    }
}