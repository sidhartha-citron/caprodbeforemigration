@isTest 
private class OrderandServicesControllerTest {
    static testMethod void testGetView() {
        Order o = [SELECT Id, AccountId FROM Order LIMIT 1];
        OrderandServicesController.ViewData v = OrderandServicesController.loadViewData(o.AccountId);

         system.assertNotEquals(0, v.roomList.size());
    }

    static testMethod void testInsertCase() {
        Test.startTest();
        Order o = [SELECT Id, AccountId FROM Order LIMIT 1];

        Case theCase = new Case();
        theCase.AccountId = o.AccountId;
        theCase.Type = 'Pest Control';
        theCase.Subject = 'test case';
        theCase.OwnerId = UserInfo.getUserId();
        insert theCase;


        List<Case> listCase = [SELECT Id FROM CASE];
        System.debug('~~ Cases List ' + listCase); 
        system.assertEquals(1, listCase.size());
        Test.stopTest();
    }

    static testMethod void testInsertCaseNegative() {
        Test.startTest();
        Test.setReadOnlyApplicationMode(true);

        Order o = [SELECT Id, AccountId FROM Order LIMIT 1];

        Case c = new Case(AccountId = o.AccountId);
        try{
            OrderandServicesController.saveTicket(c);
        } catch(Exception e){

        }
        List<Case> listCase = [SELECT Id FROM CASE];
        system.assertEquals(0, listCase.size());
        Test.stopTest();
    }

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

        Group testGroup = new Group(Name='Customer_Success', type='Queue');
        insert testGroup;

        QueueSObject mappingObject = new QueueSobject(QueueId = testGroup.Id, SObjectType = 'Case');
        
        System.runAs(new User(Id = UserInfo.getUserId())) {
        	insert mappingObject;
        }
        
        TestDataFactory.crtCPQSettings();

        Field_Service_Settings__c dataSets = new Field_Service_Settings__c(Operating_Hours_Type_Account__c = 'Account Operating Hours',
                                                                            Service_Start__c = 4, 
                                                                            LocationsPerPage__c = 10, 
                                                                            Customer_Success_Queue__c = testGroup.Id,
                                                                            Order_Active_Stage__c = 'Activated');
        insert dataSets;
        
        TestDataFactory.crtBillToAcctContact(4,1);
        accounts = TestDataFactory.accounts;
        
        System.debug(accounts);
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
        
        for(Integer i=1; i<3; i++) {
            surveyLocations.add(
                new Survey_Location__c(
                    Site_Survey__c=siteSurveys.get(i-1).Id, 
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
        
        Test.startTest();
        Opportunity op = new Opportunity(
                Name=accounts.get(1).Name+' Opportunity',
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
        
        Order o = new Order(
            AccountId=accounts.get(1).Id, 
            Status='Draft', 
            EffectiveDate=System.today(), 
            Pricebook2Id=pBook,
            Site_Survey__c=accounts.get(1).Site_Survey__c,
            Parent_Order__c = null
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
                    HasSurveyAssets__c=FALSE,
                    Active__c = true
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
                OrderId=o.Id,
                Active__c = true
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
                    Service_Frequency__c=orderItems.get(i).Frequency__c,
                    Survey_Location__c=surveyLocations.get(0).Id
                )
            );
            System.debug('SL *** ' + surveyLocations.get(0).Id);
        }       
        Orderitem orderItem=orderItems.get(0);
        orderItem.Related_Product__c=products.get(0).Id;
        update orderItems;
        
        surveyAssetLocations.get(0).Related_Product__c=products.get(0).Id;
        insert surveyAssetLocations;
        
        Test.stopTest();
        
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


        dataSets.Order_Active_Stage__c = 'Draft';
        update dataSets;
    }
}