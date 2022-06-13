({
    doInit: function(component, event, helper) {
        helper.handleInit(component, event, helper);
    },
    
	handleNextSection: function(component, event, helper) {
        helper.goToNextSection(component, event, helper);
	},
    
    handleRecordRetrieval: function(component, event, helper) {
        helper.retrieveData(component, event, helper);
    }
})