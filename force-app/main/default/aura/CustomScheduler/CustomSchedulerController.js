({
	doInit : function(component, event, helper) {
		var getState = component.get("c.getInitialState");
        
        getState.setCallback(this, function(response){
            var respState = response.getState();
            
            if (component.isValid() && respState === "SUCCESS" && response.getReturnValue() != null ) {
                var state = response.getReturnValue();
                var batchJobs = state.batchJobs;
                component.set('v.batchJobs', batchJobs);
                component.set('v.selBatchJob', batchJobs[0]);
                component.set('v.settingsNames', state.customSettingRecordNames);
                component.set('v.selSetting', state.customSettingRecordNames[0]);
                component.set('v.runningJobs', state.runningJobs);
            }		
        });
        
        $A.enqueueAction(getState);
        
        var hrs = [];
        for (var x = 0; x < 24; x++) {
            hrs[x] = x;
        }
        component.set('v.hrs', hrs);
        component.set('v.selHr', hrs[0]);
	},
    
    batchSelectChange : function(component, event) {
        var getCustomSetting = component.get("c.getBatchToCustomSetting");
        
        getCustomSetting.setParams({
            "batchName" : component.get("v.selBatchJob")
        }); 
        
        getCustomSetting.setCallback(this, function(response){
            var respState = response.getState();
            
            if (component.isValid() && respState === "SUCCESS" && response.getReturnValue() != null ) {
                var customSettingRecordNames = response.getReturnValue();
                component.set('v.settingsNames', customSettingRecordNames);
                component.set('v.selSetting', customSettingRecordNames[0]);
            }		
        });
        
        $A.enqueueAction(getCustomSetting);
    },
    
    submit : function(component, event, helper) {
        var scheduleJob = component.get("c.scheduleJob");
        
        scheduleJob.setParams({
            "batchName" : component.get("v.selBatchJob"),
            "customSettingRecordName" : component.get("v.selSetting"),
            "hr" : component.get("v.selHr")
        }); 
            
        scheduleJob.setCallback(this, function(response){
            var respState = response.getState();
            
            if (component.isValid() && respState === "SUCCESS" && response.getReturnValue() != null ) {
                var result = response.getReturnValue();
                if (result.success === true) {
                    helper.getCurrentlyRunningJobs(component);
                    component.set('v.errMsg', '');
                } else {
                    component.set('v.errMsg', result.errMsg);
                }
            }		
        });
        
        $A.enqueueAction(scheduleJob);
    },
    
    delete : function(component, event, helper) {
    	var jobId = event.getSource().get("v.name");
    	var deleteJob = component.get("c.deleteJob");
        
        deleteJob.setParams({
            "jobId" : jobId,
    		"batchNames" : component.get("v.batchJobs")
        }); 
            
        deleteJob.setCallback(this, function(response){
            var respState = response.getState();
            
            if (component.isValid() && respState === "SUCCESS" && response.getReturnValue() != null ) {
            	component.set('v.runningJobs', response.getReturnValue());
            }		
        });
        
        $A.enqueueAction(deleteJob);
	}
})