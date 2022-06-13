({
	handleValueChange: function(component, event, helper) {
        if ($A.util.isEmpty(event.getParam("value"))) {
            return;    
        }
        
        let action = component.get("c.loadDefault");
        
        action.setParams({
            id: component.get("v.value"),
            sObjectType: component.get("v.sObjectType")
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                component.set("v.selectedResult", response.getReturnValue());
                let sObject = component.get("v.sObjectType");
            
            	let recordFoundEvent = component.getEvent("EDW_LookupRecordEvent");
            
                recordFoundEvent.setParams({
            		objectType: sObject,
            		record: JSON.stringify(response.getReturnValue())
                })
        		.fire();
        
                component.set("v.value", component.get("v.selectedResult.Id"));
            	
            } else {
                component.set("v.value", null);
            }
        });

        $A.enqueueAction(action);
        event.stopPropagation();
	},
        
    handleLookupShow: function(component, event, helper) {
        $A.util.addClass(component.find('lookup'), 'slds-is-open');
    },
        
    handleLookupHide: function(component, event, helper) {
        setTimeout(() => {
            $A.util.removeClass(component.find('lookup'), 'slds-is-open');
        }, 1);
    },
    
    handleLookupTypeahead: function(component, event, helper) {
        let action = component.get("c.searchLookup");
        let value = component.find("searchInput").get("v.value");
        
        //only start searching after a couple characters are entered
        if (value.length < 2) {
            component.set("v.searchResults", []);
            return;
        }
        
        action.setAbortable();
        action.setParams({
            filterCriteria: value,
            sObjectType: component.get("v.sObjectType"),
            filterId: component.get("v.filterById"),
            numberOfRoomsFilter: component.get("v.numberOfRooms")
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                component.set("v.searchResults", response.getReturnValue());
            } else {
                console.log(response.getError());
            }
        });

        $A.util.addClass(component.find('lookup'), 'slds-is-open');

        $A.enqueueAction(action);
    },
        
    handleLookupSelect: function(component, event, helper) {            
        component.set("v.selectedResult", component.get("v.searchResults["+event.currentTarget.id+"]"));
        component.set("v.value", component.get("v.selectedResult.Id"));
        $A.util.removeClass(component.find('lookup'), 'slds-is-open');
    },
        
    handleLookupUnselect: function(component, event, helper) {            
        component.set("v.selectedResult", null);
        component.set("v.searchString", null);
        component.set("v.searchResults", null);
        component.set("v.value", null);
        
        let sObject = component.get("v.sObjectType");
        
        let recordFoundEvent = component.getEvent("EDW_LookupRecordEvent");
        
        recordFoundEvent.setParams({
            objectType: sObject,
            record: null
        })
        .fire();
    }
})