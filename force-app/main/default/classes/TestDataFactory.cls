@isTest
public class TestDataFactory {
	public static List<User> lUsers = new List<User>();
    public static List<Account> accounts = new List<Account>();
    public static List<Contact> contacts = new List<Contact>();
    public static List<OperatingHours> opthours = new List<OperatingHours>();
    public static List<ServiceTerritory> srvTers = new List<ServiceTerritory>();
    public static List<Site_Survey__c> srvSS = new List<Site_Survey__c>();
    public static List<Product2> products = new List<Product2>();
    public static List<PricebookEntry> pEntries = new List<PricebookEntry>();
    public static List<WorkOrder> wrkOrders = new List<WorkOrder>();
    public static List<WorkOrderLineItem> wrkOrdLines = new List<WorkOrderLineItem>();
    public static List<ServiceAppointment> lSAs = new List<ServiceAppointment>();
    public static List<ServiceResource> lSRs = new List<ServiceResource>();
    public static List<ServiceTerritoryMember> lSTMs = new List<ServiceTerritoryMember>();
    public static List<VMI_Product__c> vmiprods = new List<VMI_Product__c>();
    public static List<AssignedResource> lARs = new List<AssignedResource>();
    public static List<FSA_Service_Territory_Mapping__c> listFsa = new List<FSA_Service_Territory_Mapping__c>();
    public static List<CPQ_Service_Branches__c> listSrvBranch = new List<CPQ_Service_Branches__c>();
    public static List<Opportunity> opportunities = new List<Opportunity>();
    public static Province_Time_Zones_Operating_Hours__c timeZoneSetting = new Province_Time_Zones_Operating_Hours__c();
    public static Field_Service_Settings__c fssetting = new Field_Service_Settings__c(); 
    public static List<Lead> newLeads = new List<lead>(); 
    
    /**
     * @function: Field Settings
     **/
    public static void crtCPQSettings() {
        CPQ_Settings__c cpqSettings = CPQ_Settings__c.getOrgDefaults();
        cpqSettings.CPQ_DA_Out_of_Service_Area__c=1;
        cpqSettings.CPQ_DA_Region_1__c=100;
        cpqSettings.CPQ_Deal_Score_Buffer__c=15;
        cpqSettings.CPQ_OSAZ__c='Out of Service Area';
        cpqSettings.CPQ_T0__c = 80;
        cpqSettings.CPQ_T1__c = 70;
        cpqSettings.CPQ_T2__c = 60;
        cpqSettings.CPQ_T3__c = 50;
        upsert cpqSettings;
    }
    
    /**
     * @function: Field Settings
     **/
    public static void crtFieldSettings(){
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id caseRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        Id vehicleInspectionRecordType = Schema.SObjectType.ServiceAppointment.getRecordTypeInfosByName().get('Vehicle Inspection Service Appointment').getRecordTypeId();
        
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            
        WorkType testWorkType =  new WorkType(
        	Name='TestWorkType', 
            DurationType='Minutes', 
            EstimatedDuration=2
        );
        insert testWorkType;
        
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
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
        fssetting.SA_Vehicle_Inspection_Record_Type_Id__c = vehicleInspectionRecordType;
        fssetting.Service_Appointment_Completed_Status__c = 'Completed';
        fssetting.VMI_Product_Name__c = 'VMI Vendor Managed Inventory Service';
        
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
    }
    
    /**
     * @function: Create New Leads
     **/
    public static void crtTestLeads(Integer nofL, Boolean FSALeadAssignmentRule){
    	for(Integer i=0;i<nofL;i++){
				newLeads.add(new Lead(
            	LastName = 'Test Lead ' + i, 
				Phone ='123456789', 
				street = '555 Alden Road', 
				city = 'Markham', 
				State = 'ON', 
				PostalCode = 'L3R 3L5', 
				company = 'Citron Test', 
            	FSA_Lead_Assignment__c = FSALeadAssignmentRule, 
            	From_Web__c = True
           	));        
        }
        insert newLeads;
    }
    
    
    /**
     * @function: Create Test Users
     **/
    public static void crtTestUsers(Integer nofu){
        for(Integer i=0;i<nofu;i++){
            lUsers.add(new User(
                Alias = 'testA' + i, 
                Email = 'testUser@UserTechnicianForTest.com', 
                EmailEncodingKey = 'ISO-8859-1', 
                FirstName = 'TestFirstName',
                LastName = 'TestLastName', 
                LanguageLocaleKey = 'en_US', 
                LocaleSidKey = 'en_CA', 
                ProfileId = UserInfo.getProfileId(),
                TimeZoneSidKey = 'America/New_York', 
                UserName = 'testUser' + i + '@UserTechnicianForTest.com', 
                Employee_Number__c = 'ABCD123TESTTRY'
            ));
        }
        insert lUsers;
    }
    
