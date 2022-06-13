({
    setDetails : function(component, event, helper) {
        console.log('Aura method of Prompt component');
        $A.util.removeClass(component.find("autoAllocateModal"), "slds-hide");
        
        var record = event.getParam('arguments').theProduct
        var quantity = component.get("v.quantity");
        
        console.log("Auto Allocate Record: " + record);
        component.set("v.surveyProduct", record);
	}, 
    
    allocateAction : function (component, event, helper) {
        var theRecord = component.get("v.surveyProduct");
        console.log("AutoAllocate SS: " + component.get("v.siteSurveyId"));
        
        if(helper.validateQuantity(component, component.get("v.quantity"))) {
            $A.util.removeClass(component.find("theSpinner"), "slds-hide");
            var action = component.get("c.autoAllocateAssets");
            action.setParams({
                "record": JSON.stringify(theRecord), 
                "quantity": component.get("v.quantity"), 
                "siteSurveId": component.get("v.siteSurveyId")
            });   
            action.setCallback(this, function(response) {
                var state = response.getState();
                if (component.isValid() && state === "SUCCESS"){
                    console.log("Apex Success");
                    $A.util.addClass(component.find("autoAllocateModal"), "slds-hide");
                    var theEvent = component.getEvent("cloneEvent"); 
                    theEvent.setParams({
                        "actionStatus" : response.getReturnValue()
                    });
                    theEvent.fire();
                    $A.util.addClass(component.find("theSpinner"), "slds-hide");
                } else {
                    console.log(state);
                    $A.util.addClass(component.find("autoAllocateModal"), "slds-hide");
                    var resultsToast = $A.get("e.force:showToast");
                    resultsToast.setParams({
                        "title" : "Error",
                        "type" : "error",
                        "message" :$A.get("$Label.c.Site_Survey_Error_Message")
                    }); 
                    resultsToast.fire();
                }
            });
            $A.enqueueAction(action);
        }
    }, 
    
	closeModal : function(component) {
        $A.util.addClass(component.find("autoAllocateModal"), "slds-hide");
    },
    
    validate : function(component, event, helper) {
        var inputValue = component.find("quantity").get("v.value"),
            isDisabled = component.get("v.isDisabled");
        
        if (!isNaN(inputValue) && inputValue > 0 && inputValue % 1 == 0) {
            isDisabled = false;
        } else {
            isDisabled = true;
        }
        
        component.set("v.isDisabled", isDisabled);
    }
})