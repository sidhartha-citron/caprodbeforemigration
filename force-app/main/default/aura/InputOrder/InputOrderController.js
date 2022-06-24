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
            "sObjectType": component.get("v.sObjectType"),
            "orderId": component.get("v.recordId")
        })
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                console.log(response)
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

	}
})