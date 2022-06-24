({
    groupByLocation : function(component, filterRange, helper) {
        
        var rangeInCorrect = component.get("v.filterIncorrect");
        var continueProcess = (filterRange == 'CUSTOM_DATE_FILTER' && !rangeInCorrect) ? true : ((filterRange!='CUSTOM_DATE_FILTER') ? true : false);
        
        if(continueProcess){    
            
            var getLineItems = component.get("c.getWorkOrderItemsGrouped");
            getLineItems.setParams({
                "filter": filterRange,
                "startDate" : component.get("v.startDate"),
                "endDate" : component.get("v.endDate"),
            });  
            
            getLineItems.setCallback(this, function(response) {
                var state = response.getState();
                if (component.isValid() && state === "SUCCESS" && response.getReturnValue()!=null) {
                    var lines = response.getReturnValue();                        
                    $A.util.removeClass(component.find("tableGrouped") , 'slds-hide');
                    console.log(lines);
                    component.set("v.lineItemsGrouped", lines);
                    try{
                        if(lines.length == 0){
                            $A.util.removeClass(component.find("message") , 'slds-hide');
                            $A.util.addClass(component.find("stockSummary") , 'slds-hide');    
                        }else{
                            $A.util.addClass(component.find("message") , 'slds-hide');
                            helper.populateText(component);
                        }
                    }catch(e){
                        $A.util.removeClass(component.find("message") , 'slds-hide');
                        $A.util.addClass(component.find("stockSummary") , 'slds-hide'); 
                    }
                    
                    $A.util.removeClass(component.find("textDiv") , 'slds-hide');
                    $A.util.removeClass(component.find("messageDiv") , 'slds-hide');
                    
                } else {
                    console.log("Failed with state: " + state);
                }
            });
            $A.enqueueAction(getLineItems);
        }        
    },
    
    getTableUngrouped : function(component, filterRange,helper) {
        var rangeInCorrect = component.get("v.filterIncorrect");
        var continueProcess = (filterRange == 'CUSTOM_DATE_FILTER' && !rangeInCorrect) ? true : ((filterRange!='CUSTOM_DATE_FILTER') ? true : false);
        
        if(continueProcess) {
            var lineItemsNotVmi = [], lineItemsVmi = [];
            var getLineItems = component.get("c.getWorkOrderItems");
            
            getLineItems.setParams({
                "filter": filterRange,
                "startDate" : component.get("v.startDate"),
                "endDate" : component.get("v.endDate"),
            }); 
            getLineItems.setCallback(this, function(response) {
                var state = response.getState();
                if (component.isValid() && state === "SUCCESS" && response.getReturnValue()!=null) {
                    for (let i = 0; i < response.getReturnValue().length; i++) {
                        var record = response.getReturnValue()[i];
                        
                        if (record.isVMIProduct) {
                            lineItemsVmi.push(record);
                        } else {
                            lineItemsNotVmi.push(record);
                        }
                    }
                    
                    component.set("v.lineItemsNotVmi", lineItemsNotVmi);
                    component.set("v.lineItemsVmi", lineItemsVmi);
                    
                    $A.util.removeClass(component.find("table") , 'slds-hide');
                    try{
                        if(response.getReturnValue().length == 0){
                            $A.util.removeClass(component.find("message") , 'slds-hide'); 
                            $A.util.addClass(component.find("stockSummary") , 'slds-hide');
                            
                        }else{
                            $A.util.addClass(component.find("message") , 'slds-hide');
                            helper.populateText(component);
                        } 
                    }catch(e){
                        $A.util.removeClass(component.find("message") , 'slds-hide'); 
                        $A.util.addClass(component.find("stockSummary") , 'slds-hide');  
                    }                       
                    $A.util.removeClass(component.find("textDiv") , 'slds-hide');
                    $A.util.removeClass(component.find("messageDiv") , 'slds-hide');
                }
                else {
                    console.log("Failed with state: " + state);
                }
            });
            $A.enqueueAction(getLineItems);
        }
    },
    
    populateDateRange : function(component, filterRange) {
        
        var currDate = new Date();
        var currDay = currDate.getDay();
        var diffStart = currDay - 1 ;
        var diffEnd = 5 - currDay ;
        var Monday = new Date();
        Monday.setDate(currDate.getDate()-diffStart);
        
        var Friday = new Date();
        Friday.setDate(currDate.getDate() + diffEnd);
        var start;
        var end;
        
        if(filterRange == 'Today'){
            
            var monthStart =  ("0" + (currDate.getMonth() + 1)).slice(-2);
            var dayStart =  ("0" + currDate.getDate()).slice(-2);
            
            start = currDate.getFullYear() + "-" + monthStart + "-" + dayStart;
            end = currDate.getFullYear() + "-" + monthStart + "-" + dayStart;
            
        }else if (filterRange == 'This_Week'){
            
            var monthStart =  ("0" + (Monday.getMonth() + 1)).slice(-2);
            var dayStart =  ("0" + Monday.getDate()).slice(-2);
            
            var monthEnd =  ("0" + (Friday.getMonth() + 1)).slice(-2);
            var dayEnd =  ("0" +  Friday.getDate()).slice(-2);
            
            start = Monday.getFullYear() + "-" + monthStart + "-" + dayStart;
            end = Friday.getFullYear() + "-" + monthEnd  + "-" + dayEnd;
            
        }else if (filterRange == 'Next_Week'){
            
            var nextMonday = new Date(Monday);
            nextMonday.setDate(nextMonday.getDate() + 7);
            
            var nextFriday = new Date(Friday);
            nextFriday.setDate(nextFriday.getDate() + 7);
            var monthStart =  ("0" + (nextMonday.getMonth() + 1)).slice(-2);
            var dayStart =  ("0" + nextMonday.getDate()).slice(-2);
            
            var monthEnd =  ("0" + (nextFriday.getMonth() + 1)).slice(-2);
            var dayEnd =  ("0" +  nextFriday.getDate()).slice(-2);
            
            start = nextMonday.getFullYear() + "-" + monthStart + "-" + dayStart ;
            end = nextFriday.getFullYear() + "-" +monthEnd + "-" + dayEnd  ;
            
        } else if(filterRange == 'This_Month'){
            
            var firstDayMonth = new Date(currDate.getFullYear(), currDate.getMonth(), 1);
            var lastDayMonth = new Date(currDate.getFullYear(), currDate.getMonth() + 1, 0); 
            
            var monthStart =  ("0" + (firstDayMonth.getMonth() + 1)).slice(-2);
            
            var monthEnd =  ("0" + (lastDayMonth.getMonth() + 1)).slice(-2);
            var dayEnd =  ("0" +  lastDayMonth.getDate()).slice(-2);
            
            start = firstDayMonth.getFullYear() + "-" + monthStart + "-" + "01";
            end = lastDayMonth.getFullYear() + "-" + monthEnd + "-" + dayEnd ;
        }
        
        component.set("v.compareStartDate", start);
        component.set("v.compareEndDate",end);
        component.set("v.startDate", start);
        component.set("v.endDate", end);
        
    },
    
    populateText : function(component) {
        
        var range = component.get("v.filterRange");    
        var text = (range == 'CUSTOM_DATE_FILTER') ?  '' : range;
        
        if( text==''){
            var monthNames = ["Jan", "Feb", "March", "April", "May", "June",
                              "July", "August", "Sept", "Oct", "Nov", "Dec"];
            var monthNamesFr = ["janv", "févr", "mars", "avril", "mai", "juin",
                              "juil", "août", "sept", "oct", "nov", "déc"];
                        
            var s = new Date(component.get("v.startDate"));
            var start = new Date(s);
            start.setDate(start.getDate()+1);
            
            var e = new Date(component.get("v.endDate"));
            var end = new Date(e);
            end.setDate(end.getDate()+1);
            
            if ($A.get("$Locale.language") == 'fr') {
            	text = start.getDate() + ' ' + monthNamesFr[start.getMonth()] + ' - ' + end.getDate() + ' ' + monthNamesFr[end.getMonth()];
            }
            else {
                text = start.getDate() + ' ' + monthNames[start.getMonth()] + ' - ' + end.getDate() + ' ' + monthNames[end.getMonth()];
            }
        }
        else{
            switch (range) {
              case 'Today':
                text = $A.get("$Label.c.Today")
                break;
              case 'This_Week':
              	text = $A.get("$Label.c.This_Week") 
                break;     
              case 'Next_Week':
                text = $A.get("$Label.c.Next_Week")
                break;
              case 'This_Month':
                text = $A.get("$Label.c.This_Month")
                break;
              default:
                text = text!=null ? text.replace('_',' ') : '';
                break;
            }
            console.log('txt is ' + text);
        }
        
        component.set("v.dateRange" , text);
        $A.util.removeClass(component.find("stockSummary") , 'slds-hide');
        
    }
    
})