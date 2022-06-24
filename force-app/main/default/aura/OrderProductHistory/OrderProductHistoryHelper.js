({
	getOPHistory : function(component) {
        var action = component.get("c.getOrderProductHistory");
        action.setParams( { "orderId" : component.get( "v.recordId"), "bFilter" : component.get( "v.filterChecked") });
                                   
        action.setCallback(this, function(response) {
            if (response.getState() == "SUCCESS") {
                var pageSize = component.get("v.pageSize");
                component.set("v.OrderItemHistoryData", response.getReturnValue());
                component.set("v.totalRecords", component.get("v.OrderItemHistoryData").length);
                
                var totalPages = Math.ceil(component.get("v.OrderItemHistoryData").length/pageSize);
                if(totalPages > 0) component.set("v.currentPage",1);
                
                component.set('v.totalPages', totalPages);
                component.set("v.startPage",0); 
                component.set("v.endPage",pageSize-1); 
                var PaginationList = [];
                for(var i=0; i< pageSize; i++){
                    if(component.get("v.OrderItemHistoryData").length> i)
                        PaginationList.push(response.getReturnValue()[i]);    
                }
                component.set('v.oihList', PaginationList); 
				
                // component.set('v.isLoading',false); 
				this.toggleSpinner( component); 
            }
            else {
                console.log( 'Init failed');
            }
        });
        $A.enqueueAction(action);
	},
    sortRenderedData: function (component, fieldName, sortDirection) {
        var data = component.get("v.oihList");		// sort the rendered dataset
        var reverse = sortDirection !== 'asc';
        //sorts the rows based on the column header that's clicked
        data.sort(this.sortBy(fieldName, reverse))
        component.set("v.oihList", data);
    },
    sortData: function (component, fieldName, sortDirection) {
        var data = component.get("v.OrderItemHistoryData");  // sort the entire dataset
        var reverse = sortDirection !== 'asc';
        //sorts the rows based on the column header that's clicked
        data.sort(this.sortBy(fieldName, reverse))
        component.set("v.OrderItemHistoryData", data);
        this.first( component);			// reset to page 1.              
        
        this.toggleSpinner( component);
        // component.set('v.isLoading',false);   
    },    
    sortBy: function (field, reverse, primer) {
        var key = primer ?
            function(x) {return primer(x[field])} :
            function(x) {return x[field]};
        //checks if the two rows should switch places
        reverse = !reverse ? 1 : -1;
        return function (a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        }
    },
    
    next : function(component, event){
        var sObjectList = component.get("v.OrderItemHistoryData");
        var end = component.get("v.endPage");
        var start = component.get("v.startPage");     
        var pageSize = component.get("v.pageSize");
        debugger;
        var Paginationlist = [];
        var counter = 0;
        for(var i=end+1; i<end+pageSize+1; i++){
            if(sObjectList.length > i){
                Paginationlist.push(sObjectList[i]);
            }
            counter++ ;
        }
        start+=counter;
        end+=counter;
        
        console.log( 'start: ' + start);
        console.log( 'end: ' + end);   
        console.log( 'counter: ' + counter);
                        
        component.set("v.startPage",start);
        component.set("v.endPage",end);
        component.set('v.oihList', Paginationlist);
        component.set('v.currentPage', Math.ceil(end/pageSize));
    },
    previous : function(component, event){
        var sObjectList = component.get("v.OrderItemHistoryData");
        var end = component.get("v.endPage");
        var start = component.get("v.startPage");
        var pageSize = component.get("v.pageSize");
        var Paginationlist = [];
        var counter = 0;
        for(var i=start-pageSize; i < start ; i++){
            if(i > -1){
                Paginationlist.push(sObjectList[i]);
                counter++;
            }else{
                start++;
            }
        }
        start-=counter;
        end-=counter;
        
        console.log( 'start: ' + start);
        console.log( 'end: ' + end);   
        console.log( 'counter: ' + counter);
                
        component.set("v.startPage",start);
        component.set("v.endPage",end);
        component.set('v.oihList', Paginationlist);
        component.set('v.currentPage', Math.ceil(end/pageSize))
    }, 
    first: function( component) {
        // debugger;
        var sObjectList = component.get("v.OrderItemHistoryData");        
        var pageSize = component.get("v.pageSize");
		var start = 0;
        var end = pageSize-1;
        var PaginationList = [];
        for(var i=0; i<pageSize; i++){
            if(sObjectList.length > i){
                PaginationList.push(sObjectList[i]);
            }
        }
        console.log( 'start: ' + start);
        console.log( 'end: ' + end);   
        //console.log( 'counter: ' + counter);
                
        component.set("v.startPage",start);
        component.set("v.endPage",end);
        component.set('v.oihList', PaginationList);    
        component.set('v.currentPage', 1); 
    },
    last: function( component, event) {
        var sObjectList = component.get("v.OrderItemHistoryData");        
        var pageSize = component.get("v.pageSize");
        var totalRecords = component.get("v.totalRecords");
        var totalPages = component.get("v.totalPages");
		var start = (totalPages-1)*pageSize;
        var counter = 0;

        var PaginationList = [];
        for(var i=start; i<start+pageSize; i++){
            if(sObjectList.length > i){
                PaginationList.push(sObjectList[i]);
            }
            counter++;
        }
        var end = start+counter-1;
        console.log( 'start: ' + start);
        console.log( 'end: ' + end);   
        console.log( 'counter: ' + counter);
                
        component.set("v.startPage",start);
        component.set("v.endPage",end);
        component.set('v.oihList', PaginationList);  
        component.set('v.currentPage', totalPages);        
    },
    toggleSpinner: function (cmp) {
        var spinner = cmp.find("mySpinner");
        $A.util.toggleClass(spinner, "slds-hide");
    } ,
    pageSizeSelect: function( component, event) {
        var pageSize = parseInt( component.get("v.pageSize"));
        component.set( "v.pageSize", pageSize); 	// persist the integer value... lightning:select returns string values
           
        var totalPages = Math.ceil(component.get("v.OrderItemHistoryData").length/pageSize);
        component.set('v.totalPages', totalPages);
    	this.first( component);
    }
  
})