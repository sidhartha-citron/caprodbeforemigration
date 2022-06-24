({
    rerender: function(component, helper) {
        if (!component.get("v.isComponentLoaded")) {
            helper.handleInit(component, helper);
        }
        
        return this.superRerender();
    }
})