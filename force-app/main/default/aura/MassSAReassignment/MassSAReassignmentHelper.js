({
    searchHelper : function(component,event,getInputkeyWord) {
      // call the apex class method
     var action = component.get("c.fetchLookUpValues");
      // set param to method 
        action.setParams({
            'searchKeyWord': getInputkeyWord
          });
      // set a callBack   
        action.setCallback(this, function(response) {
          $A.util.removeClass(component.find("mySpinner"), "slds-show");
            var state = response.getState();
            if (state === "SUCCESS") {
				console.log('erra');
                var storeResponse = response.getReturnValue();
				console.log('neevaneeva'+storeResponse);
              // if storeResponse size is equal 0 ,display No Result Found... message on screen.                }
                if (storeResponse.length == 0) {
					console.log('runaruna' + storeResponse.length);
                    component.set("v.Message", 'No Result Found...');
                } else {
                    component.set("v.Message", '');
                }
				console.log('sunny' + storeResponse.length);
                // set searchResult list with return value from server.
                component.set("v.listOfSearchRecords", storeResponse);
            }
        });
      // enqueue the Action 
        $A.enqueueAction(action);
    },
    assignRecord : function(component,event,helper){
		component.set('v.spinner',true);
        var action = component.get("c.UpdateServiceAppointments");
        var schDate = component.get("v.ScheduleStartDate");
        console.log('aitaaita'+ action);
        action.setParams({
            'listSAIds' : component.get("v.customListStr"),
            'asId' : component.get("v.recordId"),
            'schStartDate' : component.get("v.ScheduleStartDate")
        });
		//component.set("v.spinner",false);
        action.setCallback(this,function(response){
            var state = response.getState();
            console.log('donkey' + state);
            if(state == "SUCCESS"){
                component.set("v.spinner",false);
                var res = response.getReturnValue();
                
                console.log('squirrelsquirrel!!' + res);
                if(response.getReturnValue()[0] == 'multipleSRError'){
                   component.set('v.FromMultipleResource',true); 
                   component.set('v.FromMultipleResourceError','Cannot initiate transfer'+ '<br/><br/>' + 'You cannot choose SAs from multiple service resources to a single service resource' + '<br/><br/>' + 'Choose Service Appointments from only one service resource and try again.'); 
                }
                else if(response.getReturnValue()[0] == 'multipleDatesError'){
                   console.log('cacacacaca');
                   component.set('v.FromMultipleDates',true); 
                   component.set('v.FromMultipleDatesError','Cannot initiate transfer'+ '<br/><br/>' +'You cannot transfer SAs from multiple days.'+  '<br/><br/>'+ 'Choose SAs from a single day and try again.'); 
                }
                else if(response.getReturnValue()[0] == 'nonDispatchedStatusError'){
                   component.set('v.NonDispatchedStatus',true); 
                   component.set('v.NonDispatchedStatusError','Cannot initiate transfer'+ '<br/><br/>' + 'Only service appointments in Dispatched status can be transferred.' +'<br/><br/>' +'Select only dispatched Service Appointments and try again.'); 
                }
                else if(response.getReturnValue()[0] == 'moreThan30SAError'){
                   component.set('v.SASizeGreaterThan30',true); 
                   component.set('v.SASizeGreaterThan30Error','Cannot initiate transfer'+ '<br/><br/>' +'You cannot transfer more than 30 service appointments at one time.' + '<br/><br/>'+ 'Select fewer Service Appointments and try again.'); 
                }else if(response.getReturnValue()[0] == 'mustbeaValidServiceresource'){
                   component.set('v.IsInvalidServiceResource',true); 
                   component.set('v.InvalidServiceResourceError','You must choose a valid Service Resource.'); 
                }else{
                    var record = response.getReturnValue()[0];
                    component.set('v.IsSuccess',true);
                    component.set('v.IsSuccessMessage',record);
                }
               console.log('Yaaaay!' + component.get('v.IsSuccessMessage') ); 
            }else if(state == "ERROR"){
               let errors = response.getError();
               let message = 'Unknown Error';
                if(errors && Array.isArray(errors) && errors.length > 0){
                    message = errors[0].message;
                }
                console.log('cowcow'+message);
            }
        })
            $A.enqueueAction(action);       
    }
 })