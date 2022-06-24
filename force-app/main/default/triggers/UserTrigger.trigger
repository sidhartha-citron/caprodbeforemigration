trigger UserTrigger on User (before insert,before update, after insert,after update) { 
    new UserTriggerHandler().run(); 
}