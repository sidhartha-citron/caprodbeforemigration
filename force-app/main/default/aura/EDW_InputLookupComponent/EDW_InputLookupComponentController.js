({
    valueChange: function(component, event, helper) {
        helper.handleValueChange(component, event, helper);
    },
    
    lookup_typeahead: function(component, event, helper) {
        helper.handleLookupTypeahead(component, event, helper);
    },
    
    lookup_show: function(component, event, helper) {
		helper.handleLookupShow(component, event, helper);
    },
    
    lookup_hide: function(component, event, helper) {
        helper.handleLookupHide(component, event, helper);
    },
    
    lookup_select: function(component, event, helper) {
        helper.handleLookupSelect(component, event, helper);
    },
    
    lookup_unselect: function(component, event, helper) {
        helper.handleLookupUnselect(component, event, helper);
    }
})