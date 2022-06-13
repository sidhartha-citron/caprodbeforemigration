({
    init : function(component, event, helper) {

        /*component.find("caseRecordCreator").getNewRecord(
                "Case", // sObject type (objectApiName)
                null,      // recordTypeId
                false,     // skip cache?
            $A.getCallback(function() {
                var rec = component.get("v.newCase");
                var error = component.get("v.newCaseError");
                if(error || (rec === null)) {
                    console.log("Error initializing record template: " + error);
                    return;
                }
                helper.determineDifferences(component, event, helper);
                console.log("Record template initialized: " + rec.apiName);
            })
        );*/


        helper.determineDifferences(component, event, helper);
        
    },

    handleSaveCase: function(component, event, helper) {
        // component.find("caseRecordCreator").saveRecord(function(saveResult) {
        //     if (saveResult.state === "SUCCESS" || saveResult.state === "DRAFT") {
        //         // record is saved successfully
        //         var resultsToast = $A.get("e.force:showToast");
        //         resultsToast.setParams({
        //             "title": "Saved",
        //             "message": "The record was saved. "   
        //         });
        //         resultsToast.fire();
        //         console.log(saveResult);
        //         console.log(component.get('v.simpleNewCase.Id'));
        //         helper.navigateToTicket(component, event, helper);

        //     } else if (saveResult.state === "INCOMPLETE") {
        //         // handle the incomplete state
        //         console.log("User is offline, device doesn't support drafts.");
        //     } else if (saveResult.state === "ERROR") {
        //         // handle the error state
        //         console.log('Problem saving case, error: ' + JSON.stringify(saveResult.error));
        //     } else {
        //         console.log('Unknown problem, state: ' + saveResult.state + ', error: ' + JSON.stringify(saveResult.error));
        //     }
        // });

        helper.callAction(component, 'c.saveTicket', {
            'newCase': component.get('v.simpleNewCase')
        }, function (data) {
            if(data){
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title": "Saved",
                    "type": "success",
                    "message": "The record was saved. "   
                });
                resultsToast.fire();

                component.set('v.simpleNewCase', data);

                helper.navigateToTicket(component, event, helper);

            } 
        });

    },

    changeStateToEdit: function(component, event, helper) {
        var p = component.get("v.parent");
        p.changeState('Edit');
    }

})