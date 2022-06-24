({
	handleInit: function(component, event, helper) {
		let timeBlockAction = component.get("c.getTimeBlocks"),
            defaultRequestedDateAction = component.get("c.getDefaultRequestedDate");
        
        timeBlockAction.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = response.getReturnValue();
            
            	component.set("v.timeBlocks", data);
            	component.find("timeBlock").set("v.value", data[0]);
        		component.set("v.isRequestAppointmentDisabled", false);
            }
        });
        
        defaultRequestedDateAction.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	component.find("requestedDate").set("v.value", response.getReturnValue());
            }
        });
        
        $A.enqueueAction(timeBlockAction);
        $A.enqueueAction(defaultRequestedDateAction);
	},
    
    handleValidateForm: function(component, event, helper) {
        let requestedDate = component.find("requestedDate").get("v.value"),
            timeBlock = component.find("timeBlock").get("v.value"),
            isButtonDisabled = component.get("v.isRequestAppointmentDisabled");
        
        if ($A.util.isUndefinedOrNull(requestedDate)) {
			return;
        }
        
        let action = component.get("c.validateRequestedDate");
        
        action.setParams({
            requestedDate: requestedDate
        });
            
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                console.log(response.getReturnValue());
            	let data = response.getReturnValue();
            
                if (data.isSuccessful) {
        			component.set("v.isRequestAppointmentDisabled", $A.util.isUndefinedOrNull(requestedDate) || $A.util.isUndefinedOrNull(timeBlock));
                } else {
                    this.handleDisplayToast('error', data.responseMessage, 'pester');
        			component.set("v.isRequestAppointmentDisabled", true);
                }
            }
        });
        
        $A.enqueueAction(action);
    },
    
    handleSendRequest: function(component, event, helper) {
        let requestedDate = component.find("requestedDate").get("v.value"),
            timeBlock = component.find("timeBlock").get("v.value");
        
		let action = component.get("c.createAppointmentRequest");
        
        action.setParams({
            requestedDate: requestedDate,
            timeBlock: timeBlock
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = response.getReturnValue();
            
                if (data.isSuccessful) {
                    this.handleDisplayToast('success', data.responseMessage, 'pester');
            		let container = component.find("container");		
            
                    $A.createComponent("c:EDW_WizardCompletedComponent", {
            			initData: { isCommunity: true }
                    }, (data, status, errorMessage) => {
            			component.find("form-wrapper").destroy();
                        let body = container.get("v.body");
                        body.push(data);
                        container.set("v.body", body);
                    });
                } else {
                    this.handleDisplayToast('error', data.responseMessage, 'pester');
                }
            } else {
            	this.handleDisplayToast('error', $A.get("$Label.c.An_Unkown_Error_Occurred"), 'pester');
            }
        });
        
        $A.enqueueAction(action);
    },
        
    handleValidateDate: function(component, event, helper) {
        let requestedDate = component.find("requestedDate").get("v.value"),
            action = component.get("c.validateRequestedDate");
        
        action.setParams({
            requestedDate: requestedDate
        });
            
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                console.log(response.getReturnValue());
            }
        });
        
        $A.enqueueAction(action);
    },
    
    handleDisplayToast: function (type, message, mode) {
        const toastEvent = $A.get('e.force:showToast');
        toastEvent.setParams({
            type: type,
            message: message,
            mode: mode
        })
        .fire();
    }
})