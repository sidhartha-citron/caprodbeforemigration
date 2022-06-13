({
	selectRecord : function(component,event,helper){
		var getIteration = component.get("v.singleRec");
		component.set("v.oRecord",getIteration);
        console.log('surabhi' + v.oRecord);
         var a = component.get('c.handleComponentEvent');
        $A.enqueueAction(a);

	},
   onfocus : function(component,event,helper){
       $A.util.addClass(component.find("mySpinner"), "slds-show");
        var forOpen = component.find("searchRes");
            $A.util.addClass(forOpen, 'slds-is-open');
            $A.util.removeClass(forOpen, 'slds-is-close');
        // Get Default 5 Records order by createdDate DESC 
         var getInputkeyWord = '';
       helper.searchHelper(component,event,getInputkeyWord);
    },
    onblur : function(component,event,helper){      
        component.set("v.listOfSearchRecords", null );
        var forclose = component.find("searchRes");
        $A.util.addClass(forclose, 'slds-is-close');
        $A.util.removeClass(forclose, 'slds-is-open');
    },
    keyPressController : function(component, event, helper) {
       // get the search Input keyword  
         var getInputkeyWord = component.get("v.SearchKeyWord");
		 console.log('girish' + getInputkeyWord);
       // check if getInputKeyWord size id more then 0 then open the lookup result List and
       // call the helper
       // else close the lookup result List part.  
        if( getInputkeyWord.length > 0 ){
			console.log('prachi' + getInputkeyWord.length);
             var forOpen = component.find("searchRes");
               $A.util.addClass(forOpen, 'slds-is-open');
               $A.util.removeClass(forOpen, 'slds-is-close');
            helper.searchHelper(component,event,getInputkeyWord);
        }
        else{ 
             component.set("v.listOfSearchRecords", null );
             var forclose = component.find("searchRes");
               $A.util.addClass(forclose, 'slds-is-close');
               $A.util.removeClass(forclose, 'slds-is-open');
          }
    },

  // function for clear the Record Selaction
    clear :function(component,event,heplper){
         var pillTarget = component.find("lookup-pill");
         var lookUpTarget = component.find("lookupField");
         $A.util.addClass(pillTarget, 'slds-hide');
         $A.util.removeClass(pillTarget, 'slds-show');
         $A.util.addClass(lookUpTarget, 'slds-show');
         $A.util.removeClass(lookUpTarget, 'slds-hide');
         component.set("v.SearchKeyWord",null);
         component.set("v.listOfSearchRecords", null );
         component.set("v.selectedRecord", {} );  
         component.set("v.recordId", null ); 
    },

  // This function call when the end User Select any record from the result list.  
    handleComponentEvent : function(component, event, helper) {
    // get the selected Account record from the COMPONETN event     
       var selectedAccountGetFromEvent = event.getParam("recordByEvent");
       var selectedId = event.getParam("recordById");
       console.log('Deborah'+selectedId);
       component.set("v.selectedRecord" , selectedAccountGetFromEvent);
       component.set("v.recordId" , selectedId);
        
        var forclose = component.find("lookup-pill");
           $A.util.addClass(forclose, 'slds-show');
           $A.util.removeClass(forclose, 'slds-hide');
        var forclose = component.find("searchRes");
           $A.util.addClass(forclose, 'slds-is-close');
         $A.util.removeClass(forclose, 'slds-is-open');
        var lookUpTarget = component.find("lookupField");
            $A.util.addClass(lookUpTarget, 'slds-hide');
            $A.util.removeClass(lookUpTarget, 'slds-show'); 
    },
    
    transferSA : function(component, event, helper){
        var getSchStartDate = component.get("v.ScheduleStartDate");
        console.log('panda-->' + getSchStartDate);
        var inputCmp = component.find("schStart");
	    var formattedDate = $A.localizationService.formatDate(getSchStartDate, "yyyy-MM-dd"); 
		console.log('pigpig--->' + formattedDate);
        
        var today = new Date();
        var formattedDate2 = $A.localizationService.formatDate(today, "yyyy-MM-dd"); 
        console.log('idiotidiot--->' + formattedDate2);
		
        //Darcy 2021-05-12 7 day max is changing to 13 days https://trello.com/c/PsWFG8tz
		var todayAdd13 = new Date();
		todayAdd13.setDate(todayAdd13.getDate() + 13);
		var formattedDate3 = $A.localizationService.formatDate(todayAdd13, "yyyy-MM-dd"); 
		
        if(formattedDate == '' || formattedDate == 'Invalid Date'){
			component.set('v.IsBlankDateError',true);
            component.set('v.IsBlankDateErrorMessage','You must choose a date');
		}
        else if(formattedDate < formattedDate2 || formattedDate > formattedDate3){
       		console.log('Parrot***');
            component.set('v.HasDateError',true);
            component.set('v.DateErrorMessage','Date cannot be in the past' + '<br/>' + 'Date cannot be beyond 13 days from today');
        }
        else{
                var getSelectedId = component.get("v.customListStr");
                console.log('foxfox'+getSelectedId);
                var getARId = component.get("v.recordId");
                helper.assignRecord(component,event,helper);
        	}     	
    },
    dismissDateError : function(component,event,helper){
    	 component.set('v.HasDateError', false);
         component.set('v.DateErrorMessage', '');
	},
    dismissMultipleResourceError : function(component){
    	component.set('v.FromMultipleResource',false);
    	component.set('v.FromMultipleResourceError','');
	},
    dismissMultipleDatesError : function(component){
        console.log('bababababa');
        component.set('v.FromMultipleDates',false);
    	component.set('v.FromMultipleDatesError','');
    },
     dismissSASizeGreaterThan30 : function(component){
        component.set('v.SASizeGreaterThan30',false);
    	component.set('v.SASizeGreaterThan30Error','');
    },
     dismissNonDispatchedStatusError : function(component){
        component.set('v.NonDispatchedStatus',false);
    	component.set('v.NonDispatchedStatusError','');
    },
    dismissIsSuccessMessage : function(component){
        component.set('v.IsSuccess',false);
    	component.set('v.IsSuccessMessage','');
    },
    dismissInvalidServiceResourceError : function(component){
        component.set('v.IsInvalidServiceResource',false);
    	component.set('v.InvalidServiceResourceError','');
    },
	dismissNullDateError : function(component,event,helper){
    	 component.set('v.IsBlankDateError', false);
         component.set('v.IsBlankDateErrorMessage', '');
	}

})