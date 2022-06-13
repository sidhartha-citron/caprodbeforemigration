({
    handleInit : function(component, event, helper) {
        let noData = component.find("noDataRow"),
            initData = component.get("v.initData"),
            recordId = component.get("v.recordId"),
            mode = component.get("v.mode");
        
        if (!$A.util.isUndefinedOrNull(component.get("v.tableRows")) && component.get("v.tableRows").length) {
            $A.util.addClass(noData, "slds-hide");
        }
        
        let action = component.get("c.initializeConfigureAppointmentScreen");
        
        if ($A.util.isUndefinedOrNull(initData)) {
            initData = { recordId: recordId, mode: mode };
        }
        
        action.setParams({
            json: JSON.stringify(initData)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
                let data = JSON.parse(response.getReturnValue());
            
                if (!$A.util.isUndefinedOrNull(data.order.PoNumber) && $A.util.isEmpty(data.PoNumber)) {
                    data.poNumber = data.order.PoNumber;
                }
            
                if (data !== null && data.contact !== null && $A.util.isUndefinedOrNull(data.contact.Name)) {
                	data.contact.Name = data.contact.FirstName + ' ' + data.contact.LastName;//prevent unnecessary query
            	}
        
                component.set("v.initData", data);
        
                if (data.order.Order_Cancelled__c) {
                    this.handleOrderCancelledPopup(component, event, helper);
            		return;
                }
        
                if ($A.util.isUndefinedOrNull(data.order.Id)) {
                    let backdrop = component.find("backdrop");
                    
                    $A.createComponent("c:EDW_ConfigureAppointmentCreateOrderModalComponent", {
                        order: component.getReference("v.initData.order"),
                        orderNumber: component.getReference("v.initData.orderNumber"),
                        recordId: component.get("v.initData.recordId")
                    }, (cmpData, status, errorMessage) => {
                        let body = backdrop.get("v.body");
                        body.push(cmpData);
                        backdrop.set("v.body", body);
                    });
                    
                    $A.util.addClass(backdrop, "slds-backdrop--open");
                }
        
            	component.set("v.tableRows", data.tableRows);
        		
        		$A.util.addClass(component.find("theSpinner"), "slds-hide");
            }
        });
    
    	$A.enqueueAction(action);
    },
        
    handleOpenNewSurveyLocationForm: function(component, event, helper) {
        let modal = component.find("modalAddSurveyRoom"),
            backdrop = component.find("backdrop"),
            surveyLocation = event.getParam("surveyLocation");
        let addSurveyRoomCmp = component.find("AddSurveyRoom");
    
    	surveyLocation 
        	? addSurveyRoomCmp.setLocationId(surveyLocation)
        	: addSurveyRoomCmp.setLocationId({'sobjectType':'Survey_Location__c', 'Name':''});
        
        $A.util.addClass(modal, "slds-fade-in-open");
        $A.util.addClass(backdrop, "slds-backdrop--open");
    },
    
    handleHidePopup: function(component, event, helper) {
        let modal = component.find("modalAddSurveyRoom"),
            backdrop = component.find("backdrop");
        
        $A.util.removeClass(modal, "slds-fade-in-open");
        $A.util.removeClass(backdrop, "slds-backdrop--open");
        $A.util.addClass(modal, "slds-fade-in-hide");
        $A.util.addClass(backdrop, "slds-backdrop--hide");
    },
        
    handleUpdateSurveyLocations: function(component, event, helper) {
        let currentOrderComponent = component.find("currentOrderComponent");
        
        currentOrderComponent.toggleTableSpinner((data) => {});
        
        let returnedLocationId = event.getParam("locationId"),
            locationCreated = event.getParam("locationCreated");
        let action = component.get("c.updateSurveyLocations");
        
        action.setParams({
            json: JSON.stringify(component.get("v.initData")),
            locationId: returnedLocationId
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            
                component.set("v.initData", data);
                component.set("v.initData.tableRows", data.tableRows);
            	component.set("v.initData.order", data.order);
            	component.set("v.tableRows", data.tableRows);
            	
                data.auraResponse.isSuccessful
        			? this.handleShowToastMessage(locationCreated, $A.get("$Label.c.Success_Toast_Title"), data.auraResponse.responseType, data.auraResponse.responseMessage)
            		: this.handleShowToastMessage(locationCreated, $A.get("$Label.c.Error_Toast_Title"), data.auraResponse.responseType, data.auraResponse.responseMessage)
            
        	}
            
            currentOrderComponent.toggleTableSpinner((data) => {});
        });
        
        $A.enqueueAction(action);
    },
        
    handleShowToastMessage: function(locationCreated, title, type, message) {
        let toastEvent = $A.get("e.force:showToast");
        
        if (locationCreated) {
            toastEvent.setParams({
                "title": title,
                "message": message,
                "duration": 2500,
                "type": type,
                "mode": "pester"
            })
        	.fire();
        }
    },
        
    handleSaveAndNext: function(component, event, helper) {
        let allData = component.get("v.initData");
        
        $A.createComponent("c:EDW_ConfigureAppointmentConfirmWorkOrderCreationComponent", {
            "numberOfResources": allData.numberOfResources,
            "numberOfOrderItems": allData.tableRows.length,
            "workTypeEstimatedDuration": allData.workTypeEstimatedDuration,
            "totalEstimatedDuration": allData.totalEstimatedDuration,
            "totalNumberOfOrderProducts": $A.util.isUndefinedOrNull(allData.orderItemCount) ? 0 : allData.orderItemCount,
            "totalOrderEstimatedPrice": component.get("v.initData.totalOrderAmount"),
            "order": allData.order,
            "emergencyTicket": allData.ticket
        }, (data, status, errorMessage) => {
            let target = component.find("CompleteOrderDialog");
            
            let body = target.get("v.body");
            body.push(data);
            target.set("v.body", body);
        });
    },
        
    handleUpdateTableOrderItemList: function(component, event, helper) {
        let orderItemId = event.getParam("orderItemId"),
            newTableRow = JSON.stringify(event.getParam("newTableRow")),
            mainData = JSON.stringify(component.get("v.initData"));

        let action = component.get("c.updateTableRowList");
        
        action.setParams({
            newTableRow: newTableRow,
            deleteOrderItemId: orderItemId,
            mainModel: mainData
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            	
            	component.set("v.initData", data);
        	}
        });
        
        $A.enqueueAction(action);
    },
        
    handleUpdateListOfSelectedOrderItems: function(component, event, helper) {
        let isChecked = event.getParam("isChecked"),
            orderItemId = event.getParam("orderItemId");
        
        let selectedOrderItemIdsList = component.get("v.selectedOrderItemIds");
        
        if (selectedOrderItemIdsList.indexOf(orderItemId) > -1 && !isChecked) {
            let index = selectedOrderItemIdsList.indexOf(orderItemId);
            
            selectedOrderItemIdsList.splice(index, 1);
        } else if (selectedOrderItemIdsList.indexOf(orderItemId) == -1 && isChecked) {
            selectedOrderItemIdsList.push(orderItemId);
        }
        
        component.set("v.selectedOrderItemIds", selectedOrderItemIdsList);
    },
        
    handleNavigateBack: function(component, event, helper) {
        let initData = component.get("v.initData");
        
        if ($A.util.isUndefinedOrNull(initData.mode) || initData.mode === "EDIT") {
            initData.mode = "NEW";
        }
        
        let navObject = {
            account: initData.account,
            contact: initData.contact,
            order: {Id: initData.order.Id, PoNumber: initData.order.PoNumber},
            poNumber: initData.poNumber,
            ticket: initData.ticket,
            paths: initData.paths,
            recordId: initData.recordId,
            isCommunity: initData.isCommunity,
            mode: initData.mode,
            tableRows: [],
            isCancelOrderButtonAccessible: initData.isCancelOrderButtonAccessible
        };
        
        let navEvent = $A.get("e.c:EDW_NavigateEvent");
        
        navEvent.setParams({
            navForward: false,
            context: "EDW_ConfigureAppointmentComponent",
            allData: JSON.stringify(navObject)
        })
        .fire();
        
        component.destroy();
    },
        
    handleNavigateToNextScreen: function(component, event, helper) {
        let workOrderId = event.getParam("workOrderId"),
            orderId = event.getParam("orderId");
        
        let initData = component.get("v.initData");
        initData.workOrderId = workOrderId;
        
        initData.order.Id = orderId;
        
        let navigationObject = {
            account: initData.account,
            workOrderId: workOrderId,
            recordId: workOrderId,
            paths: initData.paths,
            order: initData.order,
            poNumber: initData.poNumber,
            contact: initData.contact,
            isCommunity: initData.isCommunity,
            ticket: initData.ticket,
            mode: initData.mode,
            tableRows: [],
            isCancelOrderButtonAccessible: initData.isCancelOrderButtonAccessible
        };
        
        let navEvent = $A.get("e.c:EDW_NavigateEvent");
        
        navEvent.setParams({
            navForward: true,
            context: "EDW_ConfigureAppointmentComponent",
            allData: JSON.stringify(navigationObject)
        })
        .fire();
        
        component.destroy();
    },
        
    handleOrderCancelledPopup: function(component, event, helper) {
        $A.createComponent("c:EDW_OrderCancelledModalComponent", {
            orderId: component.get("v.initData").order.Id
        }, (data, status, errorMessage) => {
            let target = component.find("CompleteOrderDialog");
            
            let body = target.get("v.body");
            body.push(data);
            target.set("v.body", body);
        });
    }
})