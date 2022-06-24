({
	doInit: function(component, event, helper) {
		helper.handleInit(component, event, helper);
	},
    
    validateForm: function(component, event, helper) {
		helper.handleValidateForm(component, event, helper);
    },
    
    validateDate: function(component, event, helper) {
		helper.handleValidateDate(component, event, helper);
    },
    
    sendRequest: function(component, event, helper) {
		helper.handleSendRequest(component, event, helper);
    }
})