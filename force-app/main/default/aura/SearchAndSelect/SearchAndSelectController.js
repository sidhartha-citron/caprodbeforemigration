({
	doSearch : function(component, event, helper) {
        helper.search(component, helper);
	},
    
    doAdd : function(component, event, helper) {
        helper.add(component);
    },
    
    onSelectAll : function(component, event, helper) {
        helper.select(true, component);
    },
    
    onSelectNone : function(component, event, helper) {
        helper.select(false, component);
    },
    
    onInvert : function(component, event, helper) {
        helper.invert(component);
    },
})