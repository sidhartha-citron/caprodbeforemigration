({
    rerender: function(component, helper) {        
        if (!$A.util.isUndefinedOrNull(component.get("v.tableRows")) && component.get("v.tableRows").length) {
            $A.util.addClass(component.find("noDataRow"), "slds-hide");
        }
        return this.superRerender();
    }
})