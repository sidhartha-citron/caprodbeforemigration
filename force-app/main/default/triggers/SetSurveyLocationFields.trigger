trigger SetSurveyLocationFields on Survey_Location__c(before insert) {
    Map<String, Decimal> siteSurveyIds = new Map<String, Decimal>();
    for(Survey_Location__c sl : Trigger.new) {
        siteSurveyIds.put(sl.Site_Survey__c, null);
    }

    for (Site_Survey__c SiteSurvey : [SELECT Id, (SELECT Service_Order__c FROM Survey_Rooms__r ORDER BY Service_Order__c DESC NULLS LAST LIMIT 1) FROM Site_Survey__c WHERE ID IN: siteSurveyIds.keySet()]){
        if (!SiteSurvey.Survey_Rooms__r.isEmpty() && SiteSurvey.Survey_Rooms__r[0].Service_Order__c != null){                
            siteSurveyIds.put(SiteSurvey.Id, Math.max(SiteSurvey.Survey_Rooms__r[0].Service_Order__c, 0));
    	}        
    }
    
    for(Survey_Location__c sl : Trigger.new) {
        Decimal serviceOrder = siteSurveyIds.get(sl.Site_Survey__c) != null ? siteSurveyIds.get(sl.Site_Survey__c) + 1 : 1;
        sl.Quantity_of_Allocated_Products__c = 0;
        //Begin:Shashi:8-12-2019:Service Order bug:set order when it's empty
        System.debug('~~Service Order~~' + sl.Service_Order__c);
        if(sl.Service_Order__c==null){sl.Service_Order__c = serviceOrder;siteSurveyIds.put(sl.Site_Survey__c, serviceOrder++);}
        else{siteSurveyIds.put(sl.Site_Survey__c, sl.Service_Order__c);}
        //End
        
        
        //updated Oct 9, 2018 to not override the name if one is already provided [dk]
        if (String.isBlank(sl.Name)) {
            sl.Name = SurveyAssetAllocationController.buildLocationName(sl);
        }
    }
}