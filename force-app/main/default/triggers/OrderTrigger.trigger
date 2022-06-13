/**
 * OrderTrigger : This trigger is called on insert, update and delete
 * @author Shashi
 * @version 1.0 
 * @since 8-19-2019
 **/
trigger OrderTrigger on Order (before insert,before update, after insert,after update, before delete, after delete) {
    new OrderTriggerHandler().run(); 
}