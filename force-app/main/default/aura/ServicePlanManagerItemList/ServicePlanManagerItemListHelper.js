/**
 * @FileName: ServicePlanManagerItemListHelper.js
 * @Description: Helper methods for ServicePlanManagerItemList
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/22/2019      Created
 *-----------------------------------------------------------  
 */

  // Hints to ensure labels are preloaded
  // $Label.c.SPM_Fill_Fields_Message
  // $Label.c.SPM_No_Order_Items_For_Selection
  // $Label.c.SPM_No_Order_Items_For_Service_Plan

({
    setMessage : function(component) {
        let variety = component.get("v.variety");

        let message = $A.get("$Label.c.SPM_Fill_Fields_Message");

        if(variety === "Auto Assign") {
            message = $A.get("$Label.c.SPM_No_Order_Items_For_Selection");
        }

        component.set("v.message", message);
    },

    getOrderItemsInit : function(component) {
        let variety = component.get("v.variety");

        if(variety !== "Auto Assign" && variety !== "Unassigned") return;

        this.getOrderItems(component);
    },

    getOrderItems : function(component) {
        component.set("v.spinner", true);
        let action = component.get("c.getOrderItems");

        let plan = component.get("v.servicePlan");

        let criteria = {
            "dataWrapper" : component.get("v.dataWrapper"),
            "variety" : component.get("v.variety"),
            "accountId" : component.get("v.accountId"),
            "servicePlanId" : plan && plan.Id ? plan.Id : null,
            "jobType" : plan ? plan.Job_Type__c : null,
            "lineOfBusiness" : plan ? plan.Line_of_Business__c : null,
            "frequency" : plan ? plan.Frequency__c : null
        };

        action.setParams({"criteriaJSON" : JSON.stringify(criteria)});

        action.setCallback(this, function(response) {
            let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.SPM_Item_Retrieve_Error"));

            if(success === true) {
                let assetMap = JSON.parse(response.getReturnValue());
                component.set("v.assetMap", assetMap);

                let assets = [];

                for(let key in assetMap) {
                    assets.push(assetMap[key]);
                }

                component.set("v.assets", assets);

                if(assets.length === 0) {
                    let variety = component.get("v.variety");

                    let message;

                    if(variety === "Auto Assign") {
                        message = $A.get("$Label.c.SPM_No_Order_Items_For_Selection");
                    } else {
                        message = $A.get("$Label.c.SPM_No_Order_Items_For_Service_Plan");
                    }

                    component.set("v.message", message);
                }
            }

            component.set("v.spinner", false);
        });
        $A.enqueueAction(action);
    },

    setMessage : function(component, event) {
        let message = $A.get("$Label.c.SPM_Fill_Fields_Message");

        if(event) {
            let params = event.getParam("arguments");

            if(params) {
                message = params.message;
            }
        }

        component.set("v.message", message);
    },

    selectAll : function(component, event) {
        let selected = event.getSource().get("v.checked");
        let checkboxes = component.find("checkbox");
        let assetIds = [];

        if(checkboxes !== undefined) {
            if(checkboxes.length !== undefined) {
                for(let c of checkboxes) {
                    if(!c.get("v.disabled")) {
                        c.set("v.checked", selected);
                        assetIds.push(c.get("v.value"));
                    }
                }
            } else {
                if(!checkboxes.get("v.disabled")) {
                    checkboxes.set("v.checked", selected);
                    assetIds.push(checkboxes.get("v.value"));
                }
            }
        }

        this.changeItemSelection(component, selected, assetIds);
    },

    selectOne : function(component, event) {
        let selected = event.getSource().get("v.checked");
        let assetIds = [event.getSource().get("v.value")];

        this.changeItemSelection(component, selected, assetIds);

        LightningUtils.deselectSelectAll(component, event);
    },

    changeItemSelection : function(component, selected, assetIds) {
        let assetMap = component.get("v.assetMap");

        let variety = component.get("v.variety");

        for(let assetId of assetIds) {
            let asset = assetMap[assetId];

            asset.selected = selected;
            asset.selectedQuantity = 0;

            for(let itemWrapper of asset.items) {
                if(selected) {
                    asset.selectedQuantity += itemWrapper.quantity;

                    if(variety == 'Auto Assign') {
                        itemWrapper.servicePlanId = asset.item.Service_Plan__c;
                    }
                }

                itemWrapper.selected = selected;
            }

            assetMap[asset.assetId] = asset;
        }

        component.set("v.assetMap", assetMap);

        let assets = [];

        for(let key in assetMap) {
            assets.push(assetMap[key]);
        }

        component.set("v.assets", assets);
    },

    /*
     * @Name        showItemDetail
     * @Description Constructs a modal component to display individual line items for a selected asset
     * @Author      Graeme Ward
     * @Params      component
     *              event
     * @Return      void
     */
    showItemDetail : function(component, event) {
        $A.createComponent(
            "c:ServicePlanManagerItemDetail",
            {
                "servicePlanId" : component.get("v.servicePlan").Id,
                "asset" : event.getSource().get("v.value"),
                "permissionLevel" : component.get("v.permissionLevel")
            },
            function(itemDetailModal, status, errorMessage){
                if(status === "SUCCESS") {
                    let body = component.get("v.body");
                    body.push(itemDetailModal);
                    component.set("v.body", body);
                }
                else if(status === "INCOMPLETE") {
                    console.error($A.get("$Label.c.Error_No_Response_From_Server"));
                }
                else if(status === "ERROR") {
                    console.error("Error: " + errorMessage);
                }
            }
        );
    },

    confirmItemDetailSelections : function(component, event) {
        let asset = event.getParam("asset");
        console.log(asset);
        let assetMap = component.get("v.assetMap");

        assetMap[asset.assetId] = asset;

        component.set("v.assetMap", assetMap);

        let assets = [];

        for(let key in assetMap) {
            assets.push(assetMap[key]);
        }

        component.set("v.assets", assets);
    },

    assignItems : function(component) {
        component.set("v.spinner", true);

        let action = component.get("c.assignOrderItems");

        let assets = component.get("v.assets");

        let selected = false;

        for(let asset of assets) {
            if(asset.selected) {
                selected = true;
                break;
            }
        }

        if(selected) {
            action.setParams({"criteriaJSON" : JSON.stringify(assets)});

            action.setCallback(this, function(response) {
                let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.SPM_Assigning_Items_Error"));

                if(success === true) {
                    LightningUtils.setToast($A.get("$Label.c.Success"), $A.get("$Label.c.SPM_Order_Items_Assigned"), "success");
                    component.getEvent("ServicePlanManagerRefresh").fire();
                }

                component.set("v.spinner", false);
            });
            $A.enqueueAction(action);
        }
        else {
            LightningUtils.setToast($A.get("$Label.c.Error"), $A.get("$Label.c.SPM_No_Items_Selected"), "error");
            component.set("v.spinner", false);
        }
    }
});