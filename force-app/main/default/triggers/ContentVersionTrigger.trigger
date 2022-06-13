/**
 * ContentVersionTrigger
 * @author Shashi
 * @version 1.0 
 * @since 2019-07-04
 **/
trigger ContentVersionTrigger on ContentVersion (before insert,before update, after insert,after update, before delete, after delete) {
	new ContentVersionTriggerHandler().run();
}