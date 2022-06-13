/**
 * @description
 *
 * Created by timothychiang on 2020-05-08.
 *
 */

public with sharing class CPQ2_ScreenController {

	/**
	 * @description wrapper class for custom settings
	 */
	public class CustomSettings{
		@AuraEnabled public List<String> coreListPriceLobList;
		@AuraEnabled public CPQ_Settings__c cpqSettings;
		@AuraEnabled public Map<String, Frequency__c> frequencyMap;
	}

	/**
	 * @description wrapper class for the CPQ screen wrapper data
	 */
	public class InitData{
		@AuraEnabled public CPQ2_Wrapper.CpqEntity entity;
		@AuraEnabled public CustomSettings customSettings;
		@AuraEnabled public ScreenPermissions screenPermissions;
		@AuraEnabled public List<CPQ_Multiplier_Table__c> categoryMultiplier;
		@AuraEnabled public List<CPQ2_Score_Multiplier__c> scoreMultiplier;

		public InitData(){
			screenPermissions = new ScreenPermissions();
		}
	}

	public class ScreenPermissions{
		@AuraEnabled public Boolean canApproveOrders;

		public ScreenPermissions(){
			canApproveOrders = Schema.sObjectType.OrderItem.fields.Requested_Price_Approved__c.isUpdateable();
		}
	}

	/**
	 * @description gets the header and lineitems
	 *
	 * @param targetId of the header object
	 *
	 * @return wrapper object with header and line items
	 */
	@AuraEnabled
	public static InitData getInitData(Id targetId) {

		if (String.isEmpty(targetId)) {
			return null;
		}

		InitData initData = new InitData();
		initData.entity = CPQ2_Service.getHeaderAndLineItemsWithProductInfo(targetId);
		initData.customSettings = getCustomSettings();
		initData.categoryMultiplier = CPQ2_Service.getCatMultiplier();
		initData.scoreMultiplier = CPQ2_Service.getScoreMultiplier();
		return initData;
	}

	/**
	 * @description creates a new line item with product information enriched
	 *
	 * @param productId - target product associated with the line item
	 * @param pricebookId - target price book associated with the line item
	 * @param targetId
	 * @param accountId - account associated with the line item
	 *
	 * @return a "blank" line item associated with the proper product, pricebook and account
	 */
	@AuraEnabled(cacheable=false)
	public static List<CPQ2_Wrapper.LineItem> getNewLineItem(Id productId, Id pricebookId, Id targetId, Id accountId, Integer quantity) {
		return CPQ2_Service.getNewLineItem(productId, pricebookId, targetId, accountId, quantity);
	}

	/**
	 * @description get custom settings frequency map
	 *
	 * @return map from frequency name-->frequency object
	 */
	@AuraEnabled(cacheable=true)
	public static Map<String, Frequency__c> getFrequencyMap(){
		return CustomSettingsService.getFrequencyMap();
	}

	/**
	 * @description helper method to obtain all custom settings data
	 *
	 * @return custom settings wrapper with all relevant settings
	 */
	private static CustomSettings getCustomSettings(){
		CustomSettings customSettings = new CustomSettings();
		customSettings.frequencyMap = CustomSettingsService.getFrequencyMap();
		customSettings.cpqSettings = CustomSettingsService.getCpqSettings();
		customSettings.coreListPriceLobList = CustomSettingsService.getCoreListPriceRequestLobs();
		return customSettings;
	}

	/**
	 * @description save opportunity screen changes
	 *
	 * @param lineItems - JSON representation of line items return from the opportunity screen
	 *
	 * @return list of DML results in wrapper classes.
	 */
	@AuraEnabled
	public static List<CPQ2_Wrapper.DmlResult> saveChanges(String lineItems){
		System.debug('Sanchivan saveChanges');
		List<CPQ2_Wrapper.LineItem> saveItems = (List<CPQ2_Wrapper.LineItem>)System.JSON.deserialize(lineItems, List<CPQ2_Wrapper.LineItem>.class);
		return CPQ2_Service.saveChanges(saveItems);
	}

	/**
	 * @description used to simulate ship to score calculations given the entity wrapper
	 *
	 * @param entity - JSON representation of the entity wrapper - contains account, header and line items
	 *
	 * @return the entity enriched with simulated shipto score, simulated line score and simulated approval status
	 */
	@AuraEnabled
	public static CPQ2_Wrapper.CpqEntity calculateShipToScore(String entity){
		CPQ2_Wrapper.CpqEntity entityToCalculate = (CPQ2_Wrapper.CpqEntity)System.JSON.deserialize(entity, CPQ2_Wrapper.CpqEntity.class);
		entityToCalculate.header.coreListThresholdLevel = determineCoreListThresholdLevel(entityToCalculate);
		entityToCalculate.header.includeInPriceModel = true;
		List<CPQ2_Wrapper.LineItem> applicableItemList = new List<CPQ2_Wrapper.LineItem>();
		System.debug('Sanchivan entityToCalculate.lineItems: ' + entityToCalculate.lineItems);
		System.debug('Sanchivan entityToCalculate.lineItems.size(): ' + entityToCalculate.lineItems.size());
		for(CPQ2_Wrapper.LineItem li: entityToCalculate.lineItems){
			System.debug('**** isDeleted ' + li.isDeleted);
			System.debug('**** active ' + li.isActive);
			if(!li.isDeleted && li.isActive){
				li.isEdit = true;
				applicableItemList.add(li);
			}
		}

		entityToCalculate.lineItems = applicableItemList;
		List<CPQ2_Wrapper.CpqEntity> resultingEntity = CPQ2_ShipToCalculatorUtil.calculateShipToScore(new List<CPQ2_Wrapper.CpqEntity>{entityToCalculate}, true);

		return resultingEntity[0];
	}

	/**
	 * @description helper class to helper determine core list price thresholds.
	 * 				this is here instead of in the ship to calculator because core list price has to be determined independently from the calc.
	 *
	 * @param entity - contains the target account, header and line items
	 *
	 * @return the maximum threshold breached by the core list pricing
	 */
	private static Decimal determineCoreListThresholdLevel(CPQ2_Wrapper.CpqEntity entity){
		List<CPQ2_Core_List_Price_Request__c> listCoreListPriceRequests = new List<CPQ2_Core_List_Price_Request__c>();
		for(CPQ2_Wrapper.LineItem lineItem: entity.lineItems){
			if(lineItem.isCoreListSubmitted){
				listCoreListPriceRequests.add(lineItem.coreListPriceRequest.coreListPriceRequest);
			}
		}

		CPQ2_Service.evaluateCoreListPriceRequest(listCoreListPriceRequests);

		Decimal maxThresholdLevel = 0;

		for(CPQ2_Core_List_Price_Request__c clpr: listCoreListPriceRequests){
			maxThresholdLevel = (maxThresholdLevel < clpr.CPQ2_Threshold_Triggered__c)?clpr.CPQ2_Threshold_Triggered__c:maxThresholdLevel;
		}

		return maxThresholdLevel;
	}

	@AuraEnabled
	static public CPQ2_OrderValidationUtil.OrderValidationResult validateOrder(String entity){
		CPQ2_Wrapper.CpqEntity entityToCheck = (CPQ2_Wrapper.CpqEntity)System.JSON.deserialize(entity, CPQ2_Wrapper.CpqEntity.class);

		Set<Id> orderItemIds = new Set<Id>();
		
		// We need to get the latest value of Valid_for_Install_Remove_Replace__c because the latest value is not available on the UI since
		// it gets updated on the trigger. (CPQCN-405)
		for(CPQ2_Wrapper.LineItem lineItem : entityToCheck.lineItems) {
			if(lineItem.isActive && !lineItem.isDeleted && !String.isBlank(lineItem.id)){
				orderItemIds.add(lineItem.Id);
			}
		}

		Map<Id, OrderItem> orderItemMap = new Map<Id, OrderItem>(OrderService.getOrderProductsByIds(orderItemIds));

		for(CPQ2_Wrapper.LineItem lineItem : entityToCheck.lineItems) {
			if(lineItem.isActive && !lineItem.isDeleted && !String.isBlank(lineItem.id)){
				lineItem.orderItem.Valid_for_Install_Remove_Replace__c = orderItemMap.get(lineItem.Id).Valid_for_Install_Remove_Replace__c;
			}
		}

		return CPQ2_Service.validateOrder(entityToCheck);
	}
}