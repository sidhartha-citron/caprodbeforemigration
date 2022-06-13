({
	setCloneRecord : function(component, event, helper) {
		$A.util.addClass(component.find("customToast"), "slds-hide");
        component.set("v.minFloor", null); 
        component.set("v.maxFloor", null);
        component.set("v.startUnit", null); 
        component.set("v.numUnit", null);
        component.set("v.cloneCurrent", false);
        component.find("min").set("v.value",null);
        component.find("max").set("v.value",null);
        component.find("startUnit").set("v.value",null);
        component.find("numberUnits").set("v.value",null);
        component.find("cloneCurrentProds").set("v.value",false);

        console.log('Aura method of Clone component');
        $A.util.removeClass(component.find("theModal"), "slds-hide");
        component.set("v.surveyLocation", {'sobjectType':'Survey_Location__c'});
        
        var record = event.getParam('arguments').location;
        component.set("v.surveyLocation", record);
        
        var recordId = event.getParam('arguments').recordId;
	}, 
    
    cloneAllocations : function(component, event, helper) {
        //$A.util.addClass(component.find("theModal"), "slds-hide");
        var record = component.get("v.surveyLocation"); 
        var recordId = component.get("v.recordId"); 
        var minValue = component.get("v.minFloor"); 
        var maxValue = component.get("v.maxFloor"); 
        var startUnitValue = component.get("v.startUnit"); 
        var numUnitValue = component.get("v.numUnit"); 
        console.log("Clone JS Controller"); 
        console.log(record);
        console.log(recordId);
        console.log(minValue);
        console.log(maxValue);
        var invalidMin = minValue === null || typeof minValue === "undefined";
        var invalidMax = maxValue === null || typeof maxValue === "undefined";
        var invalidStartUnit = startUnitValue === null || typeof startUnitValue === "undefined";
        var invalidNumUnit = numUnitValue === null || typeof numUnitValue === "undefined";
        if(invalidMin || invalidMax)   {
            //alert("Please fill both Min and Max Floor values to continue");  Site_Survey_Max_Greater
            var customToast = component.find("customToast"); 
            customToast.setCloseType(false);
            customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                    $A.get("$Label.c.Site_Survey_Fill_In_Floors"), 'ERROR');
        }
        else if(parseInt(maxValue) < parseInt(minValue)){          
            var customToast = component.find("customToast"); 
            customToast.setCloseType(false);
            customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                    $A.get("$Label.c.Site_Survey_Max_Greater"), 'ERROR');
        }
        else if ((invalidStartUnit && !invalidNumUnit) || (!invalidStartUnit && invalidNumUnit)){
            var customToast = component.find("customToast"); 
            customToast.setCloseType(false);
            customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                    $A.get("$Label.c.Site_Survey_Unit_Error"), 'ERROR');
            }
        else {
            helper.callCloneMethod(component, false);
            $A.util.addClass(component.find("theModal"), "slds-hide");
        }
    }, 
    
    cloneAllocationsWithWarnings : function(component, event, helper) {
        helper.callCloneMethod(component, true);
    },
    
    closeModal : function(component) {
        $A.util.addClass(component.find("theModal"), "slds-hide");
    },
    
    closeWarningModal : function(component) {
        $A.util.addClass(component.find("warningModal"), "slds-hide");
    }
})