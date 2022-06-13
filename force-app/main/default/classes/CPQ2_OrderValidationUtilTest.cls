/**
 * @description
 *
 * Created by timothychiang on 2020-06-01.
 *
 */
@IsTest
public with sharing class CPQ2_OrderValidationUtilTest {
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
			Item_Type__c = 'Consumable'
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

		//TestDataFactory.crtProdWithPE(4);
		TestDataFactory.crtAcctContact(1, 1);
        TestDataFactory.accounts[0].RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Bill To').getRecordTypeId();
		update TestDataFactory.accounts[0];
//		TestDataFactory.crtSiteSurvey(1);
//		TestDataFactory.crtOpportunities(1, TestDataFactory.accounts[0], TestDataFactory.contacts[0].Id, false);
	}

	/*2020-12-02 Darcy: CPQCN-434
		* validations are being disabled for now
		*/
	/*	
	@IsTest
	static void testValidation() {
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

		orderItems[0].Product2Id = pbe1.Product2Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].UnitPrice = 12.0;
		orderItems[0].Service_Price_Per_Unit__c = 11.0;
		orderItems[0].Quantity = 10;
		orderItems[0].OrderId = order.Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		orderItems[1].Product2Id = pbe2.Product2Id;
		orderItems[1].Frequency__c = 'Weekly';
		orderItems[1].UnitPrice = 12.0;
		orderItems[1].Service_Price_Per_Unit__c = 150.0;
		orderItems[1].Quantity = 10;
		orderItems[1].OrderId = order.Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;

		orderItems[2].Product2Id = pbe3.Product2Id;
		orderItems[2].Frequency__c = 'One-Time';
		orderItems[2].Purchase_Price__c = 3.0;
		orderItems[2].Quantity = 10;
		orderItems[2].OrderId = order.Id;

		CPQ2_OrderValidationUtil.OrderValidationResult result = CPQ2_OrderValidationUtil.validateOrderLineItems(orderItems);
		System.assertEquals(false, result.isSuccess);
	}
	*/
	
	@IsTest
	static void testValidationPass() {
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

		List<OrderItem> orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), 2);

		orderItems[0].Product2Id = pbe1.Product2Id;
		orderItems[0].Frequency__c = 'Monthly';
		orderItems[0].UnitPrice = 12.0;
		orderItems[0].Service_Price_Per_Unit__c = 11.0;
		orderItems[0].Quantity = 10;
		orderItems[0].OrderId = order.Id;
		orderItems[0].SurveyAssetCountChecker__c = 1;

		orderItems[1].Product2Id = pbe2.Product2Id;
		orderItems[1].Frequency__c = 'Weekly';
		orderItems[1].UnitPrice = 12.0;
		orderItems[1].Service_Price_Per_Unit__c = 150.0;
		orderItems[1].Quantity = 10;
		orderItems[1].OrderId = order.Id;
		orderItems[1].SurveyAssetCountChecker__c = 1;

		CPQ2_OrderValidationUtil.OrderValidationResult result = CPQ2_OrderValidationUtil.validateOrderLineItems(orderItems);
		System.assertEquals(true, result.isSuccess);
	}

}