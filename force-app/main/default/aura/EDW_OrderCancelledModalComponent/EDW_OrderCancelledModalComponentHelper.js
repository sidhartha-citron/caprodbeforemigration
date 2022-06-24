({
	handleBackToOrder: function(component, event, helper) {
        let workspaceAPI = component.find("workspace");
        
        workspaceAPI.getFocusedTabInfo().then((response) => {
            let focusedTabId = response.tabId;
            workspaceAPI.closeTab({tabId: focusedTabId});
        })
        .catch((error) => {
            console.log(error);
        });

        let navEvt = $A.get("e.force:navigateToSObject");
        navEvt.setParams({
            recordId: component.get("v.orderId"),
            slideDevName: "related"
        })
        .fire();
	}
})