@IsTest
public class TestSurveyAssetAllocationController {
    @TestSetup static void setup() {
        Date todaysDate = System.today();
        List<Account> accounts = new List<Account>();
        List<Site_Survey__c> siteSurveys = new List<Site_Survey__c>();
        List<Survey_Location__c> surveyLocations = new List<Survey_Location__c>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        List<Order_Item_Location__c> orderItemLocations = new List<Order_Item_Location__c>();
        List<OpportunityLineItem> oppItems = new List<OpportunityLineItem>();
        List<OrderItem> orderItems = new List<OrderItem>();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
            
        TestDataFactory.crtCPQSettings();
            
        Field_Service_Settings__c dataSets = new Field_Service_Settings__c(Service_Start__c = 4, LocationsPerPage__c = 10);
        insert dataSets;
        
        /*
        for(Integer i=1; i<4; i++) {
            accounts.add(
                new Account(
                    Name='TestAccount'+i, 
                    AccPac_Account__c='1234-'+i, 
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
                )
            );
        }
        insert accounts;
		*/
        
        TestDataFactory.crtBillToAcctContact(4, 1); 
        accounts = TestDataFactory.accounts;
        /*Integer n = 1;
        For(Account acct: TestDataFactory.accounts){ 
        	acct.Name = 'TestAccount'+n;
            n++; 
            accounts.add(acct);
        }
        update accounts; */
        
        for(Integer i=0; i<4; i++) {
            siteSurveys.add(
                new Site_Survey__c(
                    Account__c=accounts.get(i).Id, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                )
            );
        }
        insert siteSurveys; //surveyLocations
        
        for(Integer i=0; i<4; i++) {
            surveyLocations.add(
                new Survey_Location__c(
                    Site_Survey__c=siteSurveys.get(i).Id, 
                    Building__c = 'Building'+i,
                    Floor__c = 'Floor'+i, 
                    Location_Type__c='Washroom', 
                    Location_SubType__c='Unisex',
                    Name='Location'+i
                )
            );
        }
        insert surveyLocations; 
        
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
        
        //Pricebook2 pBook = new Pricebook2(Name='TestPricebook', IsActive=TRUE);
        Id pBook = Test.getStandardPricebookId();
        
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
            
        Opportunity op = new Opportunity(
                Name= 'Opportunity Test',
                AccountId=accounts.get(1).Id,
                StageName='Presentation', 
                CloseDate=System.today().addDays(30),
                Amount=0.0, 
                Type='Retention', 
                Opportunity_Type__c='Consumables', 
                LeadSource='Call In', 
                Pricebook2Id=pBook, 
                Site_Survey__c=accounts.get(1).Site_Survey__c
        ); 
        insert op;

        OpportunityContactRole oppRole = new OpportunityContactRole(
            OpportunityId=op.Id,
            ContactId=TestDataFactory.contacts[1].Id, 
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
                    Quantity=i+2, 
                    OpportunityId=op.Id
                )
            );
        } 
        
        oppItems.add(
            new OpportunityLineItem(
                Product2Id=products.get(2).Id,  
                Service_Frequency__c=frequencies.get(0), 
                UnitPrice=1.0, 
                Purchase_Price__c=1.0, 
                Quantity=1, 
                OpportunityId=op.Id
            )
        );
        
        insert oppItems; //surveyAssetLocations
        
        for(Integer i=0; i<2; i++) {
            oppItems.get(i).SurveyAssetCountChecker__c=1;
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=op.Id,  
                    Originating_Record_ID__c=oppItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=op.Site_Survey__c, 
                    Service_Frequency__c=oppItems.get(i).Service_Frequency__c
                )
            );
        }
        OpportunityLineItem oppItem = oppItems.get(0);
        oppItem.Related_Product__c=products.get(0).Id;
        update oppItems;
        surveyAssetLocations.get(0).Survey_Location__c=surveyLocations.get(0).Id;
        surveyAssetLocations.get(0).Related_Product__c=surveyAssetLocations.get(0).Product__c;
        insert surveyAssetLocations;
        surveyAssetLocations.clear();
        
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
                    Frequency__c=frequencies.get(i), 
                    UnitPrice=1.0, 
                    Service_Price_Per_Unit__c=1.0, 
                    Quantity=1, 
                    OrderId=o.Id, 
                    HasSurveyAssets__c=FALSE
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
        
        for(Integer i=0; i<2; i++) {
            orderItems.get(i).HasSurveyAssets__c=TRUE;
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Originating_Parent_ID__c=o.Id,  
                    Originating_Record_ID__c=orderItems.get(i).Id, 
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=o.Site_Survey__c, 
                    Service_Frequency__c=orderItems.get(i).Frequency__c
                )
            );
        }       
        Orderitem orderItem=orderItems.get(0);
        orderItem.Related_Product__c=products.get(0).Id;
        update orderItems;
        surveyAssetLocations.get(0).Survey_Location__c=surveyLocations.get(0).Id;
        surveyAssetLocations.get(0).Related_Product__c=products.get(0).Id;
        insert surveyAssetLocations;
        
        for(Integer i=0; i<2; i++) {
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
        Test.stopTest();
    }
    
    static testMethod void testInitSiteSurveyOpportunityNoSS(){
    	Test.startTest();
        
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];
        OpportunityLineItem oItem = [SELECT Id, Quantity, Purchase_Price__c FROM OpportunityLineItem WHERE OpportunityId=:op.Id AND Purchase_Price__c=NULL LIMIT 1].get(0);

        a.Site_Survey__c=null;
        update a;
        op.Site_Survey__c=null;
        update op;
        oItem.Quantity = oItem.Quantity+1;
        update oItem;
        SurveyAssetAllocationController.initSiteSurvey(op.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testInitSiteSurveyOpportunityWithSS(){
        Test.startTest();
        Opportunity op = [SELECT Id, Name, AccountId FROM Opportunity Limit 1];

        SurveyAssetAllocationController.initSiteSurvey(op.Id); 
        
        Test.stopTest();
    }
    
    static testMethod void testLoadDataOpportunityWithSS(){
        Test.startTest();
        Opportunity op = [SELECT Id, Name, AccountId, Site_Survey__c FROM Opportunity Limit 1];
        SurveyAssetAllocationController.loadViewData(op.Id, op.Site_Survey__c);
        Test.stopTest();
    }
    
    static testMethod void testInitSiteSurveyOrderNoSS(){
        Test.startTest();
        Order o = [SELECT Id, Account.Name, AccountId FROM Order LIMIT 1].get(0);
        
        o.Site_Survey__c=null;
        update o;
        SurveyAssetAllocationController.initSiteSurvey(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testInitSiteSurveyOrderWithSS(){
        Order o = [SELECT Id, Account.Name, AccountId FROM Order LIMIT 1].get(0);
        
        Test.startTest();
        
        SurveyAssetAllocationController.initSiteSurvey(o.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testLoadOrderWithSS(){
        Test.startTest();
        Order o = [SELECT Id, Account.Name, AccountId, Site_Survey__c FROM Order LIMIT 1].get(0);

        SurveyAssetAllocationController.loadViewData(o.Id, o.Site_Survey__c);
        
        Test.stopTest();
    }
    
    
    static testMethod void testDeleteSurveyLocation(){
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Site_Survey__c!=null Limit 1];

        Survey_Location__c newLocation = new Survey_Location__c(
            Site_Survey__c=a.Site_Survey__c, 
            Building__c = 'Building'+4,
            Floor__c = 'Floor'+4, 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'+4
        );
        insert newLocation;
        SurveyAssetAllocationController.deleteSurveyLocation(newLocation.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testDeleteSurveyLocationException(){
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account Limit 1];
        Survey_Location__c newLocation = new Survey_Location__c(
            Site_Survey__c=a.Site_Survey__c, 
            Building__c = 'Building'+4,
            Floor__c = 'Floor'+4, 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'+4
        );
        
        SurveyAssetAllocationController.deleteSurveyLocation(newLocation.Id);
        
        Test.stopTest();
    }
    
    static testMethod void testCloneAssetAllocationsNoAsset(){
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Site_Survey__c!=NULL Limit 1];
        Order o = [SELECT Id, Account.Name, AccountId, Site_Survey__c FROM Order LIMIT 1].get(0);

        Survey_Location__c newLocation = new Survey_Location__c(
            Site_Survey__c=a.Site_Survey__c, 
            Building__c = 'Building'+4,
            Floor__c = 'Floor'+4, 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'+4
        );
        insert newLocation;
        
        SurveyAssetAllocationController.cloneAssetAllocations(newLocation, o.Id, 3, 5, 1, 1, true, false);
        
        Test.stopTest();
    }
    
    static testMethod void testCloneAssetAllocationsWithAssetOpportunity(){
		Test.startTest();
        Opportunity op = [SELECT Id, Name, AccountId, Site_Survey__c FROM Opportunity Limit 1];
        Survey_Asset_Location__c surveyAssetLocation = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                                                        Quantity__c, Product__r.Name, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c 
                                                        FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c=:op.Id].get(0);
        Survey_Location__c location = [SELECT Id, Site_Survey__c, Building__c, Floor__c, Location_Type__c, Location_SubType__c, Name FROM Survey_Location__c 
                                       WHERE Site_Survey__c=:op.Site_Survey__c].get(0);
        
        
       
        SurveyAssetAllocationController.cloneAssetAllocations(location, op.Id, 3,3, 1, 1, true, false);
        
        Test.stopTest();
    }
    
    static testMethod void testCloneAssetAllocationsWithAssetOrder(){
        Test.startTest();
        Order o = [SELECT Id, Account.Name, AccountId, Site_Survey__c FROM Order LIMIT 1].get(0);
        Survey_Asset_Location__c surveyAssetLocation = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                                                        Quantity__c, Product__r.Name, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c 
                                                        FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c=:o.Id].get(0);
        Survey_Location__c location = [SELECT Id, Site_Survey__c, Building__c, Floor__c, Location_Type__c, Location_SubType__c, Name FROM Survey_Location__c 
                                       WHERE Site_Survey__c=:o.Site_Survey__c].get(0);
        
        
        
        SurveyAssetAllocationController.cloneAssetAllocations(location, o.Id, 3,3, 1, 1, true, false);
        
        Test.stopTest();
    }
    
    static testMethod void testGetRoomSubTypes(){
        Test.startTest();
        SurveyAssetAllocationController.getRoomSubTypes();
        Test.stopTest();
    }
    
    static testMethod void testGetJSONString(){
        Test.startTest();
        
        SurveyAssetAllocationController.getJSONString();
        
        Test.stopTest();
    }
    
    static testMethod void testSaveAllocationsOpportunity(){
        Test.startTest();
        Opportunity op = [SELECT Id, Name, AccountId, Site_Survey__c FROM Opportunity Limit 1];
        Survey_Asset_Location__c surveyAssetLocation = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                                                        Quantity__c, Product__r.Name, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c 
                                                        FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c=:op.Id].get(0);
        Survey_Location__c location = [SELECT Id, Site_Survey__c, Building__c, Floor__c, Location_Type__c, Location_SubType__c, Name FROM Survey_Location__c 
                                       WHERE Site_Survey__c=:op.Site_Survey__c].get(0);
        
        
        
        surveyAssetLocation.Survey_Location__c=null;
        update surveyAssetLocation;
        
        SurveyAssetAllocationController.SurveyProduct surveyProduct = SurveyAssetAllocationController.createSurveyProduct(true, surveyAssetLocation);
        
        String surveyProductString = JSON.serialize(surveyProduct);
        String locationString = JSON.serialize(location);
        
        SurveyAssetAllocationController.saveAllocations(surveyProductString,locationString,1,op.Id,false);
        
        Test.stopTest();
    }
    
    static testMethod void testSaveAllocationsOrder(){
        Test.startTest();
        Order o = [SELECT Id, Account.Name, AccountId, Site_Survey__c FROM Order LIMIT 1].get(0);
        Survey_Asset_Location__c surveyAssetLocation = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                                                        Quantity__c, Product__r.Name, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c 
                                                        FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c=:o.Id].get(0);
        Survey_Location__c location = [SELECT Id, Site_Survey__c, Building__c, Floor__c, Location_Type__c, Location_SubType__c, Name FROM Survey_Location__c 
                                       WHERE Site_Survey__c=:o.Site_Survey__c].get(0);
        
        
        
        surveyAssetLocation.Survey_Location__c=null;
        update surveyAssetLocation;
        SurveyAssetAllocationController.SurveyProduct surveyProduct = SurveyAssetAllocationController.createSurveyProduct(true, surveyAssetLocation);
        String surveyProductString = JSON.serialize(surveyProduct);
        String locationString = JSON.serialize(location);
        
        SurveyAssetAllocationController.saveAllocations(surveyProductString,locationString,1,o.Id,false);
        
        Test.stopTest();
    }
    
    static testMethod void testDeleteSurveyAssetLocationOpportunity(){
        Test.startTest();
        Opportunity op = [SELECT Id, Name, AccountId, Site_Survey__c FROM Opportunity Limit 1];
        Survey_Asset_Location__c surveyAssetLocation = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                                                        Quantity__c, Product__r.Name, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c 
                                                        FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c=:op.Id AND Survey_Location__c<>NULL].get(0);
        
        
        
        SurveyAssetAllocationController.deleteSurveyAssetLocation(surveyAssetLocation.Product__c, surveyAssetLocation.Survey_Location__c, op.Id, surveyAssetLocation.Related_Product__c, surveyAssetLocation.Service_Frequency__c, 1.0);
        
        Test.stopTest();
    }
    
    static testMethod void testDeleteSurveyAssetLocationOorder(){
        Test.startTest();
        Order o = [SELECT Id, Account.Name, AccountId, Site_Survey__c FROM Order LIMIT 1].get(0);
        Survey_Asset_Location__c surveyAssetLocation = [SELECT Id, Site_Survey__c, Survey_Location__c, Originating_Parent_ID__c, Originating_Record_ID__c,Product__c,
                                                        Quantity__c, Product__r.Name, Status__c, Related_Product__c, Related_Product__r.Name, Service_Frequency__c 
                                                        FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c=:o.Id AND Survey_Location__c<>NULL].get(0);
        
        
        
        SurveyAssetAllocationController.deleteSurveyAssetLocation(surveyAssetLocation.Product__c, surveyAssetLocation.Survey_Location__c, o.Id, surveyAssetLocation.Related_Product__c, surveyAssetLocation.Service_Frequency__c, 1.0);
        
        Test.stopTest();
    }
    
    @isTest
    static void testReQuerySurveyLocations() {
        Test.startTest();
        Account a = [SELECT Id, Site_Survey__c, Name FROM Account WHERE Site_Survey__c!=NULL Limit 1];

        SurveyAssetAllocationController.reQuerySurveyLocations(a.Site_Survey__c, 0, 'test', 'Floor__c', true);
        
        Test.stopTest();
    }
}