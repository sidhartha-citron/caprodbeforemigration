({
	handleInit: function(component, event, helper) {
		let workOrderId = component.get("v.recordId"),
            policyAction = component.get("c.getSchedulingPolicies"),
            urlAction = component.get("c.getInstanceUrl");
        
        this.handleRetrieveServiceAppointmentsOnWorkOrder(component, event, helper, workOrderId);
        
        policyAction.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = response.getReturnValue();
            
                component.set("v.schedulingPolicies", data);
            }
        });
        
        urlAction.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
    			component.set("v.rootUrl", response.getReturnValue());
        	} else {
            	console.log("error");
            }
        });

        $A.enqueueAction(policyAction);
		$A.enqueueAction(urlAction);
	},
        
    handleExpandedEvent: function(component, event, helper) {
        let saNumber = component.find("accordion").get("v.activeSectionName"),
        	expandedEvent = $A.get("e.c:EDW_AccordionSectionExpandedEvent");
        
        console.log(saNumber);
        
        if (!$A.util.isUndefinedOrNull(saNumber)) {
            expandedEvent.setParams({
                saNumber: saNumber
            })
            .fire();
        }
    },
        
    handleRetrieveServiceAppointmentsOnWorkOrder: function(component, event, helper, workOrderId) {
        let saAction = component.get("c.getServiceAppointmentsOnWorkOrder"),
            params = event.getParam('arguments'),
       		callback = false;
        
        if ($A.util.isUndefinedOrNull(workOrderId)) {
            workOrderId = component.get("v.recordId");
        }
        
        saAction.setParams({
            workOrderId: workOrderId
        });
        
        if (params) {
            callback = params.callback;
        }
        
        saAction.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = response.getReturnValue();
                component.set("v.serviceAppointments", data);
            	let isToStayDisabled = false,
            		parentRecord = {};
            
                
                for (let sa of data) {
            		parentRecord = sa.ParentRecord;
            
                    if (!sa.Has_Resource_Assigned__c) {
                        isToStayDisabled = true;
                        break;
                    }
                }
            	component.set("v.isSaveAndFinishDisabled", isToStayDisabled || data.length != parentRecord.Order__r.Number_of_Resources__c);
        		component.set("v.doNumberOfResourcesAndServiceAppointmentsMatch", data.length == parentRecord.Order__r.Number_of_Resources__c);
            	//Begin:Shashi:9-11-2019:Allows CS to exit without assigning SA
                component.set("v.isSaveAndExitDisabled", !component.get("v.isSaveAndFinishDisabled"));
                //End
            	if (callback) callback(response.getReturnValue());
            }
        });
        
        $A.enqueueAction(saAction);
    },
        
    handleAppointmentAssigned: function(component, event, helper) {
        let serviceAppointmentId = event.getParam('appointmentId'),
            workOrderId = component.get("v.recordId"),
            hasBeenAssigned = event.getParam("isAssigned"),
            serviceAppointments = component.get("v.serviceAppointments");
        
        let areNotAllResourcesCompleted = false,
            isSaveAndFinishDisabled = false,
            doNumberOfResourcesAndServiceAppointmentsMatch = component.get("v.doNumberOfResourcesAndServiceAppointmentsMatch");
        
        for (let sa of serviceAppointments) {
            if (sa.Id === serviceAppointmentId) {
                sa.Has_Resource_Assigned__c = hasBeenAssigned;
            }
            
            if (!sa.Has_Resource_Assigned__c && !areNotAllResourcesCompleted) {
                areNotAllResourcesCompleted = true;
            }
        }
        
        if (areNotAllResourcesCompleted || !doNumberOfResourcesAndServiceAppointmentsMatch) {
            isSaveAndFinishDisabled = true;
        }
        
        component.set("v.serviceAppointments", serviceAppointments);
        component.set("v.isSaveAndFinishDisabled", isSaveAndFinishDisabled);
        //Begin:Shashi:9-11-2019:Allows CS to exit without assigning SA
        component.set("v.isSaveAndExitDisabled", !component.get("v.isSaveAndFinishDisabled"));
        //End
    }
})