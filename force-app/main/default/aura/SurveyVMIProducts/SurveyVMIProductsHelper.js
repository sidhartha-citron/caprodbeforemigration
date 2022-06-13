({
    fetchExistingVMIProducts : function(component) {
        var action = component.get("c.getVMIProducts"); 
        console.log('SSID: ' + component.get("v.siteSurveyId"));
        action.setParams({
            "siteSurveyId": component.get("v.siteSurveyId")
        });
        action.setCallback(this, function(response){        
            if(component.isValid() && response.getState() === "SUCCESS"){
                console.log('VMIS: ' + response.getReturnValue());
                component.set("v.existingVMIProducts", response.getReturnValue());
                var action2 = component.get("c.getVMIFlaggedProducts");
                
                console.log('VMI List: ' + response.getReturnValue());
                
        		action2.setParams({
            		"vmiProds": response.getReturnValue()
                });
                action2.setCallback(this, function(response2){        
                    if(component.isValid() && response2.getState() === "SUCCESS"){
                        component.set("v.AllVMIFlaggedProducts", response2.getReturnValue());
                        console.log(response2.getReturnValue());
                    }                  
                }); 
                $A.enqueueAction(action2);
            }                  
        });    
        $A.enqueueAction(action);
    },
    
    setInitialDetails : function(component) {
        var record = component.get("v.newVMIProduct");
        record.Name = component.get("v.selectedProduct.MasterLabel"); 
        record.Par_Level__c = component.get("v.selectedProduct.Par_Level__c"); 
        record.Notes__c = component.get("v.selectedProduct.Notes__c"); 
        component.set("v.newVMIProduct", record);
        component.set("v.openSection", true);
    },
    
    closeTheModal : function(component, event, helper){
        $A.util.addClass(component.find("theModal"), "slds-hide");
    }
})