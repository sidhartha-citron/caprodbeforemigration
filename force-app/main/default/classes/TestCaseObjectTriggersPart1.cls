@isTest
public class TestCaseObjectTriggersPart1 {
    
    @TestSetup static void setup() {
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        Id internalRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Data Review').getRecordTypeId();
        //Id oppRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Frequency Change - Penetration').getRecordTypeId();
        Id oppRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Changes to an Existing Service Subcategory').getRecordTypeId();
        String sysAdminProfileId = [SELECT Id FROM Profile WHERE Name ='System Administrator' LIMIT 1].Id;
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
      
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Opportunity_Case_Creation_Stage_Name__c = 'Signed Awaiting Survey Approval';
        fssetting.Opportunity_Frequency_Change_Stage_Name__c = 'Signed - Submit for Frequency Change';
        fssetting.Case_Type_for_Internal_Data_Review__c = 'Site Survey';
        fssetting.Opportunity_Case_Rejection_Stage_Name__c = 'Closed - Site Survey Rejected';
        fssetting.Site_Survey_Reviewed_Status__c = 'Approved';
        fssetting.Customer_Service_Queue__c = testGroup.Id;
        fssetting.Internal_Case_Accepted_Status__c = 'Accepted';
        fssetting.Site_Survey_Case_Rejected_Status__c = 'Rejected';
        fssetting.Internal_Data_Review_Case_Record_Type_ID__c = internalRecordTypeId;
        fssetting.Opportunity_To_Order_Creation_Stage_Name__c = 'Signed';
        fssetting.Order_Start__c = 1;
        fssetting.Non_Consumables_Period__c = 1;
        fssetting.Pest_Site_Survey_Approval_Queue__c = testGroup.Id;
        fssetting.Hygiene_Site_Survey_Approval_Queue__c = testGroup.Id;
        fssetting.Default_Order_Price_Book_ID__c = Test.getStandardPricebookId();
        fssetting.Internal_Data_Review_Case_Owner__c = testGroup.Id;
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.System_Administrator_Profile_Id__c = sysAdminProfileId;
        fssetting.Customer_Service_Profile_Id__c = sysAdminProfileId;
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
        fssetting.Opportunity_RecordType_Frequency_Change__c = oppRecordTypeId;
        fssetting.PO_Required_After_Label__c = 'PO Required After';
        fssetting.PO_Required_Before_Label__c = 'PO Required Before';
        
            
        insert fssetting;
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        /*
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
            //AccPac_Account__c='1234-', 
            A_P_Contact_Name__c='TestContactName', 
            Credit_Check__c='Completed', 
            Industry='Institutions', 
            Industry_Code_Accpac__c='000-00 UNKNOWN', 
            Invoice_Preference__c='Email',
            Invoicing_Email_Address__c='Test@test.com', 
            LEED_Customer__c='No', 
            On_Hold__c=FALSE, 
            //Type='Customer',  
            Type='Prospect',
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
        
        TestDataFactory.crtAcctContact(1, 1); 
        
        Account a = TestDataFactory.accounts[0]; 
        a.OperatingHoursId = TestDataFactory.opthours[1].id; 
        a.Service_Territory__c = TestDataFactory.srvTers[1].id;
        a.Type = 'Prospect';
        a.AccPac_Account__c = '';
        update a; 
    
        Contact c = TestDataFactory.contacts[0];

        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Approved'
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
                    Family= (i==1) ? 'Pest Control' : 'Hygiene'
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
        
        Opportunity op = new Opportunity(
            Name=a.Name+' Opportunity',
            AccountId=a.Id,
            StageName='Presentation', 
            CloseDate=System.today().addDays(30),
            Amount=0.0, 
            Type='Retention', 
            Opportunity_Type__c='Consumables', 
            LeadSource='Call In', 
            Site_Survey__c=a.Site_Survey__c
        ); 
        insert op;
        
        OpportunityContactRole oppRole = new OpportunityContactRole(
            OpportunityId=op.Id,
            ContactId=c.Id, 
            Role='Decision Maker',
            isPrimary=TRUE
        );
        insert oppRole;
        
        for(Integer i=0; i<3; i++) {
            oppItems.add(
                new OpportunityLineItem(
                    Product2Id=pEntries.get(i).Id,  
                    Service_Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OpportunityId=op.Id, 
                    SurveyAssetCountChecker__c=1
                )
            );
        } 
        insert oppItems;
        
        for(Integer i=0; i<3; i++) {
            //oppItems.get(i).SurveyAssetCountChecker__c=oppItems.get(i).Quantity;
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=op.Id,  
                    Originating_Record_ID__c=oppItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=op.Site_Survey__c, 
                    Service_Frequency__c=oppItems.get(i).Service_Frequency__c, 
                    Survey_Location__c=location.Id
                )
            );
        }
        insert surveyAssetLocations;
        
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
        QueuesObject testQueue = new QueueSObject(QueueID = testGroup.id, SobjectType = 'Case');
        
        
        System.runAs(newUser) {
            insert testQueue;
        }
    }
    
    static testMethod void testBeforeInsert() {
        List<Case> cases = new List<Case>();
        
        Id otherRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Change Current Services').getRecordTypeId();
        Id internalDataReviewRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Data Review').getRecordTypeId();
    	Id generalInquiryTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('General Inquiry (Tech)').getRecordTypeId();
    	Id generalInquiryRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('General Inquiry').getRecordTypeId();
    	Id invoiceInformationRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        Id technicianServiceRequestRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Technician Service Request').getRecordTypeId();
        Id technicianServiceRequestTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Technician Service Request (Tech)').getRecordTypeId(); 
        Id orderNewServiceRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Order New Service').getRecordTypeId(); 
        Id orderNewServiceTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Order New Service (Tech)').getRecordTypeId(); 
        Id siteContactRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Site Contact').getRecordTypeId(); 
        Id internalDataReviewTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Data Review (Tech)').getRecordTypeId(); 
        Id emergencyRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId(); 
        Id internalAppSupportRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Application Support').getRecordTypeId();
        Id creditCheckRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Credit Check').getRecordTypeId(); 
        
        Account a = [SELECT Id, Name, OperatingHoursId, Service_Territory__c, Credit_Check__c FROM Account limit 1];
        
        //Test
        List<Account> aa_test = new list<Account>([select id, name from account]);
        System.debug(aa_test);
        
        Opportunity op = [SELECT Id, Name, AccountId, StageName, Site_Survey__c, Seasonal_Requirements__c, Description FROM Opportunity limit 1];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = otherRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = internalDataReviewRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = internalDataReviewRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='Rejected', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = generalInquiryTechRecordTypeId,
            AccountId = a.Id,
            Type=fssetting.Ticket_Type_for_Sales_Inquiry__c, 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = generalInquiryRecordTypeId,
            AccountId = a.Id,
            Type=fssetting.Ticket_Type_for_New_Lead__c, 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = invoiceInformationRecordTypeId,
            AccountId = a.Id,
            Type=fssetting.Ticket_Type_for_Sales_Inquiry__c, 
            Status='New', 
            isRepairTicket__c = true,
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = technicianServiceRequestRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = technicianServiceRequestTechRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = orderNewServiceRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = orderNewServiceTechRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = siteContactRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
		cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = internalDataReviewTechRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = emergencyRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = internalAppSupportRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        cases.add(new Case(
            Subject = 'TestCase',
            RecordTypeId = creditCheckRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low'
        ));
        
        insert cases;
    }
    
    static testMethod void testCreditCheckUpdate() {
        Id creditRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Credit Check').getRecordTypeId();
        
        Account a = [SELECT Id, Name, OperatingHoursId, Service_Territory__c, Credit_Check__c FROM Account limit 1];
        Opportunity op = [SELECT Id, Name, AccountId, StageName, Site_Survey__c, Seasonal_Requirements__c, Description FROM Opportunity limit 1];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        a.Credit_Check__c = 'In Progress';
        update a; 
        
        Case testCase = new Case(
            Subject = 'TestCase',
            RecordTypeId = creditRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low', 
            Credit_Limit__c=10, 
            Origin='Email'
        );
        
        insert testCase;
        
        testCase.Status = 'Accepted';
        update testCase;
    }
    
    static testMethod void testCreditCheckUpdateOverrideAccountStatus() {
        Id creditRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Credit Check').getRecordTypeId();
        
        Account a = [SELECT Id, Name, OperatingHoursId, Service_Territory__c, Credit_Check__c FROM Account limit 1];
        Opportunity op = [SELECT Id, Name, AccountId, StageName, Site_Survey__c, Seasonal_Requirements__c, Description FROM Opportunity limit 1];
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Case testCase = new Case(
            Subject = 'TestCase',
            RecordTypeId = creditRecordTypeId,
            AccountId = a.Id,
            Type='Other', 
            Status='New', 
            Priority='Low', 
            Credit_Limit__c=10, 
            Origin='Email'
        );
        
        insert testCase;
        
        testCase.Status = 'Accepted';
        update testCase;
    }
    
    static testMethod void testBeforeOpportunity() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        Account a = [SELECT Id, Name, OperatingHoursId, Service_Territory__c, isParent__c,Invoice_Preference__c,Type,ParentId FROM Account limit 1];
        system.debug('##'+ a.isParent__c + '#' + a.Type + '#' + a.ParentId + '#' + a.Invoice_Preference__c);
     
        Opportunity op = [SELECT Id, Name, AccountId, Account.Invoice_Preference__c, StageName, Site_Survey__c, Seasonal_Requirements__c, Description FROM Opportunity Limit 1];
        system.debug('##'+ op.Account.Invoice_Preference__c);
        op.StageName=fssetting.Opportunity_Case_Creation_Stage_Name__c;
        update op;
        
        Case testCase = new Case(
            Subject = op.Name + ' - Awaiting Survey Approval',
            OwnerId = fssetting.Pest_Site_Survey_Approval_Queue__c,
            RecordTypeId = fssetting.Internal_Data_Review_Case_Record_Type_ID__c,
            AccountId = op.AccountId,
            Opportunity__c = op.Id,
            Site_Survey__c = op.Site_Survey__c, 
            Type=fssetting.Case_Type_for_Internal_Data_Review__c, 
            Status='New'
        );
        
        insert testCase;
        
        testCase.Status = 'Accepted';
        update testCase;
    }
    
    static testMethod void testOppFrequencyChange(){
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Account a = [SELECT Id, Name, OperatingHoursId, Service_Territory__c FROM Account Limit 1];
        Opportunity op = [SELECT Id, Name, AccountId, StageName, Site_Survey__c, Seasonal_Requirements__c, Description, RecordTypeId FROM Opportunity Limit 1];
        
        op.RecordTypeId = fssetting.Opportunity_RecordType_Frequency_Change__c;
        op.StageName = fssetting.Opportunity_Frequency_Change_Stage_Name__c;
        update op;
        
        Case testCase = new Case(
            Subject = op.Name + ' - Frequency Change',
            OwnerId = fssetting.Pest_Site_Survey_Approval_Queue__c,
            RecordTypeId = fssetting.Internal_Data_Review_Case_Record_Type_ID__c,
            AccountId = op.AccountId,
            Opportunity__c = op.Id,
            Site_Survey__c = op.Site_Survey__c, 
            Type=fssetting.Case_Type_for_Internal_Data_Review__c, 
            Status='Rejected'
        );
        
        insert testCase;
        
        testCase.Status = fssetting.Internal_Case_Accepted_Status__c;
        update testCase;
    }
}