/**
 * @description
 *
 * Created by timothychiang on 2020-04-24.
 *
 */

public with sharing class CPQ2_CoreListPriceRequestTriggerHandler extends TriggerHandler {
	private List<CPQ2_Core_List_Price_Request__c> listNew;
	private List<CPQ2_Core_List_Price_Request__c> listOld;
	private Map<Id,CPQ2_Core_List_Price_Request__c> mapNew;
	private Map<Id,CPQ2_Core_List_Price_Request__c> mapOld;

	public CPQ2_CoreListPriceRequestTriggerHandler(){
		this.setMaxLoopCount(40);
		listNew = Trigger.new;
		listOld = Trigger.old;
		mapNew = (Map<Id,CPQ2_Core_List_Price_Request__c>)Trigger.newMap;
		mapOld = (Map<Id,CPQ2_Core_List_Price_Request__c>)Trigger.oldMap;
	}

	protected override void beforeInsert(){
		CPQ2_Service.updateCoreListPriceWithVMI(listNew);
		CPQ2_Service.evaluateCoreListPriceRequest(listNew);
	}

	protected override void beforeUpdate(){
		CPQ2_Service.updateCoreListPriceWithVMI(listNew);
		CPQ2_Service.evaluateCoreListPriceRequest(listNew);
	}

//	protected override void beforeDelete(){
//	}
//
//	protected override void afterInsert(){
//	}
//
//	protected override void afterUpdate(){
//	}
//
//	protected override void afterDelete(){
//	}
//
//	protected override void afterUndelete(){
//	}
}