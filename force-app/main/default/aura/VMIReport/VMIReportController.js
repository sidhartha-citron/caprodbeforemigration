({
    doInit : function(component, event, helper) {
        //Initialize 
        component.set("v.isFilterDisable",true);
        helper.getCurDate(component);
    },
    
    handlePFChange: function(component, event, helper) {
        var selOptVal = event.getParam("value");
        console.log(selOptVal);
        if(selOptVal=='Custom'){
            component.set("v.isFilterDisable",false);
            helper.getCurDate(component);
        } else {
            component.set("v.isFilterDisable",true);
            helper.populateDateRange(component, selOptVal);
        }
    },
    
    applyFilters : function(component, event, helper) {
        $A.util.removeClass(component.find("spinner"),'slds-hide');
        component.set("v.pyLoad",null);
        component.set("v.lineItems", null);
        var lblVal = component.find("HIDE").get("v.value");
        if(lblVal != 'SHOW'){
            component.find("HIDE").set("v.value","SHOW");
            component.find("HIDE").set("v.label","Hide Details");
            component.set("v.isDetails",true);
        }
        helper.getReportData(component);
    },
    
    HideDetails : function(component,even,helper) {
        var lblVal = component.find("HIDE").get("v.value");
        if(lblVal == 'SHOW'){
            component.find("HIDE").set("v.value","HIDE");
            component.find("HIDE").set("v.label","Show Details");
            component.set("v.isDetails",false);
            var sumPyLoad = component.get("v.pyLoad.summaryPayLoad");
            component.set("v.lineItems", sumPyLoad);
        } else {
            component.find("HIDE").set("v.value","SHOW");
            component.find("HIDE").set("v.label","Hide Details");
            component.set("v.isDetails",true);
            var dtlPyLoad = component.get("v.pyLoad.detailPayLoad");
            component.set("v.lineItems", dtlPyLoad);
        }
    },
    
    printHandler : function(component, event, helper) {
        var pdfLink = "/apex/VMIStockSummaryReport?";
        var fltr=component.find("preFilter").get("v.value");
        pdfLink = pdfLink + "fltr=" + fltr;
        var dtStart=component.find("stDate").get("v.value");
        pdfLink = pdfLink + "&dtStart=" + dtStart;
        var dtEnd=component.find("enDate").get("v.value");
        pdfLink = pdfLink + "&dtEnd=" + dtEnd;
        var strWoli=component.find("txtWoli").get("v.value");
        pdfLink = pdfLink + "&Woli=" + strWoli;
        var strTer=component.find("txtSrvTer").get("v.value");
        pdfLink = pdfLink + "&Ter=" + strTer;
        var strRes=component.find("txtResource").get("v.value");
        pdfLink = pdfLink + "&Res=" + strRes;
        var strStatus=component.find("saStatus").get("v.value");
        pdfLink = pdfLink + "&Status=" + strStatus;
        var strDtls=component.get("v.isDetails");
        pdfLink = pdfLink + "&isDtls=" + strDtls;
        window.open(pdfLink,"_blank");
	},
    
    waiting: function(component, event, helper) {
        $A.util.removeClass(component.find("spinner") , 'slds-hide');
 	},
 
    doneWaiting: function(component, event, helper) {
        $A.util.addClass(component.find("spinner") , 'slds-hide');
 	}
    
})