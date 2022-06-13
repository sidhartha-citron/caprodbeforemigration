({
	injectComponent: function (name, target, component, isPreferenceTab) {
        if(isPreferenceTab) {
            $A.createComponent(name, {
                "recordId": component.get("v.recordId"), 
                "siteSurvey": component.get("v.siteSurvey"), 
                "signatureRequiredFieldOpts" : component.get('v.mainRecord').signatureRequiredFieldOpts,
                "securityRecord": component.get("v.mainRecord.fieldSecurity")
            }, function (contentComponent, status, error) {
                if (status === "SUCCESS") {
                    target.set('v.body', contentComponent);
                } else {
                    throw new Error(error);
                }
            });
        }  else {
            $A.createComponent(name, {
                "siteSurveyId": component.get("v.siteSurveyId"),
                "recordId": component.get("v.recordId"), 
                "securityRecord": component.get("v.mainRecord.fieldSecurity")
            }, function (contentComponent, status, error) {
                if (status === "SUCCESS") {
                    target.set('v.body', contentComponent);
                } else {
                    throw new Error(error);
                }
            });
        }
    }
})