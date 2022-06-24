({
	handleInit: function(component, event, helper) {
        let successState = "SUCCESS",
		 	initAction = component.get("c.initializeEmergencyDispatchWizard"),
            mode = component.get("v.mode");
        
        if ($A.util.isUndefinedOrNull(mode)) {
            mode = "NEW";
        }
        console.log(mode);
        
        document.title = "Emergency Dispatch Wizard";
        
        initAction.setParams({
            mode: mode
        });
        
        initAction.setCallback(this, (response) => {
            let state = response.getState();
            
            let workspaceAPI = component.find("workspace");
            
            workspaceAPI.getFocusedTabInfo()
            .then((response) => {
                let focusedTabId = response.tabId;
                workspaceAPI.setTabLabel({
                    tabId: focusedTabId,
                    label: "Emergency Dispatch Wizard"
                });
        		workspaceAPI.setTabIcon({
                    tabId: focusedTabId,
                    icon: "utility:work_order_type",
                    iconAlt: "Emergency Dispatch Wizard"
                });
            })
            .catch((error) => {
                console.log(error);
            });

			if (state == successState) {
                let data = response.getReturnValue();
                
                //let mode = component.get("v.mode");
                //component.set("v.initData", data);
                component.set("v.initData.mode", mode);//component.get("v.mode")
                component.set("v.initData.recordId", component.get("v.recordId"));
                component.set("v.initData.paths", data.paths);
                component.set("v.initData.poNumber", "");
            }
        });
        
        $A.enqueueAction(initAction);
	},
        
    navigate: function(component, event, helper) {
        let navForward = event.getParam("navForward"),
            context = event.getParam("context"),
            allData = event.getParam("allData"),
            appContainer = component.find("appContainer"),
            initData = $A.util.isUndefinedOrNull(allData) ? component.get("v.initData") : JSON.parse(allData);
        
        let paintedComponent;
        
        switch (context) {
            case "EDW_SelectCustomerComponent":
                paintedComponent = navForward ? "EDW_ConfigureAppointmentComponent" : "EDW_SelectCustomerComponent";
                break;
            case "EDW_ConfigureAppointmentComponent":
                paintedComponent = navForward ? "EDW_AppointmentVisitInternalComponent" : "EDW_SelectCustomerComponent";
                break;
            case "EDW_AppointmentVisitInternalComponent":
                paintedComponent = navForward ? "EDW_WizardCompletedComponent" : "EDW_ConfigureAppointmentComponent";
                break;
        }
        
        //console.log(JSON.stringify(initData));

        if (paintedComponent !== "EDW_WizardCompletedComponent") {
            for (let i = 0; i < initData.paths.length; i++) {
                let currPath = initData.paths[i];
                
                //console.log(currPath);
               //console.log(initData.paths);
                
                if (currPath.isCurrentPathItem) {
                    if (navForward) {
                        initData.paths[i].isCurrentPathItem = false;
                        initData.paths[i].isStepComplete = true;
                        initData.paths[i + 1].isCurrentPathItem = true;
                    } else {
                        initData.paths[i].isCurrentPathItem = false;
                        initData.paths[i - 1].isStepComplete = false;
                        initData.paths[i - 1].isCurrentPathItem = true;
                    }
                    
                    break;
                }
            }
            
            component.set("v.initData.paths", initData.paths);
            component.set("v.initData", initData);
        } else {
            if (!$A.util.isUndefinedOrNull(component.find("pathComponent"))) {
            	component.find("pathComponent").destroy();
            }
        }
        
        $A.createComponent("c:" + paintedComponent, {
            initData: initData
        }, (newComponent, status, error) => {
            if (status == "SUCCESS") {
            	appContainer.set("v.body", newComponent);
        	} else {
                console.log("error: " + error);
            }
        });
    }
})