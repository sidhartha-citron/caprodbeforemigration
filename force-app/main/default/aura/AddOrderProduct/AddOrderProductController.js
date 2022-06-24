({
	doInit: function(component, event, helper) {
        
    	helper.fetchColumnNames(component);
        
        var eCmp = component.find("Product");
        $A.util.addClass(eCmp, 'slds-hide');
        component.set("v.theRecord.OrderId", component.get("v.recordId"));
        console.log(component.get("v.recordId"));
    }, 
    
    save : function(component, event, helper) {
        console.log(component.get('v.theRecord'));
        
        if(helper.validateForm(component)) {
            var action = component.get('c.addOrderItem');
            
            action.setParams({
                "record": component.get('v.theRecord')
            });
            
            action.setCallback(this, function(response) {
                var state=response.getState();
                console.log(state + ' first action');
                if(component.isValid() && state === 'SUCCESS') {
                    console.log(state);
                    var result = response.getReturnValue();
                    component.set('v.status', response.getReturnValue());
                    var resultsToast = $A.get("e.force:showToast");
                    resultsToast.setParams({
                        "title" : result[0],
                        "type" : result[1],
                        "message" : result[2]
                    }); 
                    resultsToast.fire();
                    var dismissActionPanel = $A.get("e.force:closeQuickAction");
                    dismissActionPanel.fire();
                } else {
                    console.log(state);
                    resultsToast.setParams({
                        "title" : "Error",
                        "type" : "error",
                        "message" : " There has been a problem. Please refresh your page and try again later."
                    }); 
                    resultsToast.fire();
                }
            });
            $A.enqueueAction(action);	 
        }
    }, 
    
})