({
	handleInit: function(component, event, helper) {
        console.log("sa listener started");
        
        let progressCheck = window.setInterval($A.getCallback(() => {
            if (!component.isValid()) {
            	component.set("v.killComponent", true);
            	clearInterval(progressCheck);
            	return;
            }
            
            let action = component.get("c.checkForAppointmentAssignment"),
            	appointmentId = component.get("v.appointmentId");
            
            action.setParams({
                appointmentId: appointmentId
            });
            
            action.setCallback(this, (response) => {
                let state = response.getState();
                
                if (state === "SUCCESS") {
            		let isAssigned = response.getReturnValue();
            
                    if (isAssigned) {
            			let appEvent = $A.get("e.c:EDW_ServiceAppointmentResourceAssignedEvent");
                        appEvent.setParams({
                            appointmentId: appointmentId,
            				isAssigned: isAssigned
        				})
                        .fire();
        
                		component.set("v.killComponent", true);
        				clearInterval(progressCheck);
                    }
                } else {
                	console.log(response.getError());
                }
            });
    
        	$A.enqueueAction(action);
		}), 500);
	},
    
    handleKillComponentListener: function(component, event, helper) {
        let killComponent = component.get("v.killComponent");
        
        if (killComponent) {
            console.log("job finished, component destroyed");
            component.destroy();
        }
	}
})