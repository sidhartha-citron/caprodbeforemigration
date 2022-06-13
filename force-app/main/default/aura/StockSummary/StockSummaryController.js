({
    doInit: function(component, event, helper) {
        
        //set filter Range to today
        component.set("v.filterRange", 'Today');
        component.set("v.dateRange" , $A.get("$Label.c.Today"));
        component.set("v.compareStartDate", new Date());
        component.set("v.compareEndDate", new Date());
        
        var currDate = new Date();
        var monthStart =  ("0" + (currDate.getMonth() + 1)).slice(-2);
        var dayStart =  ("0" + currDate.getDate()).slice(-2);
            
        var start = currDate.getFullYear() + "-" + monthStart + "-" + dayStart;
        var end = currDate.getFullYear() + "-" + monthStart + "-" + dayStart;
        
        component.set("v.startDate", start);
        component.set("v.endDate", end);

      
        $A.util.addClass(component.find("TODAY") , 'slds-button_brand');
        
        // get columns
        var initColumns = component.get("c.getColumns");
        initColumns.setParams({
            "columnAPINames": component.get("v.columnAPINames")
        });   
        initColumns.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue()!=null ) {
                console.log(response.getReturnValue());
                component.set("v.columns", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(initColumns);
        
        var initVmiColumns = component.get("c.getVmiTableColumns");
        initVmiColumns.setParams({
            "columnVmiAPINames": component.get("v.columnVmiAPINames")
        });   
        initVmiColumns.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue()!=null ) {
                console.log(response.getReturnValue());
                component.set("v.vmiColumns", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(initVmiColumns);
        
        //get line items
        var getLineItems = component.get("c.getWorkOrderItems");
        getLineItems.setParams({
            "filter": "Today"
        });   
        getLineItems.setCallback(this, function(response) {
            var state = response.getState();
            var lineItemsNotVmi = [], lineItemsVmi = [];
            
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue()!=null ) {
                for (let i = 0; i < response.getReturnValue().length; i++) {
                    var record = response.getReturnValue()[i];
                    
                    console.log(record);
                }
                
                console.log(response.getReturnValue());
                
                component.set("v.lineItemsNotVmi", response.getReturnValue());
                 
                 if(response.getReturnValue().length === 0 ){
                    $A.util.removeClass(component.find("message") , 'slds-hide');
                    $A.util.addClass(component.find("stockSummary") , 'slds-hide');                        
                 }else{
                    $A.util.addClass(component.find("message") , 'slds-hide');
                    $A.util.removeClass(component.find("stockSummary") , 'slds-hide');    
                 }
                
            } else {
                $A.util.addClass(component.find("message") , 'slds-hide');
                $A.util.removeClass(component.find("stockSummary") , 'slds-hide');  
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(getLineItems);

    },
        
    filterTable : function(component, event, helper){
        
        var source = event.getSource();
        var filterRange = source.get("v.value");
        var locationFilter = component.get("v.groupByLocation");
        var prevPressed = component.get("v.filterRange");    
                    
        $A.util.removeClass(component.find(prevPressed) , 'slds-button_brand');        
        $A.util.addClass(component.find(filterRange) , 'slds-button_brand');   	
        
        //prepopulate dates in date field
		helper.populateDateRange(component, filterRange);
        component.set("v.filterRange", filterRange);

       },

    
    handleChangeDate : function(component, event, helper){
        var sDate = component.get("v.startDate");
        var eDate = component.get("v.endDate");
   
        var startDate = component.get("v.startDate");
        var endDate = component.get("v.endDate");
        var inputDate = component.find("endDateInput");
        
        //check for date validation
        if (startDate!=null && endDate!=null && startDate!='' && endDate!='') {
           
            if (startDate > endDate){
                inputDate.set("v.errors", [{message:$A.get("$Label.c.Error_Message_Invalid_Date")}]);
                component.set("v.filterIncorrect", true);
            }
            else{
               inputDate.set("v.errors", [{message:null}]);
               component.set("v.filterIncorrect", false);
            }      
        }
        else{
           component.set("v.filterIncorrect", false);
           inputDate.set("v.errors", [{message:''}]);
        }
        
        var compareStart = component.get("v.compareStartDate");
        var compareEnd = component.get("v.compareEndDate");
        var startSame = startDate!=null && startDate!='' ? startDate === compareStart : false;
        var endSame = endDate!=null && endDate!='' ?  endDate === compareEnd :  false ;
        
        //check if range was updated manually or dynamic, if manually, 
        //neutralize the previously pressed filter button
        var firstTime = component.get("v.firstTime");
        if(firstTime >= 2){        
            if( (startSame == false || endSame == false)){
              var prevPressed = component.get("v.filterRange");
              $A.util.removeClass(component.find(prevPressed) , 'slds-button_brand');
              component.set("v.filterRange",'CUSTOM_DATE_FILTER');
            }
        }
        else{
            component.set("v.firstTime", firstTime + 1);
        }
                
    },

    checkBox : function(component, event, helper) {    
        
            var groupBy = component.get("v.groupByLocation");
            if(groupBy){
               component.set("v.groupByLocation", false);
               $A.util.removeClass(component.find("GROUP_BY_LOCATION") , 'slds-button_brand');
            }
            else{
               component.set("v.groupByLocation", true);
               $A.util.addClass(component.find("GROUP_BY_LOCATION") , 'slds-button_brand');
            }                    

   },
   
    toggleFilters : function(component, event, helper) {

        var filterHidden = component.get("v.filterHidden");
        var groupedTable = component.get("v.groupByLocation");
        
        if(filterHidden){
            $A.util.removeClass(component.find("filters") , 'slds-hide');
            component.set("v.filterHidden",false);
            
            if(groupedTable){
             $A.util.addClass(component.find("tableGrouped") , 'slds-hide');
            }
            else{
             $A.util.addClass(component.find("table") , 'slds-hide');
            }
            
           $A.util.addClass(component.find("textDiv") , 'slds-hide');
           $A.util.addClass(component.find("messageDiv") , 'slds-hide');

        }
        else{
          $A.util.addClass(component.find("filters") , 'slds-hide');
		  component.set("v.filterHidden",true);
           if(groupedTable){
             $A.util.removeClass(component.find("tableGrouped") , 'slds-hide');
            }
            else{
             $A.util.removeClass(component.find("table") , 'slds-hide');
            }
            
           $A.util.removeClass(component.find("textDiv") , 'slds-hide');
           $A.util.removeClass(component.find("messageDiv") , 'slds-hide');

        }

    },
    
    openSection : function(component, event, helper) {
        var source = event.getSource();
        var section = source.get("v.label");
        var closed = source.get("v.value");
        
        var s = document.getElementById(section);
        
        if(closed){
             source.set("v.iconName","utility:chevrondown");
             source.set("v.value", false);
             $A.util.addClass(s , 'slds-is-open');
        }
        else{
           source.set("v.iconName","utility:chevronright");
           source.set("v.value", true);
           $A.util.removeClass(s , 'slds-is-open');
        }

    },
    
    
    openGroupedSection : function(component, event, helper) {
        var source = event.getSource();
        var section = source.get("v.label");
        var closed = source.get("v.value");
        
        var s = document.getElementById(section);
        console.log('section is ' + section);
        console.log('s is ' + s);

        if(closed){
             console.log('section is ' + s);
             source.set("v.iconName","utility:chevronright");
             source.set("v.value", false);
             $A.util.addClass(s , 'slds-hide');
        }
        else{
           source.set("v.iconName","utility:chevrondown");
           source.set("v.value", true);
           $A.util.removeClass(s , 'slds-hide');
        }

    },
    
    applyFilters : function(component, event, helper) {
        
        $A.util.addClass(component.find("filters") , 'slds-hide');
		component.set("v.filterHidden",true); 
        $A.util.addClass(component.find("textDiv") , 'slds-hide');
        
        var checked = component.get("v.groupByLocation");
        var range = component.get("v.filterRange");    
        
        if(checked){                           
            helper.groupByLocation(component, range,helper);
        }
        else{                                        
            helper.getTableUngrouped(component,range,helper);                                     
        }         
    },
    
   waiting: function(component, event, helper) {
        $A.util.removeClass(component.find("spinner") , 'slds-hide');
    	//document.getElementById("spinner").style.display = "block";
 	},
 
   doneWaiting: function(component, event, helper) {
        $A.util.addClass(component.find("spinner") , 'slds-hide');
   		//document.getElementById("spinner").style.display = "none";
 	}
    
})