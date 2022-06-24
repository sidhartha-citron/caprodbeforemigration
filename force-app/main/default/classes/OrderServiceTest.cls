/**
 * @description
 *
 * Created by timothychiang on 2020-05-30.
 *
 */
@IsTest
public with sharing class OrderServiceTest {
	@TestSetup static void setup() {

		CPQ2_Service.isOrderServiceActive = false;

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
			IsActive=TRUE,
			Family='Hygiene',
			ExternalId__c = 'TestProduct1',
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
			IsActive=TRUE,
			Family='Hygiene',
			Item_Type__c = 'Service',
			ExternalId__c = 'TestProduct2',
			CPQ_Price_Model__c = 'Hygiene Pricing Model',
			Service_Work_Type__c = workType2.Id,
			CPQ_Cost__c =  57.33,
			CPQ_Amortization__c = 4,
			CPQ_Capital_Cost__c = 0
		);

		Product2 product3 = new Product2(
			Name='TestProduct3',
			Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
			IsActive=TRUE,
			Family='Hygiene',
			ExternalId__c = 'TestProduct3',
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
		TestDataFactory.crtFieldSettings();
		//TestDataFactory.crtFieldServiceSetting();

		//TestDataFactory.crtProdWithPE(4);
		//TestDataFactory.crtAcctContact(1, 1);
        TestDataFactory.crtAcctContact(2, 0); 
        List<Account> accounts = TestDataFactory.accounts; 
		ID rTBillTo = [select id from recordType where name = 'Customer Bill To'].id; 
        Id rTShipTo = [select id from recordType where name = 'Customer Ship To'].id; 
        
        Account a0 = accounts.get(0);
        a0.OperatingHoursId = TestDataFactory.opthours[1].Id;
        a0.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        a0.AccPac_Account__c='1234567-0'; 
        a0.RecordTypeId = rTBillTo;
        update a0;
        Account a = accounts.get(1);
        a.OperatingHoursId = TestDataFactory.opthours[1].Id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        a.AccPac_Account__c='1234567-1'; 
        a.ParentId = a0.Id;
        a.RecordTypeId = rTShipTo;
        update a;

		Order order = (Order) TestUtils.createSObject(new Order(
			AccountId = TestDataFactory.accounts[1].Id,
			CPQ2_Include_in_Price_Model__c = True
		));

		insert order;
	}


	@IsTest
	static void testCreateUpdateOrder() {
		Order order = [SELECT Id FROM Order LIMIT 1];
		order.CPQ2_TAR__c = 0;

		Test.startTest();
		Database.SaveResult[] results = OrderService.updateOrders(new List<Order>{order}, true);
		Test.stopTest();

		System.assertEquals(true, results[0].isSuccess());
	}

	@IsTest
	static void testCreateUpdateOrderItem() {
		CPQ2_Service.isOrderServiceActive = false;
		Order order = [SELECT Id FROM Order LIMIT 1];
		PricebookEntry pbe = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];

		List<OrderItem> orderItems = new List<OrderItem>();
		OrderItem oi = new OrderItem();

		oi.Product2Id = pbe.Id;
		oi.Frequency__c = 'Monthly';
		oi.UnitPrice = 12.0;
		oi.Service_Price_Per_Unit__c = 11.0;
		oi.Quantity = 10;
		oi.OrderId = order.Id;
		oi.SurveyAssetCountChecker__c = 1;
		orderItems.add(oi);

		//CPQ2_Service.isOrderServiceActive = true;
		Test.startTest();
		Database.SaveResult[] results = OrderService.insertOrderItems(orderItems, true);
		System.assertEquals(true, results[0].isSuccess());

		oi.Service_Price_Per_Unit__c = 12;

		Database.SaveResult[] results2 = OrderService.updateOrderItems(orderItems, true);
		System.assertEquals(true, results2[0].isSuccess());
		Test.stopTest();
	}

	@IsTest
	static void testDeleteOrderItem() {
		CPQ2_Service.isOrderServiceActive = false;
		Order order = [SELECT Id FROM Order LIMIT 1];
		PricebookEntry pbe = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];

		List<OrderItem> orderItems = new List<OrderItem>();
		OrderItem oi = new OrderItem();

		oi.Product2Id = pbe.Id;
		oi.Frequency__c = 'Monthly';
		oi.UnitPrice = 12.0;
		oi.Service_Price_Per_Unit__c = 11.0;
		oi.Quantity = 10;
		oi.OrderId = order.Id;
		oi.SurveyAssetCountChecker__c = 1;
		orderItems.add(oi);

		//CPQ2_Service.isOrderServiceActive = true;
		Test.startTest();
		Database.SaveResult[] results = OrderService.insertOrderItems(orderItems, true);
		System.assertEquals(true, results[0].isSuccess());

		oi.Service_Price_Per_Unit__c = 12;

		Database.DeleteResult[] results2 = OrderService.deleteOrderItems(orderItems, true);
		System.assertEquals(true, results2[0].isSuccess());
		Test.stopTest();

	}

	@IsTest
	static void testQueryOrders() {
		CPQ2_Service.isOrderServiceActive = false;
		Order order = [SELECT Id FROM Order LIMIT 1];
		PricebookEntry pbe = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];

		List<OrderItem> orderItems = new List<OrderItem>();
		OrderItem oi = new OrderItem();

		oi.Product2Id = pbe.Id;
		oi.Frequency__c = 'Monthly';
		oi.UnitPrice = 12.0;
		oi.Service_Price_Per_Unit__c = 11.0;
		oi.Quantity = 10;
		oi.OrderId = order.Id;
		oi.SurveyAssetCountChecker__c = 1;
		orderItems.add(oi);

		//CPQ2_Service.isOrderServiceActive = true;
		Test.startTest();
		Database.SaveResult[] results = OrderService.insertOrderItems(orderItems, true);
		System.assertEquals(true, results[0].isSuccess());
		Test.stopTest();

		Order orderResult = OrderService.getOrderById(order.Id);
		System.assertEquals(order.Id, orderResult.Id);

		Map<Id, Order> mapOrder = OrderService.getOrdersMapByIds(new Set<Id>{order.Id});
		System.assertEquals(1, mapOrder.size());

		Map<Id, List<OrderItem>> orderMap =  OrderService.getOrderProductsByOrderIdsAndTypeMap(new Set<Id>{order.Id}, 'Service');
		System.assertEquals(1, orderMap.size());

		orderMap =  OrderService.getOrderProductsByOrderIdsAndTypeMap(new Set<Id>{order.Id}, null);
		System.assertEquals(1, orderMap.size());

		orderMap =  OrderService.getOrderProductsByOrderIdsMap(new Set<Id>{order.Id});
		System.assertEquals(1, orderMap.size());


	}

	@IsTest
	static void testQueryExistingOrders() {
		CPQ2_Service.isOrderServiceActive = false;
		Account account = [SELECT Id FROM Account LIMIT 1];
		Order order = [SELECT Id FROM Order LIMIT 1];
		PricebookEntry pbe = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];

		List<OrderItem> orderItems = new List<OrderItem>();
		OrderItem oi = new OrderItem();

		oi.Product2Id = pbe.Id;
		oi.Frequency__c = 'Monthly';
		oi.UnitPrice = 12.0;
		oi.Service_Price_Per_Unit__c = 11.0;
		oi.Quantity = 10;
		oi.OrderId = order.Id;
		oi.SurveyAssetCountChecker__c = 1;
		orderItems.add(oi);

		//CPQ2_Service.isOrderServiceActive = true;
		Test.startTest();
		Database.SaveResult[] results = OrderService.insertOrderItems(orderItems, true);
		System.assertEquals(true, results[0].isSuccess());
		Test.stopTest();

		List<OrderService.LineItem> resultList = OrderService.getExistingServicesByAccountId(account.Id);
		//System.assertEquals(1, resultList.size());

		Map<Id, Map<String, OrderService.OrderProductFrequencyDetails>>existingMap = OrderService.getExistingServicesMapByAccountIdAndProducts(account.Id, new Set<Id>{pbe.Product2Id});
		//System.assertEquals(1, existingMap.size());

	}
}