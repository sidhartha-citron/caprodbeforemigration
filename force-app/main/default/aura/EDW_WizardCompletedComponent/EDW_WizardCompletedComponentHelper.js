({
	handleResetWizard : function(component, event, helper) {
        let evt = $A.get("e.force:navigateToComponent");
        
        evt.setParams({
            componentDef: "c:EDW_EmergencyDispatchWizardQuickAction",
            componentAttributes: {
                recordId: component.get("v.initData").originalRecordId
            }
        })
        .fire();
    },
    
	handleCloseWizard : function(component, event, helper) {
        let workspaceAPI = component.find("workspace");
        let shouldComponentBeDestroyed = false;
        
        workspaceAPI.getFocusedTabInfo().then((response) => {
            let focusedTabId = response.tabId;
            workspaceAPI.closeTab({tabId: focusedTabId});
        })
        .catch((error) => {
    		shouldComponentBeDestroyed = true;//highly likely an error because the tab doesn't exist (not console-view)
            console.log(error);
        });

        let navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
            "recordId": component.get("v.initData").originalRecordId,
            "slideDevName": "detail"
        })
        .fire();
        
        if (shouldComponentBeDestroyed) {
            component.destroy();
        }
	}
})