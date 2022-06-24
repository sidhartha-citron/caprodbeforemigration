({
	handleInit : function(component, event, helper) {
		let action = component.get("c.validateDataAndSend");
        
        action.setParams({
            orderId: component.get("v.recordId")
        });
        
        action.setCallback(this, (response) => {
            var state = response.getState();
            
            if (state == 'SUCCESS') {
            	console.log(response.getReturnValue());
            
            	let data = response.getReturnValue();
            
            	if (data.length && data.length == 1 && data[0].isSuccessful) {
					//do successful stuff
                	let toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({
                        "title": "Success!",
                        "message": $A.get("$Label.c.DocuSign_Envelope_Successfully_Sent"),
                        "duration": 2000,
                        "type": "success",
                        "mode": "pester"
                    })
                    .fire();
        
        			$A.get("e.force:closeQuickAction").fire();
        		} else {
    				console.log("hit");
            		component.set("v.responses", data);
                    $A.util.toggleClass(component.find("messageContainer"), "slds-hide");
                    $A.util.toggleClass(component.find("spinner"), "slds-hide");
                }
        	}
        });
        
        $A.enqueueAction(action);
	}
})