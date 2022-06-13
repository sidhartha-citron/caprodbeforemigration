/**
 * Created by timothychiang on 2020-03-21.
 */

/**
 * @description service class for SOQL and DML on the Order SObject
 */
public with sharing class OrderService {

	public static final String PRODUCT_TYPE_SERVICE = 'Service';

	/**
	 * @description wrapper class to house aggregate line item results. Used for display purposes.
	 */
	public class LineItem {
		@AuraEnabled public String orderNumber;
		@AuraEnabled public String productName;
		@AuraEnabled public String frequency;
		@AuraEnabled public Decimal servicePrice;
		@AuraEnabled public Decimal totalQuantity;
		@AuraEnabled public Decimal totalPerService;
		@AuraEnabled public Decimal annualTotal;
		@AuraEnabled public Boolean isSeasonal;
		@AuraEnabled public String key;

		/**
		 * @description defined constructor
		 *
		 * @param oi - initial line item
		 */
		public LineItem(OrderItem oi){
			this.orderNumber = oi.Order_Number__c;
			this.productName = oi.Product_Name__c;
			this.frequency = oi.Frequency__c;
			this.servicePrice = oi.Service_Price_Per_Unit__c;
			this.totalQuantity = oi.Quantity;
			this.totalPerService = this.servicePrice*this.totalQuantity;
			this.annualTotal = calculateAnnualTotal(this.totalPerService, this.frequency);
			this.isSeasonal = oi.Order.CPQ2_Seasonal__c;
			this.key = oi.Order_Number__c + ' - ' + oi.Product_Name__c + ' - ' + oi.Frequency__c + ' - ' + oi.Service_Price_Per_Unit__c;
		}

		/**
		 * @description helper method to merge line items for aggregation
		 *
		 * @param li - target line item to merge
		 */
		public void mergeItem(LineItem li) {
			this.totalQuantity += li.totalQuantity;
			this.totalPerService = this.servicePrice*this.totalQuantity;
			this.annualTotal = calculateAnnualTotal(this.totalPerService, this.frequency);
		}

		/**
		 * @description helper method to calculate annual amounts
		 *
		 * @param totalPerService - target service price (per visit)
		 * @param frequency - target frequency
		 *
		 * @return total annual price
		 */
		private Decimal calculateAnnualTotal(Decimal totalPerService, String frequency){
			Map<String, Frequency__c> frequencyMap = CustomSettingsService.getFrequencyMap();
			if(frequencyMap.containsKey(frequency)){
				return totalPerService*frequencyMap.get(frequency).Occurrences_In_Year__c;
			}
			return null;
		}
	}

	/**
	 * @description aggregate wrapper class for order line items, used for calculation purposes.
	 */
	public class OrderProductFrequencyDetails {
		@AuraEnabled public String productId;
		@AuraEnabled public String frequency;
		@AuraEnabled public Decimal maxServicePrice;

		public OrderProductFrequencyDetails(AggregateResult ar){
			this.frequency = (ar.get('freq')!=null) ? String.valueOf(ar.get('freq')) : '';
			this.productId = (ar.get('productId')!=null) ? String.valueOf(ar.get('productId')) : '';
			this.maxServicePrice = (ar.get('maxServicePrice')!=null) ? (Double) ar.get('maxServicePrice') : null;
		}
	}

	/**
	 * @description get order line items by account and status and type
	 *
	 * @param accountId - target account
	 * @param status - target status to filter on
	 * @param type - target type to filter on
	 *
	 * @return list of order items
	 */
	public static List<OrderItem> getOrderLineItemsByAccountAndType(Id accountId, String type){
		return [
				SELECT Order_Number__c,
					Product_Name__c,
					Frequency__c,
					Service_Price_Per_Unit__c,
					Quantity,
					Order.CPQ2_Seasonal__c
				FROM OrderItem
				WHERE Order.AccountId = :accountId
						AND Active__c = TRUE
						AND Product2.Item_Type__c = :type
				ORDER BY Order_Number__c,Product_Name__c,Service_Price_Per_Unit__c, Frequency__c
		];
	}

	/**
	 * @description aggregate existing services with a max price per frequency
	 *
	 * @param accountId - target account ID
	 * @param status - target status to filter on
	 * @param productIds - target product ids to filter on
	 *
	 * @return list of aggregate results
	 */
	public static List<AggregateResult> getExistingServicesWithMaxPriceByAccountAndProducts(Id accountId, Set<Id> productIds){
		return [
				SELECT Product2Id productId,
						Frequency__c freq,
						MAX(Service_Price_Per_Unit__c) maxServicePrice
				FROM OrderItem
				WHERE Order.AccountId = :accountId
						AND Product2Id IN :productIds
						AND Active__c = TRUE
				GROUP BY Product2Id,
						Frequency__c
				ORDER BY Product2Id
		];
	}

	/**
	 * @description Service class method that returns existing service orders based on account and product.
	 *
	 * @param accountId - accountId
	 * @param productIds - set of target products
	 *
	 * @return Map of Maps first key set prod id second key set frequency
	 */
	public static Map<Id, Map<String, OrderProductFrequencyDetails>> getExistingServicesMapByAccountIdAndProducts(Id accountId, Set<Id> productIds){
		Map<Id, Map<String, OrderProductFrequencyDetails>> prodFreqLineItemMap = new Map<Id, Map<String, OrderProductFrequencyDetails>>();

		List<OrderProductFrequencyDetails> lineItemLists = getExistingServicesByAccountIdAndProducts(accountId, productIds);

		for(OrderProductFrequencyDetails li: lineItemLists){
			if(!prodFreqLineItemMap.containsKey(li.productId)){
				prodFreqLineItemMap.put(li.productId, new Map<String, OrderProductFrequencyDetails>());
			}

			Map<String, OrderProductFrequencyDetails> productMap = prodFreqLineItemMap.get(li.productId);

			if(!productMap.containsKey(li.frequency)){
				productMap.put(li.frequency, li);
			} // do not handle else because the aggregate function should only return one set of each permutation max
		}
		return prodFreqLineItemMap;
	}

	/**
	 * @description get existing service order line items based on account Id and Products
	 *
	 * @param accountId - target account Id
	 * @param productIds - target product Ids
	 *
	 * @return list of aggregate wrapper details
	 */
	public static List<OrderProductFrequencyDetails> getExistingServicesByAccountIdAndProducts(Id accountId, Set<Id> productIds){

		List<OrderProductFrequencyDetails> aggregatedLineItemList = new List<OrderProductFrequencyDetails>();

		for (AggregateResult ar : getExistingServicesWithMaxPriceByAccountAndProducts(accountId, productIds)) {
			String frequency = (ar.get('freq')!=null) ? String.valueOf(ar.get('freq')) : '';
			if(frequency != 'One-Time'){
				aggregatedLineItemList.add(new OrderProductFrequencyDetails(ar));
			}
		}
		return aggregatedLineItemList;
	}

	/**
	 * @description get existing services by account ID
	 *
	 * @param accountId - target account Id
	 *
	 * @return list of wrapper line items based on target Id
	 */
	public static List<LineItem> getExistingServicesByAccountId(Id accountId){
		Map<String, LineItem> mapOrderItem = new Map<String, LineItem>();

		for (OrderItem oi : getOrderLineItemsByAccountAndType(accountId, PRODUCT_TYPE_SERVICE)) {
			if(oi.Frequency__c != 'One-Time'){
				LineItem lineItem = new LineItem(oi);

				if(mapOrderItem.containsKey(lineItem.key)){
					mapOrderItem.get(lineItem.key).mergeItem(lineItem);
				} else {
					mapOrderItem.put(lineItem.key, lineItem);
				}
			}
		}
		
		return mapOrderItem.values();
	}


	/**
	 * @description get order by target Ids
	 *
	 * @param targetIds - target order Ids
	 *
	 * @return list of order based on target Ids.
	 */
	public static List<Order> getOrderByIds(Set<Id> targetIds) {
		return [
			SELECT Id,
				Name,
				Type,
				OrderNumber,
				Pricebook2Id,
				CPQ2_TAC__c,
				CPQ2_HF__c,
				CPQ2_TAR__c,
				CPQ2_HC__c,
				Site_Survey__c,
				CPQ2_Seasonal__c,
				CPQ2_Include_in_Price_Model__c,
				CPQ2_TCaC__c,
				Account.Id,
				Account.CPQ2_TCaC__c,
				Account.Name,
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
				Account.FSA_Mapping__r.CPQ_Service_Branch__r.CPQ_Direct_Cost_of_Revenue__c//,
				//Warehouse_Location__c
			FROM Order
			WHERE Id IN:targetIds
		];
	}

	/*
     * @Name        getOrderByAcctIds
     * @Description Responsible for querying Orders By Account Ids
     * @Author      Sanchivan Sivadasan
     * @Params      acctIds: Set of Account Ids
     * @Return 		List<Order>: List of Orders that belong to the Set of Account Ids passed in
	 */
	public static List<Order> getOrderByAcctIds(Set<Id> acctIds) {
		return [
			SELECT Id,
				Name,
				Type,
				OrderNumber,
				Pricebook2Id,
				CPQ2_TAC__c,
				CPQ2_HF__c,
				CPQ2_TAR__c,
				CPQ2_HC__c,
				Site_Survey__c,
				CPQ2_Seasonal__c,
				CPQ2_Include_in_Price_Model__c,
				CPQ2_TCaC__c,
				Account.Id,
				Account.CPQ2_TCaC__c,
				Account.Name,
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
			FROM Order
			WHERE AccountId IN:acctIds AND (CPQ2_Include_in_Price_Model__c = True OR CPQ2_Seasonal__c = True)
		];
	}

	/**
	 * @description get order by Id
	 *
	 * @param targetId - order Id
	 *
	 * @return target order
	 */
	public static Order getOrderById(Id targetId) {
		List<Order> targetList = getOrderByIds(new Set<Id>{
			targetId
		});

		if (!targetList.isEmpty()) {
			return targetList[0];
		} else {
			return null;
		}
	}

	/**
	 * @description get orders by target Ids in map form
	 *
	 * @param targetIds - orders Ids to target
	 *
	 * @return Map of orders Id-->orders
	 */
	public static Map<Id, Order> getOrdersMapByIds(Set<Id> targetIds) {
		Map<Id, Order> orderMap = new Map<Id, Order>();
		orderMap.putAll(getOrderByIds(targetIds));
		return orderMap;
	}


	/**
	 * @description get order line items by opportunity Ids and Type in Map form
	 *
	 * @param targetIds - target order ids
	 * @param type - target type
	 *
	 * @return Map order Id-->order
	 */
	public static Map<Id, List<OrderItem>> getOpportunityProductsByOpportunityIdsAndTypeMap(Set<Id> targetIds, String type) {

		Map<Id, List<OrderItem>> orderToOrderItemMap = new Map<Id, List<OrderItem>>();
		List<OrderItem> orderItemList;

		if (String.isEmpty(type)) {
			orderItemList = getOrderProductsByOrderIds(targetIds);
		} else {
			orderItemList = getOrderProductsByOrderIdsAndType(targetIds, type);
		}

		for (OrderItem orderItem : orderItemList) {
			if (!orderToOrderItemMap.containsKey(orderItem.OrderId)) {
				orderToOrderItemMap.put(orderItem.OrderId, new List<OrderItem>());
			}

			orderToOrderItemMap.get(orderItem.OrderId).add(orderItem);
		}

		return orderToOrderItemMap;

	}

	/**
	 * @description Get order line items by order Ids
	 *
	 * @param targetIds - target order ids
	 *
	 * @return Map order Id-->order
	 */
	public static Map<Id, List<OrderItem>> getOrderProductsByOrderIdsMap(Set<Id> targetIds) {
		return getOpportunityProductsByOpportunityIdsAndTypeMap(targetIds, null);
	}


	/**
	 * @description get order line items by order Ids
	 *
	 * @param targetIds - target Ids
	 *
	 * @return list of order line items
	 */
	public static List<OrderItem> getOrderProductsByOrderIds(Set<Id> targetIds) {
		return [
			SELECT Id,
				OrderId,
				Description,
				Frequency__c,
				Quantity,
				Service_Price_Per_Unit__c,
				Purchase_Price__c,
				Installation_Price__c,
				Installation_Status__c,
				Installation_Notes__c,
				Related_Product__c,
				PricebookEntryId,
				Requested_Price__c,
				Requested_Price_Approved__c,
				Active__c,
				CPQ2_Duration_In_Minutes__c,
				CPQ2_Material_Cost__c,
				CPQ2_Number_Of_Visits_Per_Year__c,
				CPQ2_Average_Cost_Minute__c,
				CPQ2_Total_Costs__c,
				CPQ2_Total_Revenue__c,
				CPQ2_Line_Margin__c,
				CPQ2_Total_Capital_Charge__c,
				CPQ2_Amortization__c,
				CPQ2_Capital_Cost__c,
				Product2Id,
				Product2.Name,
				Product2.Item_Type__c,
				Product2.Product_Image_URL__c,
				Product2.ProductCode,
				Product2.Family,
				Product2.Allowable_Frequencies__c,
				Related_Product__r.Name,
				Survey_Location__r.Name,
				Service_Notes__c,
				Covered_Pests__c,
				Covered_Pests_Other__c,
				Areas_of_Coverage__c,
				Areas_of_Coverage_Other__c,
				Valid_for_Install_Remove_Replace__c 
			FROM OrderItem
			WHERE OrderId IN:targetIds
		];
	}

	/**
	 * @description get Order Items by Order Item Ids.
	 * 
	 * @param orderItemIds - target Order Item 
	 * 
	 * @return list of order Items
	 */
	public static List<OrderItem> getOrderProductsByIds(Set<Id> orderItemIds) {
		return [
			SELECT 
				Id, 
				Valid_for_Install_Remove_Replace__c
			FROM
				OrderItem
			WHERE
				Id =: orderItemIds
		];
	}

	/**
	 * @description get order lineItems by targetIds and type
	 *
	 * @param targetIds - target order Ids
	 * @param type - target type
	 *
	 * @return list of order line items
	 */
	public static List<OrderItem> getOrderProductsByOrderIdsAndType(Set<Id> targetIds, String type) {
		return [
			SELECT Id,
				OrderId,
				Description,
				Frequency__c,
				Quantity,
				Service_Price_Per_Unit__c,
				Purchase_Price__c,
				Installation_Price__c,
				Installation_Status__c,
				Installation_Notes__c,
				Related_Product__c,
				PricebookEntryId,
				Requested_Price__c,
				Requested_Price_Approved__c,
				Active__c,
				CPQ2_Duration_In_Minutes__c,
				CPQ2_Material_Cost__c,
				CPQ2_Number_Of_Visits_Per_Year__c,
				CPQ2_Average_Cost_Minute__c,
				CPQ2_Total_Costs__c,
				CPQ2_Total_Revenue__c,
				CPQ2_Line_Margin__c,
				CPQ2_Total_Capital_Charge__c,
				CPQ2_Amortization__c,
				CPQ2_Capital_Cost__c,
				Product2Id,
				Product2.Name,
				Product2.Item_Type__c,
				Product2.Product_Image_URL__c,
				Product2.ProductCode,
				Product2.Family,
				Product2.Allowable_Frequencies__c,
				Related_Product__r.Name,
				Survey_Location__r.Name,
				Service_Notes__c,
				Covered_Pests__c,
				Covered_Pests_Other__c,
				Areas_of_Coverage__c,
				Areas_of_Coverage_Other__c,
				Valid_for_Install_Remove_Replace__c 
			FROM OrderItem
			WHERE OrderId IN:targetIds AND
			Item_Type__c = :type
		];
	}

	/**
	 * @description get order line items by order Ids and Type in Map form
	 *
	 * @param targetIds - target order ids
	 * @param type - target type
	 *
	 * @return Map order Id-->order
	 */
	public static Map<Id, List<OrderItem>> getOrderProductsByOrderIdsAndTypeMap(Set<Id> targetIds, String type) {

		Map<Id, List<OrderItem>> orderToOrderItemMap = new Map<Id, List<OrderItem>>();
		List<OrderItem> oliList;

		if (String.isEmpty(type)) {
			oliList = getOrderProductsByOrderIds(targetIds);
		} else {
			oliList = getOrderProductsByOrderIdsAndType(targetIds, type);
		}

		for (OrderItem order : oliList) {
			if (!orderToOrderItemMap.containsKey(order.OrderId)) {
				orderToOrderItemMap.put(order.OrderId, new List<OrderItem>());
			}

			orderToOrderItemMap.get(order.OrderId).add(order);
		}

		return orderToOrderItemMap;

	}

	/**
	 * @description handle update for orders
	 *
	 * @param orderList - target list of orders
	 * @param allOrNone - all of none option
	 *
	 * @return DML results
	 */
	public static Database.SaveResult[] updateOrders(List<Order> orderList, Boolean allOrNone) {
		return ServiceUtil.generalUpdate(orderList, allOrNone);
	}

	/**
	 * @description handle insert for order line items
	 *
	 * @param listOrderItems - target list of order items
	 * @param allOrNone - all of none option
	 *
	 * @return DML results
	 */
	public static Database.SaveResult[] insertOrderItems(List<OrderItem> listOrderItems, Boolean allOrNone) {
		return ServiceUtil.generalInsert(listOrderItems, allOrNone);
	}

	/**
	 * @description handle update for order line items
	 *
	 * @param listOrderItems - target list of order items
	 * @param allOrNone - all of none option
	 *
	 * @return DML results
	 */
	public static Database.SaveResult[] updateOrderItems(List<OrderItem> listOrderItems, Boolean allOrNone) {
		System.debug('Sanchivan OrderService.updateOrderItems listOrderItems: ' + listOrderItems);
		return ServiceUtil.generalUpdate(listOrderItems, allOrNone);
	}

	/**
	 * @description handle delete for order line items
	 *
	 * @param listOrderItems - target list of order items
	 * @param allOrNone - all of none option
	 *
	 * @return DML results
	 */
	public static Database.DeleteResult[] deleteOrderItems(List<OrderItem> listOrderItems, Boolean allOrNone) {
		return ServiceUtil.generalDelete(listOrderItems, allOrNone);
	}


}