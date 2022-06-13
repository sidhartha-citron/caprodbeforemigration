({
	getPluralLabel : function(component, helper) {
		var getPluralLabel = component.get("c.getPluralLabel");
		var objectName = component.get('v.object');

        getPluralLabel.setParams({
            "objectName": objectName
        }); 
        
        getPluralLabel.setCallback(this, function(response) {
           var state = response.getState();
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() !=null ) {
                component.set("v.pluralLabel", "Search " + response.getReturnValue());
            }
        });
        
        $A.enqueueAction(getPluralLabel);

	},
    
    search : function(component, helper) {
		component.set('v.isSearching', true);
        var search = component.get("c.search");
		var searchTerm = component.get('v.searchTerm');

        search.setParams({
            "searchTerm": searchTerm
        }); 
        
        search.setCallback(this, function(response) {
           var state = response.getState();
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() !=null ) {
                component.set('v.searchResults', response.getReturnValue());
                if (response.getReturnValue().length > 10) {
					component.set('v.hasManyResults', true);                    
                } else {
                    component.set('v.hasManyResults', false);                    
                }
                //component.set("v.pluralLabel", "Search " + response.getReturnValue());
            }
            component.set('v.isSearching', false);
        });
        
        $A.enqueueAction(search);
    },
    
    add : function(component, helper) {
        var selectedRecords = [];
    	var records = component.get("v.searchResults");
        
        for (var i = 0; i < records.length; i++) {
            if (records[i].isSelected) {
                selectedRecords.push(records[i].acct.Id);
            }
        }
        
        var appEvent = $A.get("e.c:AddRecordsEvt");
		appEvent.setParams({ "recordIds" : selectedRecords });
		appEvent.fire();
    },
    
    select : function(val, component) {
        var records = component.get("v.searchResults");
        
        for (var i = 0; i < records.length; i++) {
        	records[i].isSelected = val;
        }
        component.set('v.searchResults', records);
    },
    
    invert : function(component) {
        var records = component.get("v.searchResults");
        
        for (var i = 0; i < records.length; i++) {
        	records[i].isSelected = !records[i].isSelected;
        }
        component.set('v.searchResults', records);
    },
})