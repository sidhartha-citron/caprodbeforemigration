({
    handleCancelOrder: function(component, event, helper) {
        let orderId = component.get("v.recordId");
        
        $A.createComponent("c:EDW_CancelOrderConfirmationComponent", {
            order: { Id: orderId }
        }, (data, status, errorMessage) => {
            let target = component.find("CancelOrderDialog");
            
            let body = target.get("v.body");
            body.push(data);
            target.set("v.body", body);
        });
    },
    
    handleCloseWizard: function(component, event, helper) {
        //using window.location.href due to a known issue in salesforce:
        //https://success.salesforce.com/issues_view?id=a1p3A000000mCpKQAU&title=force-navigatetosobject-does-not-display-the-updated-data-when-standard-edit-is-overridden-for-a-record
        let recordId = component.get("v.recordId");
        
        let workspaceAPI = component.find("workspace");
        
        workspaceAPI.getFocusedTabInfo().then((response) => {
            let focusedTabId = response.tabId;
            workspaceAPI.closeTab({tabId: focusedTabId});
        })
        .catch((error) => {
            console.log(error);
        });

        if ($A.util.isUndefinedOrNull(recordId)) {
            let navEvt = $A.get("e.force:navigateToSObject");
        	navEvt.setParams({
            	"recordId": component.get("v.recordId"),
            	"slideDevName": "detail"
        	})
        	.fire();
        } else {
        	window.location.href = '/' + component.get("v.recordId");
        }
    }
})