@isTest
public class SendDocuSignOnDemandControllerTest {
	@testSetup
    static void setup() {
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
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        OperatingHours oh = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{territoryHours, oh};
            
            ServiceTerritory st1 = new ServiceTerritory(
                IsActive=true,
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
            IsActive=true,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios2',
            ParentTerritoryId = st1.Id
            
        );
        insert st;
        /*
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
            On_Hold__c=false,
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
            ShippingCountry = 'Country',
            PO_Required_for_Orders__c = 'PO Required Before'
        );
        insert a;
		*/
        TestDataFactory.crtBillToAcctContact(1, 1);
		Account a = TestDataFactory.accounts[0];
        Contact c = TestDataFactory.contacts[0];
/*
        Contact c = new Contact(
                LastName='test',
                AccountId = a.Id,
                Email = 'test@example.com'
        );
        insert c;
*/
        Account testWareHouse = a.clone(false,true,false,false);
        testWareHouse.Name= 'TestWareHouse';
        testWareHouse.AccPac_Account__c= '2345';
        insert testWareHouse;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Scanned_In_Status__c = 'Installed';
        fssetting.Work_Order_Line_Item_Completed_Status__c = 'Completed';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Scanned_Out_Status__c = 'Remove';
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Regular_Order_Record_Type_Id__c = devRecordTypeId;
        fssetting.Scan_Delimiter__c = '\\s+';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Work_Order_Room_Complete_Status__c = 'Completed';
        fssetting.Scanned_Out_Account_Record_ID__c = testWareHouse.Id;
        fssetting.Cannot_Complete_Status_Value__c = 'Cannot Complete';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Enable_Automatic_WO_Completed_Status__c = true;
        fssetting.Label_for_Install_Work_Order_Type__c = 'Install';
        fssetting.Label_for_Replace_Work_Order_Type__c = 'Replace';
        fssetting.Label_for_Service_Work_Order_Type__c = 'Service';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Working_Hour_End_Time__c = '4:00';
        fssetting.CitronDoNotReply__c = 'test@example.com';
        fssetting.PO_Required_Before_Label__c = 'PO Required Before';
        fssetting.Customer_Success_OWA_Id__c = 'fakeid';
        insert fssetting;
        
        Conga_and_DocuSign_Settings__c congaSetting = new Conga_and_DocuSign_Settings__c();
        congaSetting.Business_Days_to_Resend_DocuSign_After__c = 3;
        congaSetting.Business_Days_to_Resend_DocuSign_Before__c = 3;
        congaSetting.Conga_Root_Endpoint__c = 'https://www.mock.ca/';
        congaSetting.DocuSign_Envelope_Completed_Status__c = 'Completed';
        congaSetting.DocuSign_Running_User__c = UserInfo.getUserId();
        congaSetting.Multiple_PO_Numbers_Query_Id__c = 'fakequery';
        congaSetting.Multiple_PO_Numbers_Template_Id__c = 'faketemplate';
        congaSetting.PO_Number_Request_Email_Body__c = 'email body';
        congaSetting.PO_Number_Request_Email_Subject__c = 'email subject';
        congaSetting.PO_Number_Request_Template_Id__c = 'afaketemplate';
        congaSetting.Replaced_Order_Product_Conga_Email_Id__c = 'faketemplate';
        congaSetting.Replaced_Order_Product_Conga_Query__c = 'faequery';
        congaSetting.DocuSign_Reminder_Frequency__c = 2;
        
        insert congaSetting;
        
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
                    IsActive=true,
                    Available_As_Related_Product__c=true,
                    ExternalID__c = '2-20-03-30-1' + i,
                    Family= (i==0) ? 'Pest Control' : 'Hygiene'
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
                    IsActive=true
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
                    HasSurveyAssets__c=true
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
    }
    
    @isTest
    static void testFireEmailWithoutShipToContact() {
        Order order = [SELECT Id FROM Order LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock());

        Test.startTest();
        
        SendDocuSignOnDemandController.validateDataAndSend(order.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testFireEmailSuccessfully() {
        Order order = [SELECT Id, AccountId FROM Order LIMIT 1];
        Contact c = [SELECT Id FROM Contact WHERE AccountId = :order.AccountId LIMIT 1];
        
        order.ShipToContactId = c.Id;
        
        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock());

        Test.startTest();
        
        update order;
        
        SendDocuSignOnDemandController.validateDataAndSend(order.Id);
        
        Test.stopTest();
    }

    public class CongaCalloutMock implements HttpCalloutMock{
        public HttpResponse respond(HTTPRequest req){
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json;charset=UTF-8');
            res.setBody('{"example":"test"}');
            res.setStatusCode(200);
            return res;
        }
    }
}