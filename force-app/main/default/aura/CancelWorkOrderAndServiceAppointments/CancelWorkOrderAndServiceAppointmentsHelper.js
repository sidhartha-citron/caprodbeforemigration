({
	handleCancelWorkOrder: function(component, event, helper) {
        component.set("v.originalStatus", component.get("v.simpleRecord.Status"));
        
        $A.createComponent("c:CancelWorkOrderAndServiceAppointmentsConfirmation", {
            record: component.getReference("v.simpleRecord"),
            isCancelled: component.getReference("v.isCancelled")
        }, (data) => {
            let target = component.find("ModalDialogPlaceholder");
            let body = target.get("v.body");
            
            body.push(data);
            target.set("v.body", body);
        });
	},
    
    handleCancellationConfirmed: function(component, event, helper) {
        component.find("recordEditor").saveRecord($A.getCallback((result) => {
            if (result.state === "SUCCESS" || result.state === "DRAFT") {
                let toastEvent = $A.get("e.force:showToast");
            
                toastEvent.setParams({
                    "title": "Success!",
                    "message": $A.get("$Label.c.Work_Order_Cancellation_Completion_Message"),
                    "duration": 2000,
                    "type": "success",
                    "mode": "pester"
                })
                .fire();
                                                  
                $A.get('e.force:refreshView').fire();
            } else if (result.state === "INCOMPLETE") {
                console.log("User is offline, device doesn't support drafts.");
            } else if (result.state === "ERROR") {
        		component.set("v.simpleRecord.Status", component.get("v.originalStatus"));
    
    			let errorResult = result.error[0].pageErrors[0].message;
    
                let toastEvent = $A.get("e.force:showToast");
            
                toastEvent.setParams({
                    "title": "Error",
                    "message":  errorResult,
                    "duration": 2000,
                    "type": "error",
                    "mode": "pester"
                })
                .fire();
            } else {
                console.log('Unknown problem, state: ' + result.state + ', error: ' + JSON.stringify(result.error));
            }
        }));
    }
})