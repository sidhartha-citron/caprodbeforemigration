({
	handleCloseModal: function(component, event, helper) {
		component.destroy();
	},
    
    handleConfirmCancelOrder: function(component, event, helper) {
        $A.util.removeClass(component.find("cancelSpinner"), "slds-hide");
        component.set("v.isWorking", true);
        
        let order = component.get("v.order"),
            action = component.get("c.cancelOrder");
        
        action.setParams({
            orderJson: JSON.stringify(order)
        });
                                   
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let cancelEvent = $A.get("e.c:EDW_OrderCancelledEvent");
            	cancelEvent.fire();
            	console.log("hit");
            	component.destroy();
        	} else {
        		component.set("v.isWorking", false);
            }
        });
        
        $A.enqueueAction(action);
    }
})