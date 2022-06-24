({
	// Your renderer method overrides go here
    afterRender: function(component, helper) {
        let isInitDataRecordIdBlank = $A.util.isUndefinedOrNull(component.get("v.initData.recordId")),
            isInitDataTicketNotBlankAndClosed = !$A.util.isUndefinedOrNull(component.get("v.initData.ticket")) && component.get("v.initData.ticket").Status == "Closed";
        
        if (!isInitDataRecordIdBlank) {
            $A.util.addClass(component.find("theSpinner"), "slds-hide");
            component.find("poNumber").set("v.value", component.get("v.initData.poNumber"));
            component.find("accountLookup").set("v.isValueLockedIn", true);
            
            if (isInitDataTicketNotBlankAndClosed) {
            	component.find("ticketLookup").set("v.isValueLockedIn", true);
            }
        }
        
        return this.superAfterRender();
    }
})