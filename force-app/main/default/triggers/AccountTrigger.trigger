/**
 * AccountTrigger : This trigger is called on insert, update and delete
 * @author Aieleeta
 * @version 1.0 
 * @since 2016-06-12
 **/
trigger AccountTrigger on Account (before insert,before update, after insert,after update, before delete, after delete) {
       new AccountTriggerHandler().run(); 
}