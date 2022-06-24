({
    handleExpandContractSection: function(component, event, helper) {
        let selectedItem = event.currentTarget;
        let dataTarget = selectedItem.dataset.collapsetarget;
        
        let target = component.find(dataTarget);
        
        $A.util.toggleClass(selectedItem, "section-icon-collapsed");
        $A.util.toggleClass(target, "rolledup");
    },
    
    handleNewRowsRequest: function(component, event, helper) {
        let objJson = event.getParam("requestJson"),
            isAddWithSurveyLocation = event.getParam("isAddWithSurveyLocation"),
            initData = component.get("v.initData");

        //it has been observed that lightning at rare times will hold two copies of all data at once -> one that reflects the initial load of the second screen, and one that has all the correct and up-to-date data
        //this is preventing the "shadow" data from executing anything
        if ($A.util.isUndefinedOrNull(initData.order.Id)) {
            console.log("the order id was null because of a duplicate order issue");
            return;
        }
        
        $A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
        
        let action = component.get("c.generateOrderProducts");
        
        action.setParams({
            json: objJson,
            initDataJson: JSON.stringify(initData),
            isSurveyLocationRequested: isAddWithSurveyLocation
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            
            	let returnValue = JSON.parse(response.getReturnValue());
            
                if (!this.isResponseSuccessful(component, returnValue.auraResponse, returnValue.orderItemBatchJobId)) {
            		component.set("v.initData.auraResponse", null);
                    return;
                }
                           
                if (!$A.util.isUndefinedOrNull(returnValue.orderItemBatchJobId)) {
                    $A.createComponent("c:EDW_OrderItemBatchJobListenerComponent", {
                        batchJobId: returnValue.orderItemBatchJobId
                    }, (data, status, errorMessage) => {
                        let body = component.get("v.body");
                        body.push(data);
                        component.set("v.body", body);
                    });
        		}
        
            	component.set("v.tableRows", returnValue.tableRows);
            	component.set("v.initData.tableRows", returnValue.tableRows);
				component.set("v.initData", returnValue);
        
            	if (!$A.util.isUndefinedOrNull(component.get("v.tableRows")) && component.get("v.tableRows").length) {
                    $A.util.addClass(component.find("noDataRow"), "slds-hide");
                }
        		
                if ($A.util.isUndefinedOrNull(returnValue.orderItemBatchJobId)) {
                    $A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
                }
        	} else {
            	console.log(action.getError());
    			this.displayToastMessage(returnValue.auraResponse.responseMessage, "Error", "error", "pester");
                component.set("v.initData.auraResponse", null);
        		$A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
            }
        });
        
        $A.enqueueAction(action);
    },
        
    handleRemoveRow: function(component, event, helper) {
        $A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
        
        let mainData = component.get("v.initData"),
            noData = component.find("noDataRow"),
            orderItem = event.getParam("orderItemId"),
            action = component.get("c.removeOrderItem");
        
        action.setParams({
            json : JSON.stringify(mainData),
            orderItemId: orderItem
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let returnValue = JSON.parse(response.getReturnValue());
            
                if (!this.isResponseSuccessful(component, returnValue.auraResponse, returnValue.orderItemBatchJobId)) {
            		component.set("v.initData.auraResponse", null);
                    return; 
                }
            
            	component.set("v.tableRows", returnValue.tableRows);
            	component.set("v.initData.tableRows", returnValue.tableRows);
				component.set("v.initData", returnValue);
        		
        		let selectedOrderItemIds = component.get("v.selectedOrderItemIds");
        
                if (selectedOrderItemIds.indexOf(orderItem) > -1) {
                    let index = selectedOrderItemIds.indexOf(orderItem);
                    
                    selectedOrderItemIds.splice(index, 1);
                    
                    component.set("v.selectedOrderItemIds", selectedOrderItemIds);
                }
            
                if ($A.util.isUndefinedOrNull(component.get("v.tableRows")) || !component.get("v.tableRows").length) {
                    $A.util.removeClass(component.find("noDataRow"), "slds-hide");
                }
            }

        	$A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
        });
        
        $A.enqueueAction(action);
    },
        
    isResponseSuccessful: function(component, response, batchId) {
    	if (!$A.util.isUndefinedOrNull(response.isSuccessful) && !response.isSuccessful) {
            this.displayToastMessage(response.responseMessage, "Error", "error", "pester");
			$A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
            return false;
        } else if (response.isSuccessful && $A.util.isUndefinedOrNull(batchId)) {
            this.displayToastMessage(response.responseMessage, "Success", "success", "pester");
        }
        
        return true;
    },
        
    displayToastMessage: function(message, title, type, mode) {
        let toastEvent = $A.get("e.force:showToast");
        
        toastEvent.setParams({
            "title": title,
        	"message": message,
            "duration": 1500,
            "type": type,
            "mode": mode
        })
        .fire();
    },
        
    handleRebuildOrderItemList: function(component, event, helper) {
        let action = component.get("c.refreshTableData");
        
        action.setParams({
            json: JSON.stringify(component.get("v.initData"))
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let returnValue = response.getReturnValue();
            
            	component.set("v.tableRows", returnValue.tableRows);
            	component.set("v.initData.tableRows", returnValue.tableRows);
        
				component.set("v.initData", returnValue);
        
            	this.displayToastMessage($A.get("$Label.c.System_Completed_Process"), "Success", "success", "pester");
        
            	if (!$A.util.isUndefinedOrNull(component.get("v.tableRows")) && component.get("v.tableRows").length) {
                    $A.util.addClass(component.find("noDataRow"), "slds-hide");
                }
            }
            
        	$A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
        });
        
		$A.enqueueAction(action);
    },
        
    handleUpdatePageNumber: function(component, event, helper) {
        $A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
        
        let initData = component.get("v.initData");
        let action = component.get("c.paginateTable");
        
        if ($A.util.isUndefinedOrNull(initData)) {
            return;
        }
        
        let pageNumber = event.getParam("pageNumber");
        initData.pageNumber = pageNumber;
        
        action.setParams({
            json: JSON.stringify(initData)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
                let data = JSON.parse(response.getReturnValue());
                
                component.set("v.tableRows", data.tableRows);
                component.set("v.initData.tableRows", data.tableRows);
                component.set("v.initData", data);
            }
                               
            $A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
        });
            
        $A.enqueueAction(action);
    },
        
    handleUpdateSelectedOrderItems: function(component, event, helper) {
        $A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
        
        let obj = event.getParam("editRequestJson"),
            selectedOrderItemIds = component.get("v.selectedOrderItemIds"),
            initData = component.get("v.initData"),
            accountId = component.get("v.initData").account.Id;
        
        let action = component.get("c.updateAllSelectedOrderItems");
        
        action.setParams({
            productRequestJson: obj,
            selectedOrderItemIds: selectedOrderItemIds,
            initDataJson: JSON.stringify(initData)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
                
            	if (!this.isResponseSuccessful(component, data.auraResponse, data.orderItemBatchJobId)) {
            		component.set("v.initData.auraResponse", null);
                    return;
                }
                
                if (!$A.util.isUndefinedOrNull(data.orderItemBatchJobId)) {
                    $A.createComponent("c:EDW_OrderItemBatchJobListenerComponent", {
                        batchJobId: data.orderItemBatchJobId
                    }, (data, status, errorMessage) => {
                        let body = component.get("v.body");
                        body.push(data);
                        component.set("v.body", body);
                    });
        		}
            
                component.set("v.initData", data);
                component.set("v.tableRows", data.tableRows);
            	component.set("v.selectedOrderItemIds", []);
        		
                if ($A.util.isUndefinedOrNull(data.orderItemBatchJobId)) {
                    $A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
                }
            } else {
        		$A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
            }
        });
        
        $A.enqueueAction(action);
    },
        
    handleValidateSurveyLocations: function(component, event, helper) {
        let action = component.get("c.isOrderValidForWorkOrderGeneration");
        
        action.setParams({
            orderId: component.get("v.initData").order.Id
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let initData = component.get("v.initData");
            
            	initData.isValidToGenerateWorkOrder = response.getReturnValue();
            	component.set("v.initData.isValidToGenerateWorkOrder", initData.isValidToGenerateWorkOrder);
                component.set("v.initData", initData);
            }
        });
        
        $A.enqueueAction(action);
    },
        
    handleToggleTableSpinner: function(component, event, helper) {
        $A.util.toggleClass(component.find("tableSpinner"), "slds-hide");
    }
})