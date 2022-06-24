({
    doInit: function(component, event, helper) {
        var action = component.get("c.loadDefault");
        console.log('Init function Default value: ');
        console.log(component.get("v.value"));
        action.setParams({
            "s": component.get("v.value"),
            "sObjectType": component.get("v.sObjectType")
        })
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set("v.selectedResult", response.getReturnValue());
				component.set("v.value", component.get("v.selectedResult.Id"));
            } else {
                console.log(response.getError());
		        component.set("v.value", null);
            }
        });
        $A.enqueueAction(action);
    },
    
    valueChange: function(component, event, helper) {
        if ($A.util.isEmpty(event.getParam("value"))) {
            console.log('Skill Chosen is Empty');
        	return;    
        }
        var action = component.get("c.loadDefault");
        action.setParams({
            "s": component.get("v.value"),
            "sObjectType": component.get("v.sObjectType")
        })
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set("v.selectedResult", response.getReturnValue());
                var sObject = component.get("v.sObjectType");
                // Firing the event to notify Skill Requirements Component that a Skill was Selected by the user. 
                if(sObject !== null && typeof sObject !== "undefined" && sObject === "Skill") {
                    var result = component.get("v.selectedResult"); 
                    if(result !== null && typeof result !== "undefined") {
                        var skillEvent = component.getEvent("skillChosenEvent"); 
                        skillEvent.setParams({
                            "skillSelected" : true
                        });
                        skillEvent.fire();
                    }
                }
                else if(sObject !== null && typeof sObject !== "undefined" && sObject === "Location") {
                    var result = component.get("v.selectedResult"); 
                    if(result !== null && typeof result !== "undefined") {
                        var vehicleEvent = component.getEvent("VehicleChosenEvent"); 
                        vehicleEvent.setParams({
                            "vehicle" : result.Id
                        });
                        console.log("RESULT" + result);
                        vehicleEvent.fire();
                    } 
                }
				component.set("v.value", component.get("v.selectedResult.Id"));
            } else {
                console.log(response.getError());
		        component.set("v.value", null);
            }
        });
        $A.enqueueAction(action);
        
        event.stopPropagation();
    },    
	lookup_typeahead: function(component, event, helper) {
        var action = component.get("c.searchLookup");
        action.setAbortable();
        action.setParams({
            "s": component.find("searchInput").get("v.value"),
            "sObjectType": component.get("v.sObjectType")
        })
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set("v.searchResults", response.getReturnValue());
            } else {
                console.log(response.getError());
            }
        });
        $A.util.addClass(component.find('lookup'), 'slds-is-open');
        $A.enqueueAction(action);
	},
    
    lookup_show: function(component, event, helper) {
        $A.util.addClass(component.find('lookup'), 'slds-is-open');
    },    
    lookup_hide: function(component, event, helper) {
        setTimeout(function() {
            $A.util.removeClass(component.find('lookup'), 'slds-is-open');
        }, 1);
    },
    
    lookup_select: function(component, event, helper) {
		component.set("v.selectedResult", component.get("v.searchResults["+event.currentTarget.id+"]"));
		component.set("v.value", component.get("v.selectedResult.Id"));
        $A.util.removeClass(component.find('lookup'), 'slds-is-open');
	},
    
    lookup_unselect: function(component, event, helper) {
        component.set("v.selectedResult", null);
        component.set("v.searchString", null);
        component.set("v.searchResults", null);
        component.set("v.value", null);
        var sObject = component.get("v.sObjectType");
        if(sObject !== null && typeof sObject !== "undefined" && sObject === "Location") {
        var vehicleEvent = component.getEvent("VehicleChosenEvent"); 
            vehicleEvent.setParams({
             	"vehicle" : null
                });
            vehicleEvent.fire();
        }
	}
})