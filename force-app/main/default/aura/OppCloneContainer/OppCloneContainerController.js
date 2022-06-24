({
	doInit : function(component, event, helper) {
		var getOpp = component.get('c.getOpp');
		var oppId = component.get('v.oppId');
        
        getOpp.setParams({
            "oppId": oppId
        }); 
        
        getOpp.setCallback(this, function(response) {
           var state = response.getState();
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() !=null ) {
                component.set('v.opp', response.getReturnValue());
            }
        });
        
        $A.enqueueAction(getOpp);
	}
})