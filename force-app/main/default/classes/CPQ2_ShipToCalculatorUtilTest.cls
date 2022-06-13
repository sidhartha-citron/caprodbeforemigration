/**
 * @description Test class for CPQ2_ShipToCalculatorService
 * <p/>
 * Created by timothychiang on 2020-03-27.
 */
@IsTest
public with sharing class CPQ2_ShipToCalculatorUtilTest {

	@TestSetup static void setup() {
		CPQ2_Service.isOppServiceActive = false;

		Id pBook = Test.getStandardPricebookId();

		List<WorkType> workTypesToInsert = new List<WorkType>();
		WorkType workType1 = new WorkType(
			Name = 'TestWorkType1',
			DurationType = 'Minutes',
			EstimatedDuration = 1.7
		);

		WorkType workType2 = new WorkType(
			Name = 'TestWorkType2',
			DurationType = 'Minutes',
			EstimatedDuration = 1
		);

        Test.startTest();
		WorkType workType3 = new WorkType(
			Name = 'TestWorkType3',
			DurationType = 'Minutes',
			EstimatedDuration = 0.11
		);
		workTypesToInsert.add(workType1);
		workTypesToInsert.add(workType2);
		workTypesToInsert.add(workType3);
		insert workTypesToInsert;

		Product2 product1 = new Product2(
			Name = 'TestProduct1',
			Allowable_Frequencies__c = 'One-Time;Monthly;Weekly;Annually',
			IsActive = TRUE,
			Family = 'Hygiene',
			ExternalId__c = 'TestProduct1',
			CPQ_Price_Model__c = 'Hygiene Pricing Model',
			Item_Type__c = 'Service',
			Service_Work_Type__c = workType1.Id,
			CPQ_Cost__c = 0.93,
			CPQ_Amortization__c = 4,
			CPQ_Capital_Cost__c = 0
		);

		Product2 product2 = new Product2(
			Name = 'TestProduct2',
			Allowable_Frequencies__c = 'One-Time;Monthly;Weekly;Annually',
			IsActive = TRUE,
			Family = 'Hygiene',
			ExternalId__c = 'TestProduct2',
			CPQ_Price_Model__c = 'Hygiene Pricing Model',
			Item_Type__c = 'Service',
			Service_Work_Type__c = workType2.Id,
			CPQ_Cost__c = 57.33,
			CPQ_Amortization__c = 4,
			CPQ_Capital_Cost__c = 0
		);

		Product2 product3 = new Product2(
			Name = 'TestProduct3',
			Allowable_Frequencies__c = 'One-Time;Monthly;Weekly;Annually',
			IsActive = TRUE,
			Family = 'Hygiene',
			ExternalId__c = 'TestProduct3',
			CPQ_Price_Model__c = 'Hygiene Pricing Model',
			Item_Type__c = 'Service',
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
			IsActive = TRUE
		);

		PricebookEntry pbe2 = new PricebookEntry(
			Pricebook2Id = pBook,
			Product2Id = product2.Id,
			UnitPrice = 1.0,
			IsActive = TRUE
		);

		PricebookEntry pbe3 = new PricebookEntry(
			Pricebook2Id = pBook,
			Product2Id = product3.Id,
			UnitPrice = 1.0,
			IsActive = TRUE
		);
		TestDataFactory.pEntries.add(pbe1);
		TestDataFactory.pEntries.add(pbe2);
		TestDataFactory.pEntries.add(pbe3);
		insert TestDataFactory.pEntries;

		TestDataFactory.crtCPQSettings();
        
		List<Frequency__c> frequencies = new List<Frequency__c>{
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Weekly', Occurrences_In_Year__c = 52)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Monthly', Occurrences_In_Year__c = 12)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Annually', Occurrences_In_Year__c = 1))
        };
            
        insert frequencies;
        
		TestUtils.createSObject(new Field_Service_Settings__c(), true);
        
		TestDataFactory.crtAcctContact(1, 1);
        TestDataFactory.accounts[0].RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Bill To').getRecordTypeId();
		update TestDataFactory.accounts[0];
        
		TestDataFactory.crtSiteSurvey(1);
		TestDataFactory.crtOpportunities(1, TestDataFactory.accounts[0], TestDataFactory.contacts[0].Id, false);

        Test.stopTest();
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
	}

	@IsTest
	static void testShipToCalculatorOpportunity() {
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(opp.Id);
		for (CPQ2_Wrapper.LineItem lineItem : entity.lineItems) {
			lineItem.isEdit = true;
		}

		System.debug('**** ' + JSON.serialize(entity));
		List<CPQ2_Wrapper.CpqEntity> inputList = new List<CPQ2_Wrapper.CpqEntity>{
			entity
		};

		List<CPQ2_Wrapper.CpqEntity> entityOutputList = CPQ2_ShipToCalculatorUtil.calculateShipToScore(inputList);
		System.assertEquals(75, entityOutputList[0].shipToDealScore);
    }

	@isTest
	static void testShipToCalculatorOpportunitySimulate() {
		OpportunityLineItem oppLineItem = [SELECT Id, Service_Price_Per_Unit__c FROM OpportunityLineItem WHERE Service_Price_Per_Unit__c = 150][0];
        //oppLineItem.Service_Price_Per_Unit__c = 130;
		//update oppLineItem;
		
        
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		Id pBook = Test.getStandardPricebookId();

		List<WorkType> workTypesToInsert = new List<WorkType>();
		WorkType workType1 = new WorkType(
			Name = 'TestWorkType1',
			DurationType = 'Minutes',
			EstimatedDuration = 1.7
		);

		WorkType workType2 = new WorkType(
			Name = 'TestWorkType2',
			DurationType = 'Minutes',
			EstimatedDuration = 1
		);

		workTypesToInsert.add(workType1);
		workTypesToInsert.add(workType2);
		insert workTypesToInsert;

		List<Product2> productsToInsert = new List<Product2>();

		Product2 product1 = new Product2(
			Name = 'TestProduct4',
			Allowable_Frequencies__c = 'One-Time;Monthly;Weekly;Annually',
			IsActive = TRUE,
			Family = 'Hygiene',
			ExternalId__c = 'TestProduct4',
			Item_Type__c = 'Consumables',
			Service_Work_Type__c = workType1.Id,
			CPQ_Cost__c = 0.93,
			CPQ_Amortization__c = 4,
			CPQ_Capital_Cost__c = 0
		);

		Product2 product2 = new Product2(
			Name = 'TestProduct5',
			Allowable_Frequencies__c = 'One-Time;Monthly;Weekly;Annually',
			IsActive = TRUE,
			Family = 'Hygiene',
			ExternalId__c = 'TestProduct5',
			CPQ_Price_Model__c = 'Hygiene Pricing Model',
			Item_Type__c = 'Equipment',
			Service_Work_Type__c = workType2.Id,
			CPQ_Cost__c = 57.33,
			CPQ_Amortization__c = 4,
			CPQ_Capital_Cost__c = 0
		);

		productsToInsert.add(product1);
		productsToInsert.add(product2);
		insert productsToInsert;

		List<PricebookEntry> pbeToInsert = new List<PricebookEntry>();

        Test.startTest();
		PricebookEntry pbe1 = new PricebookEntry(
			Pricebook2Id = pBook,
			Product2Id = product1.Id,
			UnitPrice = 69.95,
			IsActive = TRUE,
			CPQ2_Margin_Threshold__c = 47.00,
			CPQ2_Margin_Threshold_2__c = 40,
			CPQ2_Vendor_Contract_Cost__c  = 10,
			CPQ2_Cost_Variance__c = 2
		);

		PricebookEntry pbe2 = new PricebookEntry(
			Pricebook2Id = pBook,
			Product2Id = product2.Id,
			UnitPrice = 1000.00,
			IsActive = TRUE,
			CPQ2_Margin_Threshold__c = 47.00,
			CPQ2_Margin_Threshold_2__c = 40,
			CPQ2_Vendor_Contract_Cost__c  = 12,
			CPQ2_Cost_Variance__c = 2
		);

		pbeToInsert.add(pbe1);
		pbeToInsert.add(pbe2);
		insert pbeToInsert;

		List<OpportunityLineItem> oppLineItems = new List<OpportunityLineItem>();

		OpportunityLineItem oppLineItem1 = new OpportunityLineItem();
		oppLineItem1.Product2Id = pbe1.Id;
		oppLineItem1.Service_Frequency__c = 'Monthly';
		oppLineItem1.UnitPrice = 20.0;
		oppLineItem1.Quantity = 1;
		oppLineItem1.OpportunityId = opp.Id;
		oppLineItem1.SurveyAssetCountChecker__c = 1;
		oppLineItem1.Purchase_Price__c = 20;

		OpportunityLineItem oppLineItem2 = new OpportunityLineItem();
		oppLineItem2.Product2Id = pbe2.Id;
		oppLineItem2.Service_Frequency__c = 'Weekly';
		oppLineItem2.UnitPrice = 1000.0;
		oppLineItem2.Quantity = 1;
		oppLineItem2.OpportunityId = opp.Id;
		oppLineItem2.SurveyAssetCountChecker__c = 1;
		oppLineItem2.Purchase_Price__c = 1000;

		oppLineItems.add(oppLineItem1);
		oppLineItems.add(oppLineItem2);
		insert oppLineItems;
        
        

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(opp.Id);
		entity.header.coreListThresholdLevel = 1;
		entity.header.shipToScoreApproved = 77;
		for (CPQ2_Wrapper.LineItem lineItem : entity.lineItems) {
			lineItem.isEdit = true;
		}

		System.debug('**** ' + JSON.serialize(entity));
		List<CPQ2_Wrapper.CpqEntity> inputList = new List<CPQ2_Wrapper.CpqEntity>{
			entity
		};

		List<CPQ2_Wrapper.CpqEntity> entityOutputList = CPQ2_ShipToCalculatorUtil.calculateShipToScore(inputList, true);
		//System.assertEquals(69, entityOutputList[0].shipToDealScore);
        Test.stopTest();
	}

	@isTest
	static void testShipToCalculatorOrder() {
        Test.startTest();
		Account acct = [SELECT Id FROM Account LIMIT 1];

		List<PricebookEntry> priceBookEntries = [SELECT Id FROM PricebookEntry];

		Order order = (Order) TestUtils.createSObject(new Order(
				AccountId = acct.Id,
				CPQ2_Include_in_Price_Model__c = True
		));

		insert order;
		
		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), priceBookEntries.size());

		orderItems[0].Product2Id = priceBookEntries[0].Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].UnitPrice = 12.0;
		orderItems[0].Service_Price_Per_Unit__c = 11.0;
		orderItems[0].Requested_Price_Approved__c = True;
        orderItems[0].Requested_Price__c = 11.0;
		orderItems[0].Quantity = 1;
		orderItems[0].OrderId = order.Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		orderItems[1].Product2Id = priceBookEntries[1].Id;
		orderItems[1].Frequency__c = 'Weekly';
		orderItems[1].UnitPrice = 12.0;
		orderItems[1].Service_Price_Per_Unit__c = 150.0;
		orderItems[1].Requested_Price_Approved__c = True;
        orderItems[1].Requested_Price__c = 150.0;
		orderItems[1].Quantity = 1;
		orderItems[1].OrderId = order.Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;

		orderItems[2].Product2Id = priceBookEntries[2].Id;
		orderItems[2].Frequency__c = 'Annually';
		orderItems[2].UnitPrice = 12.0;
		orderItems[2].Service_Price_Per_Unit__c = 3.0;
		orderItems[2].Requested_Price_Approved__c = True;
        orderItems[2].Requested_Price__c = 3.0;
		orderItems[2].Quantity = 1;
		orderItems[2].OrderId = order.Id;
		orderItems[2].SurveyAssetCountChecker__c = 1;

		insert orderItems;

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(order.Id);
		for (CPQ2_Wrapper.LineItem lineItem : entity.lineItems) {
			lineItem.isEdit = true;
		}

		System.debug('**** ' + JSON.serialize(entity));
		List<CPQ2_Wrapper.CpqEntity> inputList = new List<CPQ2_Wrapper.CpqEntity>{
			entity
		};

		List<CPQ2_Wrapper.CpqEntity> entityOutputList = CPQ2_ShipToCalculatorUtil.calculateShipToScore(inputList);
		System.assertEquals(64, entityOutputList[0].shipToDealScore);
        Test.stopTest();

	}

	@isTest
	static void testShipToCalculatorOrderBulk() {
        Test.startTest();
		Account acct = [SELECT Id FROM Account LIMIT 1];

		List<PricebookEntry> priceBookEntries = [SELECT Id, Product2.Name FROM PricebookEntry];
        
        PriceBookEntry pbe1;
        PriceBookEntry pbe2;
        PriceBookEntry pbe3;
        
        for(PriceBookEntry priceBookEntry : PriceBookEntries) {
			if(priceBookEntry.Product2.Name == 'TestProduct1')
				pbe1 = priceBookEntry;
            else if(priceBookEntry.Product2.Name == 'TestProduct2')
                pbe2 = priceBookEntry;
			else if(priceBookEntry.Product2.Name == 'TestProduct3')
				pbe3 = priceBookEntry;
        }

		List<Order> orders = (List<Order>) TestUtils.createSObjectList(new Order(
				AccountId = acct.Id,
				CPQ2_Include_in_Price_Model__c = True
		), 3);


		// I had to do this because there is a duplicate Id exception being thrown on OrderTriggerHandler Line 635. There seems to be a bug
		// on this.
		insert orders[0];
		insert orders[1];
		insert orders[2];

		Set<Id> orderIds = new Set<Id>();
		orderIds.add(orders[0].Id);
		orderIds.add(orders[1].Id);
		orderIds.add(orders[2].Id);
		
		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 6);

		// Order Products for Order 1
		orderItems[0].Product2Id = pbe1.Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[0].UnitPrice = 11.0;
		orderItems[0].Service_Price_Per_Unit__c = 9.0;
		orderItems[0].Requested_Price_Approved__c = True;
        orderItems[0].Requested_Price__c = 9.0;
		orderItems[0].Quantity = 1;
		orderItems[0].OrderId = orders[0].Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		orderItems[1].Product2Id = pbe2.Id;
		orderItems[1].Frequency__c = 'Annually';
		orderItems[1].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[1].UnitPrice = 40;
		orderItems[1].Service_Price_Per_Unit__c = 38.0;
		orderItems[1].Requested_Price_Approved__c = True;
        orderItems[1].Requested_Price__c = 38.0;
		orderItems[1].Quantity = 1;
		orderItems[1].OrderId = orders[0].Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;

		// Order Products for Order 2
		orderItems[2].Product2Id = pbe1.Id;
		orderItems[2].Frequency__c = 'Monthly';
		orderItems[2].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[2].UnitPrice = 11;
		orderItems[2].Service_Price_Per_Unit__c = 8.0;
		orderItems[2].Requested_Price_Approved__c = True;
        orderItems[2].Requested_Price__c = 8.0;
		orderItems[2].Quantity = 1;
		orderItems[2].OrderId = orders[1].Id;
		orderItems[2].SurveyAssetCountChecker__c = 1;

		orderItems[3].Product2Id = pbe2.Id;
		orderItems[3].Frequency__c = 'Annually';
		orderItems[3].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[3].UnitPrice = 40.0;
		orderItems[3].Service_Price_Per_Unit__c =33.0;
		orderItems[3].Requested_Price_Approved__c = True;
        orderItems[3].Requested_Price__c = 33.0;
		orderItems[3].Quantity = 1;
		orderItems[3].OrderId = orders[1].Id;
		orderItems[3].SurveyAssetCountChecker__c = 1;

		orderItems[4].Product2Id = pbe3.Id;
		orderItems[4].Frequency__c = 'Annually';
		orderItems[4].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[4].UnitPrice = 3;
		orderItems[4].Service_Price_Per_Unit__c = 2.0;
		orderItems[4].Requested_Price_Approved__c = True;
        orderItems[4].Requested_Price__c = 2.0;
		orderItems[4].Quantity = 1;
		orderItems[4].OrderId = orders[1].Id;
		orderItems[4].SurveyAssetCountChecker__c = 1;

		// Order Product for Order 3
		orderItems[5].Product2Id = pbe1.Id;
		orderItems[5].Frequency__c = 'Monthly';
		orderItems[5].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[5].UnitPrice = 11;
		orderItems[5].Service_Price_Per_Unit__c = 8.0;
		orderItems[5].Requested_Price_Approved__c = True;
        orderItems[5].Requested_Price__c = 8.0;
		orderItems[5].Quantity = 1;
		orderItems[5].OrderId = orders[2].Id;
		orderItems[5].SurveyAssetCountChecker__c = 1;

		insert orderItems;

		Map<Id, CPQ2_Wrapper.CpqEntity> entitiesMap = CPQ2_Service.getHeadersAndLineItemsMap(orderIds);

		for(CPQ2_Wrapper.CpqEntity entity : entitiesMap.values()) {
			for (CPQ2_Wrapper.LineItem lineItem : entity.lineItems) {
				lineItem.isEdit = true;
			}
		}

		List<CPQ2_Wrapper.CpqEntity> entityOutputList = CPQ2_ShipToCalculatorUtil.calculateShipToScore(entitiesMap.values());
		System.assertEquals(6, entityOutputList[0].shipToDealScore);
        Test.stopTest();
	}

	@isTest
	static void testCapitalCharge() {
        Test.startTest();
		Account acct = [SELECT Id FROM Account LIMIT 1];

		List<Product2> productList = [SELECT Id, Name, CPQ_Capital_Cost__c, CPQ_Amortization__c FROM Product2];
		Product2 prod1;
		Product2 prod2;
		Product2 prod3;

		for(Product2 product : productList) {
			if(product.Name == 'TestProduct1')
				prod1 = product;
			else if(product.Name == 'TestProduct2')
				prod2 = product;
			else if(product.Name == 'TestProduct3')
				prod3 = product;
		}

		prod1.CPQ_Capital_Cost__c = 54.38;
		prod1.CPQ_Amortization__c = 4;
		prod2.CPQ_Capital_Cost__c = 195.65;
		prod2.CPQ_Amortization__c = 4;
		prod3.CPQ_Capital_Cost__c = 0;
		prod3.CPQ_Amortization__c = 0;

		update productList;

		List<PricebookEntry> priceBookEntries = [SELECT Id, Product2.Name FROM PricebookEntry];
        
        PriceBookEntry pbe1;
        PriceBookEntry pbe2;
        PriceBookEntry pbe3;
        
        for(PriceBookEntry priceBookEntry : PriceBookEntries) {
			if(priceBookEntry.Product2.Name == 'TestProduct1')
				pbe1 = priceBookEntry;
            else if(priceBookEntry.Product2.Name == 'TestProduct2')
                pbe2 = priceBookEntry;
			else if(priceBookEntry.Product2.Name == 'TestProduct3')
				pbe3 = priceBookEntry;
        }

		List<Order> orders = (List<Order>) TestUtils.createSObjectList(new Order(
				AccountId = acct.Id,
				CPQ2_Include_in_Price_Model__c = True
		), 3);


		// I had to do this because there is a duplicate Id exception being thrown on OrderTriggerHandler Line 635. There seems to be a bug
		// on this.
		insert orders[0];
		insert orders[1];
		insert orders[2];

		Set<Id> orderIds = new Set<Id>();
		orderIds.add(orders[0].Id);
		orderIds.add(orders[1].Id);
		orderIds.add(orders[2].Id);
		
		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 6);

		// Order Products for Order 1
		orderItems[0].Product2Id = pbe1.Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[0].UnitPrice = 11.0;
		orderItems[0].Service_Price_Per_Unit__c = 9.0;
        orderItems[0].Requested_Price_Approved__c = True;
        orderItems[0].Requested_Price__c = 9.0;
		orderItems[0].Quantity = 1;
		orderItems[0].OrderId = orders[0].Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		orderItems[1].Product2Id = pbe2.Id;
		orderItems[1].Frequency__c = 'Annually';
		orderItems[1].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[1].UnitPrice = 40;
		orderItems[1].Service_Price_Per_Unit__c = 38.0;
		orderItems[1].Requested_Price_Approved__c = True;
        orderItems[1].Requested_Price__c = 38.0;
		orderItems[1].Quantity = 1;
		orderItems[1].OrderId = orders[0].Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;

		// Order Products for Order 2
		orderItems[2].Product2Id = pbe1.Id;
		orderItems[2].Frequency__c = 'Monthly';
		orderItems[2].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[2].UnitPrice = 11;
		orderItems[2].Service_Price_Per_Unit__c = 11.0;
		orderItems[2].Requested_Price_Approved__c = True;
        orderItems[2].Requested_Price__c = 11.0;
		orderItems[2].Quantity = 1;
		orderItems[2].OrderId = orders[1].Id;
		orderItems[2].SurveyAssetCountChecker__c = 1;

		orderItems[3].Product2Id = pbe2.Id;
		orderItems[3].Frequency__c = 'Weekly';
		orderItems[3].CPQ2_Number_Of_Visits_Per_Year__c = 52;
		orderItems[3].UnitPrice = 40.0;
		orderItems[3].Service_Price_Per_Unit__c =150.0;
		orderItems[3].Requested_Price_Approved__c = True;
        orderItems[3].Requested_Price__c = 150.0;
		orderItems[3].Quantity = 1;
		orderItems[3].OrderId = orders[1].Id;
		orderItems[3].SurveyAssetCountChecker__c = 1;

		orderItems[4].Product2Id = pbe3.Id;
		orderItems[4].Frequency__c = 'Annually';
		orderItems[4].CPQ2_Number_Of_Visits_Per_Year__c = 1;
		orderItems[4].UnitPrice = 3;
		orderItems[4].Service_Price_Per_Unit__c = 3.0;
		orderItems[4].Requested_Price_Approved__c = True;
        orderItems[4].Requested_Price__c = 3.0;
		orderItems[4].Quantity = 1;
		orderItems[4].OrderId = orders[1].Id;
		orderItems[4].SurveyAssetCountChecker__c = 1;

		// Order Product for Order 3
		orderItems[5].Product2Id = pbe1.Id;
		orderItems[5].Frequency__c = 'Monthly';
		orderItems[5].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[5].UnitPrice = 11;
		orderItems[5].Requested_Price_Approved__c = True;
        orderItems[5].Requested_Price__c = 8.0;
		orderItems[5].Quantity = 1;
		orderItems[5].OrderId = orders[2].Id;
		orderItems[5].SurveyAssetCountChecker__c = 1;

		insert orderItems;

		Map<Id, CPQ2_Wrapper.CpqEntity> entitiesMap = CPQ2_Service.getHeadersAndLineItemsMap(orderIds);

		for(CPQ2_Wrapper.CpqEntity entity : entitiesMap.values()) {
			for (CPQ2_Wrapper.LineItem lineItem : entity.lineItems) {
				lineItem.isEdit = true;
			}
		}

		List<CPQ2_Wrapper.CpqEntity> entityOutputList = CPQ2_ShipToCalculatorUtil.calculateShipToScore(entitiesMap.values());
		System.assertEquals(63, entityOutputList[0].shipToDealScore);		
	}
}