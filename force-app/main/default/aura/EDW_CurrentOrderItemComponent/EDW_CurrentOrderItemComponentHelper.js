({
	handleDeleteOrderItem : function(component, event, helper) {
		let target = event.target;
        let orderItemId = target.getAttribute("data-row-index");
        
        let createEvent = component.getEvent("deleteOrderItemEvent");
        createEvent.setParams({ 
            orderItemId: orderItemId 
        })
		.fire();
	},
    
    handleBindSurveyLocation: function(component, event, helper) {        
        let recordJSON = event.getParam("record"),
            objectType = event.getParam("objectType"),
            tableRow = component.get("v.row"),
            accountId = component.get("v.accountId"),
            orderItemId = component.get("v.row.orderItem").Id,
            loadingRow = document.getElementById("overlay-" + orderItemId),
            surveyLocationLookup = "sl-lookup-" + orderItemId;
        
        $A.util.removeClass(loadingRow, "slds-hide");
        
        let parsedRecord;
        
        if (recordJSON) {
            parsedRecord = JSON.parse(recordJSON);
        }
        
        let originalLocation = component.get("v.row.surveyLocation");

        let action = component.get("c.updateOrderItemSurveyLocation");
        
        action.setParams({ 
            json: JSON.stringify(tableRow),
            surveyLocationJson: JSON.stringify(parsedRecord),
            accountId: accountId
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            	
            	//error handling first
                if (!data.auraResponse.isSuccessful) {
            		this.displayToastMessage(data.auraResponse.responseMessage, $A.get("$Label.c.Error_Toast_Title"), "error", "pester");
            		component.set("v.row.auraResponse", null);
                	component.set("v.row.surveyLocation", null);
                    component.find("surveyLocationLookup").set("v.searchString", null);
                    component.find("surveyLocationLookup").set("v.searchResults", []);
        			$A.util.addClass(loadingRow, "slds-hide");
            
            		return;
                }
            
            	component.set("v.row.orderItem", data.orderItem);
            	component.set("v.row", data);
        
                switch (objectType) {
                    case "Survey_Location__c":
                        component.set("v.row.surveyLocation", parsedRecord);
                }
            		
                if (data.Survey_Location__c == null) {
                    component.find("surveyLocationLookup").set("v.searchString", null);
                    component.find("surveyLocationLookup").set("v.searchResults", []);
                }
        
            	let createEvent = component.getEvent("updateCurrentTableRowList");
                createEvent.setParams({
                    orderItemId: data.previousOrderItemId,
                    newTableRow: data
            	})
        		.fire();
            
            	let event = component.getEvent("validateSurveyLocationsEvent");
            	event.fire();
            } else {
            	//TODO error handling
            	let errors = response.getError(),
            		message = 'Unknown error';
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    message = errors[0].pageErrors[0].message;
                }
        
            	this.displayToastMessage(message, $A.get("$Label.c.Error_Toast_Title"), "error", "pester");
        		//reset data
            	component.set("v.row", row);
            }
        	$A.util.addClass(loadingRow, "slds-hide");
        });
        
        $A.enqueueAction(action);
    },
        
    handleUpdateOrderItem: function(component, event, helper) {
        let orderItemId = component.get("v.row.orderItemId"),
            loadingRow = document.getElementById("overlay-" + orderItemId),
			tableRow = component.get("v.row"),
			action = component.get("c.updateOrderItemProduct");
        
        $A.util.toggleClass(loadingRow, "slds-hide");
        
        action.setParams({ 
            json: JSON.stringify(tableRow),
            accountId: component.get("v.accountId")
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            
                if (!this.isResponseSuccessful(component, data, loadingRow)) {
            		component.set("v.row.auraResponse", null);
                    return; 
                }
                
            	component.set("v.row", data);
        
            	let createEvent = component.getEvent("updateCurrentTableRowList");
                createEvent.setParams({
                    orderItemId: data.previousOrderItemId,
                    newTableRow: data
            	})
        		.fire();
        	}
    
        	$A.util.toggleClass(loadingRow, "slds-hide");
        });
        
        $A.enqueueAction(action);
    },
        
    handleOpenNewSurveyLocationForm: function(component, event, helper) {
        let createEvent = component.getEvent("openAddSurveyLocationEvent");
        createEvent.fire();
    },
        
    handleOpenEditSurveyLocationForm: function(component, event, helper) {
        let surveyLocation = component.get("v.row").surveyLocation;
        
        if (surveyLocation) {
            let createEvent = component.getEvent("openAddSurveyLocationEvent");
            
            createEvent.setParams({
                surveyLocation: surveyLocation
            })
            .fire();
        }
    },
        
    handleUpdatePOToOrderItem: function(component, event, helper) {
        let row = component.get("v.row");
        
        if (row.orderItem.PO_Number__c == row.orderItemPONumber) {
            return;
        }
        
        let originalPO = row.orderItem.PO_Number__c,
        	originalRowPO = row.orderItemPONumber;
        
        row.orderItem.PO_Number__c = row.orderItemPONumber;
        
        let action = component.get("c.saveOrderProduct");
        
        action.setParams({
            jsonOrderProduct: JSON.stringify(row.orderItem)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());	
            
            	component.set("v.row.orderItem", data);
            } else {
            	//TODO error handling
            	let errors = response.getError(),
            		message = 'Unknown error';
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    message = errors[0].pageErrors[0].message;
                }
        		console.log(errors);
            	this.displayToastMessage(message, $A.get("$Label.c.Error_Toast_Title"), "error", "pester");
        		//reset data
        		row.orderItem.PO_Number__c = originalPO;
        		row.orderItemPONumber = originalPO;
        
            	component.set("v.row", row);
            }
        });
        
        $A.enqueueAction(action);
    },
        
    isResponseSuccessful: function(component, row, loadingRow) {
    	if (!$A.util.isUndefinedOrNull(row.auraResponse.isSuccessful) && !row.auraResponse.isSuccessful) {
            this.displayToastMessage(row.auraResponse.responseMessage, $A.get("$Label.c.Error_Toast_Title"), row.auraResponse.responseType, "pester");
            component.set("v.row.infestationLevel", row.auraResponse.record.Infestation_Level__c);
            component.set("v.row.numberOfRooms", row.auraResponse.record.Number_of_Rooms_NA__c
                          ? ""
                          : row.auraResponse.record.Number_of_Rooms__c);
			$A.util.toggleClass(loadingRow, "slds-hide");
            return false;
        } else if (row.auraResponse.isSuccessful) {
            this.displayToastMessage(row.auraResponse.responseMessage, $A.get("$Label.c.Success_Toast_Title"), row.auraResponse.responseType, "pester");
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
        
    handleRowSelected: function(component, event, helper) {
		let isChecked = event.getSource().get("v.checked"),
            orderItemId = component.get("v.row.orderItemId");
        
        let createEvent = $A.get("e.c:EDW_OrderItemSelectionChangeEvent");
        createEvent.setParams({
            isChecked: isChecked,
            orderItemId: orderItemId
        })
        .fire();
    }
})