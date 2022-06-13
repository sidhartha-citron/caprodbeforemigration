({
    doInit: function(component, event, helper) {
		var initColumns = component.get("c.getColumns");
    	var initColumns2 = component.get("c.getColumns");
        initColumns.setParams({
            "columnAPINames": component.get("v.checkBoxColumnAPINames")
        });   
        initColumns2.setParams({
            "columnAPINames": component.get("v.otherColumnAPINames")
        });   
        initColumns.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                component.set("v.checkBoxColumns", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });
        initColumns2.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                component.set("v.otherColumns", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(initColumns);
        $A.enqueueAction(initColumns2);
        var action = component.get('c.getHelpText'); 
        action.setCallback(this, function(response){
            var resp = response.getReturnValue();
            component.set("v.ladderHelpText", resp.Ladder_in_Good_Working_order__c);
            component.set("v.tireTreadHelpText", resp.Adhered_to_tire_tread_depth_gauge_guide__c);
        });
        $A.enqueueAction(action);
		
        if($A.get("$Locale.language") === 'fr') {
            var spillKitVals = [{value :'Not Applicable', label: 'Ne s\'applique pas'},{ value: 'Yes', label: 'Oui'},{value: 'No', label: 'Non' }];
        } else {
            var spillKitVals = [{value :'Not Applicable', label: 'Not Applicable'},{ value: 'Yes', label: 'Yes'},{value: 'No', label: 'No' }];
        }   
        component.set("v.spillKitVals", spillKitVals);
       	
       	helper.initializeVIRecord(component, event);
    },
    
    updateVIRecord : function(component, event, helper){
		var VIRec = component.get("v.VIRecord");
        var action = component.get("c.updateVI");
        action.setParams({
            "VIRec": VIRec
        });  
        $A.enqueueAction(action);
    },
    
    submitVIRecord : function(component, event, helper){
        component.set("v.error", '');
       	var VIRec = component.get("v.VIRecord");
        var action = component.get("c.submitVI");
        action.setParams({
            "VIRec": VIRec
        });  
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                component.set("v.error", response.getReturnValue());
                if(response.getReturnValue() == ''){
                    var toggleEvent = $A.get("e.c:stockSummaryToggleVi"); 
                        toggleEvent.setParams({
                            "VIShow" : false
                        });
                        toggleEvent.fire();
                    	console.log('test');
                }
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(action);
    },
    
    handleVehicleChosenEvent : function(component, event, helper){
        var vehicle = event.getParam("vehicle");
        var VI = component.get("v.VIRecord");
        var action = component.get("c.saveVehicle");
        action.setParams({
            "Vehicle": vehicle, "VI": VI
        }); 
        action.setCallback(this, function(response) {
        	var state = response.getState();
        	if (component.isValid() && state === "SUCCESS"){
           		component.set("v.VIRecord", response.getReturnValue());
        	}
        	else {
                console.log("Failed with state: " + state);
         	}
        });
        $A.enqueueAction(action); 
    }
})