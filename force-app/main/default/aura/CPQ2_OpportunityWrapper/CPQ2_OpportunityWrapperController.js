({
    /**
    * init function
    *
    */
    init: function(component, event, helper) {
        //
        helper.getRecordId(component);
        helper.setTargetRecordId(component, event, helper);
    },

    reInit: function(component, event, helper) {
        $A.get('e.force:refreshView').fire();
        helper.getRecordId(component);
        helper.setTargetRecordId(component, event, helper);
    },

    handleClose: function(component, event, helper) {
        helper.closeAction(component);
    },

    handleBack: function(component, event, helper) {
        var navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
            "recordId": component.get("v.recordId")
        });
        navEvt.fire();
        // window.location ="/"+component.get("v.recordId");
    }


})