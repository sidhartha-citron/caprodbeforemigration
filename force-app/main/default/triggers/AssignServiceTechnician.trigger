/**
 * Trigger that populates Service Resource Name once Service Appointment status becomes 'Completed'
 * @author Ahsan Butt
 */
trigger AssignServiceTechnician on ServiceAppointment (before update) {
    List<ServiceAppointment> completedAppts = new List<ServiceAppointment>();
    
    // Get ServiceAppointments that just flipped to 'Completed'
    for (ServiceAppointment appt : Trigger.new) {
        ServiceAppointment oldAppt = Trigger.oldMap.get(appt.Id);
        
        if (appt.Status == 'Completed' && appt.Status != oldAppt.Status) {
            completedAppts.add(appt);
        }
    }
    
    // Get Assigned Resources for appts -- use the most recent (sort asc, then use the last one)
    List<AssignedResource> resources = [SELECT Id, ServiceAppointmentId, Service_Resource_Name__c, ServiceResource.License_Number__c
                                        FROM AssignedResource 
                                        WHERE ServiceAppointmentId IN :completedAppts 
                                        ORDER BY LastModifiedDate ASC];
    
    Map<Id, AssignedResource> apptIdToResourceMap = new Map<Id, AssignedResource>();
    
    for (AssignedResource resource : resources) {
        apptIdToResourceMap.put(resource.ServiceAppointmentId, resource);
    }
    
    // Set Service Resource Name
    for (ServiceAppointment appt : completedAppts) {
        if (!apptIdToResourceMap.containsKey(appt.Id)) continue;
        
        appt.Serviced_By__c = apptIdToResourceMap.get(appt.Id).Service_Resource_Name__c;
        appt.License_Number__c = apptIdToResourceMap.get(appt.Id).ServiceResource.License_Number__c;
    }
}