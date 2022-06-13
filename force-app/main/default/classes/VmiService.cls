/**
 * @description
 *
 * Created by timothychiang on 2020-04-25.
 *
 */

/**
 * @description Service class to handle SOQL and DML for the VMI SObject and related SObjects
 */
public with sharing class VmiService {

	/**
	 * @description get VMI map by account Id
	 *
	 * @param targetIds - target account
	 *
	 * @return Map VMI Id-->VMI
	 */
	public static Map<Id, Map<Id, VMI_Product__c>> getProductToVmiMapByAccountId(Set<Id> targetIds) {
		List<VMI_Product__c> listVmiProducts = [
			SELECT Id,
				Account__c,
				Product__c,
				Par_Level__c
			FROM VMI_Product__c
			WHERE Account__c IN:targetIds
		];

		Map<Id, Map<Id, VMI_Product__c>> returnMap = new Map<Id, Map<Id, VMI_Product__c>>();

		for (VMI_Product__c vmi : listVmiProducts) {
			if (!returnMap.containsKey(vmi.Account__c)) {
				returnMap.put(vmi.Account__c, new Map<Id, VMI_Product__c>());
			}

			returnMap.get(vmi.Account__c).put(vmi.Product__c, vmi);
		}

		return returnMap;
	}

	/**
	 * @description handle VMI insert
	 *
	 * @param listVmi - vmi to insert
	 * @param allOrNone - all or none switch
	 *
	 * @return return DML results
	 */
	public static Database.SaveResult[] insertVmiProduct(List<VMI_Product__c> listVmi, Boolean allOrNone) {
		return ServiceUtil.generalInsert(listVmi, allOrNone);
	}

	/**
 * @description handle VMI update
 *
 * @param listVmi - vmi to update
 * @param allOrNone - all or none switch
 *
 * @return return DML results
 */
	public static Database.SaveResult[] updateVmiProduct(List<VMI_Product__c> listVmi, Boolean allOrNone) {
		return ServiceUtil.generalUpdate(listVmi, allOrNone);
	}
}