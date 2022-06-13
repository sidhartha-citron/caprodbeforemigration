/**
 * @description Test class for CPQ2_Service
 *
 * Created by timothychiang on 2020-04-01.
 *
 */
@IsTest
public with sharing class CPQ2_ServiceOpportunityTest {
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
		TestDataFactory.crtOperatingHrs();

		
		Id billToAcctRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Bill To').getRecordTypeId(); 
        Id ShipToAcctRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Ship To').getRecordTypeId(); 
        List<Account> accounts = new List<Account>();
        
        TestDataFactory.crtAcctContact(2, 1);
        accounts = TestDataFactory.accounts;
         
        Schema.Location loc = new Schema.Location();
        loc.Name = 'Test Location';
        loc.LocationType = 'Warehouse';
        
        insert loc;
        
        // Test the scenario If the Account has a Parent and the Parent is a Bill To Account
        TestDataFactory.accounts[0].parentId = TestDataFactory.accounts[1].Id;
        TestDataFactory.accounts[0].RecordTypeId = ShipToAcctRecTypeId;
        TestDataFactory.accounts[0].Type = 'Customer';
        //TestDataFactory.accounts[0].Ship_To_Location__c = '001';
        //TestDataFactory.accounts[0].Default_Warehouse_Location__c = loc.Id;
        TestDataFactory.accounts[1].RecordTypeId = billToAcctRecTypeId;
        //TestDataFactory.accounts[1].Ship_To_Location__c = '001';
        TestDataFactory.accounts[1].Type = 'Customer';
        TestDataFactory.accounts[1].isParent__c = true;
        update TestDataFactory.accounts[1];
		update TestDataFactory.accounts[0];
		
		//TestDataFactory.crtProdWithPE(4);
		//TestDataFactory.crtAcctContact(1, 1);
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

		OpportunityLineItem oppLineItem3= new OpportunityLineItem();
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
	static void testEditOli() {
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		Product2 prod = [SELECT Id FROM Product2 WHERE Name='TestProduct3'];
		OpportunityLineItem oli = [SELECT Id FROM OpportunityLineItem WHERE Product2Id =: prod.Id];

		oli.Service_Frequency__c = 'Monthly';
		oli.Quantity = 100;

		Test.startTest();
		update oli;
		Test.stopTest();

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(opp.Id);
		System.assertEquals(32838.24,entity.header.totalAnnualCost);
		System.assertEquals(85920,entity.header.totalAnnualRevenue);
		System.assertEquals(54,entity.header.highestFrequency);
	}

	@IsTest
	static void testCreateOli() {
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(opp.Id);
		System.assertEquals(31593.619000,entity.header.totalAnnualCost);
		System.assertEquals(82350,entity.header.totalAnnualRevenue);
		System.assertEquals(54,entity.header.highestFrequency);
	}

	@IsTest
	static void testDeleteOli() {
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		Product2 prod = [SELECT Id FROM Product2 WHERE Name='TestProduct3'];
		OpportunityLineItem oli = [SELECT Id FROM OpportunityLineItem WHERE Product2Id =: prod.Id];

		Test.startTest();
		delete oli;
		Test.stopTest();

		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItems(opp.Id);
		System.assertEquals(31583.16,entity.header.totalAnnualCost);
		System.assertEquals(82320,entity.header.totalAnnualRevenue);
		System.assertEquals(54,entity.header.highestFrequency);
	}

	@IsTest
	static void testGetLineItems(){
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		CPQ2_Wrapper.CpqEntity entity = CPQ2_Service.getHeaderAndLineItemsWithProductInfo(opp.Id);

		System.assertNotEquals(null,entity);
		System.assertEquals(3,entity.lineItems.size());
	}

	@IsTest
	static void testGetLineItemsNegative(){
		Map<Id, CPQ2_Wrapper.CpqEntity> entityMap = CPQ2_Service.getHeadersAndLineItemsMap(null, false);

		System.assertEquals(null, entityMap);
	}

	@isTest
	static void testOpportunitySigned(){
		CPQ2_Service.isOppServiceActive = false;
		Opportunity opp = [SELECT Id, CPQ2_Date_Approved__c, stageName, AccountId FROM Opportunity LIMIT 1];
		Opportunity oppNew = [SELECT Id, CPQ2_Date_Approved__c, stageName, AccountId FROM Opportunity LIMIT 1];
		PricebookEntry pbe = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];

		List<CPQ2_Core_List_Price_Request__c> clpList = new List<CPQ2_Core_List_Price_Request__c>();

		CPQ2_Core_List_Price_Request__c coreListPriceRequest = new CPQ2_Core_List_Price_Request__c();
		coreListPriceRequest.CPQ2_Opportunity__c = opp.Id;
		coreListPriceRequest.CPQ2_Product__c = pbe.Product2Id;
		coreListPriceRequest.CPQ2_Pricebook_Entry_Id__c = pbe.Id;
		coreListPriceRequest.CPQ2_Requested_Price__c = 5;
		coreListPriceRequest.CPQ2_List_Price__c = 4;
		clpList.add(coreListPriceRequest);

		CPQ2_Service.isOppServiceActive = true;

		Database.SaveResult[] results = OpportunityService.insertCoreListPriceRequest(clpList, true);
		System.assertEquals(true, results[0].isSuccess());
		List<Opportunity> listNew = new List<Opportunity>();
		
		Map<Id, Opportunity> mapOld = new Map<Id, Opportunity>();
		mapOld.put(opp.Id, opp);

		Test.startTest();

		
		oppNew.CPQ2_Date_Approved__c = DateTime.now();
		oppNew.stageName = 'Signed';
		listNew.add(oppNew);

		CPQ2_Service.convertOpportunityCoreListPriceRequests(listNew, mapOld);
		
		Test.stopTest();
	}
}