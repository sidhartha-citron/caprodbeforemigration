/**
 * @description
 *
 * Created by timothychiang on 2020-05-19.
 *
 */

public with sharing class CPQ2_OrderValidationUtil {

	public class OrderValidationResult{
		@AuraEnabled public Boolean isSuccess;
		@AuraEnabled public List<String> errorMessages;

		public OrderValidationResult(){
			isSuccess = false;
			errorMessages = new List<String>();
		}
	}


	/**
	 * @description perform validation on order line items - scope of this validation assumes the following:
	 * 				the line items all come from the same order
	 * 				the line items passed through represent ALL of the line items associated to the order
	 *
	 * @param orderItems - target line items to validate
	 *
	 * @return validation result
	 */
	public static OrderValidationResult validateOrderLineItems(List<OrderItem> orderItems){
		
		/*2020-12-02 Darcy: CPQCN-434
		* validations are being disabled for now
		*/
		OrderValidationResult result = new OrderValidationResult();
		result.isSuccess = true;
		return result;
		
		/*

		Set<Id> productIdSet = new Set<Id>();

		// get product information related to the orderItem
		for(OrderItem orderItem: orderItems){
			productIdSet.add(orderItem.Product2Id);
		}

		Map<Id, Product2> product2Map = ProductService.getProduct2MapByIds(productIdSet);

		Boolean satisfiesOneTimePurchase = true;
		Boolean satisfiesOneTimeService = true;
		Boolean satisfiesNotOneTimeService = true;
		Boolean satisfiesRecurringDeliveriesService = true;
		Boolean isRecurringServiceOrOneTimeConsumableOrEquipWithNoInstall = true;
		Boolean isRecurringServiceOrOneTimeConsumableOrEquipment = true;
		Boolean hasOpenInstallation = false;
		Boolean satisfiesRecurringServiceInstallationAndOneTime = true;
		Boolean hasProductInfo = true;

		OrderValidationResult result = new OrderValidationResult();

		for(OrderItem orderItem: orderItems){
			System.debug('Sanchivan orderItem.Id: ' + orderItem.Id);
			System.debug('Sanchivan orderItem.Valid_for_Install_Remove_Replace__c: ' + orderItem.Valid_for_Install_Remove_Replace__c);
			

			Product2 currentProduct;
			if(product2Map.containsKey(orderItem.Product2Id)){
				currentProduct = product2Map.get(orderItem.Product2Id);
				
				// If it's a Fee Item then ignore Validation (CPQCN-406)
				// Product2.Item_Type__c = 'Service' AND
				// Product2.Never_Generate_Work_Order__c = True AND
				// Product2.Is_Inventory_Item__c = False (Non Service Items)
				if(currentProduct.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_of_Services__c &&
				   currentProduct.Never_Generate_Work_Order__c == True &&
				   currentProduct.Is_Inventory_Item__c == False) {
					continue;
				}

				//		1. One-time Delivery / One-time Delivery (Consumable) + Installation (Equipment)
				//		All Items on this Order have Service Frequency = One Time AND Product.Item_Type = Consumable OR Equipment
				if(!(orderItem.Frequency__c == QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c && 
					 currentProduct.Item_Type__c != QueryUtils.fieldServiceSettings.Item_Type_of_Services__c)){
					satisfiesOneTimePurchase = false;
				}

				//		2. One-time Service
				//		All Items on this Order have Service Frequency = One Time AND Product.Item_Type = Service
				if(!(orderItem.Frequency__c == QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c && 
					 currentProduct.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_of_Services__c)){
					satisfiesOneTimeService = false;
				}

				//		3. Recurring Services / Recurring services + installation
				//		All Items on this Order have Service Frequency != One Time AND Product.Item_Type = Service
				if(!(orderItem.Frequency__c != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c && 
					 currentProduct.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_of_Services__c)){
					satisfiesNotOneTimeService = false;
				}

				//		4. Recurring Deliveries
				//		All Items on this Order have Service Frequency != One Time AND Product.Item_Type = Consumable (Note: Allowable Frequency on Product will likely cover for the equipment side anyways)
				if(!(orderItem.Frequency__c != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c && 
					 currentProduct.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_for_Consumables__c)){
					satisfiesRecurringDeliveriesService = false;
				}

				//		5. Recurring services + Installation + one-time delivery products (consumables) + equipment 
				// 		(equipment may have installation)
				//		a. However, you can add **~One-Time~** Consumables to Recurring Services if one of the
				//		recurring services is doing an Install for the first time. I.e. For the Service Line item
				//		Install Status != Null AND “Is Valid for Install/Replace” = TRUE (True = hasn’t completed install)
				if(!(orderItem.Frequency__c != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c && 
					 currentProduct.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_of_Services__c) &&
				   !(orderItem.Frequency__c == QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c && 
					 currentProduct.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_for_Consumables__c) &&
				   !(orderItem.Frequency__c == QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c &&
					 currentProduct.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_for_Equipment__c )){
						isRecurringServiceOrOneTimeConsumableOrEquipment = false;
				}
				if((orderItem.Frequency__c != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c && 
					currentProduct.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_of_Services__c) &&
					!String.isBlank(orderItem.Installation_Status__c) &&
					(orderItem.Id == null || orderItem.Valid_for_Install_Remove_Replace__c)){
					hasOpenInstallation = true;
				}
			} else {
				hasProductInfo = false;
			}
		}
		
		//rule 5 final check
		if(!(isRecurringServiceOrOneTimeConsumableOrEquipment && hasOpenInstallation)){
			satisfiesRecurringServiceInstallationAndOneTime = false;
		}

		System.debug('*** hasProductInfo: ' + hasProductInfo);
		System.debug('*** satisfiesOneTimePurchase: ' + satisfiesOneTimePurchase);
		System.debug('*** satisfiesOneTimeService: ' + satisfiesOneTimeService);
		System.debug('*** satisfiesNotOneTimeService: ' + satisfiesNotOneTimeService);
		System.debug('*** satisfiesRecurringDeliveriesService: ' + satisfiesRecurringDeliveriesService);
		System.debug('*** satisfiesRecurringServiceInstallationAndOneTime: ' + satisfiesRecurringServiceInstallationAndOneTime);

		result.isSuccess = (hasProductInfo && (
							satisfiesOneTimePurchase ||
							satisfiesOneTimeService ||
							satisfiesNotOneTimeService ||
							satisfiesRecurringDeliveriesService ||
							satisfiesRecurringServiceInstallationAndOneTime));					
		return result;
		*/
	}
}