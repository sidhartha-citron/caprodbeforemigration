({
	doInit : function(component, event, helper) {
		console.log('-- In Site Survey Setting Component -- '); 
        console.log(' RecordId ' + component.get("v.recordId"));
        console.log(' Site Survey  coming from parent cmp ' + component.get("v.siteSurvey"));
        console.log(' Site Survey Id coming from parent cmp ' + component.get("v.siteSurvey.Id"));
        console.log(' Signature Required For Opts from parent cmp ' + component.get('v.signatureRequiredFieldOpts'));
        
        var signatureOpts = [];
        var signatureRequiredFieldOpts = component.get('v.signatureRequiredFieldOpts');
        if (signatureRequiredFieldOpts != null) {
            for (var i = 0; i < signatureRequiredFieldOpts.length; i++) {
            	signatureOpts.push({
                	label :  signatureRequiredFieldOpts[i],
                	value: signatureRequiredFieldOpts[i]
            	});
        	}
        }
        
        var signatureVals = [];
        var siteSurvey = component.get('v.siteSurvey');
        if (siteSurvey['Signature_Required_For__c'] != null) {
            signatureVals = siteSurvey['Signature_Required_For__c'].split(';');
        }
        
        component.set('v.signatureRequiredPicklistOpts', signatureOpts);
        component.set('v.signatureRequiredPicklistVals', signatureVals);
	},
    
    handleSave: function(component, event, helper) {
        var siteSurvey = component.get("v.siteSurvey");
        var signaturePicklist = component.find("signatureRequiredPicklist");
        var signaturePicklistVals = signaturePicklist.get('v.value');
        if (signaturePicklistVals != null) {
            siteSurvey['Signature_Required_For__c'] = signaturePicklistVals.join(';');
        }        
        
        var action = component.get("c.saveSiteSurvey");
        action.setParams({"record": siteSurvey});
        action.setCallback(this, function(response){        
           if(component.isValid() && response.getState() === "SUCCESS"){
				var record = response.getReturnValue();
               	var customToast = component.find("customToast");            
                    if(!$A.util.isUndefinedOrNull(record)){
                        /*customToast.setCloseType(true);
            			customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Success_Title"), 
                        $A.get("$Label.c.Site_Survey_Save_Success_Message"), 'SUCCESS');*/
                        
                        component.set("v.siteSurvey", record);
                        var theEvent = component.getEvent("savedEvent"); 
                        theEvent.setParams({
                            "siteSurvey" :record
                        });
                        theEvent.fire();
                        var resultsToast = $A.get("e.force:showToast");
                        resultsToast.setParams({
                            "title" : $A.get("$Label.c.Site_Survey_Save_Success_Title"),
                            "type" : "success",
                            "message" :$A.get("$Label.c.Site_Survey_Save_Success_Message")
                        }); 
                        resultsToast.fire();
                    }
               		else{
                        var errorMessage = "",
                            errors = action.getError();
                        
                        if (errors[0] && errors[0].pageErrors[0]) {
                            errorMessage = action.getError()[0].pageErrors[0].message;
                        } else {
                            errorMessage = $A.get("$Label.c.Site_Survey_Save_Error_Message");
                        }
                        
                        var resultsToast = $A.get("e.force:showToast");
                        resultsToast.setParams({
                            "title" : $A.get("$Label.c.Site_Survey_Save_Error_Title"),
                            "type" : "error",
                            "message" :errorMessage
                        }); 
                        resultsToast.fire();
               		}
           }else {
               var errorMessage = "",
                   errors = action.getError();
               
               if (errors[0] && errors[0].pageErrors[0]) {
                   errorMessage = action.getError()[0].pageErrors[0].message;
               } else {
                   errorMessage = $A.get("$Label.c.Site_Survey_Save_Error_Message");
               }
               
               var resultsToast = $A.get("e.force:showToast");
               resultsToast.setParams({
                   "title" : $A.get("$Label.c.Site_Survey_Save_Error_Title"),
                   "type" : "error",
                   "message" :errorMessage
               }); 
               resultsToast.fire();
           }                    
        });    
        $A.enqueueAction(action);
        
    },
    
    closeParentModal: function(component, event, helper){
        $A.get("e.force:closeQuickAction").fire();
        $A.get('e.force:refreshView').fire();
    }

})