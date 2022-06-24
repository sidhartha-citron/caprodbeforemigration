/**
 * @description
 *
 * Created by timothychiang on 2020-04-19.
 *
 */

public with sharing class CPQ2_OpportunityWrapperController {

	/**
	 * @description  by the opportunity wrapper to determine the opportunity id an SObject
	 *
	 * @param targetId  id of record
	 *
	 * @return opportunity Id
	 */
	@AuraEnabled
	public static CPQ2_OpportunityWrapperController.DataWrapper getDestinationId(String targetId){
		Id sobjectId = targetId;
		String sObjName = sobjectId.getSObjectType().getDescribe().getName();
		Id returnId = null;

		DataWrapper wrapper = new DataWrapper();

		if(sObjName == 'Opportunity'){
			wrapper.returnId = targetId;
			wrapper.isQuoteSyncCheckFailed = false;
			// returnId = targetId;
			// return wrapper;
		} else if (sObjName == 'Quote'){
			Quote quote = QuoteService.getQuoteById(targetId);
			wrapper.returnId = quote.OpportunityId;
			// wrapper.isQuoteScreen = true;

			if(quote.Opportunity.SyncedQuoteId == targetId) {
				wrapper.isQuoteSyncCheckFailed = false;
			}
			else {
				wrapper.isQuoteSyncCheckFailed = true;
			}
			// return wrapper;
			// returnId =  quote.OpportunityId;
		}

		return wrapper;

		//return returnId;
	}

	public class DataWrapper {
		@AuraEnabled
		public Id returnId;

		@AuraEnabled
		public Boolean isQuoteSyncCheckFailed;

		@AuraEnabled
		public Boolean isQuoteSynced;
	}
}