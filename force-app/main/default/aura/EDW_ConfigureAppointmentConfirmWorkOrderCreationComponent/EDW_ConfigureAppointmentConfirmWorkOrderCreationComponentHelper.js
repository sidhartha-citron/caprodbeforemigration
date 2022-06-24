({
	handleDoInit : function(component, event, helper) {
		let numberOfOrderItems = component.get("v.numberOfOrderItems"),
            workTypeEstimatedDuration = component.get("v.workTypeEstimatedDuration"),
            totalEstimatedDuration = component.get("v.totalEstimatedDuration"),
            numberOfResources = component.get("v.numberOfResources"),
            totalNumberOfOrderProducts = component.get("v.totalNumberOfOrderProducts"),
            totalOrderEstimatedPrice = component.get("v.totalOrderEstimatedPrice");
        
        let warnings = [];
        
        if (numberOfOrderItems == 0) {
            warnings.push($A.get("$Label.c.Creating_an_Order_with_no_Order_Items_Summary_Screen"));
        }
        
        if ($A.util.isUndefinedOrNull(totalEstimatedDuration)) {
            totalEstimatedDuration = 0;
        }
        
        if (totalEstimatedDuration != 0 && workTypeEstimatedDuration > totalEstimatedDuration) {
            warnings.push($A.get("$Label.c.Service_Appointment_Duration_and_Product_Recommendation_Discrepancy"));
        }
        
        let orderSummaries = [];
        
        component.set("v.allWarnings", warnings);
        
        component.set("v.averageDurationPerServiceAppointment",
                    totalEstimatedDuration != 0 
						? (totalEstimatedDuration / numberOfResources).toFixed(2)
                      	: (workTypeEstimatedDuration / numberOfResources).toFixed(2)
        );
        
        orderSummaries.push({"label": $A.get("$Label.c.Number_of_Service_Appointments_Summary_Screen"), "value": numberOfResources});
        orderSummaries.push({"label": $A.get("$Label.c.Average_Duration_Per_Service_Appointment_Summary_Screen"), "value": totalEstimatedDuration != 0 
                                                                                                    ? (totalEstimatedDuration / numberOfResources).toFixed(2)
                                                                                                    : (workTypeEstimatedDuration / numberOfResources).toFixed(2) + " hours"});
        orderSummaries.push({"label": $A.get("$Label.c.Total_Number_of_Order_Products_Summary_Screen"), "value": totalNumberOfOrderProducts});
        orderSummaries.push({"label": $A.get("$Label.c.Total_Order_Estimated_Price_Summary_Screen"), "value": "$" + totalOrderEstimatedPrice.toFixed(2)});
        
        component.set("v.orderSummaryItems", orderSummaries);
	},
    
	handleCloseModal : function(component, event, helper) {
		component.destroy();
	},
    
	handleConfirmWorkOrderGeneration: function(component, event, helper) {
        $A.util.toggleClass(component.find("generateWorkOrderSpinner"), "slds-hide");
        $A.util.toggleClass(component.find("generateWorkOrderSpinnerMessage"), "slds-hide");
        
        let workTypeEstimatedDuration = component.get("v.workTypeEstimatedDuration"),
            totalEstimatedDuration = component.get("v.totalEstimatedDuration"),
            totalDuration = totalEstimatedDuration == 0 || $A.util.isUndefinedOrNull(totalEstimatedDuration) ? workTypeEstimatedDuration : totalEstimatedDuration,
            order = component.get("v.order"),
            emergencyTicket = component.get("v.emergencyTicket"),
            totalNumberOfOrderProducts = component.get("v.totalNumberOfOrderProducts");
        
        let action = component.get("c.generateWorkOrder");
        
        action.setParams({
            orderJson: JSON.stringify(order),
            totalDuration: totalDuration,
            totalNumberOfOrderItems: totalNumberOfOrderProducts,
            caseJson: JSON.stringify(emergencyTicket)
        });
        
        action.setCallback(this, (response) => {
            let state = response.getState();
            
            if (state === "SUCCESS") {
            	let data = JSON.parse(response.getReturnValue());
            	
                if (!$A.util.isUndefinedOrNull(data.errorMessage)) {
                    let toastEvent = $A.get("e.force:showToast");
                    
                    toastEvent.setParams({
                        "title": "Error",
                        "message": data.errorMessage,
                        "duration": 2500,
                        "type": "error",
                        "mode": "pester"
                    })
                    .fire();
        			
        			this.handleCloseModal(component, event, helper);
        
        			return;
                } else {
                    let navEvent = $A.get("e.c:EDW_GenerateWorkOrderEvent");
                
                    navEvent.setParams({
                        workOrderId: data.workOrderId,
                        orderId: data.orderId
                    })
                    .fire();
                }
            }
        });
        
        $A.enqueueAction(action);
	}
})