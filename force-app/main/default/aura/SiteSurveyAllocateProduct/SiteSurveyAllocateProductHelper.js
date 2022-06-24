({
    saveAllocation : function(component) {
        var allocatedQty = component.get("v.allocatedQty");						//qty specified in the modal
        var selectedProduct = component.get("v.selectedProduct");				// dragged product
        var surveyLocation = component.get("v.surveyLocation");					// selected location
               
        var action = component.get("c.saveAllocations");
        action.setParams({
            "selectedProductJSON": JSON.stringify(selectedProduct),
            "surveyLocationJSON": JSON.stringify(surveyLocation),
            "allocatedQty": allocatedQty,
            "parentRecordId": component.get("v.parentRecordId")
            //"existingAsset" : component.get("v.existingAsset")
        });
        
        
        action.setCallback(this, function(response){                   
            if(response.getState() === "SUCCESS")
            {
                if(response.getReturnValue() === true)
                {
                    // fire allocation created event
                    var allocationCreatedEvent = component.getEvent("NewAllocatedCreated");
                    allocationCreatedEvent.fire();
                    
                    // show success message
                    var customToast = component.find("customToast");            
                    customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Success_Title"), 
                                            $A.get("$Label.c.Site_Survey_Save_Success_Message"), 'SUCCESS');     
                } 
            } else {
                // show error toast                
                var customToast = component.find("customToast");            
                customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                        $A.get("$Label.c.Site_Survey_Save_Error_Message"), 'ERROR');
            }
        });
        $A.enqueueAction(action);
    }
})