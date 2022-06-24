({
	showToast : function(component, toastType, msg) {
        /*
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            type: toastType,
            message: msg
        });
        toastEvent.fire();
        */
        $A.createComponent("c:VFToast", {
            "toastMsg" : msg,
            "toastType" : toastType
        }, function(newCmp, status, errorMessage) {
            if (component.isValid()) {
                if (status == "ERROR") {
                    console.log('Error Message--',errorMessage);
                } else if (status == "SUCCESS") {
                	component.set("v.toastCmp", newCmp);
                }
            }
        });
	},
    
    select : function(val, component) {
        var records = component.get("v.displayRecords");
        
        for (var i = 0; i < records.length; i++) {
        	records[i].isSelected = val;
        }
        component.set('v.displayRecords', records);
    },
    
    invert : function(component) {
        var records = component.get("v.displayRecords");
        
        for (var i = 0; i < records.length; i++) {
        	records[i].isSelected = !records[i].isSelected;
        }
        component.set('v.displayRecords', records);
    },
    
    active : function(component) {
        var records = component.get("v.displayRecords");
        
        for (var i = 0; i < records.length; i++) {
            records[i].isSelected = records[i].isActive;
        }
        component.set('v.displayRecords', records);
    },
    
    loadRecords : function(component) {
        var getRecords = component.get("c.getRecordEntries");
        var ids = component.get('v.ids');
		var objectName = component.get('v.objectName');
        var sortImpl = component.get('v.sortImpl');
        var pageSize = component.get('v.pageSize');

        var numPages = Math.ceil(ids.length/pageSize);
        component.set('v.numPages', numPages);
        var pagTopComponent = component.find("pagTop");
        pagTopComponent.setNumPages(numPages);
        var pagBottomComponent = component.find("pagBottom");
        pagBottomComponent.setNumPages(numPages);
        
        if (numPages > 1) {
            component.set('v.initialNumLoading', pageSize);
        } else {
            component.set('v.initialNumLoading', ids.length);
        }
        
        getRecords.setParams({
            "ids" : ids,
            "objName": objectName,
            "sortImpl" : sortImpl,
            "startIndex" : 0,
            "pageSize" : pageSize
        }); 
        
        getRecords.setCallback(this, function(response){
            var state = response.getState();
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() !=null ) {
                var recordSet = response.getReturnValue();
                console.log(recordSet);
                component.set('v.records', recordSet.records);
                component.set('v.displayRecords', recordSet.records);
                
                // var searchLabelAbove = "Search '" + recordSet.searchField + "' above";
                // var searchLabelBelow = "Search '" + recordSet.searchField + "' below";
                // component.set('v.searchPlaceholderAbove', searchLabelAbove);
                // component.set('v.searchPlaceholderBelow', searchLabelBelow);
                
				//component.set('v.headers', recordSet.headers);
                
                // Set field entry values to record (sobject) values
                var records = component.get('v.records');
                for (var i = 0; i < records.length; i++) {
                    var record = records[i].record;
                    var fields = records[i].fields;
                    
                    for (var x = 0; x < fields.length; x++) {
                        var fieldName = fields[x].name;
                        
                        if(fieldName.indexOf('.') !== -1) {
                            var relatedObjFields = fieldName.split('.');
                            if (record[relatedObjFields[0]] != undefined) {
                            	fields[x].value = record[relatedObjFields[0]][relatedObjFields[1]];          
                            }
                        } else {
                        	fields[x].value = record[fieldName];    
                        }
                    }
                }
                
                // Set header entry values to control (sobject) values
                var control = recordSet.controlRecord;
                var headers = recordSet.headers;
                var accountId = recordSet.accountId;
                var parentName = recordSet.parentName;
                var parentId = component.get('v.recordId');
                
                for (var x = 0; x < headers.length; x++) {
                    if (headers[x].type == 'PICKLIST') {
                        headers[x].value = null;
                    } else {
                    	headers[x].value = control[headers[x].name];    
                    }
                }
                component.set('v.headers', headers);
                component.set('v.isInitialLoad', false);
                component.set('v.isLoading', false);
                component.set('v.accountId', accountId);
                component.set('v.parentName', parentName);
                component.set('v.lookupFieldFilter', "AccountId = '" + accountId +"' AND Id != '" + parentId + "'");
                
                console.log('Darcy ' + component.get('v.lookupFieldFilter'));
    
            }		
        });
        
		$A.enqueueAction(getRecords);
    },
    
    loadPage : function(component, newCurrPg) {
        component.set('v.isLoading', true);
        
        var getRecords = component.get("c.getRecordEntries");
        var ids = component.get('v.ids');
		var objectName = component.get('v.objectName');
        var sortImpl = component.get('v.sortImpl');
        var pageSize = component.get('v.pageSize');
        
        getRecords.setParams({
            "ids" : ids,
            "objName": objectName,
            "sortImpl" : sortImpl,
            "startIndex" : (newCurrPg - 1) * pageSize,
            "pageSize" : pageSize
        }); 
        
        getRecords.setCallback(this, function(response){
            var state = response.getState();
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() !=null ) {
                var recordSet = response.getReturnValue();
                
                component.set('v.records', recordSet.records);
                component.set('v.displayRecords', recordSet.records);
				//component.set('v.headers', recordSet.headers);
                
                // Set field entry values to record (sobject) values
                var records = component.get('v.records');
                for (var i = 0; i < records.length; i++) {
                    var record = records[i].record;
                    var fields = records[i].fields;
                    
                    for (var x = 0; x < fields.length; x++) {
                        var fieldName = fields[x].name;
                        
                        if(fieldName.indexOf('.') !== -1) {
                            var relatedObjFields = fieldName.split('.');
                            if (record[relatedObjFields[0]] != undefined) {
                            	fields[x].value = record[relatedObjFields[0]][relatedObjFields[1]];          
                            }
                        } else {
                        	fields[x].value = record[fieldName];    
                        }
                    }
                }
                
                component.set('v.isLoading', false);
            }		
        });
        
		$A.enqueueAction(getRecords);  
    },
    
    saveRecords : function(component, helper) {
        var save = component.get("c.saveRecords");
        
        var records = [];
        var entries = component.get("v.displayRecords");
        for (var i = 0; i < entries.length; i++) {
            // Filter out un-selected records
            if (!entries[i].isSelected) continue;
            
            var record = entries[i].record;
            for (var x = 0; x < entries[i].fields.length; x++) {
               var field = entries[i].fields[x];
               record[field.name] = field.value;
            }
            records.push(entries[i].record);
        }
        
        save.setParams({
            "records": records
        }); 
          
        save.setCallback(this, function(response){
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() != null ) {
				var results = response.getReturnValue();
                if (results.isSuccess) {
                    var msg;
                    if (results.numSaved == 1) {
                        msg = results.numSaved + " record updated."
                    } else {
                        msg = results.numSaved + " records updated."
                    }
                	helper.showToast(component, "success", msg);    
                } else {
                    helper.showToast(component, "error", "Records failed to update: "  + results.errMsg);    
                }
            } else {
                helper.showToast(component, "error", "Records failed to update due to communication error.");    
            }	
        });
        
        $A.enqueueAction(save);            
    },
    
    movetoOrder : function(component, helper) {
        var movetoOrder = component.get("c.cloneOrderItem");
        var ordId= component.get("v.selectedId");
        console.log(ordId);
        if(ordId) {
            
            var records = [];
            var entries = component.get("v.displayRecords");
            for (var i = 0; i < entries.length; i++) {
                // Filter out un-selected records
                if (!entries[i].isSelected) continue;
                
                var record = entries[i].record;
                for (var x = 0; x < entries[i].fields.length; x++) {
                   var field = entries[i].fields[x];
                   record[field.name] = field.value;
                }
                records.push(entries[i].record);
            }
     
            movetoOrder.setParams({
                "records": records,
                "ordId"  : ordId
            }); 
              
            movetoOrder.setCallback(this, function(response){
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
                
                // component.set('v.isCloning', false);
            });
            
            $A.enqueueAction(movetoOrder);   
        }
        else {
            helper.showToast(component, "error", "Please select an Order under the same Ship To account!!!"); 
        }
                 
    },
        toggleModal : function (component) {
        var toggleModal = component.find("resultsModal");
        $A.util.toggleClass(toggleModal, "slds-hide");
    },
    search : function(component, helper) {
        var searchRecords = component.get("c.searchRecords");
		var objName = component.get('v.objectName');
        var searchTerm = component.get('v.searchTerm');
        
        component.set('v.isSearching', true);
        
        // If search term is empty, return to original list
        if (searchTerm == null || searchTerm.length === 0 || !searchTerm.trim()) {
        	var entries = component.get("v.records"); 
            component.set('v.displayRecords', entries);
            component.set('v.isSearching', false);
            return;
        }
        
        var records = [];
        // Use complete list of records (not just display)
        var entries = component.get("v.records"); 
        for (var i = 0; i < entries.length; i++) {    
            records.push(entries[i].record);
        }
        
        searchRecords.setParams({
            "records" : records,
            "objName" : objName,
            "searchTerm" : searchTerm
        }); 
        
        searchRecords.setCallback(this, function(response){
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue() != null ) {
				var resultsMap = response.getReturnValue();
        		
                var filteredEntries = [];
                for (var i = 0; i < entries.length; i++) {    
            		var entry = entries[i];
                    if (resultsMap[entry.record.Id] == true) {
                        filteredEntries.push(entry);
                    }
        		}
                component.set('v.displayRecords', filteredEntries);
                component.set('v.isSearching', false);
            }
        });
        
        $A.enqueueAction(searchRecords);
    },
    
    // searchSurveyLocations : function(component, helper) {
    //     var searchRecords = component.get("c.searchSurveyLocations");
	// 	var objName = component.get('v.objectName');
    //     var searchTerm = component.get('v.searchSurveyLocation');
        
    //     component.set('v.isSearching', true);
        
    //     // If search term is empty, return to original list
    //     if (searchTerm == null || searchTerm.length === 0 || !searchTerm.trim()) {
    //     	var entries = component.get("v.records"); 
    //         component.set('v.displayRecords', entries);
    //         component.set('v.isSearching', false);
    //         return;
    //     }
        
    //     var records = [];
    //     // Use complete list of records (not just display)
    //     var entries = component.get("v.records"); 
    //     for (var i = 0; i < entries.length; i++) {    
    //         records.push(entries[i].record);
    //     }
        
    //     searchRecords.setParams({
    //         "records" : records,
    //         "objName" : objName,
    //         "searchTerm" : searchTerm
    //     }); 
        
    //     searchRecords.setCallback(this, function(response){
    //         var state = response.getState();
    //         if (component.isValid() && state === "SUCCESS" && response.getReturnValue() != null ) {
	// 			var resultsMap = response.getReturnValue();
        		
    //             var filteredEntries = [];
    //             for (var i = 0; i < entries.length; i++) {    
    //         		var entry = entries[i];
    //                 if (resultsMap[entry.record.Id] == true) {
    //                     filteredEntries.push(entry);
    //                 }
    //     		}
    //             component.set('v.displayRecords', filteredEntries);
    //             component.set('v.isSearching', false);
    //         }
    //     });
        
    //     $A.enqueueAction(searchRecords);
    // }    

})