    /**
     * Create Service Branch Record
     **/
    public static void crtServiceBranch(){
        if(listSrvBranch.size()>0){return;}
        DateTime myDateTime = DateTime.now();
	
        listSrvBranch.add(new CPQ_Service_Branches__c(
            CPQ_Average_Cost_Minute__c = 0.69,
            CPQ_Average_Drive_Stem_Cost__c = 17.4,
            CPQ_Direct_Cost_of_Revenue__c = 1,
            CPQ_External_Id__c = 'Toronto' + String.valueOf(myDateTime.getTime())
        ));
        insert listSrvBranch;
    }
    
    /**
     * Create an FSA Record
     **/
    public static void crtFSA(){
        if(srvTers.size()==0){TestDataFactory.crtSrvTerritory();}
        if(listSrvBranch.size()==0){TestDataFactory.crtServiceBranch();}
        if(listFsa.size()>0){return;}
        listFsa = [Select Id,FSA__c,Province__c,CPQ_Service_Branch__c,CPQ_Service_Zone__c FROM FSA_Service_Territory_Mapping__c WHERE FSA__c = 'L3R'];
        if(listFsa.size()>0){return;}
        listFsa.add(new FSA_Service_Territory_Mapping__c( 
            FSA__C = 'L3R', 
            Name = 'TestFSA', 
            Province__c = 'Ontario',
            CPQ_Service_Branch__c = listSrvBranch[0].Id,
            CPQ_Service_Zone__c = '1'
        ));
        insert listFsa;
    }
    
    /**
     * @function : Create account and associated contacts
     **/
    public static void crtAcctContact(Integer nofa, Integer nofc){
        crtAcctContact(nofa, nofc, 0, true);
    }
    
    /**
     * @function : Create "Customer Ship To" account and associated contacts
     **/
     public static void crtShipToAcctContact(Integer nofa, Integer nofc){
        crtAcctContact(nofa, nofc, 0, true);
        Id rT = [select id from recordType where name = 'Customer Ship To'].id; 
        crtBillToAcctContact(nofa, nofc);
         
        List<Account> updatedAccounts = new List<Account>();
        for(Account a: accounts){
            a.RecordTypeId = rT; 
            updatedAccounts.add(a);
        }
        update updatedAccounts; 
    }
    
    public static void crtBillToAcctContact(Integer nofa, Integer nofc){
        crtAcctContact(nofa, nofc, 0, true);
        
        ID rT = [select id from recordType where name = 'Customer Bill To'].id; 
        List<Account> updatedAccounts = new List<Account>();
        for(Account a: accounts){
            a.RecordTypeId = rT; 
            updatedAccounts.add(a);
        }
        update updatedAccounts; 
    }
    
