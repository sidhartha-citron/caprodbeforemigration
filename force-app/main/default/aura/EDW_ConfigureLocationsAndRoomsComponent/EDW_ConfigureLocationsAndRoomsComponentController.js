({
	expandContractSection: function(component, event, helper) {
		helper.handleExpandContractSection(component, event, helper);
	},
    
    addRows: function(component, event, helper) {
        helper.handleAddRows(component, event, helper, false);
    },
        
    addRowsWithLocation: function(component, event, helper) {
        helper.handleAddRows(component, event, helper, true);
    },

	//Begin:Shashi:0-4-2019:Populate related infestation and rooms    
    validateFormTreatment: function(component, event, helper) {
        helper.onChangeTreatmentType(component, event, helper);
        helper.handleValidateForm(component, event, helper);
    },
    
    validateFormInfestation: function(component, event, helper) {
        helper.onChangeInfestationLevel(component, event, helper);
        helper.handleValidateForm(component, event, helper);
    },
    //End
    
    validateForm: function(component, event, helper) {
        helper.handleValidateForm(component, event, helper);
    },
    
    updateSelectedOrderItems: function(component, event, helper) {
        helper.handleUpdateSelectedOrderItems(component, event, helper);
    },
    
    rowsSelectedListener: function(component, event, helper) {
        helper.handleRowsSelectedListener(component, event, helper);
    }
})