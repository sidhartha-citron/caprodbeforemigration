/**
 * OpportunityTrigger: 
 * @author Irfan Tarique
 * @version 1.0 
 * @since 16-10-2019 
 **/
trigger OpportunityTrigger on Opportunity (after insert, after update, before insert, before update, before delete, after delete) {
      new OpportunityTriggerHandler().run();
}