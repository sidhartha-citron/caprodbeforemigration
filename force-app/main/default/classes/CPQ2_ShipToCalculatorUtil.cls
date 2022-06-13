/**
* @description Util class to facilitate the ship to calculations based on opportunities and order data
 *
 * Created by timothychiang on 2020-03-27.
 *
 */
public with sharing class CPQ2_ShipToCalculatorUtil {
	private static String LINE_SCORE_GREEN = 'Green';
	private static String LINE_SCORE_YELLOW = 'Yellow';
	private static String LINE_SCORE_RED = 'Red';

	private static Decimal APPROVAL_STATUS_SUPERGREEN = 0;
	private static Decimal APPROVAL_STATUS_GREEN = 1;
	private static Decimal APPROVAL_STATUS_YELLOW = 2;
	private static Decimal APPROVAL_STATUS_RED = 3;
	private static Decimal APPROVAL_STATUS_STOP = 4;

	/**
	 * @description structure to store shiptolevel calculations
	 */
	public class ShipToLevelDetails{
		public Decimal grandTotalRevenuePerYear = 0;
		public Decimal grandTotalCostPerYear = 0;
		public Decimal grandTotalCapitalCharge = 0;
		public Decimal maxNumberOfVisits = 0;
		public Decimal totalRevenue = 0;
		public Decimal totalCost = 0;
		public Decimal highestFrequency = 0;
		public Decimal costStop;
		public Decimal distanceAdjustments;
		public Decimal otherDirectCostPercentage;
		public Decimal totalStopCost;
		public Decimal otherDirectCost;
		public Decimal totalDirectCosts;
		public Decimal totalCapitalCharge = 0;
		public Decimal grossMargin;
		public Decimal grossMarginPercentage;
		public Decimal shipToDealScore;
		public Decimal lineItemCount;
		public Decimal approvalStatus;
		public Boolean lowMarginFound;
		
	}

	/**
	 * @description structure to store line level calculations
	 */
	public class LineLevelDetails{
		public Decimal materialCost;
		public Decimal duration;
		public Decimal serviceCostPerMinute;
		public Decimal numberOfVisits;
		public Decimal quantity;
		public Decimal servicePrice;
		public Decimal materialCostPerYear;
		public Decimal serviceCostPerYear;
		public Decimal totalCostPerYear;
		public Decimal totalRevenuePerYear;
		public Decimal lineMargin;
		public Decimal totalCapitalCharge = 0;

	}

	private static CPQ_Settings__c cpqSettings;

	/**
	 * @description main public method to activate shipTo Score calculation
	 *
	 * @param entities - wrapper object containing header and line item info
	 *
	 * @return - same wrapper object but enriched with ship to calculated values
	 */
	public static List<CPQ2_Wrapper.CpqEntity> calculateShipToScore(List<CPQ2_Wrapper.CpqEntity> entities) {
		return calculateShipToScore(entities, false);
	}

	public static List<CPQ2_Wrapper.CpqEntity> calculateShipToScore(List<CPQ2_Wrapper.CpqEntity> entities, Boolean isSimulation) {
		System.debug('CPQ2_ShipToCalculatorUtil BEGIN soql limit : ' + Limits.getQueries());
        String headerType = entities[0].header.getType();
		cpqSettings = CustomSettingsService.getCpqSettings();

		//CPQCN-595 2021-01-28 Darcy: When the entities arrive via the trigger, the productInfo needs to be added
		//          2021-02-26 Darcy: Only for Opportunities, not adding for orders to save on soql queries
        if(headerType == CPQ2_Util.SOBJECT_NAME_OPP) {
            for (CPQ2_Wrapper.CpqEntity entity : entities) {
                Set<Id> prodIdSet = new Set<Id>();
                for (CPQ2_Wrapper.LineItem li : entity.lineItems) {
                    if(li.productInfo == null){
                        prodIdSet.add(li.productId);
                    }
                }
                if (!prodIdSet.isEmpty()) {
                    List<ProductService.ProductWrapper> productInformationList = ProductService.getProductInformationByIds(prodIdSet, entity.header.priceBookId, entity.header.accountId, entity.header.id);
                    Map<Id, ProductService.ProductWrapper> productInformationMap = new Map<Id, ProductService.ProductWrapper>();
                    for (ProductService.ProductWrapper pw : productInformationList) {
                        productInformationMap.put(pw.priceBookEntry.Id, pw);
                    }
                    for (CPQ2_Wrapper.LineItem li : entity.lineItems) {
                        if (productInformationMap.containsKey(li.pricebookEntryId)) {
                            li.productInfo = productInformationMap.get(li.pricebookEntryId);
                            System.debug('CPQ2_ShipToCalculatorUtil line item loop: ' + li);
                        }
                    }
                }
            }
        }
		//END-595

		enrichEntities(entities);
		calculate(entities);
		calculateNonServiceLineMargins(entities);

		if(isSimulation && headerType == CPQ2_Util.SOBJECT_NAME_OPP){
			for (CPQ2_Wrapper.CpqEntity entity : entities) {
				entity.header.approvalStatus = simulateApprovalStatus(entity, cpqSettings);
				entity.header.dealImpacts = simulateDealImpacts(entity, cpqSettings);
			}
		}

		if(headerType == CPQ2_Util.SOBJECT_NAME_ORDER) {
			calculateShipToScoreForOrder(entities);
		}

		//System.debug('***** ' + JSON.serialize(entities));
		System.debug('***** ' + entities);
        System.debug('CPQ2_ShipToCalculatorUtil END soql limit : ' + Limits.getQueries());
		return entities;
	}

	/*
     * @Name        calculateShipToScoreForOrder
     * @Description Responsible for calculating the Ship To Score for the Order when list of entities are passed in
     * @Author      Sanchivan Sivadasan
     * @Params      entities: list of wrapper object containing, Account, Header and Line Item Info
	 */
	public static void calculateShipToScoreForOrder(List<CPQ2_Wrapper.CpqEntity> entities) {
		Map<Id, Map<String, CPQ2_Wrapper.HeaderItem>> orderMapByAcctId = new Map<Id, Map<String, CPQ2_Wrapper.HeaderItem>>();
		Map<Id, CPQ2_Wrapper.AccountItem> accountItemMap = new Map<Id, CPQ2_Wrapper.AccountItem>();
		Map<Id, ShipToLevelDetails> shipToLevelDetailsByAcctIdMap = new Map<Id, ShipToLevelDetails>();
		generateMapofOrdersByAccountId(entities, orderMapByAcctId, accountItemMap);
        System.debug('~~orderMapByAcctId~~' + orderMapByAcctId);
		if(orderMapByAcctId.size() > 0) {
			generateShipToDetailsMapForOrder(entities, orderMapByAcctId, accountItemMap, shipToLevelDetailsByAcctIdMap);
			stampEntity(entities, accountItemMap, shipToLevelDetailsByAcctIdMap);
		}		
	}

	/*
     * @Name        getOrderMap
     * @Description Responsible for generating the Map that contains Account Id to Map of Header
     * @Author      Sanchivan Sivadasan
     * @Params      entities: list of wrapper object containing, Account, Header and Line Item Info
     * 				orderMapByAcctId: An empty map passed in to be filled in by this method
	 */
	private static void generateMapofOrdersByAccountId(List<CPQ2_Wrapper.CpqEntity> entities, 
		Map<Id, Map<String, CPQ2_Wrapper.HeaderItem>> orderMapByAcctId,
		Map<Id, CPQ2_Wrapper.AccountItem> accountItemMap) {
		
		Set<Id> acctIds = new Set<Id>();
		
		// Get relevant account Ids
		for (CPQ2_Wrapper.CpqEntity entity : entities) {
			acctIds.add(entity.accountItem.account.Id);
		}

		// Get the Orders By Account Ids
		List<Order> orderList = OrderService.getOrderByAcctIds(acctIds);

		Map<Id, List<CPQ2_Wrapper.HeaderItem>> seasonalOrdersByAcctIdMap = new Map<Id, List<CPQ2_Wrapper.HeaderItem>>();
		
		// Create the Map based on the orderList
		for(Order ord : orderList) {
			Map<String, CPQ2_Wrapper.HeaderItem> headerMap = orderMapByAcctId.get(ord.Account.Id);
			if(headerMap == Null)
				headerMap = new Map<String, CPQ2_Wrapper.HeaderItem>();

			CPQ2_Wrapper.HeaderItem headerItem = new CPQ2_Wrapper.HeaderItem(ord);

			// Collect a Map of Accounts which has seasonal Orders
			if(headerItem.isSeasonal) {
				List<CPQ2_Wrapper.HeaderItem> headerItems = seasonalOrdersByAcctIdMap.get(ord.Account.Id);
				if(headerItems == Null)
					headerItems = new List<CPQ2_Wrapper.HeaderItem>();
				headerItems.add(headerItem);
				seasonalOrdersByAcctIdMap.put(ord.Account.Id, headerItems);
			}

			headerMap.put(ord.Id, headerItem);
			orderMapByAcctId.put(ord.AccountId, headerMap);
		}

		Integer counter = 1;
		// Loop through the entities
		for (CPQ2_Wrapper.CpqEntity entity : entities) {
			List<CPQ2_Wrapper.HeaderItem> headerItems = seasonalOrdersByAcctIdMap.get(entity.accountItem.account.Id);

			if(headerItems != Null && headerItems.size() > 0) {
				entity.accountItem.hasSeasonal = True;
			}
			else {
				entity.accountItem.hasSeasonal = False;
			}

			accountItemMap.put(entity.accountItem.account.Id, entity.accountItem);
			Map<String, CPQ2_Wrapper.HeaderItem> headerMap = orderMapByAcctId.get(entity.accountItem.account.Id);
			
			if(headerMap != Null) {
				// If header from entity already exists in the orderMapByAcctId replace the in the map with what is in the entity
				if(headerMap.keySet().contains(entity.header.id)) {
					headerMap.put(entity.header.id, entity.header);
				}
				// If it doesn't exist then add it to the Map.
				else{
					// If it's brand new record without a SFDC Id
					if(String.isBlank(entity.header.id)) {
						headerMap.put(String.valueOf(counter), entity.header);
						counter++;
					}
					// If it's an existing record that became active
					else {
						headerMap.put(entity.header.id, entity.header);
					}				
				}
				orderMapByAcctId.put(entity.accountItem.account.Id, headerMap);		
			}				
		}
	}

	/*
     * @Name        generateShipToDetailsMapForOrder
     * @Description Responsible for summing up the Headers and calculating the Ship To Score
     * @Author      Sanchivan Sivadasan
     * @Params      entities: list of wrapper object containing, Account, Header and Line Item Info
     * 				orderMapByAcctId: A Map of Map which currently contains all the orders in the database for an Account.
	 * 				accountItemMap: A Map of AccountItem wrapper by Account Id
	 * 				shipToLevelDetailsByAcctIdMap: An empty map passed in to be filled in by this method
	 */
	private static void generateShipToDetailsMapForOrder(List<CPQ2_Wrapper.CpqEntity> entities,  
		Map<Id, Map<String, CPQ2_Wrapper.HeaderItem>> orderMapByAcctId,
		Map<Id, CPQ2_Wrapper.AccountItem> accountItemMap,
		Map<Id, ShipToLevelDetails> shipToLevelDetailsByAcctIdMap) {
		
		for(Id acctId : orderMapByAcctId.keySet()) {
			List<CPQ2_Wrapper.HeaderItem> headerList = orderMapByAcctId.get(acctId).values();
			ShipToLevelDetails shipToDetails = new ShipToLevelDetails();
			shipToDetails.highestFrequency = 0;
			for(CPQ2_Wrapper.HeaderItem header : headerList) {
                System.debug('~~IncludeInPriceModel~~' + header.includeInPriceModel);
				if(header.includeInPriceModel) {
					shipToDetails.totalRevenue += header.totalAnnualRevenue;
					shipToDetails.totalCost += header.totalAnnualCost;
					shipToDetails.totalCapitalCharge += header.totalCapitalCharge;
					System.debug('*** header.totalCapitalCharge ' + header.totalCapitalCharge );
					shipToDetails.highestFrequency = (header.highestFrequency > shipToDetails.highestFrequency) ? header.highestFrequency : shipToDetails.highestFrequency;
				}
			}

			CPQ2_Wrapper.AccountItem accountItem = accountItemMap.get(acctId);

			calculateShipTo(accountItem, shipToDetails, CPQ2_Util.SOBJECT_NAME_ORDER);
			accountItemMap.put(acctId, accountItem);
			shipToLevelDetailsByAcctIdMap.put(acctId, shipToDetails);
		}
	}

	/*
     * @Name        generateShipToDetailsMapForOrder
     * @Description Responsible for summing up the Headers and calculating the Ship To Score
     * @Author      Sanchivan Sivadasan
     * @Params      entities: list of wrapper object containing, Account, Header and Line Item Info
     * 				accountItemMap: A Map of AccountItem wrapper by Account Id
	 * 				shipToLevelDetailsByAcctIdMap: A Map by Account Id that maps to a wrapper class which contains the calculated Ship To Score details
	 */
	private static void stampEntity(List<CPQ2_Wrapper.CpqEntity> entities,  
		Map<Id, CPQ2_Wrapper.AccountItem> accountItemMap,
		Map<Id, ShipToLevelDetails> shipToLevelDetailsByAcctIdMap) {

		// Loop through the entities
		for (CPQ2_Wrapper.CpqEntity entity : entities) {   
			ShipToLevelDetails shipToDetails = shipToLevelDetailsByAcctIdMap.get(entity.accountItem.account.Id);
			CPQ2_Wrapper.AccountItem accountItem = accountItemMap.get(entity.accountItem.account.Id);

            if(accountItem!=null){
                entity.accountItem.costStop = accountItem.costStop;
                entity.accountItem.distanceAdjustments = accountItem.distanceAdjustments;
                entity.accountItem.otherDirectCostPercentage = accountItem.otherDirectCostPercentage;
            }

            if(shipToDetails!=null){
                // stamp entity
                entity.grossMargin = shipToDetails.grossMargin;
                entity.grossMarginPercentage = shipToDetails.grossMarginPercentage;
                entity.shipToDealScore = shipToDetails.shipToDealScore;
            }
		}		
	}

	/**
	 * @description private helper method to calculate shipto score
	 *
	 * @param entities - enriched header and line item information
	 *
	 * @return same entities with enriched ship to score information
	 */
	private static List<CPQ2_Wrapper.CpqEntity> calculate(List<CPQ2_Wrapper.CpqEntity> entities) {
		String headerType = entities[0].header.getType();
		for (CPQ2_Wrapper.CpqEntity entity : entities) {
			ShipToLevelDetails shipToDetails = new ShipToLevelDetails();
			shipToDetails.lineItemCount = 0;
			shipToDetails.lowMarginFound = false;

			for (CPQ2_Wrapper.LineItem lineItem : entity.lineItems) {
				if(calculateLineItem(lineItem)){
					System.debug('Darcy is this getting recalculated? ' + lineItem);
					//2021-03-26 Darcy: Exclude One-Time from STS calculation https://trello.com/c/uusoyFsG
					if(lineItem.frequency != 'One-Time'){
					// gather totals
						shipToDetails.grandTotalRevenuePerYear += lineItem.totalRevenue;
						shipToDetails.grandTotalCostPerYear += lineItem.totalCost;
						shipToDetails.maxNumberOfVisits = (shipToDetails.maxNumberOfVisits < lineItem.numberOfVisits) ? lineItem.numberOfVisits : shipToDetails.maxNumberOfVisits;
						shipToDetails.grandTotalCapitalCharge += lineItem.totalCapitalCharge;
						shipToDetails.lineItemCount++;
					}	
					if(lineItem.lineScore != LINE_SCORE_GREEN){
						shipToDetails.lowMarginFound = true;
					}
				}
			}

			// stamp header
			entity.header.totalAnnualRevenue = shipToDetails.grandTotalRevenuePerYear;
			entity.header.totalAnnualCost = shipToDetails.grandTotalCostPerYear;
			entity.header.totalCapitalCharge = shipToDetails.grandTotalCapitalCharge;
			entity.header.highestFrequency = shipToDetails.maxNumberOfVisits;
			entity.header.pmCount = shipToDetails.lineItemCount;
			entity.header.lowMarginFound = shipToDetails.lowMarginFound;

			// If it's Opportunity then calculate the ShipToScore now.
			if(headerType == CPQ2_Util.SOBJECT_NAME_OPP) {
				calculateShipTo(entity.accountItem, shipToDetails, headerType);

				// stamp entity
				entity.grossMargin = shipToDetails.grossMargin;
				entity.grossMarginPercentage = shipToDetails.grossMarginPercentage;
				entity.shipToDealScore = shipToDetails.shipToDealScore;
			}
		}

		return entities;
	}

	/**
	 * @description helper class to calculate ship to level totals
	 *
	 * @param entity - target entity
	 * @param shipToDetails - shipTo details from previous calculations
	 */
	private static void calculateShipTo(CPQ2_Wrapper.AccountItem accountItem, ShipToLevelDetails shipToDetails, String headerType){
		CPQ_Settings__c cpqSettings = CustomSettingsService.getCpqSettings();
		FSA_Service_Territory_Mapping__c fsa = accountItem.account.FSA_Mapping__r;
		CPQ_Service_Branches__c serviceBranch = fsa.CPQ_Service_Branch__r;		

		if(headerType == CPQ2_Util.SOBJECT_NAME_OPP) {
			// add opp totals to account totals
			shipToDetails.totalRevenue = shipToDetails.grandTotalRevenuePerYear + accountItem.totalAnnualRevenue;
			shipToDetails.totalCost = shipToDetails.grandTotalCostPerYear + accountItem.totalAnnualCost;
			shipToDetails.totalCapitalCharge = shipToDetails.grandTotalCapitalCharge + accountItem.totalCapitalCharge;
			shipToDetails.highestFrequency = (shipToDetails.maxNumberOfVisits > accountItem.highestFrequency) ? shipToDetails.maxNumberOfVisits : accountItem.highestFrequency;
		}
        
        system.debug('~~AccountItem~~' + accountItem);

		// stamp account level totals
		accountItem.totalAnnualRevenue = shipToDetails.totalRevenue;
		accountItem.totalAnnualCost = shipToDetails.totalCost;
		accountItem.highestFrequency = shipToDetails.highestFrequency;
		accountItem.totalCapitalCharge = shipToDetails.totalCapitalCharge;

		// calculate ship to level
		shipToDetails.costStop = serviceBranch.CPQ_Average_Drive_Stem_Cost__c;
		shipToDetails.distanceAdjustments = fsa.CPQ_Distance_Adj_Factor__c/100;
		shipToDetails.otherDirectCostPercentage = serviceBranch.CPQ_Direct_Cost_of_Revenue__c/100;

		// stamp account
		accountItem.costStop = shipToDetails.costStop;
		accountItem.distanceAdjustments = fsa.CPQ_Distance_Adj_Factor__c;
		accountItem.otherDirectCostPercentage = serviceBranch.CPQ_Direct_Cost_of_Revenue__c;

		// calculate total cost
		shipToDetails.totalStopCost = shipToDetails.costStop * shipToDetails.distanceAdjustments * shipToDetails.highestFrequency;
		shipToDetails.otherDirectCost = shipToDetails.totalRevenue * shipToDetails.otherDirectCostPercentage;
		shipToDetails.totalDirectCosts = shipToDetails.totalCost + shipToDetails.totalStopCost + shipToDetails.otherDirectCost;

		// calculate total margin
		shipToDetails.grossMargin = shipToDetails.totalRevenue - shipToDetails.totalDirectCosts;
		shipToDetails.grossMarginPercentage = (shipToDetails.totalRevenue == 0)?0:(shipToDetails.grossMargin / shipToDetails.totalRevenue);

		// calculate shipToScore
		shipToDetails.shipToDealScore = (shipToDetails.grossMarginPercentage * 100 + cpqSettings.CPQ_Deal_Score_Buffer__c).setScale(0);
	}

	/**
	 * @description mirrors the logic of the opportunity approval process deal impacts.
	 *
	 * @param entity - target entity to evaluate
	 * @param cpqSettings - custom settings relevant for the calculations
	 *
	 * @return list of impacts
	 */
	private static List<String> simulateDealImpacts(CPQ2_Wrapper.CpqEntity entity, CPQ_Settings__c cpqSettings){
		CPQ2_Wrapper.HeaderItem header = entity.header;
		CPQ2_Wrapper.AccountItem account = entity.accountItem;

		List<String> dealImpacts = new List<String>();

		if(account.hasSeasonal){
			dealImpacts.add(cpqSettings.DI_Seasonal_Order_Found__c);
		} else {
			if(header.pmCount != 0){
				if(entity.shipToDealScore < cpqSettings.CPQ_T1__c){
					dealImpacts.add(cpqSettings.DI_Low_Ship_To_Score__c);
				}

				if(header.shipToScoreApproved != null && (entity.shipToDealScore < header.shipToScoreApproved)){
					dealImpacts.add(cpqSettings.DI_Lower_than_Prev_Approved_Score__c);
				}
			}
		}

		if(!isFsaApproved(entity, cpqSettings)){
			dealImpacts.add(cpqSettings.DI_FSA_Issue__c);
		}

		if(header.lowMarginFound){
			dealImpacts.add(cpqSettings.DI_Low_Margin_Found__c);
		}

		if(header.nonServiceThreshold > 0){
			dealImpacts.add(cpqSettings.DI_Nonservice_Margin__c);
		}

		if(header.coreListThresholdLevel > 0){
			dealImpacts.add(cpqSettings.DI_Core_List_Price_Needs_Approval__c);
		}

		return dealImpacts;
	}

	/**
	 * @description  mirrors the logic of the opportunity approval status.
	 *
	 * @param entity- target entity to evaluate
	 * @param cpqSettings - custom settings relevant for the calculations
	 *
	 * @return end state to represent the approval status
	 */
	private static Decimal simulateApprovalStatus(CPQ2_Wrapper.CpqEntity entity, CPQ_Settings__c cpqSettings){
		CPQ2_Wrapper.HeaderItem header = entity.header;
		CPQ2_Wrapper.AccountItem account = entity.accountItem;
		
		Decimal maxOtherThreshold = Math.max(header.nonServiceThreshold, header.coreListThresholdLevel);
		Boolean usePriceModel = (account.hasSeasonal || header.pmCount == 0)?false:true;
		
		System.debug('~~NonServiceThreshold~~' + header.nonServiceThreshold);
		System.debug('~~coreListThresholdLevel~~' + header.coreListThresholdLevel);
		System.debug('~~MaxOtherThreshold~~' + maxOtherThreshold);
		System.debug('~~usePriceModel~~' + usePriceModel);
		System.debug('~~ShipToScore~~' + entity.shipToDealScore);

		if(usePriceModel && entity.shipToDealScore < cpqSettings.CPQ_T3__c){
			return APPROVAL_STATUS_STOP;
		} else if(!isFsaApproved(entity, cpqSettings) || maxOtherThreshold == 2 || header.contractTermApprovalStatus == 2){
			return APPROVAL_STATUS_RED;
		} else if(!usePriceModel && maxOtherThreshold == 0){
			return APPROVAL_STATUS_GREEN;
		} else if(!usePriceModel && maxOtherThreshold == 1 || header.contractTermApprovalStatus == 1){
			return APPROVAL_STATUS_YELLOW;
		} else {
			System.debug('~~null shiptoscore~~' + header.shipToScoreApproved);
			Decimal shipToScoreApproved = 100;
			if(header.shipToScoreApproved != null){
				shipToScoreApproved = header.shipToScoreApproved;
			}

			if(entity.shipToDealScore >= cpqSettings.CPQ_T0__c
				&& maxOtherThreshold ==0) {

				return APPROVAL_STATUS_SUPERGREEN;
			} else if(entity.shipToDealScore >= Math.min(shipToScoreApproved, cpqSettings.CPQ_T1__c)
				&& maxOtherThreshold ==0){

				return APPROVAL_STATUS_GREEN;
			} else if(entity.shipToDealScore >= cpqSettings.CPQ_T2__c){
				return APPROVAL_STATUS_YELLOW;
			} else {
				return APPROVAL_STATUS_RED;
			}
		}
	}

	/**
	 * @description helper method to determine if the account's FSA has been approved
	 *
	 * @param entity - target entity to evaluate
	 * @param cpqSettings - custom settings to help evaluate
	 *
	 * @return whether the FSA has been approved or not
	 */
	private static Boolean isFsaApproved(CPQ2_Wrapper.CpqEntity entity, CPQ_Settings__c cpqSettings){
		CPQ2_Wrapper.AccountItem account = entity.accountItem;
		CPQ2_Wrapper.HeaderItem header = entity.header;

		return ((account.serviceZone == cpqSettings.CPQ_OSAZ__c &&
				account.fsa == header.fsaApproved) ||
				account.serviceZone != cpqSettings.CPQ_OSAZ__c);
	}


	/**
	 * @description helper method to calculate single line items
	 *
	 * @param lineItem target to calculate
	 *
	 * @return true if line was calculated, false otherwise
	 */
	private static Boolean calculateLineItem(CPQ2_Wrapper.LineItem lineItem) {

		Boolean isCalculated = false;

		if(lineItem.includeInShipToCalculation &&
			(lineItem.materialCost != null &&
				lineItem.duration != null &&
				lineItem.averageCostMinute != null &&
				lineItem.numberOfVisits != null &&
				lineItem.quantity != null &&
				lineItem.servicePrice != null)) {
		
			LineLevelDetails lineItemDetail = new LineLevelDetails();

			// calculate individual line items
			lineItemDetail.materialCost = lineItem.materialCost;
			lineItemDetail.duration = lineItem.duration;
			lineItemDetail.serviceCostPerMinute = lineItem.averageCostMinute;
			lineItemDetail.numberOfVisits = lineItem.numberOfVisits;
			lineItemDetail.quantity = lineItem.quantity;
			lineItemDetail.servicePrice = lineItem.servicePrice;

			if(lineItem.capitalCost != 0 && lineItem.capitalCost != null && lineItem.amortization != 0 && lineItem.amortization != null) {
				lineItemDetail.totalCapitalCharge = (lineItem.capitalCost/lineItem.amortization) * lineItem.quantity;
				System.debug('*** lineItem.capitalCost ' + lineItem.capitalCost);
				System.debug('*** lineItem.amortization ' + lineItem.amortization);
				System.debug('*** lineItem.capitalCost/lineItem.amortization ' + lineItem.capitalCost/lineItem.amortization);
				System.debug('*** (lineItem.capitalCost/lineItem.amortization) * lineItem.quantity ' + (lineItem.capitalCost/lineItem.amortization) * lineItem.quantity);
			} else {
				lineItemDetail.totalCapitalCharge = 0;
			}


			//System.debug('***LINE LEVEL DETAILS****: ' + lineItemDetail);
			
			// calculate costs cost per year
			lineItemDetail.materialCostPerYear = lineItemDetail.materialCost * lineItemDetail.quantity * lineItemDetail.numberOfVisits;
			lineItemDetail.serviceCostPerYear = lineItemDetail.duration * lineItemDetail.serviceCostPerMinute * lineItemDetail.quantity * lineItemDetail.numberOfVisits;
			lineItemDetail.totalCostPerYear = lineItemDetail.materialCostPerYear + lineItemDetail.serviceCostPerYear + lineItemDetail.totalCapitalCharge;
			
			// calculate revenue
			lineItemDetail.totalRevenuePerYear = lineItemDetail.servicePrice * lineItemDetail.quantity * lineItemDetail.numberOfVisits;
			
			// calculate line margin
			// CPQCN-407 Darcy 2020-12-18 following line commented and replaced with block below
			//lineItemDetail.lineMargin =(lineItemDetail.totalRevenuePerYear == 0) ? 0:(lineItemDetail.totalRevenuePerYear - lineItemDetail.totalCostPerYear) / lineItemDetail.totalRevenuePerYear;

			if (lineItemDetail.totalRevenuePerYear == 0) {
				if (lineItemDetail.totalCostPerYear < 0) {
					//VMI Service is an example of a product with negative cost but no direct revenue. It should contribute to the ship-to score
					lineItemDetail.lineMargin = 1; 
				} 
				else {
					lineItemDetail.lineMargin = 0;
				}
			}
			else {
				lineItemDetail.lineMargin = (lineItemDetail.totalRevenuePerYear - lineItemDetail.totalCostPerYear) / lineItemDetail.totalRevenuePerYear;
			}

			// stamp line item
			lineItem.totalRevenue = lineItemDetail.totalRevenuePerYear;
			lineItem.totalCost = lineItemDetail.totalCostPerYear;
			lineItem.lineMargin = lineItemDetail.lineMargin*100;
			lineItem.totalCapitalCharge =lineItemDetail.totalCapitalCharge;

			
			// determine line score
			if(lineItem.lineMargin >= cpqSettings.CPQ_LT1__c ){
				lineItem.lineScore = LINE_SCORE_GREEN;
			} else if(lineItem.lineMargin >= cpqSettings.CPQ_LT2__c){
				lineItem.lineScore = LINE_SCORE_YELLOW;
			} else {
				lineItem.lineScore = LINE_SCORE_RED;
			}

			System.debug('***LINE LEVEL DETAILS****: ' + lineItemDetail);
			isCalculated = true;
		}
		
		return isCalculated;
	}

	private static Map<Id,SObject> getHeaderData(Set<Id> headerIdSet, String lineItemType){
		Map<Id,SObject> returnList = new Map<Id,SObject>();

		if(headerIdSet != null && !headerIdSet.isEmpty()){
			if(lineItemType == CPQ2_Util.SOBJECT_NAME_OPP){
				returnList = (Map<Id,SObject>) OpportunityService.getOpportunitiesMapByIds(headerIdSet);
			} else if(lineItemType == CPQ2_Util.SOBJECT_NAME_ORDER) {
				returnList = (Map<Id,SObject>) OrderService.getOrdersMapByIds(headerIdSet);
			}
		}

		return returnList;
	}


	/**
	 * @description helper class that enriches header and line items with price model details
	 *
	 * @param entities - target wrapper class with header and line items to be enriched
	 *
	 */
	private static void enrichEntities(List<CPQ2_Wrapper.CpqEntity> entities) {

		Set<Id> headerIdSet = new Set<Id>();
		Set<Id> productIds = new Set<Id>();
		Set<Id> setPbeIds = new Set<Id>();
		String headerType = '';

		//get all Ids used for targeted queries
		for (CPQ2_Wrapper.CpqEntity entity : entities) {
			headerIdSet.add(entity.header.id);
			headerType = entity.header.getType();

			for (CPQ2_Wrapper.LineItem lineItem : entity.lineItems) {
				if (lineItem.isEdit) {
					productIds.add(lineItem.productId);
					setPbeIds.add(lineItem.pricebookEntryId);
				}
			}
		}

		// get opportunity details
		Map<Id,SObject> sObjectMap = getHeaderData(headerIdSet, headerType);
		//Map<Id, Opportunity> opportunityList = OpportunityService.getOpportunitiesMapByIds(headerIdSet);

		// get all applicable productIds
		Map<Id, Product2> product2Map = ProductService.getProduct2MapByIdsFilteredByModel(CPQ2_Util.PRICE_MODEL_HYGIENE);
		Map<Id, PricebookEntry> pbeMap = ProductService.getPriceBookEntryMapByIds(setPbeIds);

		// get all of the frequencies
		Map<String, Frequency__c> nameToFrequencyMap = CustomSettingsService.getFrequencyMap();

		//enrich CPQEntity with data
		for (CPQ2_Wrapper.CpqEntity entity : entities) {
			SObject sobj = sObjectMap.get(entity.header.id);
			//entity.account = opp.Account;
			entity.accountItem = new CPQ2_Wrapper.AccountItem((Account)sobj.getSObject('Account'));

			for (CPQ2_Wrapper.LineItem lineItem : entity.lineItems) {

				System.debug('***PROD ID ' + lineItem.productId);
				System.debug('***PROD ID MAP' + product2Map.keySet());
				// determine if data should be included in calc
				if (product2Map.containsKey(lineItem.productId) && lineItem.isActive) {
					System.debug('***CAUGHT');
					lineItem.includeInShipToCalculation = true;
				} else {
					lineItem.includeInShipToCalculation = false;
				}

				if(pbeMap.containsKey(lineItem.pricebookEntryId)){
					PricebookEntry pbe = pbeMap.get(lineItem.pricebookEntryId);
					if(pbe.Product2.Item_Type__c == CPQ2_Util.PRODUCT_TYPE_CONSUMABLES ||
						pbe.Product2.Item_Type__c == CPQ2_Util.PRODUCT_TYPE_EQUIPMENT){
						lineItem.includeInNonServiceCalculation = true;
					} else {
						lineItem.includeInNonServiceCalculation = false;
					}
				}

				// We ignore stamping line items that are not being edited because we are relying on
				// their already stamped values. We only refresh price model information for line
				// items that have been modified.
				if (lineItem.isEdit) {
					System.debug('***CAUGHT EDIT');

					if (lineItem.includeInShipToCalculation) {
						//stamp the line item with the relevant info.
						System.debug('***CAUGHT ENRICHED');
						Product2 product = product2Map.get(lineItem.productId);
						lineItem.materialCost = product.CPQ_Cost__c;
						lineItem.duration = product.CPQ_Duration_In_Minutes__c;
						lineItem.averageCostMinute = entity.accountItem.account.FSA_Mapping__r.CPQ_Service_Branch__r.CPQ_Average_Cost_Minute__c;
						lineItem.capitalCost = product.CPQ_Capital_Cost__c;
						lineItem.amortization = product.CPQ_Amortization__c;

						if (nameToFrequencyMap.containsKey(lineItem.frequency)) {
							lineItem.numberOfVisits = nameToFrequencyMap.get(lineItem.frequency).Occurrences_In_Year__c;
						} else {
							//TODO: is this what we want to do?
							lineItem.numberOfVisits = 1;
						}
					}

					System.debug('***lineItem ' + lineItem);
					System.debug('***lineItem.includeInNonServiceCalculation ' + lineItem.includeInNonServiceCalculation);
					if(lineItem.includeInNonServiceCalculation){
						PricebookEntry pbe = pbeMap.get(lineItem.pricebookEntryId);
						lineItem.marginThreshold1 = pbe.CPQ2_Margin_Threshold__c;
						lineItem.marginThreshold2 = pbe.CPQ2_Margin_Threshold_2__c;
						lineItem.productType = pbe.Product2.Item_Type__c;
						lineItem.itemCost = pbe.CPQ2_Total_Cost__c;
						lineItem.listPrice = pbe.UnitPrice;
					}

				}
			}
		}
	}

	/**
	 * @description helper method to calculate line score for non-service rows.
	 *
	 * @param listEntities - target entities to evaluate
	 */
	private static void calculateNonServiceLineMargins(List<CPQ2_Wrapper.CpqEntity> listEntities){
		//System.debug('Darcy calculateNonServiceLineMargins' + JSON.serialize(listEntities));
		for(CPQ2_Wrapper.CpqEntity entity: listEntities){
			entity.header.nonServiceThreshold = 0;

			for(CPQ2_Wrapper.LineItem li: entity.lineItems){				
				if(li.includeInNonServiceCalculation){
					li.lineScore = LINE_SCORE_RED;
					li.thresholdLevel = 2;
					//CPQCN-532 2020-12-28 Darcy: Null quantity (before assigned) will not trip margin threshold
					if(li.lastApprovedPurchasePrice <= li.purchasePrice || li.quantity == null){
						li.thresholdLevel = 0;
						li.lineScore = LINE_SCORE_GREEN;
					} else {
						Decimal foundCalcThreshold;
						if(li.productType == CPQ2_Util.PRODUCT_TYPE_CONSUMABLES){
							foundCalcThreshold = evaluateConsumableThreshold(li);
						} else {
							foundCalcThreshold = evaluateEquipmentThreshold(li);
						}

						if(entity.header.nonServiceThreshold < foundCalcThreshold){
							entity.header.nonServiceThreshold = foundCalcThreshold;
						}
					}

				}
			}
		}
	}

	/**
	 * @description determine line score of consumable line item
	 *
	 * @param lineItem - target line item to evaluate
	 *
	 * @return line score
	 */
	private static Decimal evaluateConsumableThreshold(CPQ2_Wrapper.LineItem lineItem){
		lineItem.lineScore = LINE_SCORE_RED;
		lineItem.thresholdLevel = 2;
		
		//CPQCN-519 2021-01-26 Darcy: testing the contract price instead of requested core list
		Boolean hasContractPrice = false;
		Decimal contractPrice = 0;
		ProductService.ProductWrapper prodInfo = lineItem.productInfo;
		if(prodInfo != null){
			ContractService.ContractPricingSummary cps = prodInfo.contractPriceSummary;
			System.debug('evaluateConsumableThreshold productInfo: ' + prodInfo );
			if(cps != null){
				hasContractPrice = true;
				contractPrice = cps.lowestApplicablePrice;
				System.debug('evaluateConsumableThreshold hasContractPrice: ' + contractPrice );
			}
		}
		//CPQCN-596 2021-02-01 Darcy: Purchase price can be null when there is no opp line (core list price request only)
		if(lineItem.purchasePrice >= lineItem.lastApprovedPurchasePrice || lineItem.purchasePrice == null){
            lineItem.lineScore = LINE_SCORE_GREEN;
			lineItem.thresholdLevel = 0;
		} else {
			if(lineItem.itemCost != null) {
				//CPQCN-513 CPQCN-519 2021-01-26 Darcy: Zero quantity will not trip margin threshold
				if((hasContractPrice && lineItem.purchasePrice >= contractPrice) || lineItem.quantity == 0){
					lineItem.lineScore = LINE_SCORE_GREEN;
					lineItem.thresholdLevel = 0;
				} else {
					Decimal price = lineItem.purchasePrice;
					Decimal cost = lineItem.itemCost;
					Decimal grossMargin = (price - cost)/((price == 0)?1:price);

					lineItem.lineMargin = grossMargin;

					if(lineItem.marginThreshold1 != null){
						if(grossMargin < (lineItem.marginThreshold1/100)){
							lineItem.lineScore = LINE_SCORE_YELLOW;
							lineItem.thresholdLevel = 1;

							if(lineItem.marginThreshold2 != null) {
								if (grossMargin < (lineItem.marginThreshold2/100)) {
									lineItem.lineScore = LINE_SCORE_RED;
									lineItem.thresholdLevel = 2;
								}
							}
						} else {
							lineItem.lineScore = LINE_SCORE_GREEN;
							lineItem.thresholdLevel = 0;
						}
					} 
					else {
						//CPQCN-513 2020-12-23 Darcy: margin threshold is null, you must sell at list price or higher
						if (lineItem.purchasePrice >= lineItem.listPrice) {
							lineItem.lineScore = LINE_SCORE_GREEN;
							lineItem.thresholdLevel = 0;
						}
					}
				}

				//CPQCN-497 -- new core list price
				 
				if (lineItem.coreListPriceRequest != null) {
					CPQ2_Core_List_Price_Request__c clpr = lineItem.coreListPriceRequest.coreListPriceRequest;
					System.debug('~~~CLPRRC~~~' + clpr.CPQ2_Requested_Price__c);

					if(clpr!=null && clpr.CPQ2_Requested_Price__c!=null
								  && clpr.CPQ2_Approved_Core_List_Price__c==null 
								  && lineItem.isCoreListSubmitted){ 
                        String coreListLineScore = LINE_SCORE_RED;
						Integer coreListThresholdLevel = 2;

                        if(clpr.CPQ2_Requested_Price__c >= lineItem.listPrice){
                            coreListLineScore = LINE_SCORE_GREEN;
                            coreListThresholdLevel = 0;
						} 
						else {

							Decimal price = clpr.CPQ2_Requested_Price__c;
							Decimal cost = lineItem.itemCost;
							Decimal grossMargin = (price - cost)/((price == 0)?1:price);

							//System.debug('CLPR price, cost, margin: ' + price + ', ' + cost + ', ' + grossMargin);

							if(lineItem.marginThreshold1 != null){
								if(grossMargin < (lineItem.marginThreshold1/100)){
									coreListLineScore = LINE_SCORE_YELLOW;
									coreListThresholdLevel = 1;
			
									if(lineItem.marginThreshold2 != null) {
										if(grossMargin < (lineItem.marginThreshold2/100)){
											coreListLineScore = LINE_SCORE_RED;
											coreListThresholdLevel = 2;
										}
									}
								} else {
									coreListLineScore = LINE_SCORE_GREEN;
									coreListThresholdLevel = 0;
								}
							} 
						}
                        if(coreListThresholdLevel  > lineItem.thresholdLevel){
                            lineItem.thresholdLevel = coreListThresholdLevel;
                            lineItem.lineScore = coreListLineScore;
                        }
                    }
                    System.debug('~~~CLPRRC~~~' + clpr.CPQ2_Approved_Core_List_Price__c);
                    if(clpr!=null && clpr.CPQ2_Approved_Core_List_Price__c!=null){
                        if(lineItem.purchasePrice >= clpr.CPQ2_Approved_Core_List_Price__c){
                            lineItem.lineScore = LINE_SCORE_GREEN;
                            lineItem.thresholdLevel = 0;
                        } 
                    }
				}
				//End:497
			}
		}
		
		return lineItem.thresholdLevel;
	}

	/**
	 * @description determine line score of equipment line item
	 *
	 * @param lineItem - target line item to evaluate
	 *
	 * @return line score
	 */
	private static Decimal evaluateEquipmentThreshold(CPQ2_Wrapper.LineItem lineItem){
		lineItem.lineScore = LINE_SCORE_YELLOW;
		lineItem.thresholdLevel = 1;

		//CPQCN-519 2021-01-26 Darcy: testing the contract price instead of requested core list
		Boolean hasContractPrice = false;
		Decimal contractPrice = 0;
		ProductService.ProductWrapper prodInfo = lineItem.productInfo;
		if(prodInfo != null){
			ContractService.ContractPricingSummary cps = prodInfo.contractPriceSummary;
			System.debug('evaluateEquipmentThreshold productInfo: ' + prodInfo );
			if(cps != null){
				hasContractPrice = true;
				contractPrice = cps.lowestApplicablePrice;
				System.debug('evaluateEquipmentThreshold hasContractPrice: ' + contractPrice );
			}
		}
		//CPQCN-596 2021-02-01 Darcy: Purchase price can be null when there is no opp line (core list price request only)
		if(lineItem.purchasePrice >= lineItem.lastApprovedPurchasePrice || lineItem.purchasePrice == null){
			lineItem.lineScore = LINE_SCORE_GREEN;
			lineItem.thresholdLevel = 0;
		} else {

			if (lineItem.listPrice != null) {
				if ((lineItem.purchasePrice >= lineItem.listPrice)
						|| (hasContractPrice && lineItem.purchasePrice >= contractPrice)
						|| lineItem.quantity == 0) {
					lineItem.lineScore = LINE_SCORE_GREEN;
					lineItem.thresholdLevel = 0;
				} else {
					lineItem.lineScore = LINE_SCORE_YELLOW;
					lineItem.thresholdLevel = 1;
				}
                
                //CPQCN-497 -- new core list price
				if (lineItem.coreListPriceRequest != null) {
					CPQ2_Core_List_Price_Request__c clpr = lineItem.coreListPriceRequest.coreListPriceRequest;
					System.debug('~~~CLPRRE~~~' + clpr.CPQ2_Requested_Price__c);
                    if(clpr!=null && clpr.CPQ2_Requested_Price__c!=null
                                  && clpr.CPQ2_Approved_Core_List_Price__c==null
                                  && lineItem.isCoreListSubmitted){ 
                        String coreListLineScore = LINE_SCORE_YELLOW;
                		Integer coreListThresholdLevel = 1;
                        
                        if(clpr.CPQ2_Requested_Price__c >= lineItem.listPrice){
                            coreListLineScore = LINE_SCORE_GREEN;
                            coreListThresholdLevel = 0;
                        } 
                        if(coreListThresholdLevel  > lineItem.thresholdLevel){
                            lineItem.thresholdLevel = coreListThresholdLevel;
                            lineItem.lineScore = coreListLineScore;
                        }
                    }
                    System.debug('~~~CLPRRE~~~' + clpr.CPQ2_Approved_Core_List_Price__c);
                    if(clpr!=null && clpr.CPQ2_Approved_Core_List_Price__c!=null){
                        if(lineItem.purchasePrice >= clpr.CPQ2_Approved_Core_List_Price__c){
                            lineItem.lineScore = LINE_SCORE_GREEN;
                            lineItem.thresholdLevel = 0;
                        } else {
                            lineItem.lineScore = LINE_SCORE_YELLOW;
                            lineItem.thresholdLevel = 1;
                        }
                    }
				}
				//End:497
			}
		}

		return lineItem.thresholdLevel;
	}
}