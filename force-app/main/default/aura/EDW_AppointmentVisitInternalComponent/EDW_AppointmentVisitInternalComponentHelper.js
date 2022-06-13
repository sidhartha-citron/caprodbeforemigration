({
	handleInit: function(component, event, helper) {
        let recordId = component.get("v.recordId"),
        	workOrderId = $A.util.isUndefinedOrNull(recordId) ? component.get("v.initData").workOrderId : recordId,
			action = component.get("c.initializeAppointmentVisitDateTimeScreen");
        
        action.setParams({
            workOrderId: workOrderId
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = response.getReturnValue(),
            		oldData = component.get("v.initData"),
            		areAllServiceAppoinmentsResourced = data.areAllServiceAppoinmentsResourced;
            
                component.set("v.initData.accountId", data.accountId);
                component.set("v.initData.workOrderId", data.workOrderId);
            
        		let doesNumerOfResourcesAndNumberOfServiceAppointmentsMatch = data.numberOfServiceAppointments === parseInt(oldData.order.Number_of_Resources__c);
            
                if (!doesNumerOfResourcesAndNumberOfServiceAppointmentsMatch) {
                    this.displayWarningModal(component, event, helper);
            	}
        		component.set("v.isSaveAndFinishDisabled", !doesNumerOfResourcesAndNumberOfServiceAppointmentsMatch || !areAllServiceAppoinmentsResourced);
            }
        });
        
        $A.enqueueAction(action);

	},
    
    handleNavigateBack: function(component, event, helper) {
        let initData = component.get("v.initData");
        
        if (!$A.util.isUndefinedOrNull(initData.ticket)) {
            initData.ticket.Status = "Closed";
        }
        
        let navObject = {
            account: initData.account,
            paths: initData.paths,
            order: initData.order,
            contact: initData.contact,
            poNumber: initData.poNumber,
            recordId: initData.order.Id,
            isCommunity: initData.isCommunity,
            ticket: initData.ticket,
            mode: initData.mode,
            tableRows: [],
            isCancelOrderButtonAccessible: initData.isCancelOrderButtonAccessible
        };
        
        let navEvent = $A.get("e.c:EDW_NavigateEvent");
        
        navEvent.setParams({
            navForward: false,
            context: "EDW_AppointmentVisitInternalComponent",
            allData: JSON.stringify(navObject)
        })
        .fire();
        
        component.destroy();
    },
    
    handleVerifyAppointments: function(component, event, helper) {
        $A.util.removeClass(component.find("verificationSpinner"), "slds-hide");
        
        let accordion = component.find("accordion");
        
        accordion.retrieveServiceAppointmentsOnWorkOrder((result) => {
            let isToStayDisabled = false;
            
            for (let sa of result) {
                if (!sa.Has_Resource_Assigned__c) {
                    isToStayDisabled = true;
            		break;
                }
            }
        
        	component.set("v.isSaveAndFinishDisabled", isToStayDisabled);
        
            if (!isToStayDisabled) {
                component.find("btnVerifyAppointments").set("v.disabled", true);
            }
        
        	$A.util.addClass(component.find("verificationSpinner"), "slds-hide");
        });
    },
 
	displayWarningModal: function(component, event, helper) {
    	let modalWrapper = component.find("warningModal");
    
        $A.createComponent("c:EDW_AppointmentVisitInternalWarningModal", {
        }, (data, status, errorMessage) => {
            let body = modalWrapper.get("v.body");
            body.push(data);
            modalWrapper.set("v.body", body);
        });
	},
        
    handleSaveAndFinish: function(component, event, helper) {
        let initData = component.get("v.initData"),
            action = component.get("c.completeEmergencyDispatchWizard");
        
        $A.util.removeClass(component.find("theSpinner"), "slds-hide");
        
        action.setParams({
            orderJson: JSON.stringify(initData.order)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                let navObject = { 
            		isCommunity: response.getReturnValue(),
            		originalRecordId: initData.ticket == null ? initData.account.Id : initData.ticket.Id
        		};
            
                let navEvent = $A.get("e.c:EDW_NavigateEvent");
                
                navEvent.setParams({
                    navForward: true,
                    context: "EDW_AppointmentVisitInternalComponent",
                    allData: JSON.stringify(navObject)
                })
                .fire();
                
                //component.destroy();
            } else {
        		$A.util.addClass(component.find("theSpinner"), "slds-hide");
                console.log(JSON.stringify(response.getError()));
            }
        });
        
        $A.enqueueAction(action);
    },
    //Begin:Shashi:9-11-2019:Allows CS to exit without assigning SA
    handleSaveAndExit: function(component, event, helper) {
        let initData = component.get("v.initData"),
            action = component.get("c.exitEmergencyDispatchWizard");
        
        $A.util.removeClass(component.find("theSpinner"), "slds-hide");
        
        action.setParams({
            orderJson: JSON.stringify(initData.order)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                var navEvt = $A.get("e.force:navigateToSObject");
                navEvt.setParams({
                    "recordId": initData.account.Id,
                    "slideDevName": "related"
                });
                navEvt.fire();
        
            } else {
        		$A.util.addClass(component.find("theSpinner"), "slds-hide");
                console.log(JSON.stringify(response.getError()));
            }
        });
        
        $A.enqueueAction(action);
    }
	//End
})