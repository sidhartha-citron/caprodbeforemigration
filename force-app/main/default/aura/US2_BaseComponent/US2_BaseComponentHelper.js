/**
 * Created by timothychiang on 2018-10-09.
 */
({
    /**
     * actionName = the apex controller method to call (e.g. 'c.myMethod' )
     * params = JSON object specifying action parameters (e.g. { 'x' : 42 } )
     * successCallback = function to call when action completes (e.g. function( response ) { ... } )
     * failureCallback = function to call when action fails (e.g. function( response ) { ... } )
     */
    callAction : function( component, actionName, params, successCallback, failureCallback, disableSpinner ) {

        var action = component.get( actionName );

        if ( params ) {
            action.setParams( params );
        }

        if(!disableSpinner){
            this.fireSpinnerShow(component);
        }


        action.setCallback( this, function( response ) {
            if ( component.isValid() && response.getState() === 'SUCCESS' ) {

                if ( successCallback ) {
                    successCallback( response.getReturnValue() );
                }

            } else {

                console.error( 'Error calling action "' + actionName + '" with state: ' + response.getState() );

                if ( failureCallback ) {
                    failureCallback( response.getError(), response.getState() );
                } else {
                    this.logActionErrors( component, response.getError() );
                }

            }

            if(!disableSpinner) {
                this.fireSpinnerHide(component);
            }
        });

        $A.enqueueAction( action );

    },

    /**
    * log error function
    *
    */
    logActionErrors : function( component, errors ) {
        if ( errors ) {
            for ( var index in errors ) {
                var resultsToast = $A.get("e.force:showToast");
                resultsToast.setParams({
                    "title": "Saved",
                    "type": "error",
                    "message": "Please contact the administrator regarding the following error: " + errors[index].message   
                });
                resultsToast.fire();
                //console.error( 'Error: ' + errors[index].message );
            }
        } else {
            var resultsToast = $A.get("e.force:showToast");
            resultsToast.setParams({
                "title": "Saved",
                "type": "error",
                "message": "Unknown error"  
            });
            resultsToast.fire();
            //console.error( 'Unknown error' );
        }
    },

    /**
    * reveal spinner
    *
    */
    fireSpinnerShow : function(component){
        var cmpEvent = component.getEvent("spinnerEvent");
        cmpEvent.setParams({"action" : "Spinner Show"});
        cmpEvent.fire();
    },

    /**
    * hide spinner
    *
    */
    fireSpinnerHide : function(component){
        var cmpEvent = component.getEvent("spinnerEvent");
        cmpEvent.setParams({"action" : "Spinner Hide"});
        cmpEvent.fire();
    },

    /**
    * create numeric picklist options
    *
    */
    generateNumericOptions : function(component, minNumber, maxNumber){
        var numericOptions = [];

        for (var q = minNumber ; q <= maxNumber; q++) {
            numericOptions.push({
                "label": q,
                "value": q
            });
        }

        return numericOptions;
    },

    /**
    * utility function to convert datetime to date
    *
    */
    // convertDateTimeToDate : function(dateTime){
    //     var inputDateTime = moment(dateTime);
    //     var resultDate = inputDateTime.startOf('day');
    //     return resultDate.format("YYYY-MM-DD");
    // },

    /**
    * function to navigate back to last URL
    *
    */
    navigateBack: function(){
        window.history.back();
    },

    closeAction: function(){
        var cameFromURL = component.get('v.cameFromURL');

        if(cameFromURL){
            this.navigateBack();
        } else {
            $A.get("e.force:closeQuickAction").fire();
        }
    },

    /**
    * function to extract recordId from page reference
    *
    */
    getRecordId: function(component){
        var recordId = component.get('v.recordId');
        if(recordId){
        } else {
            var newRecordId = component.get('v.pageReference.state.c__recordId');
            component.set('v.recordId', newRecordId);
            component.set('v.cameFromURL', true);
            
        }

        component.set('v.hasRecordId', true);
    },

    /**
    * handle form exit
    *
    */     
   exitForm: function(component, event, helper, id){
    var navEvt = $A.get("e.force:navigateToSObject");
    navEvt.setParams({
      "recordId": id,
      "slideDevName": "detail"
    });
    navEvt.fire();
},

})