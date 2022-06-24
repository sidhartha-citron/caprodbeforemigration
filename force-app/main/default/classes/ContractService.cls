/**
 * @description service class for contracts
 */
public with sharing class ContractService {

	public static final String PARENT_RANK_ACCOUNT = 'Account';
	public static final String PARENT_RANK_PARENT = 'Parent Account';

    /**
	 * @description wrapper class for contract price AKA core list price
	 */
	public class ContractPriceWrapper {
		@AuraEnabled public CPQ2_ContractPrice__c cp;
		@AuraEnabled public String parentRank;

		public ContractPriceWrapper(CPQ2_ContractPrice__c cp, String parentRank) {
			this.cp = cp;
			this.parentRank = parentRank;
		}
	}

    /**
	 * @description wrapper class to hold a summary of core list prices
	 */
	public class ContractPricingSummary {
		@AuraEnabled public Id prodId;
		@AuraEnabled public CPQ2_ContractPrice__c lowestCP;
		@AuraEnabled public Decimal lowestApplicablePrice;
		@AuraEnabled public List<ContractPriceWrapper> applicablePricing;

        /**
		 * @description defined constructor
		 *
		 * @param cp contract price
		 * @param parentRank account parental ranking
		 */
		public ContractPricingSummary(CPQ2_ContractPrice__c cp, String parentRank) {
			this.prodId = cp.CPQ2_Product__c;
			this.lowestApplicablePrice = cp.CPQ2_Price__c;
			this.lowestCP = cp;
			this.applicablePricing = new List<ContractPriceWrapper>{
				new ContractPriceWrapper(cp, parentRank)
			};
		}

        /**
		 * @description helper method to add new contract pricing to the summary
		 *
		 * @param cp contract price
		 * @param parentRank account parental ranking
		 */
		private void addPricing(CPQ2_ContractPrice__c cp, String parentRank) {
			if (this.lowestCP.CPQ2_Account__c == cp.CPQ2_Account__c && cp.CPQ2_Price__c < this.lowestApplicablePrice) {
				this.lowestApplicablePrice = cp.CPQ2_Price__c;
				this.lowestCP = cp;
			}

			this.applicablePricing.add(new ContractPriceWrapper(cp, parentRank));
		}
	}

    /**
	 * @description handle inserting of contracts
	 *
	 * @param listContracts list of contracts to insert
	 * @param allOrNone all or none flag
	 *
	 * @return save result
	 */
	public static Database.SaveResult[] insertContracts(List<Contract> listContracts, Boolean allOrNone) {
		return ServiceUtil.generalInsert(listContracts, allOrNone);
	}

	/**
	 * @description handle updating of contracts
	 *
	 * @param listContracts list of contracts to update
	 * @param allOrNone all or none flag
	 *
	 * @return save result
	 */
	public static Database.SaveResult[] updateContracts(List<Contract> listContracts, Boolean allOrNone) {
		return ServiceUtil.generalUpdate(listContracts, allOrNone);
	}

    /**
	 * @description handle upserting of contract prices aka core list pricing
	 *
	 * @param listContractPrices list of contract prices to insert
	 * @param allOrNone  all or none flag
	 *
	 * @return save result
	 */
	public static Database.UpsertResult[] insertContractPrices(List<CPQ2_ContractPrice__c> listContractPrices, Boolean allOrNone) {
        Schema.SObjectField externalId = CPQ2_ContractPrice__c.CPQ2_External_Id__c;
        System.debug('~~' + listContractPrices);
		return ServiceUtil.generalUpsert(listContractPrices,externalId,allOrNone);
	}

	/**
	 * @description get contracts by account Ids
	 *
	 * @param targetIds -  target account Ids
	 *
	 * @return Map of contracts
	 */
	public static Map<Id, Contract> getContractsByAccountIds(Set<Id> targetIds) {
		return new Map<Id, Contract>([
			SELECT Id,
					AccountId
			FROM Contract
			WHERE AccountId IN:targetIds
		]);
	}

    /**
	 * @description get contract pricing by contract Ids and contract status
	 *
	 * @param targetIds - target contract Ids
	 * @param Status - contract status
	 *
	 * @return Map of contract prices
	 */
	public static Map<Id, CPQ2_ContractPrice__c> getContractPricingByContractIdsAndStatus(Set<Id> targetIds, String Status) {
		return new Map<Id, CPQ2_ContractPrice__c>([
			SELECT Id,
				CPQ2_Price__c,
				CPQ2_Product__c,
				CPQ2_Account__c,
				CPQ2_Contract__c,
				CPQ2_Contract__r.ContractNumber,
				CPQ2_Contract__r.StartDate,
				CPQ2_Contract__r.EndDate,
				CPQ2_Contract__r.Account.Name
			FROM CPQ2_ContractPrice__c
			WHERE CPQ2_Contract__c IN:targetIds AND
			CPQ2_Active__c = true AND
			CPQ2_Contract__r.Status = :Status
		]);
	}

    /**
	 * @description get contract pricing by account
	 *
	 * @param accountId - target account Id to get contract pricing
	 *
	 * @return map of contract pricing by product Id
	 */
	public static Map<Id, ContractPricingSummary> getContractPricing(Id accountId) {
		Map<Id, Map<Id, List<CPQ2_ContractPrice__c>>> productToAccountToPricing;
		Account acc = AccountService.getAccountById(accountId);

		Id accountParentId = null;
		Set<Id> accountIds = new Set<Id>();

		accountIds.add(accountId);
		if (String.isNotEmpty(acc.ParentId)) {
			accountParentId = acc.ParentId;
			accountIds.add(accountParentId);
		}

		productToAccountToPricing = getProductPriceMap(accountIds);

		Map<Id, ContractPricingSummary> prodPricingMap = new Map<Id, ContractPricingSummary>();

		for (Map<Id, List<CPQ2_ContractPrice__c>> accountMap : productToAccountToPricing.values()) {
			populatePriceMap(accountMap, prodPricingMap, accountId, PARENT_RANK_ACCOUNT);
			populatePriceMap(accountMap, prodPricingMap, accountParentId, PARENT_RANK_PARENT);
		}

		return prodPricingMap;
	}

    /**
	 * @description get Map of Product Id--> Map AccountId-->List of Contract Prices
	 *
	 * @param accountIds target accountIds
	 *
	 * @return Map of Product Id--> Map AccountId-->List of Contract Prices
	 */
	private static Map<Id, Map<Id, List<CPQ2_ContractPrice__c>>> getProductPriceMap(Set<Id> accountIds) {
		Map<Id, Map<Id, List<CPQ2_ContractPrice__c>>> productToAccountToPricing = new Map<Id, Map<Id, List<CPQ2_ContractPrice__c>>>();

		List<Contract> contracts = ContractService.getContractsByAccountIds(accountIds).values();

		Set<Id> contractIds = new Set<Id>();
		for (Contract contract : contracts) {
			contractIds.add(contract.Id);
		}

		List<CPQ2_ContractPrice__c> contractPricing = ContractService.getContractPricingByContractIdsAndStatus(contractIds, 'Activated').values();

		for (CPQ2_ContractPrice__c cp : contractPricing) {
			if (!productToAccountToPricing.containsKey(cp.CPQ2_Product__c)) {
				productToAccountToPricing.put(cp.CPQ2_Product__c, new Map<Id, List<CPQ2_ContractPrice__c>>());
			}

			Map<Id, List<CPQ2_ContractPrice__c>> accountMap = productToAccountToPricing.get(cp.CPQ2_Product__c);

			if (!accountMap.containsKey(cp.CPQ2_Account__c)) {
				accountMap.put(cp.CPQ2_Account__c, new List<CPQ2_ContractPrice__c>());
			}

			accountMap.get(cp.CPQ2_Account__c).add(cp);
		}

		return productToAccountToPricing;
	}

    /**
	 * @description helper function to convert the querying results of the accountMaps into a map of Contract Price Summaries
	 *
	 * @param accountMap - from target account type
	 * @param prodPricingMap - price map to populate/enhance
	 * @param accountId  - target account
	 * @param parentRank - definition of the account's parental rank
	 */
	private static void populatePriceMap(Map<Id, List<CPQ2_ContractPrice__c>> accountMap, Map<Id, ContractPricingSummary> prodPricingMap, Id accountId, String parentRank) {
		if (accountMap.containsKey(accountId)) {
			for (CPQ2_ContractPrice__c cp : accountMap.get(accountId)) {
				if (!prodPricingMap.containsKey(cp.CPQ2_Product__c)) {
					prodPricingMap.put(cp.CPQ2_Product__c, new ContractPricingSummary(cp, parentRank));
				} else {
					prodPricingMap.get(cp.CPQ2_Product__c).addPricing(cp, parentRank);
				}
			}
		}
	}

    /**
	 * @description handle the generation of a new contract
	 *
	 * @param accountId - parent account
	 * @param startDate - contract's start date
	 * @param term - contract's term
	 *
	 * @return new contract
	 */
	public static Contract createNewContract(Id accountId, Date startDate, Integer term) {
		Contract newContract = new Contract();
		newContract.AccountId = accountId;
		newContract.Status = 'Draft';
		newContract.StartDate = startDate;
		newContract.ContractTerm = term;

		return newContract;
	}

    /**
	 * @description handle the generation of a new contract price
	 *
	 * @param productId - target product id
	 * @param price - contract price
	 * @param contractId - parent contract
	 *
	 * @return new contract price
	 */
	public static CPQ2_ContractPrice__c createNewContractPrice(Id productId, Decimal price, Id contractId) {
		CPQ2_ContractPrice__c contractPrice = new CPQ2_ContractPrice__c();
		contractPrice.CPQ2_Product__c = productId;
		contractPrice.CPQ2_Price__c = price;
		contractPrice.CPQ2_Active__c = true;
		contractPrice.CPQ2_Contract__c = contractId;
		contractPrice.CPQ2_External_Id__c = String.valueOf(contractId).substring(0, 15) + '-' + String.valueOf(productId).substring(0, 15);
        System.debug('~~' + contractPrice.CPQ2_External_Id__c);
		return contractPrice;
	}

}