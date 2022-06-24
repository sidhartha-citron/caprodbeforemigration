({
    doInit : function(component, event, helper) {
        var records = [];
        component.set('v.records', records);
    },
    
    handleAddRecords : function(component, event, helper) {
        var recordIds = event.getParam("recordIds");
        
        var filteredRecordIds = helper.filterDupes(component, recordIds);
               
        if (filteredRecordIds.length == 0) return;
        
        helper.addRecords(component, filteredRecordIds);
	},
    
    doClone : function(component, event, helper) {
        helper.doClone(component, helper);
    },
    
    closeModal : function(component, event, helper) {
        helper.toggleModal(component);
    },
    
    remove : function(component, event, helper) {
        var records = component.get('v.records');
        var index = event.getSource().get("v.name");
        records.splice(index, 1);
        component.set('v.records', records);
    }
})