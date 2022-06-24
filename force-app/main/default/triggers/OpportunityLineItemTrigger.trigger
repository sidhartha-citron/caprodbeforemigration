trigger OpportunityLineItemTrigger on OpportunityLineItem (before insert, before update, after insert, after update, after delete) {
    new OpportunityLineItemTriggerHandler().run();
}