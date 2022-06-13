({
	initializeVIRecord : function(component, event){
		var action = component.get("c.initVI");
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                console.log(response.getReturnValue());
                component.set("v.VIRecord", response.getReturnValue());
                var action = component.get("c.initVehicle");
        		action.setParams({
            		"VI": response.getReturnValue()
       			});
                action.setCallback(this, function(response) {
            	var state = response.getState();
            	if (component.isValid() && state === "SUCCESS"){
                	component.set("v.selectedVehicle", response.getReturnValue());
           	 	} else {
                	console.log("Helper Failed with state: " + state);
            	}
        		});
        		$A.enqueueAction(action);
            } else {
                console.log("Helper Failed with state: " + state);
            }
        });
        $A.enqueueAction(action);
	},
})