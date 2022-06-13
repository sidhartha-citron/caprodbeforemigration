({
    handlePolicyChange: function(component, event, helper) {
        let action = component.get("c.updateServiceAppointmentPolicy"),
            policyId = component.find("selectedPolicy").get("v.value");
        
        action.setParams({
            policyId: policyId,
            sa: component.get("v.serviceAppointment")
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let returnedServiceAppointment = response.getReturnValue();
            
                component.set("v.serviceAppointment", returnedServiceAppointment);
        		component.find("iframe").destroy();//.set("v.policyId", data.FSL__Scheduling_Policy_Used__c);
        		let iframeContainer = component.find("iframeContainer");	
            
            	$A.createComponent("c:EDW_GetCandidateComponent", {
                    rootUrl: component.get("v.rootUrl"),
                    policyId: returnedServiceAppointment.FSL__Scheduling_Policy_Used__c,
                    serviceAppointmentId: returnedServiceAppointment.Id,
            		hasResourceAssigned: returnedServiceAppointment.Has_Resource_Assigned__c,
                    "aura:id": "iframe"
                }, (data, status, errorMessage) => {
                    iframeContainer.set("v.body", data);
                });
            } else {
                let errors = response.getError();
        
                if (errors.length) {
            		this.displayToastMessage(errors[0].message, $A.get("$Label.c.Error_Toast_Title"), "error", "pester");
                }
            }
		});
        
        $A.enqueueAction(action);
	},
    
    handleCancelServiceAppointment: function(component, event, helper) {
        this.generateSpinnerComponent(component);
        
        let serviceAppointment = component.get("v.serviceAppointment"),
        	action = component.get("c.cancelSpecifiedServiceAppointment");

        action.setParams({
            sa: serviceAppointment
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = response.getReturnValue();
            
                if (data.isSuccessful) {
                    let deleteServiceAppointmentEvent = component.getEvent("deleteServiceAppointmentEvent");
                    deleteServiceAppointmentEvent.fire();
                    
                    this.displayToastMessage(data.responseMessage, $A.get("$Label.c.Success_Toast_Title"), "success", "pester");
                } else {
                    this.displayToastMessage(data.responseMessage, $A.get("$Label.c.Error_Toast_Title"), "error", "pester");
        			component.find("spinnerOverlay").destroy();
                }
        	} else {
                let errors = response.getError();
        
                if (errors.length) {
            		this.displayToastMessage(errors[0].message, $A.get("$Label.c.Error_Toast_Title"), "error", "pester");
                }
            }
		});
        
        $A.enqueueAction(action);
    },
    
    handleDeleteServiceAppointment: function(component, event, helper) {
        this.generateSpinnerComponent(component);
        
        let serviceAppointment = component.get("v.serviceAppointment"),
       		action = component.get("c.deleteSpecifiedServiceAppointment");
        
        action.setParams({
            sa: serviceAppointment
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                let deleteServiceAppointmentEvent = component.getEvent("deleteServiceAppointmentEvent");
                deleteServiceAppointmentEvent.fire();
            
            	this.displayToastMessage($A.get("$Label.c.Service_Appointment_Successfully_Deleted"), $A.get("$Label.c.Success_Toast_Title"), "success", "pester");
        	} else {
                let errors = response.getError();
        
                if (errors.length) {
            		this.displayToastMessage(errors[0].message, $A.get("$Label.c.Error_Toast_Title"), "error", "pester");
                }    
            }
        });
        
        $A.enqueueAction(action);
    },
      
    displayToastMessage: function(message, title, type, mode) {
        let toastEvent = $A.get("e.force:showToast");
        
        toastEvent.setParams({
            "title": title,
        	"message": message,
            "duration": 1500,
            "type": type,
            "mode": mode
        })
        .fire();
    },
                    
    handleSectionExpandedEvent: function(component, event, helper) {
        let param = event.getParam("saNumber"),
        	sa = component.get("v.serviceAppointment"),
        	iframeContainer = component.find("iframeContainer");
        
        console.log("expanded event called with SA: " + sa.Id);
        
        if (param == sa.AppointmentNumber) {
        	let oldIframe = component.find("iframe");
            
            if (!$A.util.isUndefinedOrNull(oldIframe)) {
                console.log("destroying old frame");
                oldIframe.destroy();
            }
            
            $A.createComponent("c:EDW_GetCandidateComponent", {
                rootUrl: component.get("v.rootUrl"),
                policyId: sa.FSL__Scheduling_Policy_Used__c,
                serviceAppointmentId: sa.Id,
            	hasResourceAssigned: sa.Has_Resource_Assigned__c,
                "aura:id": "iframe"
            }, (data, status, errorMessage) => {
                iframeContainer.set("v.body", data);
            });
                
                console.log("expanded on: " + sa.AppointmentNumber);
        } else {
        	let oldIframe = component.find("iframe");
            
            if (!$A.util.isUndefinedOrNull(oldIframe)) {
                console.log("destroying old frame");
                oldIframe.destroy();
            }
        }
    },
                
    generateSpinnerComponent: function(component) {
        $A.createComponent("c:EDW_ServiceAppointmentAccordionItemSpinnerComponent", {
        }, (data, status, errorMessage) => {
            let body = component.get("v.body");
            body.push(data);
            component.find("spinnerWrapper").set("v.body", body);
        });
    }
})