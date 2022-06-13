({
    handleInit: function(component, helper) {
        let action = component.get("c.loadCustomerInformationSection"),
            orderId = component.get("v.orderId");
        
        action.setParams({
            orderId: orderId
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue()),
            		txtPoNumber = component.find("txtPoNumber");
            
            	component.set("v.isComponentLoaded", true);
            
                if (!$A.util.isUndefinedOrNull(txtPoNumber)) {
        			txtPoNumber.set("v.value", data.PoNumber);
                }
            	
                component.set("v.description", data.Description);
                component.set("v.orderName", data.Name);
            	component.set("v.initData.order", data);
            	component.set("v.initData.order.PoNumber", data.PoNumber);
            	component.set("v.initData", component.get("v.initData"));
            }
        });
        
        if (!$A.util.isUndefinedOrNull(orderId)) {
        	$A.enqueueAction(action);
        }
    },
    
    handleExpandContractSection: function(component, event, helper) {
        let selectedItem = event.currentTarget;
        let dataTarget = selectedItem.dataset.collapsetarget;
        
        let target = component.find(dataTarget);
        
        $A.util.toggleClass(selectedItem, "section-icon-collapsed");
        $A.util.toggleClass(target, "rolledup");
    },
    
    handleSavePONumber: function(component, event, helper) {
        let order = component.get("v.initData").order,
            inputPoNumber = component.find("txtPoNumber").get("v.value");
        
        let action = component.get("c.saveOrder");
        
        if (order.PoNumber == inputPoNumber) {
            return;
        }
        
        order.PoNumber = inputPoNumber;
        
        action.setParams({
            orderJson: JSON.stringify(order)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            
            	component.set("v.initData.order", data);
            	component.set("v.initData.order.PoNumber", data.PoNumber);
            	component.set("v.initData.poNumber", data.PoNumber);
            	component.set("v.initData", component.get("v.initData"));//force parent to have updated data
            } else {
            	console.log(action.getError());
            }
        });
        
        $A.enqueueAction(action);
    },
    
    handleValidateDuration: function(component, event, helper) {
		let userSpecifiedDuration = parseFloat(component.get("v.initData").totalEstimatedDuration),
			workTypeSpecifiedDuration = parseFloat(component.get("v.initData.workTypeEstimatedDuration")),
        	componentEstimatedDuration = parseFloat(component.get("v.componentEstimatedDuration")),
            order = component.get("v.initData.order");
        
        if (!$A.util.isEmpty(component.get("v.componentEstimatedDuration")) && componentEstimatedDuration < 0) {
            component.set("v.componentEstimatedDuration", 0.00);
        } else if ($A.util.isEmpty(component.get("v.componentEstimatedDuration"))) {
            component.set("v.componentEstimatedDuration", workTypeSpecifiedDuration);
            component.set("v.initData.totalEstimatedDuration", 0.00);
        } else if (!$A.util.isUndefinedOrNull(componentEstimatedDuration) && componentEstimatedDuration != userSpecifiedDuration) {
            if (componentEstimatedDuration < workTypeSpecifiedDuration) {
                $A.util.removeClass(component.find("iconWarning"), "slds-hide");
                $A.util.addClass(component.find("estimatedDuration"), "ch-slds-form-element--warning");
            } else {
                $A.util.addClass(component.find("iconWarning"), "slds-hide");
                $A.util.removeClass(component.find("estimatedDuration"), "ch-slds-form-element--warning");
            }
            
            component.set("v.initData.totalEstimatedDuration", componentEstimatedDuration);
        }
        
        order.User_Specified_Estimated_Duration__c = componentEstimatedDuration;
        
        let action = component.get("c.saveOrder");
        
        action.setParams({
            orderJson: JSON.stringify(order)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            
                component.set("v.initData.order", data);
        		component.set("v.initData", component.get("v.initData"));
            }
        });
        
        if (componentEstimatedDuration != userSpecifiedDuration) {
        	$A.enqueueAction(action);
        }
    },
    
    handleWorkTypeEstimatedDurationListener: function(component, event, helper) {
        let userSpecifiedDuration = component.get("v.initData.totalEstimatedDuration"),
            workTypeSpecifiedDuration = component.get("v.initData.workTypeEstimatedDuration");
        
        if ($A.util.isUndefinedOrNull(userSpecifiedDuration) || $A.util.isUndefinedOrNull(workTypeSpecifiedDuration)) {
            //killing the logic as these values should never be undefined unless the component is loading
            return;
        }
        
		let userSpecifiedDurationDecimal = parseFloat(userSpecifiedDuration).toFixed(2),
			workTypeSpecifiedDurationDecimal = parseFloat(workTypeSpecifiedDuration);
        
        if (parseFloat(userSpecifiedDurationDecimal) != 0 && workTypeSpecifiedDurationDecimal > userSpecifiedDurationDecimal) {
            component.set("v.componentEstimatedDuration", parseFloat(userSpecifiedDurationDecimal).toFixed(2));
            $A.util.removeClass(component.find("iconWarning"), "slds-hide");
            $A.util.addClass(component.find("estimatedDuration"), "ch-slds-form-element--warning");
        } else if (parseFloat(userSpecifiedDurationDecimal) <= 0) {
            component.set("v.componentEstimatedDuration", parseFloat(workTypeSpecifiedDurationDecimal).toFixed(2));
        } else if (workTypeSpecifiedDurationDecimal > userSpecifiedDurationDecimal) {
            $A.util.removeClass(component.find("iconWarning"), "slds-hide");
            $A.util.addClass(component.find("estimatedDuration"), "ch-slds-form-element--warning");
        } else {
            $A.util.addClass(component.find("iconWarning"), "slds-hide");
            $A.util.removeClass(component.find("estimatedDuration"), "ch-slds-form-element--warning");
        }
    },
    
    handleChangeNumberOfResources: function(component, event, helper) {
        let numberOfResources = component.get("v.numberOfResources"),
            order = component.get("v.initData.order");
        
        if (numberOfResources == order.Number_of_Resources__c) {
            return;
        }
        
        order.Number_of_Resources__c = numberOfResources;
        
        let action = component.get("c.saveOrder");
        
        action.setParams({
            orderJson: JSON.stringify(order)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            
            	component.set("v.numberOfResources", data.Number_of_Resources__c);
            
            	order.Number_of_Resources__c = data.Number_of_Resources__c;
            	
                component.set("v.initData.order", order);
        		component.set("v.initData", component.get("v.initData"));
            }
        });
        
        $A.enqueueAction(action);
    },

    handleChangeEffectiveDate: function(component, event, helper, isFromDateField) {
        let effectiveDate = component.get("v.effectiveDate"),
            order = component.get("v.initData.order"),
            previousEffectiveDate = component.get("v.previousEffectiveDate"),
            effectiveTime = component.get("v.effectiveTime"),
            previousEffectiveTime = component.get("v.previousEffectiveTime"),
            isOperatingHoursOverridden = component.find("chkOHOverride").get("v.checked");
        
        if (effectiveDate === previousEffectiveDate && effectiveTime === previousEffectiveTime) {
            //no change, throw away
            //return;
        }
        
        let action = component.get("c.saveOrderEffectiveDate");
        
        let orderDateTimeJson = '{"order":' + JSON.stringify(order) + '}';
                
        action.setParams({
            orderDateTimeJson: orderDateTimeJson,
            effectiveDate: effectiveDate,
            previousEffectiveDate: previousEffectiveDate,
            effectiveTime: effectiveTime,
            previousEffectiveTime: previousEffectiveTime,
            isOperatingHoursOverridden: isOperatingHoursOverridden,
            isFromDateField: isFromDateField
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
				
            	if (data.response.isSuccessful) {
            		this.handleToastCreation($A.get("$Label.c.Success_Toast_Title"), data.response.responseType, data.response.responseMessage);
            
            		order.EffectiveDate = data.order.EffectiveDate;
            		order.Service_Appointment_Scheduled_Start_Time__c = data.order.Service_Appointment_Scheduled_Start_Time__c;

            		component.set("v.previousEffectiveDate", data.order.EffectiveDate);
            		component.set("v.previousEffectiveTime", data.order.Service_Appointment_Scheduled_Start_Time__c);
            
                    if (!isOperatingHoursOverridden) {
                        component.set("v.minValidTime", data.minOperatingHoursTime);
                        component.set("v.maxValidTime", data.maxOperatingHoursTime);
                    }
                           
            		component.set("v.effectiveTime", data.order.Service_Appointment_Scheduled_Start_Time__c);
            
            		component.set("v.initData.order", data.order);
                    component.set("v.initData", component.get("v.initData"));
        		} else {
            		this.handleToastCreation($A.get("$Label.c.Error_Toast_Title"), data.response.responseType, data.response.responseMessage);
        
        			component.set("v.effectiveDate", component.get("v.previousEffectiveDate"));
                    //component.set("v.previousEffectiveTime", previousEffectiveTime);
        			component.set("v.effectiveTime", component.get("v.previousEffectiveTime"));
                    
                    console.log(component.get("v.effectiveTime"));
                }
            } else {
                console.log(action.getError());
            }
        });
        
        $A.enqueueAction(action);
    },
        
    handleSwitchOperatingHoursRequirement: function(component, event, helper) {
        let isOperatingHoursToBeOverridden = component.find("chkOHOverride").get("v.checked"),
            orderStartTime = component.find("orderStartTime");
        
        if (isOperatingHoursToBeOverridden) {
            console.log("to override");
            
            this.handleChangeEffectiveDate(component, event, helper, false);
        } else {
            this.handleChangeEffectiveDate(component, event, helper, true);
        }
    },
        
    handleSaveDescription: function(component, event, helper) {
        let description = component.get("v.description"),
            order = component.get("v.initData.order");
        
        if (description == order.Description) {
            return;
        }
        
        order.Description = description;
        
        let action = component.get("c.saveOrder");
        
        action.setParams({
            orderJson: JSON.stringify(order)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            
            	component.set("v.description", data.Description);
            
            	order.Description = data.Description;
            	
                component.set("v.initData.order", order);
        		component.set("v.initData", component.get("v.initData"));
            }
        });
        
        $A.enqueueAction(action);
    },
        
    handleSaveOrderName: function(component, event, helper) {
        let orderName = component.get("v.orderName"),
            order = component.get("v.initData.order");
        
        if (orderName == order.Name) {
            console.log("thrown away");
            return;
        }
        
        order.Name = orderName;
        
        let action = component.get("c.saveOrder");
        
        action.setParams({
            orderJson: JSON.stringify(order)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state == "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            
            	component.set("v.orderName", data.Name);
            
            	order.Name = data.Name;
            	
                component.set("v.initData.order", order);
        		component.set("v.initData", component.get("v.initData"));
            }
        });
        
        $A.enqueueAction(action);
    },

    handleToastCreation: function(title, type, message) {
        let toastEvent = $A.get("e.force:showToast");
        
        toastEvent.setParams({
            "title": title,
            "message": message,
            "duration": 3000,
            "type": type,
            "mode": "dismissible"
        })
        .fire();
    }
})