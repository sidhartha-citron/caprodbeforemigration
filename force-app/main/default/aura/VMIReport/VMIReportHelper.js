({
	populateDateRange : function(component, filterRange) {
        
        var currDate = new Date();
        var currDay = currDate.getDay();
        var diffStart = currDay - 1;
        var diffEnd = 5 - currDay;
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
            
        } else if(filterRange == 'Tomorrow'){
            var tmrw = new Date();
            tmrw.setDate(currDate.getDate() + 1);
            var monthStart =  ("0" + (tmrw.getMonth() + 1)).slice(-2);
            var dayStart =  ("0" + tmrw.getDate()).slice(-2);
            start = tmrw.getFullYear() + "-" + monthStart + "-" + dayStart;
            end = tmrw.getFullYear() + "-" + monthStart + "-" + dayStart;
        }
        else if (filterRange == 'This_Week'){
            
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
        component.find("stDate").set("v.value",start);
        component.find("enDate").set("v.value",end);
    },
    
    getCurDate : function(component){
        var dt = new Date();
        var mm =  ("0" + (dt.getMonth() + 1)).slice(-2);
        var dd =  ("0" + dt.getDate()).slice(-2);
        var today = dt.getFullYear() + "-" + mm + "-" + dd;
        component.find("stDate").set("v.value",today);
        component.find("enDate").set("v.value",today);
    },
    
    getReportData: function (component){
    	var getLineItems = component.get("c.getWorkOrderItems");
        var sDate = component.find("stDate").get("v.value");
        var eDate = component.find("enDate").get("v.value")
        if(sDate > eDate){
            this.showMessageDialog(component,"Start Date cannot be greater than End Date");
            return;
        } else {
            this.hideMessageDialog(component);
        }
        getLineItems.setParams({
                "filter" : component.find("preFilter").get("v.value"),
                "dtStart" : component.find("stDate").get("v.value"),
                "dtEnd" : component.find("enDate").get("v.value"),
            	"strWoli": component.find("txtWoli").get("v.value"),
            	"strTer": component.find("txtSrvTer").get("v.value"),
            	"strRes": component.find("txtResource").get("v.value"),
            	"strStatus" : component.find("saStatus").get("v.value"),
        });
        getLineItems.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                console.log(response.getReturnValue());
                if(response.getReturnValue()!=null) {
                    this.hideMessageDialog(component);
                    
                    component.set("v.pyLoad",response.getReturnValue());
                    var detailPayLoad = component.get("v.pyLoad.detailPayLoad");
                    component.set("v.lineItems", detailPayLoad);
                    var errMsg = component.get("v.pyLoad.strMessage");
                    console.log('Success Error:' + errMsg);
                    if(errMsg!=''){
                       this.showMessageDialog(component,errMsg); 
                    }
                } else {
                   	this.showMessageDialog(component,"No records found. Please select a different filter criteria.");
                }
            } else {
                component.set("v.pyLoad",null);
                component.set("v.lineItems",null);
                this.showMessageDialog(component,"Failed to load:" + state);
                console.log("Error Report: " + state);
            }
        });
        $A.enqueueAction(getLineItems);
	},
    
    showMessageDialog : function(component, strMsg){
        component.find("HIDE").set("v.disabled",true); 
        component.find("PRINT").set("v.disabled",true); 
        component.set("v.isshowError",true);
        component.set("v.showMessage",strMsg);
        $A.util.addClass(component.find("spinner"),'slds-hide');
    },
    
    hideMessageDialog : function (component){
    	component.find("HIDE").set("v.disabled",false);
        component.find("PRINT").set("v.disabled",false); 
        component.set("v.isshowError",false);
        component.set("v.showMessage","");
        $A.util.addClass(component.find("spinner"),'slds-hide');
	}
    
})