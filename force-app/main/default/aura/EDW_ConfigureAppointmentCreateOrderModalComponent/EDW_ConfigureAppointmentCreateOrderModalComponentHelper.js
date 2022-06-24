({
	handleCreateOrder: function(component, event, helper) {
        $A.util.removeClass(component.find("createSpinner"), "slds-hide");
        
		let order = component.get("v.order"),
            action = component.get("c.insertOrder");
        
        action.setParams({
            jsonOrder: JSON.stringify(order)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            
            	component.set("v.order", data);
            	component.set("v.orderNumber", data.OrderNumber);
                let modalCloseEvt = component.getEvent("ModalCloseEvent"); 
            	modalCloseEvt.fire(); 
				component.destroy();
        	} else {
        		$A.util.addClass(component.find("createSpinner"), "slds-hide");
            	console.log(action.getError());
        		//console.log(response.);
            	//do something
            }
        });
        
        $A.enqueueAction(action);
	},
    
	handleCloseModal: function(component, event, helper) {
        let workspaceAPI = component.find("workspace");
        
        workspaceAPI.getFocusedTabInfo().then((response) => {
            let focusedTabId = response.tabId;
            workspaceAPI.closeTab({tabId: focusedTabId});
        })
        .catch((error) => {
            console.log(error);
        });
        
        let navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
            "recordId": component.get("v.recordId"),
            "slideDevName": "detail"
        })
        .fire();
    }
})