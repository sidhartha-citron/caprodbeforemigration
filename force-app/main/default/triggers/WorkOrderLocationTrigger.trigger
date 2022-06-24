trigger WorkOrderLocationTrigger on Work_Order_Room__c (before insert, before update, after update) {
    new WorkOrderLocationTriggerHandler().run();
}