({
	handleInit : function(component, event, helper) {
		let recordId = component.get("v.recordId");
        
        let action = component.get("c.getResourcePreferences");
        
        action.setParams({
            recordId: recordId
        });
        
        action.setCallback(this, function(response) {
            let state = response.getState();

            if (state === "SUCCESS") {
            	let data = response.getReturnValue();

                component.set("v.viewModel", data);
                component.set("v.resourcePreferences", data.resourcePreferences);
                component.set("v.columnNames", data.columnNames);
            }
                           
        	$A.util.toggleClass(component.find("theSpinner"), "slds-hide");
        });
        
        $A.enqueueAction(action);
	}
})