({
    doInit : function(component, event, helper) {
        var action = component.get("c.checkVI");
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                //component.set("v.VIDisplay", response.getReturnValue());
                if (response.getReturnValue() === true){
                                        $A.createComponent("c:StockSummaryVehicleInspection",  {"aura:id" : "VI"}, function(newCmp) {
																if (component.isValid()) {
                                                                    var body = component.get("v.body");
                                                                	body.push(newCmp);
																	component.set("v.body", body);
                                                                }});
                }
                else{
                    $A.createComponent("c:StockSummary",  {"aura:id" : "SS"}, function(newCmp) {
																if (component.isValid()) {
                                                                    var body = component.get("v.body");
                                                                	body.push(newCmp);
																	component.set("v.body", body);
                                                                }});
                }
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(action);
    },
    
	handleVIToggle : function(component, event, helper) {
		var toggle = event.getParam("VIShow");
        if (toggle === false){
            component.set("v.body", '');
        	$A.createComponent("c:StockSummary",  {"aura:id" : "SS"}, function(newCmp) {
			if (component.isValid()) {
            	var body = component.get("v.body");
                body.push(newCmp);
				component.set("v.body", body);
            }});
        }
	}
})