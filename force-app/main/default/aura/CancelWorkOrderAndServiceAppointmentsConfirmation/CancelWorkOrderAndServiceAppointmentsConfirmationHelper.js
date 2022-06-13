({
	handleConfirmCancel : function(component, event, helper) {
		let record = component.get("v.record");
        
        record.Status = $A.get("$Label.c.Cancelled");
        record.Cannot_Complete_Reason__c = $A.get("$Label.c.Cancelled");
        
        component.set("v.record", record);
        component.set("v.isCancelled", true);
        
        component.destroy();
	},
    
    handleCancel : function(component, event, helper) {
		component.destroy();
	}
})