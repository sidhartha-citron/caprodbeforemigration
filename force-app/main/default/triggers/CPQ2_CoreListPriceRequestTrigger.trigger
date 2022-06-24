/**
 * @description
 *
 * Created by timothychiang on 2020-04-24.
 *
 */

trigger CPQ2_CoreListPriceRequestTrigger on CPQ2_Core_List_Price_Request__c (before insert, before update) {
	new CPQ2_CoreListPriceRequestTriggerHandler().run();
}