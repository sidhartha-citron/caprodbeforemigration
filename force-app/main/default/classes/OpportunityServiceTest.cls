/**
 * @description
 *
 * Created by timothychiang on 2020-05-29.
 *
 */
@IsTest
public with sharing class OpportunityServiceTest {
	@TestSetup static void setup() {
		CPQ2_Service.isOppServiceActive = false;

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
		TestDataFactory.crtAcctContact(1, 1);
		TestDataFactory.crtSiteSurvey(1);
		TestDataFactory.crtOpportunities(1, TestDataFactory.accounts[0], TestDataFactory.contacts[0].Id, false);
	}

	@IsTest
	static void getOpportunityById() {
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		Opportunity oppList = OpportunityService.getOpportunityById(opp.Id);

		System.assertEquals(opp.Id,oppList.Id);
	}

	@IsTest
	static void getOpportunityMapsById() {
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		Map<Id, Opportunity> oppMap = OpportunityService.getOpportunitiesMapByIds(new Set<Id>{opp.Id});

		System.assertEquals(1,oppMap.size());
	}

	@IsTest
	static void testInsertUpdateOli() {
		CPQ2_Service.isOppServiceActive = false;
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		PricebookEntry pbe = [SELECT Id FROM PricebookEntry LIMIT 1];

		List<OpportunityLineItem> oppLineItems = new List<OpportunityLineItem>();

		OpportunityLineItem oppLineItem1 = new OpportunityLineItem();
		oppLineItem1.Product2Id = pbe.Id;
		oppLineItem1.Service_Frequency__c = 'Monthly';
		oppLineItem1.UnitPrice = 12.0;
		oppLineItem1.Service_Price_Per_Unit__c = 11.0;
		oppLineItem1.Quantity = 10;
		oppLineItem1.OpportunityId = opp.Id;
		oppLineItem1.SurveyAssetCountChecker__c = 1;
		oppLineItems.add(oppLineItem1);

		Database.SaveResult[] results = OpportunityService.insertOpportunityProducts(oppLineItems, true);
		System.assertEquals(true, results[0].isSuccess());

		oppLineItem1.UnitPrice = 13;

		Database.SaveResult[] results2 = OpportunityService.updateOpportunityProducts(oppLineItems, true);
		System.assertEquals(true, results2[0].isSuccess());

		List<OpportunityLineItem> listOpportunityLineItems = OpportunityService.getOpportunityProductsByOpportunityIds(new Set<Id>{opp.Id});
		System.assertEquals(1, listOpportunityLineItems.size());

		List<OpportunityLineItem> listOpportunityLineItems2 = OpportunityService.getOpportunityProductsByOpportunityIdsAndType(new Set<Id>{opp.Id}, 'Service');
		System.assertEquals(1, listOpportunityLineItems2.size());
	}

	@IsTest
	static void testDeleteOli() {
		CPQ2_Service.isOppServiceActive = false;
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		PricebookEntry pbe = [SELECT Id FROM PricebookEntry LIMIT 1];

		List<OpportunityLineItem> oppLineItems = new List<OpportunityLineItem>();

		OpportunityLineItem oppLineItem1 = new OpportunityLineItem();
		oppLineItem1.Product2Id = pbe.Id;
		oppLineItem1.Service_Frequency__c = 'Monthly';
		oppLineItem1.UnitPrice = 12.0;
		oppLineItem1.Service_Price_Per_Unit__c = 11.0;
		oppLineItem1.Quantity = 10;
		oppLineItem1.OpportunityId = opp.Id;
		oppLineItem1.SurveyAssetCountChecker__c = 1;
		oppLineItems.add(oppLineItem1);

		Database.SaveResult[] results = OpportunityService.insertOpportunityProducts(oppLineItems, false);
		System.assertEquals(true, results[0].isSuccess());

		Database.DeleteResult[] results2 = OpportunityService.deleteOpportunityProducts(oppLineItems, false);
		System.assertEquals(true, results2[0].isSuccess());
	}

	@IsTest
	static void testVmiServiceGetProductToVmiMapByAccountId() {
		Opportunity opp = [SELECT Id, AccountId FROM Opportunity LIMIT 1];
		Product2 prd = new Product2(name='testProd', VMI_Product__c = true);
		insert prd; 

		VMI_Product__c vmi = new VMI_Product__c(Par_Level__c = 1, Notes__c='test', Account__c=opp.AccountId, Product__c = prd.Id);

		insert vmi;

		VmiService.getProductToVmiMapByAccountId(new Set<Id>{opp.AccountId});
	}

	@IsTest
	static void testInsertUpdateVMI() {
		CPQ2_Service.isOppServiceActive = false;
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		PricebookEntry pbe = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];

		List<CPQ2_VMI_Request__c> vmiList = new List<CPQ2_VMI_Request__c>();

		CPQ2_VMI_Request__c vmiRequest = new CPQ2_VMI_Request__c();
		vmiRequest.CPQ2_Opportunity__c = opp.Id;
		vmiRequest.CPQ2_Product__c = pbe.Product2Id;
		vmiRequest.CPQ2_Pricebook_Entry_Id__c = pbe.Id;
		vmiRequest.CPQ2_Par_Level__c = 4;
		vmiList.add(vmiRequest);

		CPQ2_Service.isOppServiceActive = true;

		Database.SaveResult[] results = OpportunityService.insertVmiRequest(vmiList, true);
		System.assertEquals(true, results[0].isSuccess());

		vmiRequest.CPQ2_Par_Level__c = 13;

		Database.SaveResult[] results2 = OpportunityService.updateVmiRequest(vmiList, true);
		System.assertEquals(true, results2[0].isSuccess());

		Map<Id,CPQ2_VMI_Request__c> mapCpq2VMIRequests = OpportunityService.getVmiRequestMapByOpportunityId(opp.Id);
		System.assertEquals(1, mapCpq2VMIRequests.size());
	}

	@IsTest
	static void testDeleteVMI() {
		CPQ2_Service.isOppServiceActive = false;
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
		PricebookEntry pbe = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];

		List<CPQ2_VMI_Request__c> vmiList = new List<CPQ2_VMI_Request__c>();

		CPQ2_VMI_Request__c vmiRequest = new CPQ2_VMI_Request__c();
		vmiRequest.CPQ2_Opportunity__c = opp.Id;
		vmiRequest.CPQ2_Product__c = pbe.Product2Id;
		vmiRequest.CPQ2_Pricebook_Entry_Id__c = pbe.Id;
		vmiRequest.CPQ2_Par_Level__c = 4;
		vmiList.add(vmiRequest);

		CPQ2_Service.isOppServiceActive = true;

		Database.SaveResult[] results = OpportunityService.insertVmiRequest(vmiList, true);
		System.assertEquals(true, results[0].isSuccess());

		vmiRequest.CPQ2_Par_Level__c = 13;

		Database.DeleteResult[] results2 = OpportunityService.deleteVmiRequest(vmiList, true);
		System.assertEquals(true, results2[0].isSuccess());
	}

	@IsTest
	static void testInsertUpdateCoreListPriceRequest() {
		CPQ2_Service.isOppServiceActive = false;
		Opportunity opp = [SELECT Id, CPQ2_Date_Approved__c, stageName FROM Opportunity LIMIT 1];
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

		coreListPriceRequest.CPQ2_Requested_Price__c = 10;

		Database.SaveResult[] results2 = OpportunityService.updateCoreListPriceRequest(clpList, true);
		System.assertEquals(true, results2[0].isSuccess());

		Map<Id, CPQ2_Core_List_Price_Request__c> mapCpq2CLPRequests = OpportunityService.getContractPriceRequestMapByOpportunityId(opp.Id);
		System.assertEquals(1, mapCpq2CLPRequests.size());

		opp.CPQ2_Date_Approved__c = DateTime.now();

		update opp;

	}

	@IsTest
	static void testDeleteCoreListPriceRequest() {
		CPQ2_Service.isOppServiceActive = false;
		Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];
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

		coreListPriceRequest.CPQ2_Requested_Price__c = 10;

		Database.DeleteResult[] results2 = OpportunityService.deleteCoreListPriceRequest(clpList, true);
		System.assertEquals(true, results2[0].isSuccess());

	}
}