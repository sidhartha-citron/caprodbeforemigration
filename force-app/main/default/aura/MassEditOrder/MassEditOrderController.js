({
	doInit : function(component, event, helper) {
	    let pageReference = component.get("v.pageReference");
        let orderId = pageReference.state.c__orderId;
        component.set("v.recordId", orderId);

        var getOLIs = component.get("c.getOLIs");
        
        // Get Order Line Items
        getOLIs.setParams({
            "orderId" : component.get("v.recordId")
        }); 
        
        getOLIs.setCallback(this, function(response){
            var state = response.getState();
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() !=null ) {
                var olis = response.getReturnValue();
                
                // Create edit component
                $A.createComponent("c:MassEdit", {
                    "ids" : olis,
                    "objectName" : "OrderItem",
                    "sortImpl" : "RecordEntryOrderItemSorter",
                    "displayActiveSelector" : true,
                    "recordId" : component.get("v.recordId")
                }, function(newCmp, status, errorMessage) {
                    if (component.isValid()) {
                        if (status == "ERROR") {
                            console.log('Error Message--',errorMessage);
                        }
                        component.set("v.editComp", newCmp);
                    }
                });
            }		
        });
        
        $A.enqueueAction(getOLIs);  
	},

	setTabLabel : function(component, event, helper) {
        let workspaceAPI = component.find("workspace");

        workspaceAPI.getAllTabInfo().then(function(tabInfo) {
            for(let tab of tabInfo) {
                if(tab.title === "Loading...") {
                    workspaceAPI.setTabLabel({
                        tabId: tab.tabId,
                        label: "Mass Edit Order Products"
                    });

                    workspaceAPI.setTabIcon({
                        tabId: tab.tabId,
                        icon: "standard:timesheet",
                        iconAlt: "SP Manager"
                    });
                }
            }
        })
        .catch(function(error) {
            console.error(JSON.stringify(error));
        });
    }
})