({
	handleInit: function(component, event, helper) {
        let resourceAssigned = component.get("v.hasResourceAssigned");

        if ($A.util.isUndefinedOrNull(resourceAssigned) || !resourceAssigned) {
            $A.createComponent("c:EDW_ServiceAppointmentResourceAssignedListener", {
                appointmentId: component.get("v.serviceAppointmentId")
            }, (data, status, errorMessage) => {
                component.find("serviceAppointmentListener").set("v.body", data);
            });
        }
	}
})