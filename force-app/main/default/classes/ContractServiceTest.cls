/**
 * @description
 *
 * Created by timothychiang on 2020-05-29.
 *
 */
@IsTest
public with sharing class ContractServiceTest {

	@TestSetup static void setup(){
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
		TestDataFactory.crtFieldSettings();
		//TestDataFactory.crtFieldServiceSetting();

		//TestDataFactory.crtProdWithPE(4);
		TestDataFactory.crtAcctContact(1, 1);

	}

	@IsTest
	static void testCreateAndUpdateContract() {

		Account account = [SELECT Id FROM Account];
		Contract newContract = ContractService.createNewContract(account.Id, Date.today(), 12);
		Database.SaveResult[] results = ContractService.insertContracts(new List<Contract>{newContract}, false);
		System.assertEquals(true, results[0].isSuccess());

		newContract.ContractTerm = 24;
		Database.SaveResult[] results2 = ContractService.updateContracts(new List<Contract>{newContract}, false);
		System.assertEquals(true, results2[0].isSuccess());
	}

	@IsTest
	static void testGetContractsByAccountIds() {

		Account account = [SELECT Id FROM Account];
		Contract newContract = ContractService.createNewContract(account.Id, Date.today(), 12);
		Database.SaveResult[] results = ContractService.insertContracts(new List<Contract>{newContract}, false);
		System.assertEquals(true, results[0].isSuccess());

		Map<Id, Contract> accountToContractMap = ContractService.getContractsByAccountIds(new Set<Id>{account.Id});
		System.assertEquals(1, accountToContractMap.size());
	}

	@IsTest
	static void testCreateContractPricingAndRetrieval() {

		Account account = [SELECT Id FROM Account];
		Contract newContract = ContractService.createNewContract(account.Id, Date.today(), 12);
		Database.SaveResult[] results = ContractService.insertContracts(new List<Contract>{newContract}, false);
		System.assertEquals(true, results[0].isSuccess());

		newContract.Status = 'Activated';
		Database.SaveResult[] results2 = ContractService.updateContracts(new List<Contract>{newContract}, false);
		System.assertEquals(true, results2[0].isSuccess());

		Product2 prod = [SELECT Id FROM Product2 WHERE Name='TestProduct3'];
		CPQ2_ContractPrice__c cp = ContractService.createNewContractPrice(prod.Id, 12, newContract.Id);
		System.assertEquals(12, cp.CPQ2_Price__c);

		Database.UpsertResult[] results3 = ContractService.insertContractPrices(new List<CPQ2_ContractPrice__c>{cp}, false);
		System.assertEquals(true, results3[0].isSuccess());

		Map<Id, CPQ2_ContractPrice__c> mapContractPrice =  ContractService.getContractPricingByContractIdsAndStatus(new Set<Id>{newContract.Id}, 'Activated');
		System.assertEquals(1, mapContractPrice.size());

		Map<Id, ContractService.ContractPricingSummary> contractPricingMap = ContractService.getContractPricing(account.Id);
		System.assertEquals(1, contractPricingMap.size());
	}
}