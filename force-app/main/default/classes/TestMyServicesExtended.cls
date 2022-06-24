@isTest
public class TestMyServicesExtended {
    
    @TestSetup static void setup() {
        Date todaysDate = System.today();
        List<Account> accounts = new List<Account>();
        List<Site_Survey__c> siteSurveys = new List<Site_Survey__c>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
         TestDataFactory.crtCPQSettings();
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        QueueSobject testQueue = new QueueSObject(QueueId = testGroup.Id, SobjectType = 'Case');
        System.runAs(new User(Id = UserInfo.getUserId())) {   
            insert testQueue;
        }
            
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c(Name='fssetting');
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Order_Active_Stage__c='Activated';
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Work_Order_Line_Item_CannotComp_Status__c = 'Cannot Complete';
        fssetting.Work_Order_New_Status__c = 'New';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Item_Type_of_Services__c = 'Service';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        fssetting.Working_Hour_End_Time__c = '4:00';
        fssetting.Service_Start__c = 0;
        fssetting.Invoice_Information_Case_RecordTypeId__c = devRecordTypeId;
        
        fssetting.Inside_Sales_Team__c = testGroup.Id;
        fssetting.Billing_Team__c = testGroup.Id;
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
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        TestDataFactory.crtBillToAcctContact(4,1);
        accounts = TestDataFactory.accounts;
        
        for(Integer i=0;i<4;i++){
            accounts[i].OperatingHoursId = TestDataFactory.opthours[1].Id;
        	accounts[i].Service_Territory__c = TestDataFactory.srvTers[1].Id;
        }
        
        for(Integer i=1; i<3; i++) {
            siteSurveys.add(
                new Site_Survey__c(
                    Account__c=accounts.get(i).Id, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                )
            );
        }
        insert siteSurveys; //surveyLocations
        
        Survey_Location__c newLocation = new Survey_Location__c(
            Site_Survey__c=siteSurveys.get(0).Id, 
            Building__c = 'Building'+4,
            Floor__c = 'Floor'+4, 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'+4
        );
        
        insert newLocation;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Item_Type__c=i==1?'Consumables':fssetting.Item_Type_of_Services__c, 
                    Display_Record_In_Portal__c=i==1?TRUE:FALSE, 
                    Display_Frequency_In_Portal__c=i==1?TRUE:FALSE,
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
        
        Account a1 = accounts.get(1);
        Account a2 = accounts.get(2);
		a1.Site_Survey__c = siteSurveys.get(0).Id;
        a2.Site_Survey__c = siteSurveys.get(1).Id;
        update new List<Account>{a1, a2};
        
        Test.startTest();
            
        Order o = new Order(
        	AccountId=accounts.get(1).Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=accounts.get(1).Site_Survey__c
        ); 
        insert o;
        
        for(Integer i=0; i<3; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(0), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=TRUE
                )
            );
        } 
        
        orderItems.add(
            new OrderItem(
                Product2Id=pEntries.get(2).Id,  
                Frequency__c=frequencies.get(0), 
                UnitPrice=1.0, 
                Purchase_Price__c=1.0, 
                Quantity=1, 
                OrderId=o.Id
            )
        );
        
        orderItems.add(
            new OrderItem(
                Product2Id=pEntries.get(4).Id,  
                Frequency__c=frequencies.get(0), 
                UnitPrice=1.0, 
                Purchase_Price__c=1.0, 
                Quantity=1, 
                OrderId=o.Id
            )
        );
        
        insert orderItems;
        
        List<WorkOrder> completedWorkOrders = new List<WorkOrder>();
        
        WorkOrder completedWorkOrder = new WorkOrder(
            AccountId=accounts.get(0).Id,
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
            Status = fssetting.Work_Order_Completion_Status__c
        );
        
        WorkOrder completedWorkOrderTwo = new WorkOrder(
            AccountId=accounts.get(0).Id,
            Order__c=o.Id,
            StartDate=System.today() - 1, 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=o.Pricebook2Id, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            Status = fssetting.Work_Order_Completion_Status__c
        );
        
        completedWorkOrders.add(completedWorkOrder);
        completedWorkOrders.add(completedWorkOrderTwo);
        
        insert completedWorkOrders;
        
        WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=completedWorkOrders.get(0).Id, 
            Order_Product__c=orderItems.get(0).Id, 
            Type_of_Service__c='Service', 
            Quantity=1,
            PricebookEntryId=pEntries.get(0).Id,         
            Status = fssetting.Work_Order_Completion_Status__c
        );
        insert testWorkOrderItem;
  
        WorkOrderLineItem testWorkOrderItemTwo = new WorkOrderLineItem(
            WorkOrderId=completedWorkOrders.get(0).Id, 
            Order_Product__c=orderItems.get(2).Id, 
            Type_of_Service__c='Service', 
            Quantity=1,
            PricebookEntryId=pEntries.get(2).Id,           
            Status = fssetting.Work_Order_Completion_Status__c
        );
        
        insert testWorkOrderItemTwo;
        
        WorkOrderLineItem testWorkOrderItemThree = new WorkOrderLineItem(
            WorkOrderId=completedWorkOrders.get(1).Id, 
            Order_Product__c=orderItems.get(3).Id, 
            Type_of_Service__c='Service', 
            Quantity=1,
            PricebookEntryId=pEntries.get(2).Id,          
            Status = fssetting.Work_Order_Completion_Status__c
        );
        
        insert testWorkOrderItemThree;
        
        WorkOrderLineItem testWorkOrderItemFour = new WorkOrderLineItem(
            WorkOrderId=completedWorkOrders.get(1).Id, 
            Order_Product__c=orderItems.get(4).Id, 
            Type_of_Service__c='Service', 
            Quantity=1,
            PricebookEntryId=pEntries.get(2).Id,        
            Status = fssetting.Work_Order_Completion_Status__c
        );
        
        insert testWorkOrderItemFour;
        
        Test.stopTest();
        
        // Also, insert future work order
        WorkOrder futureWorkOrder = new WorkOrder(
            AccountId=accounts.get(0).Id,
            Order__c=o.Id,
            StartDate=System.today() + 1, 
            EndDate=System.today() + 2,
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=o.Pricebook2Id, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            Status = fssetting.Work_Order_New_Status__c
        );
        insert futureWorkOrder;
        
		WorkOrderLineItem futureWorkOrderItem = new WorkOrderLineItem(
            WorkOrderId=futureWorkOrder.Id, 
            Order_Product__c=orderItems.get(0).Id, 
            Type_of_Service__c='Service', 
            Quantity=1,
            PricebookEntryId=pEntries.get(0).Id
        );
        insert futureWorkOrderItem;
        
        for(Integer i=0; i<3; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o.Id,  
                    Originating_Record_ID__c=orderItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o.Site_Survey__c, 
                    Service_Frequency__c=orderItems.get(i).Frequency__c, 
                    Survey_Location__c=newLocation.Id
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
        
        Contact newContact = new Contact(
            FirstName = 'TestFirstName', 
            LastName = 'TestLastName', 
            Email = 'testUser@UserCommunity.com', 
            AccountId = accounts.get(1).Id
            
        );
        insert newContact;
        
        Profile communityProfile = [SELECT Id FROM Profile WHERE Usertype='PowerCustomerSuccess' LIMIT 1]; 
        User newUser = new User(
            Alias = 'testA', 
            Email = newContact.Email, 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = newContact.FirstName,
            LastName = newContact.LastName, 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = newContact.Email, 
            //ContactId=newContact.Id, 
            CommunityNickname=newContact.FirstName, 
            Contact_Login__c=newContact.Email, 
            Employee_Number__c = 'ABCD123TEST12345'
        );
        insert newUser;
        
        //User newUser = getCommunityUser(newContact);
    }
    
    static testMethod void testGetValues() {
        Test.startTest();
        
        MyServicesExtended.getValues();
        
        Test.stopTest();
    }
    
    static testMethod void testGetServicesMapInternal(){
       	Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        Order o = [SELECT Id, Account.Name, AccountId, Status FROM Order LIMIT 1].get(0);
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        o.Status = fssetting.Order_Active_Stage__c;
        
       
        
        update o;
        List<String> queryParams = new List<String>{'OrderItemNumber, Order.OrderNumber, Product2.Name, Product2.Display_Frequency_In_Portal__c, Quantity, Product2.Product_Image_URL__c, Product2.Item_Type__c, Product_Name__c, Frequency__c, Order_Number__c, Order.Status, Order.AccountId, PricebookEntryId, PricebookEntry.UnitPrice, Related_Product__r.Name'};
        MyServicesExtended.getServicesMap(queryParams, a.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testGetServicesMapIsPortal(){
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        Order o = [SELECT Id, Account.Name, AccountId, Status FROM Order LIMIT 1].get(0);
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        o.Status = fssetting.Order_Active_Stage__c;
        
        
        
        update o;
        User communityUser = [SELECT Id, AccountId, ContactId, UserName FROM User WHERE UserName='testUser@UserCommunity.com' LIMIT 1];
        List<String> queryParams = new List<String>{'OrderItemNumber, Order.OrderNumber, Product2.Name, Product2.Display_Frequency_In_Portal__c, Quantity, Product2.Product_Image_URL__c, Product2.Item_Type__c, Product_Name__c, Frequency__c, Order_Number__c, Order.Status, Order.AccountId, PricebookEntryId, PricebookEntry.UnitPrice, Related_Product__r.Name'};
        
        System.RunAs(communityUser){
        	MyServicesExtended.getServicesMap(queryParams, a.Id);
        }  
        
        Test.stopTest();
    }
    
    static testMethod void testAddToCartWithOrder(){
        Test.startTest();
        
        Id pBook = Test.getStandardPricebookId();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        User communityUser = [SELECT Id, AccountId, ContactId, UserName FROM User WHERE UserName='testUser@UserCommunity.com' LIMIT 1];
        PricebookEntry pEntry = [SELECT Id, Product2.Display_Frequency_In_Portal__c FROM PricebookEntry WHERE Product2.Display_Frequency_In_Portal__c=TRUE LIMIT 1];
        
        Order o = new Order(
        	AccountId=a.Id, 
            Status='Shopping Cart', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c, 
            ShoppingCartEID__c = communityUser.ContactId + 'Shopping Cart'
        );

        insert o;
        
        System.RunAs(communityUser) {
        	MyServicesExtended.addToCart(pEntry.Id);
        }  
        
        Test.stopTest();
    }
    
    static testMethod void testAddToCartWithoutOrder(){
        Test.startTest();
        Id pBook = Test.getStandardPricebookId();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        User communityUser = [SELECT Id, AccountId, ContactId, UserName FROM User WHERE UserName='testUser@UserCommunity.com' LIMIT 1];
        PricebookEntry pEntry = [SELECT Id, Product2.Display_Frequency_In_Portal__c FROM PricebookEntry WHERE Product2.Display_Frequency_In_Portal__c=TRUE LIMIT 1];
        List<String> queryParams = new List<String>{'OrderItemNumber, Order.OrderNumber, Product2.Name, Product2.Display_Frequency_In_Portal__c, Quantity, Product2.Product_Image_URL__c, Product2.Item_Type__c, Product_Name__c, Frequency__c, Order_Number__c, Order.Status, Order.AccountId, PricebookEntryId, PricebookEntry.UnitPrice, Related_Product__r.Name'};

        System.RunAs(communityUser) {
        	MyServicesExtended.addToCart(pEntry.Id);
        }  
        
        Test.stopTest();
    }
    
    static testMethod void testGetCaseDetails(){
        Test.startTest();
        User communityUser = [SELECT Id, AccountId, ContactId, UserName FROM User WHERE UserName='testUser@UserCommunity.com' LIMIT 1];
        System.RunAs(communityUser) {
        	MyServicesExtended.getCaseDetails();
        }
        Test.stopTest();
    }
}