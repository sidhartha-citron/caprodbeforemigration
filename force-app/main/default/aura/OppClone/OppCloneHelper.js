({
    filterDupes : function(component, recordIds) {
		var filteredRecordIds = [];
        
        // Filter record ids against existing records
        var existingRecords = component.get('v.records');
        for (var i = 0; i < recordIds.length; i++) {
         	var id = recordIds[i];
            var dupe = false;
            
            if (id === '') {
                continue;
            }

            for (var j = 0; j < existingRecords.length; j++) {
                if (existingRecords[j].Id == id) {
                    dupe = true;
                    break;
                }
        	}   
            
            if (!dupe) {
                filteredRecordIds.push(id);
            }
        }
        
        return filteredRecordIds;
	},
    
    addRecords : function(component, recordIds) {
        // Get records and add to existing records
        var getRecords = component.get('c.getRecords');
		
        getRecords.setParams({
            "ids": recordIds
        }); 
        
        var existingRecords = component.get('v.records');
        getRecords.setCallback(this, function(response) {
           var state = response.getState();
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() !=null ) {
                var newRecords = response.getReturnValue();
                existingRecords = existingRecords.concat(newRecords);
                component.set('v.records', existingRecords);
            }
        });
        
        $A.enqueueAction(getRecords);
    },
    
    doClone : function(component, helper) {
        component.set('v.isCloning', true);
        
        var oppId = component.get('v.oppId');
        var records = component.get("v.records");
        var setStage = component.get("v.setStage");
        var recordIds = [];
        
        for (var i = 0; i < records.length; i++) {
            recordIds.push(records[i].Id);
        }
        
        var cloneOpp = component.get('c.cloneOpp');
		
        cloneOpp.setParams({
            "oppId": oppId,
            "acctIds" : recordIds,
            "setStage" : setStage
        }); 
        
        cloneOpp.setCallback(this, function(response) {
           var state = response.getState();
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() !=null ) {
                var cloneResults = response.getReturnValue();
                console.log(cloneResults);
                component.set('v.successes', cloneResults.successes);
        		component.set('v.failures', cloneResults.failures);
        		
                helper.toggleModal(component);
            } else {
                return [];
            }
            
            component.set('v.isCloning', false);
        });
        
        $A.enqueueAction(cloneOpp);
    },
    
    toggleModal : function (component) {
        var toggleModal = component.find("resultsModal");
        $A.util.toggleClass(toggleModal, "slds-hide");
    }
})