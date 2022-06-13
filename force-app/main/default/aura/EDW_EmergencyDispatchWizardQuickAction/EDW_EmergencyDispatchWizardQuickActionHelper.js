({
	handleInit: function(component, event, helper) {
        this.validateAccessToEmergencyDispatchWizard(component, event, helper);
	},
    
    validateAccessToEmergencyDispatchWizard: function(component, event, helper) {
    	let recordId = component.get("v.recordId"),
            action = component.get("c.isAccessValid");
        
        action.setParams({
            recordId: recordId
        });
        
		action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                let data = JSON.parse(response.getReturnValue());
            
                if (data.response.isSuccessful) {
                    this.navigationFactory(component, event, helper, data.objectType);
                } else {
                	let objResponse = { responseMessage: data.response.responseMessage };
                    component.set("v.response", objResponse);
        			$A.util.removeClass(component.find("messageContainer"), "slds-hide");
        			component.find("mySpinner").destroy();
                }
        	} else {
            	
            }
        });
        
        $A.enqueueAction(action);
	},
    
    navigationFactory: function(component, event, helper, objectType) {
        if (objectType === "Account") {
            this.navigateToEmergencyDispatchWizard(component, event, helper, "NEW");
        } else if (objectType === "Order") {
            this.navigateToEmergencyDispatchWizard(component, event, helper, "EDIT");
        } else if (objectType === "Case") {
            this.navigateToEmergencyDispatchWizard(component, event, helper, "NEW");
        } else {
            //error
        }
    },
    
    navigateToEmergencyDispatchWizard: function(component, event, helper, mode) {
        let evt = $A.get("e.force:navigateToComponent");
        
        evt.setParams({
            componentDef : "c:EDW_EmergencyDispatchWizardMasterComponent",
            componentAttributes: {
                recordId: component.get("v.recordId"),
                mode: mode
            },
            isredirect : false
        })
        .fire();
        $A.util.addClass(component.find("mySpinner"), "slds-hide");
    }
})