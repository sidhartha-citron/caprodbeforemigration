/**
 * @description
 *
 * Created by timothychiang on 2020-04-24.
 *
 */

public with sharing class CPQ2_VmiRequestTriggerHandler extends TriggerHandler {
	private List<CPQ2_VMI_Request__c> listNew;
	private List<CPQ2_VMI_Request__c> listOld;
	private Map<Id,CPQ2_VMI_Request__c> mapNew;
	private Map<Id,CPQ2_VMI_Request__c> mapOld;

	public CPQ2_VmiRequestTriggerHandler(){
		this.setMaxLoopCount(40);
		listNew = Trigger.new;
		listOld = Trigger.old;
		mapNew = (Map<Id,CPQ2_VMI_Request__c>)Trigger.newMap;
		mapOld = (Map<Id,CPQ2_VMI_Request__c>)Trigger.oldMap;
	}

//	protected override void beforeInsert(){
//	}
//
//	protected override void beforeUpdate(){
//	}
//
//	protected override void beforeDelete(){
//	}

	protected override void afterInsert(){
		CPQ2_Service.updateCoreListPriceWithVMI(listNew, CPQ2_Util.DmlAction.ACTION_CREATE);
	}

	protected override void afterUpdate(){
		CPQ2_Service.updateCoreListPriceWithVMI(listNew, CPQ2_Util.DmlAction.ACTION_UPDATE);
	}

//	protected override void afterDelete(){
//		CPQ2_Service.updateCoreListPriceWithVMI(listNew, CPQ2_Util.DmlAction.ACTION_DELETE);
//	}
//
//	protected override void afterUndelete(){
//	}

}