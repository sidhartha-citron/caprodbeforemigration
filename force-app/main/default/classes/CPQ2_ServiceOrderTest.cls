/**
 * @description
 *
 * Created by timothychiang on 2020-05-29.
 *
 */
/**
 * @description Test class for CPQ2_Service
 *
 * Created by timothychiang on 2020-04-01.
 *
 */
@IsTest
public with sharing class CPQ2_ServiceOrderTest {
	@TestSetup static void setup() {
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
			CPQ_Capital_Cost__c = 54.38
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
			CPQ_Capital_Cost__c = 195.65
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
			CPQ_Amortization__c = 0,
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
        
        List<Frequency__c> frequencies = new List<Frequency__c>{
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Weekly', Occurrences_In_Year__c = 52)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Monthly', Occurrences_In_Year__c = 12)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Annually', Occurrences_In_Year__c = 1))
        };
            
        insert frequencies;
        
        TestUtils.createSObject(new Field_Service_Settings__c(), true);
        
		//TestDataFactory.crtFieldSettings();
		TestDataFactory.crtAcctContact(1, 1);
        TestDataFactory.accounts[0].RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Bill To').getRecordTypeId();
		update TestDataFactory.accounts[0];
	}

	@IsTest
	static void testMultipleOrdersWithEdit() {
		createDataScenario3();

		Test.startTest();
		List<OrderItem> orderItems = [SELECT Id, OrderId FROM OrderItem WHERE Order.CPQ2_HC__c = 1];
		
		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(orderItems[0].OrderId);

		System.assertEquals(373,entity.accountItem.totalAnnualRevenue);
		System.assertEquals(138.61,entity.accountItem.totalCapitalCharge);
		System.assertEquals(331.4039,entity.accountItem.totalAnnualCost);
		System.assertEquals(12,entity.accountItem.highestFrequency);

		Test.stopTest();
	}

	@IsTest
	static void testMultipleOrders() {
		createDataScenario2();

		Test.startTest();
		Account acct = [SELECT Id FROM Account LIMIT 1];

		PricebookEntry pbe1 = [SELECT Id, Product2.Name FROM PricebookEntry WHERE Product2.Name = 'TestProduct1'];

		Order order = (Order) TestUtils.createSObject(new Order(
			AccountId = acct.Id,
			CPQ2_Include_in_Price_Model__c = true
		));

		insert order;

		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 1);

		orderItems[0].Product2Id = pbe1.Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[0].UnitPrice = 11;
		orderItems[0].Service_Price_Per_Unit__c = 8.0;
        orderItems[0].Requested_Price_Approved__c = True;
        orderItems[0].Requested_Price__c = 8.0;
		orderItems[0].Quantity = 1;
		orderItems[0].OrderId = order.Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		insert orderItems;

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(order.Id);
		System.assertEquals(96,entity.header.totalAnnualRevenue);
		System.assertEquals(38.831,entity.header.totalAnnualCost);
		System.assertEquals(12,entity.header.highestFrequency);

		System.assertEquals(373.00,entity.accountItem.totalAnnualRevenue);
		System.assertEquals(331.4039,entity.accountItem.totalAnnualCost);
		System.assertEquals(12,entity.accountItem.highestFrequency);

		Test.stopTest();
	}

	@IsTest
	static void testMultipleOrdersInsertNonActive() {
		createDataScenario2();

		Test.startTest();
		Account acct = [SELECT Id FROM Account LIMIT 1];

		PricebookEntry pbe1 = [SELECT Id, Product2.Name FROM PricebookEntry WHERE Product2.Name = 'TestProduct1'];

		Order order = (Order) TestUtils.createSObject(new Order(
			EffectiveDate = Date.today().addDays(100),
			AccountId = acct.Id,
			CPQ2_Include_in_Price_Model__c = true
		));

		insert order;

		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 1);

		orderItems[0].Product2Id = pbe1.Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[0].UnitPrice = 11;
		orderItems[0].Service_Price_Per_Unit__c = 8.0;
        orderItems[0].Requested_Price_Approved__c = True;
        orderItems[0].Requested_Price__c = 8.0;
		orderItems[0].Quantity = 1;
		orderItems[0].OrderId = order.Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		insert orderItems;

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(order.Id);
		System.assertEquals(96.00,entity.header.totalAnnualRevenue);
		System.assertEquals(38.831,entity.header.totalAnnualCost);
		System.assertEquals(12,entity.header.highestFrequency);

		System.assertEquals(277.00,entity.accountItem.totalAnnualRevenue);
		System.assertEquals(292.5729,entity.accountItem.totalAnnualCost);
		System.assertEquals(12,entity.accountItem.highestFrequency);

		Test.stopTest();
	}

	@IsTest
	static void testSetOrdersItemsInactive() {
		createDataScenario3();

		Test.startTest();
		List<OrderItem> orderItems = [SELECT Id, OrderId FROM OrderItem WHERE Order.CPQ2_HC__c = 1];
		orderItems[0].Active__c = false;
		update orderItems;

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(orderItems[0].OrderId);

		System.assertEquals(0,entity.header.totalAnnualCost);
		System.assertEquals(0,entity.header.totalAnnualRevenue);
		System.assertEquals(0,entity.header.highestFrequency);

		System.assertEquals(277.00,entity.accountItem.totalAnnualRevenue);
		System.assertEquals(292.5729,entity.accountItem.totalAnnualCost);
		System.assertEquals(12,entity.accountItem.highestFrequency);

		Test.stopTest();
	}

	@IsTest
	static void testSeasonal() {
		createDataScenario2();

		Test.startTest();
		Account acct = [SELECT Id FROM Account LIMIT 1];

		PricebookEntry pbe1 = [SELECT Id, Product2.Name FROM PricebookEntry WHERE Product2.Name = 'TestProduct1'];

		Order order = (Order) TestUtils.createSObject(new Order(
			AccountId = acct.Id,
			CPQ2_Include_in_Price_Model__c = true,
			Season_Start_Day__c = '1',
			Season_End_Day__c = '1',
			Season_Start_Month__c = '1',
			Season_End_Month__c = '3'
		));

		insert order;

		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 1);

		orderItems[0].Product2Id = pbe1.Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].CPQ2_Number_Of_Visits_Per_Year__c = 12;
		orderItems[0].UnitPrice = 11;
		orderItems[0].Service_Price_Per_Unit__c = 8.0;
        orderItems[0].Requested_Price_Approved__c = True;
        orderItems[0].Requested_Price__c = 8.0;
		orderItems[0].Quantity = 9;
		orderItems[0].OrderId = order.Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		insert orderItems;

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(order.Id);
		System.assertEquals(true,entity.accountItem.hasSeasonal);

		Test.stopTest();
	}


	@IsTest
	static void testEditOrderItem() {
		createDataScenario1();
		Order order = [SELECT Id FROM Order LIMIT 1];
		Product2 prod = [SELECT Id FROM Product2 WHERE Name='TestProduct3'];
		OrderItem orderItem = [SELECT Id FROM OrderItem WHERE Product2Id =: prod.Id];

		orderItem.Frequency__c = 'Monthly';
		//orderItem.Quantity = 100;

		Test.startTest();
		update orderItem;
		Test.stopTest();

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(order.Id);
		System.assertEquals(3117.3343,entity.header.totalAnnualCost);
		System.assertEquals(7968.00,entity.header.totalAnnualRevenue);
		System.assertEquals(52,entity.header.highestFrequency);
	}

	@IsTest
	static void testCreateOrderItem() {
		createDataScenario1();
		Order order = [SELECT Id FROM Order LIMIT 1];

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(order.Id);
		System.assertEquals(3105.8294,entity.header.totalAnnualCost);
		System.assertEquals(7935.00,entity.header.totalAnnualRevenue);
		System.assertEquals(52,entity.header.highestFrequency);
	}

	@IsTest
	static void testGetLineItems(){
		createDataScenario1();
		Order order = [SELECT Id FROM Order LIMIT 1];
		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItemsWithProductInfo(order.Id);

		System.assertNotEquals(null,entity);
		System.assertEquals(3,entity.lineItems.size());
	}

	@IsTest
	static void testLineItemSave(){
		createDataScenario4();
		Order order = [SELECT Id FROM Order LIMIT 1];
		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItemsWithProductInfo(order.Id);

		System.assertNotEquals(null,entity);
		System.assertEquals(3,entity.lineItems.size());

		CPQ2_Wrapper.LineItem lineItem = entity.lineItems[0];
		lineItem.frequency = 'Weekly';

		System.debug('***  lineItem.productId ' + lineItem.productId);
		System.debug('***  lineItem.pricebookEntryId ' + lineItem.pricebookEntryId);
		System.debug('***  entity.header.id ' + entity.header.id);
		System.debug('***  entity.accountItem.account.Id ' + entity.accountItem.account.Id);
		CPQ2_Wrapper.LineItem newlineItem = CPQ2_Service.getNewLineItem(lineItem.productId, entity.header.priceBookId, entity.header.id, entity.accountItem.account.Id, 1)[0];
		newlineItem.quantity = 1;
		newlineItem.servicePrice = 10;
		newlineItem.frequency = 'Monthly';
		entity.lineItems.add(newlineItem);

		Test.startTest();
		CPQ2_Service.saveChanges(entity.lineItems);
		Test.stopTest();

		List<OrderItem> orderItems = [SELECT Id FROM OrderItem WHERE OrderId=:order.Id];
		System.assertEquals(4,orderItems.size());
	}

	@IsTest
	static void testOrderValidation() {
		createDataScenario1();
		Order order = [SELECT Id FROM Order LIMIT 1];
		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(order.Id);
		entity.lineItems[0].frequency = 'One-Time';

		CPQ2_OrderValidationUtil.OrderValidationResult result = CPQ2_Service.validateOrder(entity);
		System.assertEquals(true, result.isSuccess);
	}

	@IsTest
	static void testOrderValidationPass() {
		createDataScenario1();
		Order order = [SELECT Id FROM Order LIMIT 1];
		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(order.Id);

		CPQ2_OrderValidationUtil.OrderValidationResult result = CPQ2_Service.validateOrder(entity);
		System.assertEquals(true, result.isSuccess);
	}


	static void createDataScenario1(){

		Account acct = [SELECT Id FROM Account LIMIT 1];

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


		Order order = (Order) TestUtils.createSObject(new Order(
			AccountId = acct.Id,
			CPQ2_Include_in_Price_Model__c = true
		));

		insert order;

		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 3);

		orderItems[0].Product2Id = pbe1.Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].UnitPrice = 12.0;
		orderItems[0].Service_Price_Per_Unit__c = 11.0;
        orderItems[0].Requested_Price_Approved__c = True;
        orderItems[0].Requested_Price__c = 11.0;
		orderItems[0].Quantity = 1;
		orderItems[0].OrderId = order.Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		orderItems[1].Product2Id = pbe2.Id;
		orderItems[1].Frequency__c = 'Weekly';
		orderItems[1].UnitPrice = 12.0;
		orderItems[1].Service_Price_Per_Unit__c = 150.0;
        orderItems[1].Requested_Price_Approved__c = True;
        orderItems[1].Requested_Price__c = 150.0;
		orderItems[1].Quantity = 1;
		orderItems[1].OrderId = order.Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;

		orderItems[2].Product2Id = pbe3.Id;
		orderItems[2].Frequency__c = 'Annually';
		orderItems[2].UnitPrice = 12.0;
		orderItems[2].Service_Price_Per_Unit__c = 3.0;
        orderItems[2].Requested_Price_Approved__c = True;
        orderItems[2].Requested_Price__c = 3.0;
		orderItems[2].Quantity = 1;
		orderItems[2].OrderId = order.Id;
		orderItems[2].SurveyAssetCountChecker__c = 1;

		insert orderItems;
	}

	static void createDataScenario2(){

		Account acct = [SELECT Id FROM Account LIMIT 1];

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

		List<Order> orders = (List<Order>) TestUtils.createSObjectList(new Order(
			AccountId = acct.Id,
			CPQ2_Include_in_Price_Model__c = True
		), 2);

		// I had to do this because there is a duplicate Id exception being thrown on OrderTriggerHandler Line 635. There seems to be a bug
		// on this.
		insert orders[0];
		insert orders[1];

		Set<Id> orderIds = new Set<Id>();
		orderIds.add(orders[0].Id);
		orderIds.add(orders[1].Id);

		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 6);

		List<OrderItem> orderItemsBatch1 = new List<OrderItem>();

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
		orderItemsBatch1.add(orderItems[0]);

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
		orderItemsBatch1.add(orderItems[1]);

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
		orderItemsBatch1.add(orderItems[2]);

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
		orderItemsBatch1.add(orderItems[3]);

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
		orderItemsBatch1.add(orderItems[4]);

		insert orderItemsBatch1;
	}

	static void createDataScenario3(){

		Account acct = [SELECT Id FROM Account LIMIT 1];

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
	}

	static void createDataScenario4(){

		Account acct = [SELECT Id FROM Account LIMIT 1];

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


		Order order = (Order) TestUtils.createSObject(new Order(
			AccountId = acct.Id,
			CPQ2_Include_in_Price_Model__c = true
		));

		insert order;

		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 3);

		orderItems[0].Product2Id = pbe1.Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].UnitPrice = 12.0;
		orderItems[0].Service_Price_Per_Unit__c = 11.0;
        orderItems[0].Requested_Price_Approved__c = True;
        orderItems[0].Requested_Price__c = 11.0;
		orderItems[0].Quantity = 1;
		orderItems[0].OrderId = order.Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		orderItems[1].Product2Id = pbe2.Id;
		orderItems[1].Frequency__c = 'Weekly';
		orderItems[1].UnitPrice = 12.0;
		orderItems[1].Service_Price_Per_Unit__c = 150.0;
        orderItems[1].Requested_Price_Approved__c = True;
        orderItems[1].Requested_Price__c = 150.0;
		orderItems[1].Quantity = 1;
		orderItems[1].OrderId = order.Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;

		orderItems[2].Product2Id = pbe3.Id;
		orderItems[2].Frequency__c = 'Annually';
		orderItems[2].UnitPrice = 12.0;
		orderItems[2].Service_Price_Per_Unit__c = 3.0;
        orderItems[2].Requested_Price_Approved__c = True;
        orderItems[2].Requested_Price__c = 3.0;
		orderItems[2].Quantity = 1;
		orderItems[2].OrderId = order.Id;
		orderItems[2].SurveyAssetCountChecker__c = 1;

		insert orderItems;
	}


}