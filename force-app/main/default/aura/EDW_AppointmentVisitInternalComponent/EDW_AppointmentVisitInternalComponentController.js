({
	doInit: function(component, event, helper) {
		helper.handleInit(component, event, helper);
	},
    
    navigateBack: function(component, event, helper) {
		helper.handleNavigateBack(component, event, helper);
	},
    
    verifyAppointments: function(component, event, helper) {
		helper.handleVerifyAppointments(component, event, helper);
	},
    
    saveAndFinish: function(component, event, helper) {
		helper.handleSaveAndFinish(component, event, helper);
	},
    //Begin:Shashi:9-11-2019:Allows CS to exit without assigning SA
    saveAndExit: function(component, event, helper) {
    	helper.handleSaveAndExit(component, event, helper);
	}
    //End
})