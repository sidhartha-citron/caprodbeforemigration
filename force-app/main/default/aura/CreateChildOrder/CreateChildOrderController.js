({
    doInit : function(component, event, helper) {
        
        var spinner = component.find("theSpinner");
        $A.util.removeClass(spinner, 'slds-hide');

        var action = component.get('c.createChildOrder');
        
        action.setParams({
            "recordId":component.get('v.recordId')
        });
        
        action.setCallback(this, function(response) {
            var state=response.getState();
            console.log(state + ' first action');
            if(component.isValid() && state === 'SUCCESS') {
                console.log(state);
                //component.set('v.status', response.getReturnValue());
                var result = response.getReturnValue();
                console.log(result);
                $A.util.addClass(spinner, 'slds-hide');
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title" : result[0],
                    "type" : result[1],
                    "message" : result[2]
                }); 
                resultsToast.fire(); 
                console.log(' Record of new Order ' + result[3]);
                if(result[3] !== null || typeof result[3] !== "undefined") {
                    var navEvt = $A.get("e.force:navigateToSObject");
                    navEvt.setParams({
                        "recordId": result[3],
                        "slideDevName": "detail"
                    });
                    navEvt.fire();   
                }
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
})