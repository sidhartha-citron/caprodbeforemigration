({
	init : function(component, event, helper) {
        var action = component.get("c.findStatus");
        action.setParams({
            "recordId": component.get("v.recordId")
        });
        action.setCallback(this, function(response){
            console.log('action.setCallback: ' + JSON.stringify(response));
			
			if(component.isValid() && response.getState() === "SUCCESS") {
                var responseVal = response.getReturnValue();
				console.log('responseVal: ' + JSON.stringify(responseVal));
				
				if(typeof responseVal !== "undefined" && responseVal !==null && responseVal.length>0) {
					var toastEvent = $A.get("e.force:showToast");
					toastEvent.setParams({
						"type": responseVal[0],
						"title": responseVal[1],
						"message": responseVal[2]
					});
					toastEvent.fire();
				}
            }    
        });
        $A.enqueueAction(action); 
    }
})