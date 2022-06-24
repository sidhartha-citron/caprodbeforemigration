({
    getCurrentlyRunningJobs : function(component) {
        var getCurrentlyRunningJobs = component.get("c.getCurrentlyRunningJobs");
        
        getCurrentlyRunningJobs.setParams({
            "batchNames" : component.get("v.batchJobs")
        }); 
        
        getCurrentlyRunningJobs.setCallback(this, function(response){
            var respState = response.getState();
            
            if (component.isValid() && respState === "SUCCESS" && response.getReturnValue() != null ) {
                component.set('v.runningJobs', response.getReturnValue());
            }		
        });
        
        $A.enqueueAction(getCurrentlyRunningJobs);
    }
})