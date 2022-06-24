/**
 * WorkOrderLineItemTrigger : This trigger is called on insert, update and delete
 * @author Varun
 * @version 1.0 
 * @since 01-02-2020
 **/

trigger WorkOrderLineItemTrigger on WorkOrderLineItem (before insert,before update, after insert,after update, after delete) {
   new WorkOrderLineItemTriggerHandler().run();
}