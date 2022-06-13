/**
* @description general util class for CPQ2
 *
 * Created by timothychiang on 2020-03-22.
 *
 */

public with sharing class CPQ2_Util {
	public enum DmlAction {ACTION_UPDATE, ACTION_CREATE, ACTION_DELETE}

	public static final String PRICE_MODEL_HYGIENE = 'Hygiene Pricing Model';
	public static final String PRODUCT_TYPE_SERVICE = 'Service';
	public static final String PRODUCT_TYPE_EQUIPMENT = 'Equipment';
	public static final String PRODUCT_TYPE_CONSUMABLES = 'Consumables';

	public static final String DML_RESULT_TYPE_INSERT = 'Insert';
	public static final String DML_RESULT_TYPE_UPDATE = 'Update';
	public static final String DML_RESULT_TYPE_DELETE = 'Delete';

	public static final String SERVICE_OPP_TRIGGER_NAME = 'CPQ2_OLI_Trigger';
	public static final String SERVICE_ORDER_TRIGGER_NAME = 'CPQ2_ORLI_Trigger';
	public static final String SERVICE_QUOTE_TRIGGER_NAME = 'CPQ2_QUOTE_Trigger';
	public static final String SOBJECT_NAME_OPP = 'Opportunity';
	public static final String SOBJECT_NAME_ORDER = 'Order';
	public static final String SOBJECT_NAME_ORDER_LINE_ITEM = 'OrderItem';
	public static final String SOBJECT_NAME_OPP_LINE_ITEM = 'OpportunityLineItem';
	public static final String SOBJECT_NAME_VMI = 'CPQ2_VMI_Request__c';
	public static final String SOBJECT_NAME_OPP_CORE_LIST_PRICE = 'CPQ2_Core_List_Price_Request__c';
    
    public static Boolean isTriggered = false;

	/**
	 * @description helper method to convert DML enumerable to string
	 *
	 * @param action - target action to convert
	 *
	 * @return translated string
	 */
	public static String mapSaveActionToDmlResultType(DmlAction action){
		String returnString;

		if(action == DmlAction.ACTION_CREATE){
			returnString = DML_RESULT_TYPE_INSERT;
		} else if(action == DmlAction.ACTION_UPDATE){
			returnString = DML_RESULT_TYPE_UPDATE;
		} else if(action == DmlAction.ACTION_DELETE){
			returnString = DML_RESULT_TYPE_DELETE;
		}

		return returnString;
	}

	/**
	 * @description generates unique ids for each line item - important for LWC
	 *
	 * @return unique Id
	 */
	public static String getUUID() {
		Blob b = Crypto.generateAesKey(128);
		String h = EncodingUtil.convertToHex(b);
		String guid = h.substring(0, 8) + '-' +
				h.substring(8, 12) + '-' +
				h.substring(12, 16) + '-' +
				h.substring(16, 20) + '-' +
				h.substring(20);
		System.debug(guid);
		return guid;
	}

	/**
	 * @description util method to convert a list of OLIs into a map with OppId as key
	 *
	 * @param oliList list to extract from
	 *
	 * @return map of opportunity Ids to List of OLI
	 */
	public static Map<Id, List<OpportunityLineItem>> getOpportunityIdMapFromOli(List<OpportunityLineItem> oliList){

		Map<Id, List<OpportunityLineItem>> oppToOliListMap = new Map<Id, List<OpportunityLineItem>>();
		for(OpportunityLineItem oli: oliList){
			if(!oppToOliListMap.containsKey(oli.OpportunityId)){
				oppToOliListMap.put(oli.OpportunityId, new List<OpportunityLineItem>());
			}
			oppToOliListMap.get(oli.OpportunityId).add(oli);
		}
		return oppToOliListMap;
	}

	/**
	 * @description util method to convert a list of OrderItems into a map with Order Id as key
	 *
	 * @param orderItemList list of target order items
	 *
	 * @return map of opportunity Ids to List of OLI
	 */
	public static Map<Id, List<OrderItem>> getOrderIdMapFromOrderItems(List<OrderItem> orderItemList){

		Map<Id, List<OrderItem>> orderToOrderItemsListMap = new Map<Id, List<OrderItem>>();
		for(OrderItem orderItem: orderItemList){
			if(!orderToOrderItemsListMap.containsKey(orderItem.OrderId)){
				orderToOrderItemsListMap.put(orderItem.OrderId, new List<OrderItem>());
			}
			orderToOrderItemsListMap.get(orderItem.OrderId).add(orderItem);
		}
		return orderToOrderItemsListMap;
	}
}