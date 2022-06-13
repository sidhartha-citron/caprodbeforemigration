@isTest
public class OrderSendSurveyTest {
    @TestSetup static void setup() {
        List<Account> accounts = new List<Account>();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        Id regularOrderRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        TestDataFactory.crtCPQSettings();
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        QueueSobject testQueue = new QueueSObject(QueueId = testGroup.Id, SobjectType = 'Case');
        System.runAs(new User(Id = UserInfo.getUserId())) {   
            insert testQueue;
        }
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Regular_Order_Record_Type_Id__c = regularOrderRecordTypeId;
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.System_Administrator_Profile_Id__c = UserInfo.getProfileId();
        fssetting.Accounts_Receivable_Queue__c = testGroup.Id;
        fssetting.Billing_Team__c = testGroup.Id;
        fssetting.Invoice_Information_Case_RecordTypeId__c = devRecordTypeId;
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Default_Opportunity_Price_Book_ID__c = pBook;
        fssetting.Default_Order_Price_Book_ID__c = pBook;
        
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
        
        Frequency__c setting1 =  new Frequency__c(Name=frequencies.get(0));
        setting1.Hygiene_Minus_Days__c = 5;
        setting1.Hygiene_Plus_Days__c = 5;
        setting1.Occurrences_In_Year__c = 1;
        setting1.Discount_Percent__c = 0.0;
        setting1.Pest_Minus_Days__c = 1;
        setting1.Pest_Plus_Days__c = 1;
        insert setting1;
        
        Frequency__c setting2 =  new Frequency__c(Name=frequencies.get(1));
        setting2.Hygiene_Minus_Days__c = 5;
        setting2.Hygiene_Plus_Days__c = 5;
        setting2.Occurrences_In_Year__c = 12;
        setting2.Discount_Percent__c = 0.0;
        setting2.Pest_Minus_Days__c = 1;
        setting2.Pest_Plus_Days__c = 1;
        insert setting2;
        
        Frequency__c setting3 =  new Frequency__c(Name=frequencies.get(2));
        setting3.Hygiene_Minus_Days__c = 5;
        setting3.Hygiene_Plus_Days__c = 5;
        setting3.Occurrences_In_Year__c = 54;
        setting3.Discount_Percent__c = 0.0;
        setting3.Pest_Minus_Days__c = 1;
        setting3.Pest_Plus_Days__c = 1;
        insert setting3;
        
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
        
        ServiceTerritory st1 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios1'
            
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
            Name='TerritoryForCaseTestScenarios',
            ParentTerritoryId = st1.Id
            
        );
        insert st;
        Id rT = [select id from recordType where name = 'Customer Ship To'].id;
        ID rT2 = [select id from recordType where name = 'Customer Bill To'].id;
        TestDataFactory.crtAcctContact(2, 1);
        
        accounts = TestDataFactory.accounts;
        accounts[0].recordTypeId = rT2;
        update accounts[0];
        accounts[1].RecordTypeId = rT; 
        accounts[1].ParentId = accounts[0].id;
        accounts[1].OperatingHoursId = TestDataFactory.opthours[1].Id;
        accounts[1].Service_Territory__c = TestDataFactory.srvTers[1].Id;
        update accounts[1];
        
        contact c = TestDataFactory.contacts[0]; 
        c.AccountId = accounts[1].id;
        update c;
              
        Account a0 = accounts.get(0);
        Account a = accounts.get(1);
        
       /*
        for(Integer i=0; i<=1; i++) {
            accounts.add(new Account(
                Name='TestAccount'+i, 
                AccPac_Account__c='123456-'+i, 
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
            )); 
        }

        insert accounts;
        
        Account a0 = accounts.get(0);
        Account a = accounts.get(1);
        a.ParentId = a0.Id;
        update a;
        
        Contact c = new Contact(
            FirstName = 'TestFirstName', 
            LastName = 'TestLastName', 
            Email = 'testUser@UserCommunity.com', 
            AccountId = a.Id, 
            Title = 'title',
            Phone = '12345678',
            Fax = '12345678',
            MobilePhone = '12345678',
            Customer_Satisfaction_eSurveys__c = FALSE,
            Customer_Opinion_eSurveys__c = TRUE,
            Customer_eNewsletters__c = FALSE,
            Promotional_Offer_Emails__c = TRUE,
            Promotional_Mailings__c = FALSE
        );
        insert c;
		*/
        
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
        
        Order o = new Order(
            AccountId=a.Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=a.Site_Survey__c,
            ShipToContactId = c.Id
        ); 
        insert o;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE,
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
        
        for(Integer i=0; i<3; i++) {
            orderItems.add(
                new OrderItem(
                    Product2Id=pEntries.get(i).Id,  
                    Frequency__c=frequencies.get(1), 
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
        
    }
    
    static testMethod void testActivatedOrder() {
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Name='TestAccount1'];
        Order o = [SELECT Id, Account.Name, AccountId, RecordTypeId FROM Order WHERE Account.Name='TestAccount1' LIMIT 1].get(0);
        
        o.Status='Activated';
        update o;
	}
}