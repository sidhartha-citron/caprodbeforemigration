({
	doInit: function(component, event, helper) {
		helper.handleInit(component, event, helper);
	},
    
    expandedEvent: function(component, event, helper) {
        helper.handleExpandedEvent(component, event, helper);
    },
    
    retrieveServiceAppointmentsOnWorkOrder: function(component, event, helper) {
        helper.handleRetrieveServiceAppointmentsOnWorkOrder(component, event, helper);
    },
    
    appointmentAssigned: function(component, event, helper) {
		helper.handleAppointmentAssigned(component, event, helper);
	}
})