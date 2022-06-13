({
    doInit : function(component, event, helper) {
        var evt = $A.get("e.force:navigateToComponent");
        evt.setParams({
            componentDef : "c:SiteSurvey",
            componentAttributes: {
                recordId : component.get("v.recordId")
            },
            isredirect : false
        });
        evt.fire();
        $A.util.addClass(component.find("mySpinner"), "slds-hide");
    }
})