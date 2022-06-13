/**
 * @description service class for the account
 */
public with sharing class AccountService {

    /**
	 * @description
	 *
	 * @param targetId - target to query by
	 *
	 * @return target account based on Id
	 */
	public static Account getAccountById(Id targetId) {
		return getAccountMapByIds(new Set<Id>{
			targetId
		}).get(targetId);
	}

    /**
	 * @description
	 *
	 * @param targetIds target accounts to query by
	 *
	 * @return map of accounts based on target Ids
	 */
	public static Map<Id, Account> getAccountMapByIds(Set<Id> targetIds) {
		return new Map<Id, Account>([
			SELECT Id,
				Name,
				//Default_Warehouse_Location__c,
				ParentId,
				Parent.Name,
				Parent.ParentId,
				Parent.Parent.Name
			FROM Account
			WHERE Id IN:targetIds
		]);
	}

    /**
	 * @description
	 *
	 * @param accountList target accounts to save
	 * @param allOrNone switch to denote save type
	 *
	 * @return save results of updating the account
	 */
	public static Database.SaveResult[] updateAccounts(List<Account> accountList, Boolean allOrNone) {
		return ServiceUtil.generalUpdate(accountList, allOrNone);
	}
}