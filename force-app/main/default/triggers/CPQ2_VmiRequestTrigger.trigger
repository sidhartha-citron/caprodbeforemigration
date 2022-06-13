/**
 * @description
 *
 * Created by timothychiang on 2020-04-24.
 *
 */

trigger CPQ2_VmiRequestTrigger on CPQ2_VMI_Request__c (after insert, after update, after undelete) {
	new CPQ2_VmiRequestTriggerHandler().run();
}