({
	handleInit: function(component, event, helper) {
        console.log("batch component listening...");
        
        let toastEvent = $A.get("e.force:showToast");
        
        toastEvent.setParams({
            "title": $A.get("$Label.c.Success_Toast_Title"),
        	"message": $A.get("$Label.c.Batch_Process_Received"),
            "duration": 10000,
            "type": "success",
            "mode": "dismissible"
        })
        .fire();
        
        this.pingServer(component, 5000);
	},
    
    pingServer: function(component, timeout) {
        let progressCheck = window.setInterval($A.getCallback(() => {
            let action = component.get("c.isOrderItemBatchJobCompleted");
            
            action.setParams({
                orderItemBatchJobId: component.get("v.batchJobId")
            });
            
            action.setCallback(this, (response) => {
                let state = response.getState();
                let isBatchComplete = response.getReturnValue();
                
                if (state == "SUCCESS") {
                    if (isBatchComplete) {
                		//TODO fire event to tell order item table to refresh all data
                        let batchJobCompletedEvent = $A.get("e.c:EDW_OrderItemBatchJobCompletedEvent");
                        batchJobCompletedEvent.fire();
                
                		component.set("v.killComponent", true);
                		clearInterval(progressCheck);
                    }
                }
            });

            $A.enqueueAction(action);
        }), timeout);
    },
    
    handleKillComponentListener: function(component, event, helper) {
        let killComponent = component.get("v.killComponent");
        
        if (killComponent) {
            console.log("job finished, component destroyed");
            component.destroy();
        }
	}
})