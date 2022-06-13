trigger AssignedResourceTrigger on AssignedResource (before delete,after insert,after update,after delete) {
     new AssignResourceTriggerHandler().run();
}