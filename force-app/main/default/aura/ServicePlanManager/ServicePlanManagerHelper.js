/**
 * @FileName: ServicePlanManagerHelper.js
 * @Description: Helper methods for ServicePlanManager
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/22/2019         Created
 *-----------------------------------------------------------  
 */
({
    checkPermissions : function(component) {
        let action = component.get("c.checkPermissions");

        action.setCallback(this, function(response) {
            let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.SPM_Permission_Check_Error"));

            if(success === true) {
                let permissionLevel = response.getReturnValue();

                component.set("v.permissionLevel", permissionLevel);

                if(permissionLevel !== "None") {
                    this.setAccountId(component);
                    this.getAccountData(component);
                }
            }

            $A.get("e.force:closeQuickAction").fire();
        });
        $A.enqueueAction(action);
    },

    /*
     * @Name        setAccountId
     * @Description Fetches the account id from the page reference and sets it on the component
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    setAccountId : function(component) {
        let pageReference = component.get("v.pageReference");
        let accountId = pageReference.state.c__accountId;
        component.set("v.accountId", accountId);
        component.find("recordHandler").reloadRecord(true);
    },

    /*
     * @Name        getAccountData
     * @Description Fetches account details: related Order Products and Service Plans
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    getAccountData : function(component) {
        component.set("v.spinner", true);
        component.set("v.selectedPlan", null);

        let cmp = component.find("two");

        if (cmp) {
            cmp.set("v.routeSearchString", '');
            cmp.set("v.scheduleSearchString", '');
            cmp.set("v.assets", []);
        }

        let action = component.get("c.getAccountData");

        action.setParams({"accountId" : component.get("v.accountId")});

        action.setCallback(this, function(response) {
            let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.SPM_Account_Data_Error"));

            if(success === true) {
                component.set("v.dataWrapper", JSON.parse(response.getReturnValue()));
            }

            component.find("tabSet").set("v.selectedTabId", "one");
            component.set("v.spinner", false);
        });
        $A.enqueueAction(action);
    },

    /*
     * @Name        setTabLabel
     * @Description Changes the label of the newly opened tab from Loading to Service Plan Manager
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    setTabLabel : function(component) {
        let workspaceAPI = component.find("workspace");

        workspaceAPI.getAllTabInfo().then(function(tabInfo) {
            for(let tab of tabInfo) {
                if(tab.title === "Loading...") {
                    workspaceAPI.setTabLabel({
                        tabId: tab.tabId,
                        label: $A.get("$Label.c.SPM_Title") + ": " + component.get("v.simpleRecord.Name")
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
    },

    /*
     * @Name        setAccountId
     * @Description Defines the active tab on the Service Plan Manager
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    handleActive : function(component, event) {
        let tabId = event.getSource().get("v.id");
        component.set("v.activeTab", tabId);

        if (tabId === "two") {
            let cmp = component.find("two");
            cmp.resetPlan();
        }
    }
});