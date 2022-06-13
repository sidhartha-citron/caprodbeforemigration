/**
 * OrderProductTrigger : This trigger is called on insert, update and delete
 * @author Shashi
 * @version 1.0 
 * @since 8-12-2019
 **/
trigger OrderProductTrigger on OrderItem (before insert,before update, after insert,after update, before delete, after delete) {
    new OrderProductTriggerHandler().run(); 
}