    /**
     * @function : Create Prospect account and associated contacts
     **/
    public static void crtProspectAcctContact(Integer nofa, Integer nofc){
        Id prospectAcctRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Prospect').getRecordTypeId();
    
        if(listFsa.size()==0){TestDataFactory.crtFSA();}
        
        for(Integer i=0;i<nofa;i++) {
            accounts.add(new Account(
                Name='TestAccount'+i,
                AccPac_Account__c='',
                A_P_Contact_Name__c='TestContactName',
                Credit_Check__c='Completed',
                Industry='Institutions',
                Industry_Code_Accpac__c='000-00 UNKNOWN',
                Invoice_Preference__c='Email',
                Invoicing_Email_Address__c='Test@test.com',
                LEED_Customer__c='No',
                On_Hold__c=FALSE,
                Type='Prospect',
                Phone='123456789',
                Billing_Suite_Number__c='1',
                BillingStreet='Street',
                BillingCity = 'Toronto',
                BillingState = 'ON',
                BillingPostalCode = 'L3R3L5',
                BillingCountry = 'CA',
                Shipping_Suite_Number__c = '1',
                ShippingStreet = 'Street',
                ShippingCity = 'Toronto',
                ShippingState = 'ON',
                ShippingPostalCode = 'L3R3L5',
                ShippingCountry = 'CA',
                RecordTypeId = prospectAcctRecTypeId,
                OperatingHoursId = TestDataFactory.opthours[1].Id,
                Service_Territory__c = TestDataFactory.srvTers[1].Id,
                Invoice_Frequency__c = 'M - Monthly',
                Invoice_Generation__c = 'Bill at Beginning of Invoice Frequency'
            ));
        }
        insert accounts;

        for(Integer j=0;j<nofa;j++){
            for(Integer k=0;k<nofc;k++){
                contacts.add(new Contact(
                    FirstName = 'TestFirstName' + j + k,
                    LastName = 'TestLastName' + j + k,
                    Email = 'testUser@UserCommunity.com',
                    AccountId = accounts.get(j).Id,
                    Title = 'title',
                    Phone = '123678' + j + k,
                    Fax = '123458' + j + k,
                    MobilePhone = '145678' + j + k,
                    Customer_Satisfaction_eSurveys__c = FALSE,
                    Customer_Opinion_eSurveys__c = TRUE,
                    Customer_eNewsletters__c = FALSE,
                    Promotional_Offer_Emails__c = TRUE,
                    Promotional_Mailings__c = FALSE
    
                ));
            }
        }
        insert contacts;
    }

    /**
     * @function : Create account and associated contacts
     **/
    public static void crtAcctContact(Integer nofa, Integer nofc, Integer startIndex, Boolean withShippingAddress){
        if(listFsa.size()==0){TestDataFactory.crtFSA();}
        
        
        for(Integer i=0 + startIndex;i<nofa+startIndex;i++) {

            Account a = new Account();
            a.Name='TestAccount' + i; 
            a.AccPac_Account__c='123456-'+ i; 
            a.A_P_Contact_Name__c='TestContactName'; 
            a.Credit_Check__c='Completed'; 
            a.Industry='Institutions'; 
            a.Industry_Code_Accpac__c='000-00 UNKNOWN'; 
            a.Invoice_Preference__c='Email';
            a.Invoicing_Email_Address__c='Test@test.com'; 
            a.LEED_Customer__c='No'; 
            a.On_Hold__c=FALSE; 
            a.Type='Customer';
            a.Phone='1231231234';
            a.Billing_Suite_Number__c='1'; 
            a.BillingStreet='Street'; 
            a.BillingCity = 'Toronto'; 
            a.BillingState = 'ON'; 
            a.BillingPostalCode = 'L3R 3L5';
            a.BillingCountry = 'CA';

            if(withShippingAddress){
                a.Shipping_Suite_Number__c = '1';
                a.ShippingStreet = 'Street'; 
                a.ShippingCity = 'Toronto'; 
                a.ShippingState = 'ON'; 
                a.ShippingPostalCode = 'L3R 3L5'; 
                a.ShippingCountry = 'CA';
            }

            accounts.add(a);
        }
        insert accounts;   
        
        for(Integer j=0;j<nofa;j++){
            for(Integer k=0;k<nofc;k++){
                contacts.add(new Contact(
                    FirstName = 'TestFirstName' + j + k, 
                    LastName = 'TestLastName' + j + k, 
                    Email = 'testUser@UserCommunity.com', 
                    AccountId = accounts.get(j).Id, 
                    Title = 'title',
                    Phone = '123678' + j + k,
                    Fax = '123458' + j + k,
                    MobilePhone = '145678' + j + k,
                    Customer_Satisfaction_eSurveys__c = FALSE,
                    Customer_Opinion_eSurveys__c = TRUE,
                    Customer_eNewsletters__c = FALSE,
                    Promotional_Offer_Emails__c = TRUE,
                    Promotional_Mailings__c = FALSE
                    
                ));
            }
        }
        insert contacts;
        
    }
	
