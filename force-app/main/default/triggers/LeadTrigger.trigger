/**
 * Lead: 
 * @author Irfan Tarique
 * @version 1.0 
 * @since 05-05-2020 
 **/
trigger LeadTrigger on Lead (after insert, after update, before insert, before update, before delete) {
      new LeadTriggerHandler().run();
}