trigger ServiceAppointmentTrigger on ServiceAppointment (before insert,before update, after insert,after update, before delete, after delete) {

 new ServiceAppointmentTriggerHandler().run();    
}