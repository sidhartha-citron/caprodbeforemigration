/**
 * @description Test class for CPQ2_ScreenController
 * <p/>
 * Created by timothychiang on 2020-03-27.
 */
@IsTest
public with sharing class CPQ2_ScreenControllerTest {
    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    // HELPER METHODS
    static void setupHelper() {
    
        Id pBook = Test.getStandardPricebookId();

        List<WorkType> workTypesToInsert = new List<WorkType>();
        WorkType workType1 = new WorkType(
            Name='TestWorkType1',
            DurationType='Minutes',
            EstimatedDuration=1.7
        );

        WorkType workType2 = new WorkType(
            Name='TestWorkType2',
            DurationType='Minutes',
            EstimatedDuration=1
        );

        WorkType workType3 = new WorkType(
            Name='TestWorkType3',
            DurationType='Minutes',
            EstimatedDuration=0.11
        );
        workTypesToInsert.add(workType1);
        workTypesToInsert.add(workType2);
        workTypesToInsert.add(workType3);
        insert workTypesToInsert;

        Product2 product1 = new Product2(
            Name='TestProduct1',
            Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
            IsActive=true,
            Family='Hygiene',
            ExternalID__c = 'TestProduct1',
            CPQ_Price_Model__c = 'Hygiene Pricing Model',
            Item_Type__c = 'Service',
            Service_Work_Type__c = workType1.Id,
            CPQ_Cost__c = 0.93,
            CPQ_Amortization__c = 4,
            CPQ_Capital_Cost__c = 0
        );

        Product2 product2 = new Product2(
            Name='TestProduct2',
            Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
            IsActive=true,
            Family='Hygiene',
            Item_Type__c = 'Service',
            ExternalID__c = 'TestProduct2',
            CPQ_Price_Model__c = 'Hygiene Pricing Model',
            Service_Work_Type__c = workType2.Id,
            CPQ_Cost__c =  57.33,
            CPQ_Amortization__c = 4,
            CPQ_Capital_Cost__c = 0
        );

        Product2 product3 = new Product2(
            Name='TestProduct3',
            Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
            IsActive=true,
            Family='Hygiene',
            ExternalID__c = 'TestProduct3',
            Item_Type__c = 'Service',
            CPQ_Price_Model__c = 'Hygiene Pricing Model',
            Service_Work_Type__c = workType3.Id,
            CPQ_Cost__c = 0.97,
            CPQ_Amortization__c = 4,
            CPQ_Capital_Cost__c = 0
        );

        TestDataFactory.products.add(product1);
        TestDataFactory.products.add(product2);
        TestDataFactory.products.add(product3);
        insert TestDataFactory.products;

        PricebookEntry pbe1 = new PricebookEntry(
            Pricebook2Id = pBook,
            Product2Id = product1.Id,
            UnitPrice = 1.0,
            IsActive = true
        );

        PricebookEntry pbe2 = new PricebookEntry(
            Pricebook2Id = pBook,
            Product2Id = product2.Id,
            UnitPrice = 1.0,
            IsActive = true
        );

        PricebookEntry pbe3 = new PricebookEntry(
            Pricebook2Id = pBook,
            Product2Id = product3.Id,
            UnitPrice = 1.0,
            IsActive = true
        );
        TestDataFactory.pEntries.add(pbe1);
        TestDataFactory.pEntries.add(pbe2);
        TestDataFactory.pEntries.add(pbe3);
        insert TestDataFactory.pEntries;

        TestDataFactory.crtCPQSettings();
        TestDataFactory.crtFieldSettings();
        //TestDataFactory.crtFieldServiceSetting();

        TestDataFactory.crtAcctContact(1, 1);
        TestDataFactory.accounts[0].RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Bill To').getRecordTypeId();
		update TestDataFactory.accounts[0];
        TestDataFactory.crtSiteSurvey(1);
		TestDataFactory.crtOpportunities(1, TestDataFactory.accounts[0], TestDataFactory.contacts[0].Id, false);

		List<OpportunityLineItem> oppLineItems = new List<OpportunityLineItem>();

		OpportunityLineItem oppLineItem1 = new OpportunityLineItem();
		oppLineItem1.Product2Id = pbe1.Id;
		oppLineItem1.Service_Frequency__c = 'Monthly';
		oppLineItem1.UnitPrice = 12.0;
		oppLineItem1.Service_Price_Per_Unit__c = 11.0;
		oppLineItem1.Quantity = 10;
		oppLineItem1.OpportunityId = TestDataFactory.opportunities[0].Id;
		oppLineItem1.SurveyAssetCountChecker__c = 1;

		OpportunityLineItem oppLineItem2 = new OpportunityLineItem();
		oppLineItem2.Product2Id = pbe2.Id;
		oppLineItem2.Service_Frequency__c = 'Weekly';
		oppLineItem2.UnitPrice = 12.0;
		oppLineItem2.Service_Price_Per_Unit__c = 150.0;
		oppLineItem2.Quantity = 10;
		oppLineItem2.OpportunityId = TestDataFactory.opportunities[0].Id;
		oppLineItem2.SurveyAssetCountChecker__c = 1;

		OpportunityLineItem oppLineItem3 = new OpportunityLineItem();
		oppLineItem3.Product2Id = pbe3.Id;
		oppLineItem3.Service_Frequency__c = 'Annually';
		oppLineItem3.UnitPrice = 12.0;
		oppLineItem3.Service_Price_Per_Unit__c = 3.0;
		oppLineItem3.Quantity = 10;
		oppLineItem3.OpportunityId = TestDataFactory.opportunities[0].Id;
		oppLineItem3.SurveyAssetCountChecker__c = 1;

		oppLineItems.add(oppLineItem1);
		oppLineItems.add(oppLineItem2);
		oppLineItems.add(oppLineItem3);
        insert oppLineItems;
        
        Quote quote = new Quote(
            Name = 'Quote',
            OpportunityId = TestDataFactory.opportunities[0].Id,
            PriceBook2Id = pBook
        );
        insert quote;

        List<Order> orders = (List<Order>) TestUtils.createSObjectList(new Order(
            AccountId = TestDataFactory.accounts[0].Id,
            CPQ2_Include_in_Price_Model__c = True
        ), 2);

        // I had to do this because there is a duplicate Id exception being thrown on OrderTriggerHandler Line 635. There seems to be a bug
        // on this.
        insert orders[0];
        insert orders[1];
    }
    
    public static void createOrderItems() {
        List<PricebookEntry> priceBookEntries = [SELECT Id, Product2.Name FROM PricebookEntry];

		PricebookEntry pbe1;
		PricebookEntry pbe2;
		PricebookEntry pbe3;

		for(PricebookEntry priceBookEntry : priceBookEntries) {
			if (priceBookEntry.Product2.Name == 'TestProduct1') {
				pbe1 = priceBookEntry;
			}
			else if (priceBookEntry.Product2.Name == 'TestProduct2') {
				pbe2 = priceBookEntry;
			}
			else if (priceBookEntry.Product2.Name == 'TestProduct3') {
				pbe3 = priceBookEntry;
			}
		}
        
        List<Order> orders = [SELECT Id FROM Order];
        
        List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 6);

        List<OrderItem> orderItemsBatch1 = new List<OrderItem>();

        // Order Products for Order 1
        orderItems[0].Product2Id = pbe1.Id;
        orderItems[0].Frequency__c = 'Monthly';
        orderItems[0].CPQ2_Number_Of_Visits_Per_Year__c = 12;
        orderItems[0].UnitPrice = 11.0;
        orderItems[0].Service_Price_Per_Unit__c = 9.0;
        orderItems[0].Quantity = 12;
        orderItems[0].OrderId = orders[0].Id;
        orderItems[0].SurveyAssetCountChecker__c = 1;
        orderItemsBatch1.add(orderItems[0]);

		orderItems[1].Product2Id = pbe2.Id;
		orderItems[1].Frequency__c = 'Annually';
		orderItems[1].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[1].UnitPrice = 40;
		orderItems[1].Service_Price_Per_Unit__c = 38.0;
		orderItems[1].Quantity = 40;
		orderItems[1].OrderId = orders[0].Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;
		orderItemsBatch1.add(orderItems[1]);

		// Order Products for Order 2
		orderItems[2].Product2Id = pbe1.Id;
		orderItems[2].Frequency__c = 'Monthly';
		orderItems[2].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[2].UnitPrice = 11;
		orderItems[2].Service_Price_Per_Unit__c = 8.0;
		orderItems[2].Quantity = 12;
		orderItems[2].OrderId = orders[1].Id;
		orderItems[2].SurveyAssetCountChecker__c = 1;
		orderItemsBatch1.add(orderItems[2]);

		orderItems[3].Product2Id = pbe2.Id;
		orderItems[3].Frequency__c = 'Annually';
		orderItems[3].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[3].UnitPrice = 40.0;
		orderItems[3].Service_Price_Per_Unit__c =33.0;
		orderItems[3].Quantity = 12;
		orderItems[3].OrderId = orders[1].Id;
		orderItems[3].SurveyAssetCountChecker__c = 1;
		orderItemsBatch1.add(orderItems[3]);

		orderItems[4].Product2Id = pbe3.Id;
		orderItems[4].Frequency__c = 'Annually';
		orderItems[4].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[4].UnitPrice = 3;
		orderItems[4].Service_Price_Per_Unit__c = 2.0;
		orderItems[4].Quantity = 5;
		orderItems[4].OrderId = orders[1].Id;
		orderItems[4].SurveyAssetCountChecker__c = 1;
		orderItemsBatch1.add(orderItems[4]);
		insert orderItemsBatch1;        
    }

    @isTest
    static void CPQ2_OpportunityWrapperControllerTest() {
        Id oppId = [SELECT Id FROM Opportunity Limit 1][0].Id;
        Id quoteId = [SELECT Id FROM Quote Limit 1][0].Id;
        
        Test.startTest();

        CPQ2_OpportunityWrapperController.getDestinationId(String.valueOf(oppId));
        CPQ2_OpportunityWrapperController.getDestinationId(String.valueOf(quoteId));        

        Test.stopTest();
    }

    @isTest
    static void CPQ2_ExistingServicesControllerTest() {
        Test.startTest();
        
        createOrderItems();
        Id accountId = [SELECT Id FROM Account Limit 1][0].Id;
        CPQ2_ExistingServicesController.getExistingServices(accountId);
        
        Test.stopTest();
    }

    @isTest
    static void CPQ2_SearchProductControllerTest() {
        Test.startTest();
        
        createOrderItems();
        
        String searchString = 'Test';
        String priceBook = Test.getStandardPricebookId();
        String typeFilter = 'All';
        String categoryFilter = 'All';
        String lobFilter = 'All';
        String accountId = [SELECT Id FROM Account Limit 1][0].Id;
        List<Opportunity> opps = [SELECT Id FROM Opportunity];        
        List<ProductService.ProductWrapper> results = CPQ2_SearchProductController.getResults(searchString, priceBook, typeFilter, categoryFilter, lobFilter, accountId, opps[0].Id);
        
        Test.stopTest();
    }

    @isTest
    static void getInitDataOpportunityTest() {
        Test.startTest();
        
        //createOrderItems();
        List<Opportunity> opps = [SELECT Id FROM Opportunity];

        CPQ2_ScreenController.InitData initData = CPQ2_ScreenController.getInitData(opps[0].Id);

        //System.assertEquals(4374,initData.entity.accountItem.totalAnnualRevenue);
		//System.assertEquals(3627.9335,initData.entity.accountItem.totalAnnualCost);
		//System.assertEquals(12,initData.entity.accountItem.highestFrequency);

        Test.stopTest();
    }

    @isTest
    static void getInitDataOrderTest() {
        Test.startTest();
        
        createOrderItems();
        List<Order> orders = [SELECT Id FROM Order];

        CPQ2_ScreenController.InitData initData = CPQ2_ScreenController.getInitData(orders[0].Id);

        //System.assertEquals(4374,initData.entity.accountItem.totalAnnualRevenue);
		//System.assertEquals(3627.9335,initData.entity.accountItem.totalAnnualCost);
		//System.assertEquals(12,initData.entity.accountItem.highestFrequency);

        initData = CPQ2_ScreenController.getInitData(Null);
        System.assertEquals(initData, Null);
        Test.stopTest();
    }

    @isTest
    static void getNewLineItemTest() {
        Test.startTest();
        
		createOrderItems();

        List<Order> orders = [SELECt Id FROM Order];
        List<PricebookEntry> priceBookEntries = [SELECT Id, Product2Id, Product2.Name FROM PricebookEntry];
        List<Account> accounts = [SELECT Id FROM Account];
        Id priceBookId = Test.getStandardPricebookId();

        CPQ2_Wrapper.LineItem lineItem = CPQ2_ScreenController.getNewLineItem(priceBookEntries[0].Product2Id, priceBookId, orders[0].Id, accounts[0].Id, 1)[0];

        System.assertNotEquals(lineItem, Null);
        System.assertEquals(lineItem.productId, priceBookEntries[0].Product2Id);
       
        Test.stopTest();
    }

    @isTest
    static void getFrequencyMapTest() {
        Test.startTest();
        Map<String, Frequency__c> frequency = CPQ2_ScreenController.getFrequencyMap();
        Test.stopTest();
    }

    @isTest
    static void saveChangesTest() {
        Test.startTest();
        
        createOrderItems();

        List<Order> orders = [SELECT Id FROM Order];
        CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(orders[0].Id);

        List<CPQ2_Wrapper.DmlResult> dmlResults = CPQ2_ScreenController.saveChanges(System.JSON.serialize(entity.lineItems));

        for(CPQ2_Wrapper.DmlResult dmlResult : dmlResults) {
            System.assertEquals(dmlResult.isSuccess, True);
        }
        
        Test.stopTest();
    }

    @isTest
    static void calculateShipToScoreTest() {
        Test.startTest();

        Id oppId = [SELECT Id FROM Opportunity Limit 1][0].Id;
        
        CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(oppId);
        for(CPQ2_Wrapper.LineItem li: entity.lineItems){
            li.isDeleted = false;
        }

        CPQ2_Wrapper.CpqEntity entityResult = CPQ2_ScreenController.calculateShipToScore(System.JSON.serialize(entity));        
        Test.stopTest();
    }

    @isTest
    static void validateOrderTest() {
        Test.startTest();
        
        createOrderItems();

        Id orderId = [SELECT Id FROM Order Limit 1][0].Id;
        CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(orderId);

        CPQ2_OrderValidationUtil.OrderValidationResult result = CPQ2_ScreenController.validateOrder(System.JSON.serialize(entity));        
        Test.stopTest();
    }
}