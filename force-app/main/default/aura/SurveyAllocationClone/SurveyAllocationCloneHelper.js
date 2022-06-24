({
	callCloneMethod : function(component, hasWarnings) {
        var spinner = component.find("theSpinner");
        $A.util.removeClass(spinner, "slds-hide");
        
		console.log('Clone Helper'); 
        console.log('STARTING UNIT: ' + component.get("v.startUnit"));
        var action = component.get("c.cloneAssetAllocations"); 
        console.log('BOOLEAN: ' + component.get("v.cloneCurrent"));
        action.setParams({
            "record" : component.get("v.surveyLocation"), 
            "recordId" : component.get("v.recordId"), 
            "min" : component.get("v.minFloor"), 
            "max" : component.get("v.maxFloor"),
            "startUnit" : component.get("v.startUnit"), 
            "numUnits" : component.get("v.numUnit"), 
            "cloneCurrentAllocations" : component.get("v.cloneCurrent"),
            "hasWarnings" : hasWarnings
        });
        
        action.setCallback(this, function(response){
            if(component.isValid() && response.getState() === "SUCCESS")
            {
             	 var mapSize = 0;
                 for(var key in response.getReturnValue()){
                        mapSize += 1;
                        console.log('key : '+ key + 'Map value: ', response.getReturnValue()[key]);
                 }
                if(mapSize === 0) {
                    var resultsToast = $A.get("e.force:showToast");
                    resultsToast.setParams({
                        "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                        "type" : 'success',
                        "message" :$A.get("$Label.c.Site_Survey_Clone_Success")
                    }); 
                        resultsToast.fire();
                    /*var customToast = component.find("customToast"); 
                    customToast.setCloseType(false);
                    customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Success_Title"), 
                                            $A.get("$Label.c.Site_Survey_Clone_Success"), 'SUCCESS');*/
                    component.set("v.minFloor", "");
                    component.set("v.maxFloor", "");
                    component.set("v.startUnit", null); 
        			component.set("v.numUnit", null);
        			component.set("v.cloneCurrent", false);
                    $A.util.addClass(component.find("theModal"), "slds-hide");
                    var theEvent = component.getEvent("cloneEvent"); 
                    theEvent.setParams({
                        "actionStatus" : true
                    });
                    theEvent.fire();
                    //$A.util.addClass(component.find("theModal"), "slds-hide"); Site_Survey_Clone_Error
                    
                } else if(!hasWarnings) {
                    /*var customToast = component.find("customToast"); 
                    customToast.setCloseType(false);
                    customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                           $A.get("$Label.c.Site_Survey_Clone_Error"), 'ERROR');*/
                    var modalMap = [];
                    for(var key in response.getReturnValue()){
                        modalMap.push({value:response.getReturnValue()[key], key:key});
                        console.log('key : '+ key + 'Map value: ', response.getReturnValue()[key]);
                    }
                    component.set("v.cloneWarnings", modalMap);
                    //console.log('Product Name: ' + response.getReturnValue().keys()[0] + 'Missing Assets: ' + response.getReturnValue().values()[0]);
					$A.util.removeClass(component.find("warningModal"), "slds-hide");
                } else {
                    var resultsToast = $A.get("e.force:showToast");
                    resultsToast.setParams({
                        "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                        "type" : 'success',
                        "message" :$A.get("$Label.c.Site_Survey_Clone_Success")
                    }); 
                        resultsToast.fire();
                    component.set("v.minFloor", "");
                    component.set("v.maxFloor", "");
                    component.set("v.startUnit", null); 
        			component.set("v.numUnit", null);
        			component.set("v.cloneCurrent", false);
                    var theEvent = component.getEvent("cloneEvent"); 
                    theEvent.setParams({
                        "actionStatus" : true
                    });
                    theEvent.fire();
                    $A.util.addClass(component.find("warningModal"), "slds-hide");
                }
                $A.util.addClass(spinner, "slds-hide");
            }            
        });
        $A.enqueueAction(action); 
	}
    
})