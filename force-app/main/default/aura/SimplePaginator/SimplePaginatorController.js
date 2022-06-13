({
	doInit : function(component, event, helper) {
		helper.setPages(component);
    },
    
    pageClick : function(component, event, helper) {
        var pg = event.target.id;
        helper.updatePage(component, pg);
    },
    
    prevClick : function(component, event, helper) {
        var currPage = parseInt(component.get('v.currPage'));
        helper.updatePage(component, currPage - 1);
    },
    
    nextClick : function(component, event, helper) {
        var currPage = parseInt(component.get('v.currPage'));
        helper.updatePage(component, currPage + 1);
    },
    
    handleUpdatePage : function(component, event) {
        var newCurrPg = parseInt(event.getParam("currPage"));
        component.set('v.currPage', newCurrPg);
    },
    
    setNumPages : function(component, event, helper) {          
        var numPgs = event.getParam('arguments').numPages;
        component.set('v.numPages', numPgs);
        helper.setPages(component);
    }
})