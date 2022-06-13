({
    firstPage: function(component, event, helper) {
        component.set("v.currentPageNumber", 1);
    },
    
    prevPage: function(component, event, helper) {
        component.set("v.currentPageNumber", Math.max(component.get("v.currentPageNumber")-1, 1));
    },
    
    nextPage: function(component, event, helper) {
        component.set("v.currentPageNumber", component.get("v.currentPageNumber")+1);
    }
})