    /**
     * @function: Create operating hours
     **/
    public static void crtOperatingHrs(){
        if(opthours.size()>0){return;}
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHoursTerritory', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        ); opthours.add(territoryHours);
        OperatingHours oh = new OperatingHours(
            Name='TestHoursAccount', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        ); opthours.add(oh);
        OperatingHours employeeHours = new OperatingHours(
            Name='TestHoursEmployee', 
            Operating_Hours_Type__c='Employee Operating Hours', 
            TimeZone='America/New_York'
        );opthours.add(employeeHours);
        insert opthours;
    } 
    
    /**
     * @function: Create service territories
     **/
    public static void crtSrvTerritory(){
        if(srvTers.size()>0){return;}
        if(opthours.size()==0){TestDataFactory.crtOperatingHrs();}
        srvTers = [Select Id From ServiceTerritory];
        if(srvTers.size()>0){return;}
        ServiceTerritory stP = new ServiceTerritory(
                IsActive=TRUE,
                Street='Street', 
                City = 'Toronto', 
                State = 'ON', 
                PostalCode = 'L3R 3L5',
                Country = 'CA', 
                OperatingHoursId=opthours.get(0).Id, 
                Name='TerritoryForCaseTestScenarios1'
                
        ); srvTers.add(stP);
		insert srvTers[0];
        
        ServiceTerritory stC = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'Toronto', 
            State = 'ON', 
            PostalCode = 'L3R 3L5',
            Country = 'CA', 
            OperatingHoursId=opthours.get(0).Id, 
            Name='TerritoryForCaseTestScenarios',
            ParentTerritoryId = srvTers[0].Id
        ); srvTers.add(stC);
        insert srvTers[1];
    }
    
    /**
     * @function: Create site surveys associated to accounts
     **/
    public static void crtApprovedSiteSurvey(Integer nofSS){
        for(Integer a=0;a<accounts.size();a++){
            for(Integer i=0;i<nofSS;i++){
                srvSS.add(new Site_Survey__c(
                    Account__c=accounts.get(a).Id,
                    Survey_Date__c = System.today(),
                    Status__c = 'Approved'
                ));
            }
        }
        insert srvSS;
    }

    /**
     * @function: Create site surveys associated to accounts
     **/
    public static void crtSiteSurvey(Integer nofSS){
        for(Integer a=0;a<accounts.size();a++){
            for(Integer i=0;i<nofSS;i++){
                srvSS.add(new Site_Survey__c(
                    Account__c=accounts.get(a).Id, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                ));
            }
        }
        insert srvSS;
    }
    
    /**
     * @function: Create products
     **/
    public static void crtProdWithPE(Integer nofp){
        Id pBook = Test.getStandardPricebookId();
        
        for(Integer i=0; i<nofp; i++){
            products.add(new Product2(
                    Name=(i==1) ? 'VMI Vendor Managed Inventory Service' : 'TestProduct'+ i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family=(i==1) ? 'Pest Control' : 'Hygiene',
                    ExternalId__c = '3-55-7-02-1' + i,
                    ProductCode = '3-55-' + i
            ));
        }
        
        insert products;
        
        for(Integer i=0;i<nofp;i++){
        	pEntries.add(new PricebookEntry(
            	Pricebook2Id=pBook, 
                Product2Id=products.get(i).Id, 
                UnitPrice=1.0, 
                IsActive=TRUE
            ));
        }
        insert pEntries;
    }
    
    /**
     * @function: Create Work Order Line Items
     **/
    public static void crtWrkOrdersLines(Integer nofw, Integer nofwl){
        Id pBook = Test.getStandardPricebookId();
        List<String> lofBU = new List<String>{'Hygiene','Life Safety','Pest Control','Chemical'};
        List<String> tofSRV = new List<String>{'Installation','Delivery','Service','Replace','Remove','DeInstall'};
        
        Test.startTest();
        
        for(Integer i=0;i<nofw;i++){
            Integer acctRdm = Integer.valueof((Math.random() * accounts.size()));
            Integer lofBRdm = Integer.valueof((Math.random() * lofBU.size()));
            wrkOrders.add(new WorkOrder(
                AccountId=accounts.get(acctRdm).Id,
                StartDate=System.today(), 
                Line_of_Business__c=lofBU.get(lofBRdm), 
                Pricebook2Id=pBook, 
                Suite_Number__c='1', 
                Street='Street', 
                City = 'City', 
                State = 'State', 
                PostalCode = 'PostalCode',
                Country = 'Country',
                ServiceTerritoryId = srvTers.get(1).Id
            ));
        }
        insert wrkOrders;
        
        for(Integer i=0;i<nofw;i++){
            for(Integer j=0;j<pEntries.size();j++){
                Integer SVRdm = Integer.valueof((Math.random() * tofSRV.size()));
                wrkOrdLines.add(new WorkOrderLineItem(
                    WorkOrderId=wrkOrders.get(i).Id, 
                    Type_of_Service__c=tofSRV.get(SVRdm),
                    QUantity=1,
                    PricebookEntryId=pEntries.get(j).Id
        		));
            }
        }
        insert wrkOrdLines;
        
        Test.stopTest();
    }
    
	/**
	 * Create Service Appointments
	 **/
    public static void crtServiceAppts(Integer nofsa){
        for(Integer j=0;j<wrkOrders.size();j++){
            for(Integer i=0;i<nofsa;i++){
                lSAs.add(new ServiceAppointment(
                    ParentRecordId=wrkOrders.get(j).Id, 
                    DueDate=System.today().addDays(2), 
                    EarliestStartTime=System.today(), 
                    Status='New', 
                    ServiceTerritoryId=wrkOrders.get(j).ServiceTerritoryId,
                    SchedStartTime = System.today(),
                    SchedEndTime = System.today().addDays(1)
                ));
            }
        }
        insert lSAs;
    }
    
    /**
     * @function: Create Service Resources
     **/
    public static void crtServiceResource(Integer nofsr){
        for(Integer i=0;i<nofsr;i++){
            Integer usrRdm = Integer.valueof((Math.random() * lUsers.size()));
            lSRs.add(new ServiceResource(
                Name='TestResource', 
                RelatedRecordId=lUsers.get(usrRdm).Id,
                ResourceType='T', 
                isActive=TRUE
            ));
        }
        insert lSRs;
    }
    
    /**
     * @function: Create Service Territory Team members
     **/
    public static void crtServiceTerMem(Integer nofsm){
        for(Integer i=0;i<nofsm;i++){
            Integer sRdm = Integer.valueof((Math.random() * lSRs.size()));
            lSTMs.add(new ServiceTerritoryMember(
                OperatingHoursId=opthours.get(2).Id, 
                ServiceResourceId=lSRs.get(sRdm).Id, 
                ServiceTerritoryId=srvTers.get(1).Id, 
                EffectiveStartDate=System.today(),
                Street='Street', 
                City = 'City', 
                State = 'State', 
                PostalCode = 'PostalCode',
                Country = 'Country',
                TerritoryType='P'
            ));
        }
        insert lSTMs;
    }
    
    /**
     * @function: Create VMI Products
     **/
    public static void crtVMIProducts(Integer nofv){
        nofv = 1; //Currently it creates only 1 VMI product
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        List<Product2> lProdVMI = new List<Product2>();
        lProdVMI.add(new Product2(Name = fssetting.VMI_Product_Name__c,
                                  Allowable_Frequencies__c='One-Time;Monthly;Weekly',
                                  IsActive=TRUE,Available_As_Related_Product__c=TRUE,
                                  Family='Pest Control',ExternalId__c='test',VMI_Product__c=true));
        insert lProdVMI;
        
        for(Integer i=0;i<accounts.size();i++){
            for(Integer j=0;j<nofv;j++){
                Integer pdRdm = Integer.valueof((Math.random() * lProdVMI.size()));
                vmiprods.add(new VMI_Product__c(
                    Account__c = accounts.get(i).Id,
                    Product__c = lProdVMI.get(pdRdm).Id,
                    Quantity_Per_Visit__c = 10
                ));
            }
        }
        insert vmiprods;
    }
    
    /**
     * @function: Create assigned resource
     **/
    public static void crtAssignedResource(){
        for(Integer i=0;i<lSAs.size();i++){
            Integer srRdm = Integer.valueof((Math.random() * lSRs.size()));
            lARs.add(new AssignedResource(
                ServiceAppointmentId = lSAs.get(i).Id,
                ServiceResourceId = lSRs.get(srRdm).Id
        	));
        }
        insert lARs;
    }
    
    /**
     * @function: Create the Time Zone Setting
     **/
    public static void crtTimeZoneSettings() {
        timeZoneSetting.Name = 'ON';
        timeZoneSetting.Province_Territory_Code__c = 'ON';
        timeZoneSetting.TimeZone__c = 'America/New_York';
        insert timeZoneSetting;
    }

    /**
     * @function: Create the Field Service Settings custom setting
     **/
    public static void crtFieldServiceSetting() {
        Group testGroup = new Group(Name='TestGroup', Type='Queue');
        insert testGroup;
        
        QueueSObject mappingObject = new QueueSobject(QueueId = testGroup.Id, SObjectType = 'Case');
        
        System.runAs(new User(Id = UserInfo.getUserId())) {
        	insert mappingObject;
        }

        Id devRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Data Review').getRecordTypeId();
        Id newRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('New Conversion Opportunity').getRecordTypeId();
        
        //todo get this sorted out - the record type doesn't match the variable name
        // Id frequencyChangeRecordType = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Additional Opportunities - Penetration').getRecordTypeId();
        Id frequencyChangeRecordType = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Additional Subcategories - Penetration').getRecordTypeId();

        Id freqChangeRecordType = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('Changes to an Existing Service Subcategory').getRecordTypeId();
        Id prospectAcctRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Prospect').getRecordTypeId();
        Id billToAcctRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Bill To').getRecordTypeId();
        Id ShipToAcctRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Ship To').getRecordTypeId();

        String sysAdminProfileId = [SELECT Id FROM Profile WHERE Name ='System Administrator' LIMIT 1].Id;
        String randomProfileId = [SELECT Id, UserType FROM Profile WHERE Id !=:sysAdminProfileId AND UserType != 'PowerCustomerSuccess' LIMIT 1].Id;
        String customerSuccessProfileId = [SELECT Id FROM Profile WHERE Id!=:sysAdminProfileId AND Id!=:randomProfileId LIMIT 1].Id;

        fssetting = Field_Service_Settings__c.getOrgDefaults();
        fssetting.Opportunity_RecordType_New__c = newRecordTypeId;
        fssetting.Opportunity_Case_Creation_Stage_Name__c = 'Signed Awaiting Survey Approval';
        fssetting.Opportunity_Case_Rejection_Stage_Name__c = 'Closed - Site Survey Rejected';
        fssetting.Internal_Data_Review_Case_Record_Type_ID__c = devRecordTypeId;
        fssetting.Case_Type_for_Internal_Data_Review__c = 'Site Survey';
        fssetting.Site_Survey_Case_Rejected_Status__c = 'Rejected';
        fssetting.Opportunity_To_Order_Creation_Stage_Name__c = 'Signed';
        fssetting.Order_Start__c = 1;
        fssetting.Non_Consumables_Period__c = 1;
        fssetting.Pest_Site_Survey_Approval_Queue__c = testGroup.Id;
        fssetting.Hygiene_Site_Survey_Approval_Queue__c = testGroup.Id;
        fssetting.Default_Order_Price_Book_ID__c = Test.getStandardPricebookId();
        fssetting.Internal_Data_Review_Case_Owner__c = testGroup.Id;
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Site_Survey_Reviewed_Status__c = 'Approved';
        fssetting.System_Administrator_Profile_Id__c = sysAdminProfileId;
        fssetting.Customer_Service_Profile_Id__c = customerSuccessProfileId;
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Service_Start__c=0;
        fssetting.Opportunity_RecordType_Additional__c=frequencyChangeRecordType;
        fssetting.Opportunity_RecordType_Frequency_Change__c = freqChangeRecordType;
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Hygiene_LOB__c = 'Hygiene';
        fssetting.Chemical_LOB__c = 'Chemical';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';

        fssetting.Inside_Sales_Team__c = testGroup.Id;
        fssetting.Billing_Team__c = testGroup.Id;
        fssetting.Ticket_Type_for_New_Lead__c = 'New Lead';
        fssetting.Ticket_Type_for_Site_Survey__c = 'Site Survey';
        fssetting.CS_Pest_Queue__c = testGroup.Id;
        fssetting.CS_Chemical_Queue__c = testGroup.Id;
        fssetting.CS_Hygiene_Queue__c = testGroup.Id;
        fssetting.Inside_Sales_Queue__c = testGroup.Id;
        fssetting.Customer_Success_Queue__c = testGroup.Id;
        fssetting.Customer_Service_Queue__c = testGroup.Id;
        fssetting.Billing_Queue__c = testGroup.Id;
        fssetting.CS_Orders__c = testGroup.Id;
        fssetting.CS_Data_Cleanup__c = testGroup.Id;
        fssetting.App_Support_Team_Queue__c = testGroup.Id;
        fssetting.Finance_Master_Data_Queue__c = testGroup.Id;
        
        fssetting.Opportunity_Frequency_Change_Stage_Name__c = 'Signed - Submit for Frequency Change';
        fssetting.Item_Type_for_Consumables__c = 'Consumables';
        fssetting.Invoice_Information_Case_RecordTypeId__c = '012f1000000PUJKAA4';

        upsert fssetting;
    }

    public static void crtOpportunities(Integer nofOpp, Account acct, Id contactId) {
        crtOpportunities(nofOpp, acct, contactId, true);
    }

    /**
     * @function: Create Opportities
     **/
    public static void crtOpportunities(Integer nofOpp, Account acct, Id contactId, Boolean addLineItems) {
		Id newRecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByName().get('New Conversion Opportunity').getRecordTypeId();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};

        for(Integer i = 0; i < nofOpp; i++) {
            Opportunity opp = new Opportunity();
            opp.Name = acct.Name + ' Opportunity ' + i;
            opp.AccountId = acct.Id;
            opp.StageName = 'Presentation';
            opp.CloseDate = System.today().addDays(30);
            opp.Amount = 0.0;
            opp.Type = 'Retention';
            opp.Opportunity_Type__c = 'Consumables';
            opp.LeadSource = 'Call In';
            opp.Site_Survey__c = srvSS[0].Id;
            opp.RecordTypeId = newRecordTypeId;

            opportunities.add(opp);
        }

        insert opportunities;

        List<OpportunityContactRole> contactRoles = new List<OpportunityContactRole>();
        for(Opportunity opp : opportunities) {
            OpportunityContactRole oppRole = new OpportunityContactRole();
            oppRole.OpportunityId = opp.Id;
            oppRole.ContactId = contactId;
            oppRole.Role = 'Decision Maker';
            oppRole.isPrimary = TRUE;

            contactRoles.add(oppRole);
        }

        insert contactRoles;

        if(addLineItems){
            List<OpportunityLineItem> oppLineItems = new List<OpportunityLineItem>();
            Integer i;
            System.debug('frequencies: ' + frequencies);
            for(Opportunity opp : opportunities) {
                i = 0;
                for(PriceBookEntry pbEntry : pEntries) {
                    OpportunityLineItem oppLineItem = new OpportunityLineItem();
                    oppLineItem.Product2Id = pbEntry.Id;
                    oppLineItem.Service_Frequency__c = frequencies.get(i);
                    oppLineItem.UnitPrice = 1.0;
                    oppLineItem.Service_Price_Per_Unit__c = 1.0;
                    oppLineItem.Quantity = 1;
                    oppLineItem.OpportunityId = opp.Id;
                    oppLineItem.SurveyAssetCountChecker__c = 1;
                    i++;

                    oppLineItems.add(oppLineItem);
                }
            }

            insert oppLineItems;
        }

    }

}