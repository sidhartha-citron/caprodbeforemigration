({
    policyChange: function(component, event, helper) {
		helper.handlePolicyChange(component, event, helper);
	},
    
    cancelServiceAppointment: function(component, event, helper) {
		helper.handleCancelServiceAppointment(component, event, helper);
	},
    
    deleteServiceAppointment: function(component, event, helper) {
		helper.handleDeleteServiceAppointment(component, event, helper);
	},
    
    sectionExpandedEvent: function(component, event, helper) {
        helper.handleSectionExpandedEvent(component, event, helper);
	}
})