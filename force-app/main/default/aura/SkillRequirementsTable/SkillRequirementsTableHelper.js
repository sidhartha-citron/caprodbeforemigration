({
    fetchColumns : function(component) {
        var initColumns = component.get("c.getColumns");
        initColumns.setParams({
            "columnAPINames": component.get("v.columnAPINames")
        });   
        initColumns.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                component.set("v.columns", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(initColumns);
    }, 
    
	/*saveSkillHelper : function(component, theRecord, siteSurveyId) {
        
        var allSkills = component.get("v.records");
        
        var action = component.get("c.saveNewSkill");
        
        action.setParams({
            "record": JSON.stringify(theRecord),
            "siteSurveyId": siteSurveyId
        });
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                console.log(response.getReturnValue());
                console.log("Successful with state: " + state);
                var theRecord = response.getReturnValue();
                
                if(theRecord!==null && typeof theRecord!=="undefined") {
                    var record = allSkills.find(function(item){
                        if(item.skillId === theRecord.skillId){
                            item.recordId=theRecord.recordId;
                            item.skillLevel=theRecord.skillLevel;
                            return item;
                        }                                  
                    });
                    
                    var index = allSkills.findIndex(function(item){
                        if(item.skillId === record.skillId){
                            return item;
                        }                                  
                    });
                    allSkills.splice(index, 1, record);
                    component.set("v.records", allSkills);
                }
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(action);
	}, */
    
    updateSkillHelper : function(component, theRecord) {
        console.log("Update Helper: " + theRecord.recordId);
        var allSkills = component.get("v.records");
        
        var action = component.get("c.upsertSkill");
        
        action.setParams({
            "record": JSON.stringify(theRecord), 
            "siteSurveyId" : component.get("v.siteSurveyId")
        });
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                console.log(response.getReturnValue());
                console.log("Successful with state: " + state);
                //component.set("v.records", response.getReturnValue());
                var value = response.getReturnValue();
                console.log("Successful with state: " + value.recordId);
                if(!$A.util.isUndefinedOrNull(value) && ($A.util.isUndefinedOrNull(theRecord.recordId) || $A.util.isEmpty(theRecord.recordId))) {
                    var record = allSkills.find(function(item){
                        if(item.skillId === value.skillId){
                            item.recordId=value.recordId;
                            item.skillLevel=value.skillLevel;
                            return item;
                        }                                  
                    });
                    
                    var index = allSkills.findIndex(function(item){
                        if(item.skillId === record.skillId){
                            return item;
                        }                                  
                    });
                    console.log("Successful Record: " + record);
                    allSkills.splice(index, 1, record);
                    component.set("v.records", allSkills);
                }
            }
        });
        
        $A.enqueueAction(action);
    }, 
    
    deleteSkillCleanRecord : function(component, skillId) {
        
        if(skillId!==null && typeof skillId!=="undefined") {
            var allSkills = component.get("v.records");
            
            var record = allSkills.find(function(item){
                if(item.externalId === skillId){
                    item.skillExists=false;
                    item.skillLevel='';
                    return item;
                }                                  
            });
            if(record!==null && typeof record!=="undefined") {
                record.recordId='';
                var x;
                for (x in record.lineOfBusinesses) {
                    console.log(">> x " + record.lineOfBusinesses[x]);
                    record.lineOfBusinesses[x].isChosen=false;
                }
                
                var index = allSkills.findIndex(function(item){
                    if(item.skillId === record.skillId){
                        return item;
                    }                                  
                });
                allSkills.splice(index, 1, record);
                component.set("v.records", allSkills);
            }
        }
    },
    
    deleteSkillHelper : function(component, recordId, siteSurveyId) {
        
        var action = component.get("c.deleteSkill");
        
        action.setParams({
            "externalId": recordId, 
            "siteSurveyId": siteSurveyId
        });
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                console.log(response.getReturnValue());
                console.log("Successful with state: " + state);
                //component.set("v.records", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(action);
	}
})