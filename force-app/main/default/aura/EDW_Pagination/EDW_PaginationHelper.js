({
    handleFirstPage: function(component, event, helper) {
        this.fireEvent(component, 1);
	},
    
    handlePrevPage: function(component, event, helper) {
        let newPageNumber = component.get("v.currentPageNumber") - 1;
        
        this.fireEvent(component, newPageNumber);
	},
    
    handleNextPage: function(component, event, helper) {
        let newPageNumber = component.get("v.currentPageNumber") + 1;
        
        this.fireEvent(component, newPageNumber);
	},
    
    fireEvent: function(component, pageNumber) {
        let paginateEvent = component.getEvent("paginationEvent");
        
        paginateEvent.setParams({
            pageNumber: pageNumber
        })
        .fire();
    }
})