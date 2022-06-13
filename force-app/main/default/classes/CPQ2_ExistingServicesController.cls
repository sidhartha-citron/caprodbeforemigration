/**
 * Created by timothychiang on 2020-03-21.
 */

public with sharing class CPQ2_ExistingServicesController {

	/**
	 * @description wrapper class to house existing service order data + helper config information (frequencies)
	 */
	public class existingOrderData{
		@AuraEnabled public List<OrderService.LineItem> existingServices;
		@AuraEnabled public CPQ_Settings__c cpqSettings;
	}

	/**
	 * @description gets existing services for target account Id
	 *
	 * @param accountId - target account Id
	 *
	 * @return existing service order data + helper config information (frequencies)
	 */
	@AuraEnabled
	public static existingOrderData getExistingServices(Id accountId) {
		existingOrderData returnData = new existingOrderData();
		returnData.cpqSettings = CustomSettingsService.getCpqSettings();
		returnData.existingServices = OrderService.getExistingServicesByAccountId(accountId);
		return returnData;
	}
}