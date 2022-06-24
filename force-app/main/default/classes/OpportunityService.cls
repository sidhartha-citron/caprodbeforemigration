/**
 * @description Service class to handle SOQL and DML of the opportunity SObject and related SObjects
 */
public with sharing class OpportunityService {

	/**
	 * @description get opportunity by Id
	 *
	 * @param targetId - opportunity Id
	 *
	 * @return target opportunity
	 */
	public static Opportunity getOpportunityById(Id targetId) {
		List<Opportunity> targetList = getOpportunityByIds(new Set<Id>{
			targetId
		});

		if (!targetList.isEmpty()) {
			return targetList[0];
		} else {
			return null;
		}
	}

	/**
	 * @description get opportunities by target Ids
	 *
	 * @param targetIds - target opportunity Ids
	 *
	 * @return list of opportunities based on target Ids.
	 */
	public static List<Opportunity> getOpportunityByIds(Set<Id> targetIds) {
		return [
			SELECT Id,
				Name,
				Type,
				CloseDate,
				StageName,
				Pricebook2Id,
				CPQ2_TAC__c,
				CPQ2_HF__c,
				CPQ2_TAR__c,
				CPQ2_FAS__c,
				CPQ2_HC__c,
				CPQ2_CLT__c,
				CPQ2_TCaC__c,
				CPQ2_SSA__c,
				CPQ2_CTAS__c,
				Account.Id,
				Account.Name,
				Account.CPQ2_TCaC__c,
				Account.CPQ2_TOAR__c,
				Account.CPQ2_TOAC__c,
				Account.CPQ2_HF__c,
				Account.CPQ2_CSBSM__c,
				Account.CPQ2_DAF__c,
				Account.CPQ2_DOR__c,
				Account.Ship_Complete__c,
				//Account.CPQ2_DSA__c,
				Account.CPQ2_HSO__c,
				Account.FSA_Mapping__c,
				Account.FSA_Mapping__r.FSA__c,
				Account.FSA_Mapping__r.CPQ_Service_Zone__c,
				Account.FSA_Mapping__r.CPQ_Distance_Adj_Factor__c,
				Account.FSA_Mapping__r.CPQ_Service_Branch__c,
				Account.FSA_Mapping__r.CPQ_Service_Branch__r.CPQ_Average_Cost_Minute__c,
				Account.FSA_Mapping__r.CPQ_Service_Branch__r.CPQ_Average_Drive_Stem_Cost__c,
				Account.FSA_Mapping__r.CPQ_Service_Branch__r.CPQ_Direct_Cost_of_Revenue__c

			FROM Opportunity
			WHERE Id IN:targetIds
		];
	}

	/**
	 * @description get opportunties by target Ids in map form
	 *
	 * @param targetIds - opportunity Ids to target
	 *
	 * @return Map of Opportunity Id-->Opportunity
	 */
	public static Map<Id, Opportunity> getOpportunitiesMapByIds(Set<Id> targetIds) {
		Map<Id, Opportunity> opportunityMap = new Map<Id, Opportunity>();
		opportunityMap.putAll(getOpportunityByIds(targetIds));
		return opportunityMap;
	}

	/**
	 * @description get opportunity line items by opportunity Ids and Type in Map form
	 *
	 * @param targetIds - target opportunity ids
	 * @param type - target type
	 *
	 * @return Map Opportunity Id-->Opportunity
	 */
	public static Map<Id, List<OpportunityLineItem>> getOpportunityProductsByOpportunityIdsAndTypeMap(Set<Id> targetIds, String type) {

		Map<Id, List<OpportunityLineItem>> oppToOliMap = new Map<Id, List<OpportunityLineItem>>();
		List<OpportunityLineItem> oliList;
		System.debug('Sanchivan type: ' + type);

		if (String.isEmpty(type)) {
			System.debug('Sanchivan getOpportunityProductsByOpportunityIds called');
			oliList = getOpportunityProductsByOpportunityIds(targetIds);
		} else {
			System.debug('Sanchivan getOpportunityProductsByOpportunityIdsAndType called');
			oliList = getOpportunityProductsByOpportunityIdsAndType(targetIds, type);
		}

		System.debug('Sanchivan oliList: ' + oliList);

		for (OpportunityLineItem oli : oliList) {
			if (!oppToOliMap.containsKey(oli.OpportunityId)) {
				oppToOliMap.put(oli.OpportunityId, new List<OpportunityLineItem>());
			}

			oppToOliMap.get(oli.OpportunityId).add(oli);
		}

		return oppToOliMap;

	}

	/**
	 * @description Get opportunity line items by opportunity Ids
	 *
	 * @param targetIds - target opportunity ids
	 *
	 * @return Map Opportunity Id-->Opportunity
	 */
	public static Map<Id, List<OpportunityLineItem>> getOpportunityProductsByOpportunityIdsMap(Set<Id> targetIds) {
		return getOpportunityProductsByOpportunityIdsAndTypeMap(targetIds, null);
	}

	/**
	 * @description get Opportunity line items by opportunity Ids
	 *
	 * @param targetIds - target Ids
	 *
	 * @return list of opportunity line items
	 */
	public static List<OpportunityLineItem> getOpportunityProductsByOpportunityIds(Set<Id> targetIds) {
		System.debug('Sanchivan getOpportunityProductsByOpportunityIds entered');
		return [
			SELECT Id,
				OpportunityId,
				Opportunity.RecordType.Name,
				Description,
				Service_Frequency__c,
				Quantity,
				Service_Price_Per_Unit__c,
				Purchase_Price__c,
				Installation_Price__c,
				Installation_Status__c,
				Installation_Notes__c,
				Item_Type__c,
				Related_Product__c,
				PricebookEntryId,
				PricebookEntry.UnitPrice,
				CPQ2_Duration_In_Minutes__c,
				CPQ2_Material_Cost__c,
				CPQ2_Number_Of_Visits_Per_Year__c,
				CPQ2_Average_Cost_Minute__c,
				CPQ2_Total_Costs__c,
				CPQ2_Total_Revenue__c,
				CPQ2_Line_Margin__c,
				CPQ2_isRecurring__c,
				CPQ2_Last_Approved_Purchase_Price__c,
				CPQ2_Total_Capital_Charge__c,
				CPQ2_Amortization__c,
				CPQ2_Capital_Cost__c,
				Areas_of_Coverage__c,
				Areas_of_Coverage_Other__c,
				Covered_Pests__c,
				Covered_Pests_Other__c,
				Total_Monthly_Revenue__c,
				Product2Id,
				Product2.Name,
				Product2.Item_Type__c,
				Product2.Product_Image_URL__c,
				Product2.ProductCode,
				Product2.Family,
				Product2.Allowable_Frequencies__c,
				Product2.Category_Description__c,
				Related_Product__r.Name
			FROM OpportunityLineItem
			WHERE OpportunityId IN:targetIds
		];
	}

	/**
	 * @description get opportunity lineItems by targetIds and type
	 *
	 * @param targetIds - target opportunity Ids
	 * @param type - target type
	 *
	 * @return list of opportunity line items
	 */
	public static List<OpportunityLineItem> getOpportunityProductsByOpportunityIdsAndType(Set<Id> targetIds, String type) {
		return [
			SELECT Id,
				OpportunityId,
				Opportunity.RecordType.Name,
				Description,
				Service_Frequency__c,
				Quantity,
				Service_Price_Per_Unit__c,
				Purchase_Price__c,
				Installation_Price__c,
				Installation_Status__c,
				Installation_Notes__c,
				Item_Type__c,
				Related_Product__c,
				PricebookEntryId,
				PricebookEntry.UnitPrice,
				Areas_of_Coverage__c,
				Areas_of_Coverage_Other__c,
				Covered_Pests__c,
				Covered_Pests_Other__c,
				CPQ2_Duration_In_Minutes__c,
				CPQ2_Material_Cost__c,
				CPQ2_Number_Of_Visits_Per_Year__c,
				CPQ2_Average_Cost_Minute__c,
				CPQ2_Total_Costs__c,
				CPQ2_Total_Revenue__c,
				CPQ2_Line_Margin__c,
				CPQ2_Last_Approved_Purchase_Price__c,
				CPQ2_isRecurring__c,
				CPQ2_Total_Capital_Charge__c,
				CPQ2_Amortization__c,
				CPQ2_Capital_Cost__c,
				Total_Monthly_Revenue__c,
				Product2Id,
				Product2.Name,
				Product2.Item_Type__c,
				Product2.Product_Image_URL__c,
				Product2.ProductCode,
				Product2.Family,
				Product2.Allowable_Frequencies__c,
				Product2.Category_Description__c,
				Related_Product__r.Name
			FROM OpportunityLineItem
			WHERE OpportunityId IN:targetIds AND
			Item_Type__c = :type
		];
	}

	/**
	 * @description get vmi requests by opportunity Ids
	 *
	 * @param targetIds - target opportunity ids
	 *
	 * @return Map Opportunity ID--> Map Product ID --> VMI Request
	 */
	public static Map<Id, Map<Id, CPQ2_VMI_Request__c>> getVmiRequestsByOpportunityIds(Set<Id> targetIds) {

		List<CPQ2_VMI_Request__c> returnList = [
			SELECT Id,
				CPQ2_Par_Level__c,
				CPQ2_Product__c,
				CPQ2_Opportunity__c,
				CPQ2_Pricebook_Entry_Id__c
			FROM CPQ2_VMI_Request__c
			WHERE CPQ2_Opportunity__c IN:targetIds
		];

		Map<Id, Map<Id, CPQ2_VMI_Request__c>> returnMap = new Map<Id, Map<Id, CPQ2_VMI_Request__c>>();

		for (CPQ2_VMI_Request__c vr : returnList) {
			if (!returnMap.containsKey(vr.CPQ2_Opportunity__c)) {
				returnMap.put(vr.CPQ2_Opportunity__c, new Map<Id, CPQ2_VMI_Request__c>());
			}

			returnMap.get(vr.CPQ2_Opportunity__c).put(vr.CPQ2_Product__c, vr);
		}

		return returnMap;

	}

	/**
	 * @description get VMI request map by opportunity
	 *
	 * @param targetId - target opportunity
	 *
	 * @return Map of product Id-->vmi request
	 */
	public static Map<Id, CPQ2_VMI_Request__c> getVmiRequestMapByOpportunityId(Id targetId) {
		Map<Id, Map<Id, CPQ2_VMI_Request__c>> resultMap = getVmiRequestsByOpportunityIds(new Set<Id>{
			targetId
		});
		Map<Id, CPQ2_VMI_Request__c> returnMap = new Map<Id, CPQ2_VMI_Request__c>();

		if (resultMap.containsKey(targetId)) {
			returnMap = resultMap.get(targetId);
		}

		return returnMap;
	}

	/**
	 * @description get core list price request by opportunity ids
	 *
	 * @param targetIds - target opportunity ids
	 *
	 * @return Map Opportunity Id--> Map Product Id --> core list price request
	 */
	public static Map<Id, Map<Id, CPQ2_Core_List_Price_Request__c>> getContractPriceRequestByOpportunityIds(Set<Id> targetIds) {
		List<CPQ2_Core_List_Price_Request__c> returnList = [
			SELECT Id,
				CPQ2_Opportunity__c,
				CPQ2_List_Price__c,
				CPQ2_Requested_Price__c,
				CPQ2_Product__c,
				CPQ2_VMI_Request__c,
				CPQ2_Pricebook_Entry_Id__c,
				CPQ2_Is_VMI__c,
				CPQ2_Approved_Core_List_Price__c
			FROM CPQ2_Core_List_Price_Request__c
			WHERE CPQ2_Opportunity__c IN:targetIds
		];


		Map<Id, Map<Id, CPQ2_Core_List_Price_Request__c>> returnMap = new Map<Id, Map<Id, CPQ2_Core_List_Price_Request__c>>();

		for (CPQ2_Core_List_Price_Request__c cr : returnList) {
			if (!returnMap.containsKey(cr.CPQ2_Opportunity__c)) {
				returnMap.put(cr.CPQ2_Opportunity__c, new Map<Id, CPQ2_Core_List_Price_Request__c>());
			}

			returnMap.get(cr.CPQ2_Opportunity__c).put(cr.CPQ2_Product__c, cr);
		}

		return returnMap;
	}
    
	/**
	 * @description get contract price request by opportunity id
	 *
	 * @param targetId - target opportunity Id
	 *
	 * @return Map Product Id-->Opportunity Id
	 */
	public static Map<Id, CPQ2_Core_List_Price_Request__c> getContractPriceRequestMapByOpportunityId(Id targetId) {
		Map<Id, Map<Id, CPQ2_Core_List_Price_Request__c>> resultMap = getContractPriceRequestByOpportunityIds(new Set<Id>{
			targetId
		});
		Map<Id, CPQ2_Core_List_Price_Request__c> returnMap = new Map<Id, CPQ2_Core_List_Price_Request__c>();

		if (resultMap.containsKey(targetId)) {
			returnMap = resultMap.get(targetId);
		}

		return returnMap;
	}

	/**
	 * @description handle update for opportunities
	 *
	 * @param opportunityList - opportunities to save
	 * @param allOrNone - all of none option
	 *
	 * @return DML results
	 */
	public static Database.SaveResult[] updateOpportunities(List<Opportunity> opportunityList, Boolean allOrNone) {
		return ServiceUtil.generalUpdate(opportunityList, allOrNone);
	}

	/**
	 * @description  handle insert for opportunity line items
	 *
	 * @param listOpportunityProducts - opportunity line items to save
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.SaveResult[] insertOpportunityProducts(List<OpportunityLineItem> listOpportunityProducts, Boolean allOrNone) {
		return ServiceUtil.generalInsert(listOpportunityProducts, allOrNone);
	}

	/**
	 * @description  handle update for opportunity line items
	 *
	 * @param listOpportunityProducts - opportunity line items to save
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.SaveResult[] updateOpportunityProducts(List<OpportunityLineItem> listOpportunityProducts, Boolean allOrNone) {
		return ServiceUtil.generalUpdate(listOpportunityProducts, allOrNone);
	}

	/**
	 * @description  handle delete for opportunity line items
	 *
	 * @param listOpportunityProducts - opportunity line items to delete
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.DeleteResult[] deleteOpportunityProducts(List<OpportunityLineItem> listOpportunityProducts, Boolean allOrNone) {
		return ServiceUtil.generalDelete(listOpportunityProducts, allOrNone);
	}

	/**
	 * @description  handle insert for core list price requests
	 *
	 * @param listCoreListPriceRequest - core list price requests to save
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.SaveResult[] insertCoreListPriceRequest(List<CPQ2_Core_List_Price_Request__c> listCoreListPriceRequest, Boolean allOrNone) {
		return ServiceUtil.generalInsert(listCoreListPriceRequest, allOrNone);
	}

	/**
	 * @description  handle update for core list price requests
	 *
	 * @param listCoreListPriceRequest - core list price requests to save
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.SaveResult[] updateCoreListPriceRequest(List<CPQ2_Core_List_Price_Request__c> listCoreListPriceRequest, Boolean allOrNone) {
		return ServiceUtil.generalUpdate(listCoreListPriceRequest, allOrNone);
	}

	/**
	 * @description  handle delete for core list price requests
	 *
	 * @param listCoreListPriceRequest - core list price requests to delete
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.DeleteResult[] deleteCoreListPriceRequest(List<CPQ2_Core_List_Price_Request__c> listCoreListPriceRequest, Boolean allOrNone) {
		return ServiceUtil.generalDelete(listCoreListPriceRequest, allOrNone);
	}

	/**
	 * @description  handle insert for vmi requests
	 *
	 * @param listVmiRequest - vmi to save
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.SaveResult[] insertVmiRequest(List<CPQ2_VMI_Request__c> listVmiRequest, Boolean allOrNone) {
		return ServiceUtil.generalInsert(listVmiRequest, allOrNone);
	}

	/**
	 * @description  handle update for vmi requests
	 *
	 * @param listVmiRequest - vmi to save
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.SaveResult[] updateVmiRequest(List<CPQ2_VMI_Request__c> listVmiRequest, Boolean allOrNone) {
		return ServiceUtil.generalUpdate(listVmiRequest, allOrNone);
	}

	/**
	 * @description  handle delete for vmi requests
	 *
	 * @param listVmiRequest - vmi to delete
	 * @param allOrNone - all of none option
	 *
	 * @return  DML results
	 */
	public static Database.DeleteResult[] deleteVmiRequest(List<CPQ2_VMI_Request__c> listVmiRequest, Boolean allOrNone) {
		return ServiceUtil.generalDelete(listVmiRequest, allOrNone);
	}

	/**
	 * @description retrive category multiplier values for commission calculation
	 * 
	 * @return List of Multiplier records
	 */
	public static List<CPQ_Multiplier_Table__c> getCatMultipliers(){
		List<CPQ_Multiplier_Table__c> lstMultiTbl = [SELECT Id, CPQ_Active_As_Of_Date__c, CPQ_Multiplier_Category__c, 
															CPQ_Multiplier_Type__c, CPQ_Multiplier__c
													 FROM CPQ_Multiplier_Table__c ORDER BY LASTMODIFIEDDATE];

		System.debug('--' + lstMultiTbl);
		return lstMultiTbl;
	}


	/**
	 * @description get list of score multipliers
	 * 
	 * @return List of score multipliers 
	 */
	public static List<CPQ2_Score_Multiplier__c> getScoreMultipliers(){
		List<CPQ2_Score_Multiplier__c> lstScoreTbl = [SELECT Id, CPQ2_Score_From__c, CPQ2_Score_To__c, CPQ2_Multiplier__c
													  FROM CPQ2_Score_Multiplier__c];
		
		System.debug('--' + lstScoreTbl);
		return lstScoreTbl;
	}

	/**
	* @description get opportunity record type
	* 
	* @return String 
	**/
	public static String getOppRecordType(String oppid){
		Opportunity opp = [SELECT Id, RecordType.Name FROM Opportunity WHERE ID=:oppid];
		return opp.RecordType.Name;
	}
}