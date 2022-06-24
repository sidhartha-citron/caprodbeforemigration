trigger SetServiceTerritoryMemberFields on ServiceTerritoryMember (before insert, before update) {
    Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
    Map<Id, OperatingHours> operatingHours = new Map<Id, OperatingHours>();
    
    for(ServiceTerritoryMember st : Trigger.new) {
        ServiceTerritoryMember oldRec = (Trigger.isInsert ? new ServiceTerritoryMember() : Trigger.oldMap.get(st.Id));
        Boolean shouldTest = st.OperatingHoursId!=null && st.OperatingHoursId!=oldRec.OperatingHoursId && st.ServiceResourceId!=null;
        if(shouldTest) {
            operatingHours.put(st.OperatingHoursId, null);
        }
        if(String.isNotBlank(st.Starting_Location__c)){
            if(st.Starting_Location__c==custSetting.Home_Base_Technician_Picklist_Value__c) {
                st.Home_Base_Technician__c = TRUE;
                st.WareHouse_Technician__c = FALSE;
            } else {
                st.WareHouse_Technician__c = TRUE;
                st.Home_Base_Technician__c = FALSE;
            }
        }
    }
    
    operatingHours = new Map<Id, OperatingHours>([SELECT Id, Operating_Hours_Type__c, TimeZone FROM OperatingHours WHERE Id IN:operatingHours.keySet()]);
    
    if(!operatingHours.isEmpty()) {
        for(ServiceTerritoryMember st : Trigger.new) {
            ServiceTerritoryMember oldRec = (Trigger.isInsert ? new ServiceTerritoryMember() : Trigger.oldMap.get(st.Id));
            
            OperatingHours oh = operatingHours.get(st.OperatingHoursId); 
            if(oh!=null && oh.Operating_Hours_Type__c!=custSetting.Operating_Hours_Type_Employee__c) {
                st.addError('Please make sure you only add Operating Hours of Type Employee Operating Hours to a Service Territory Member associated to a Service Resource');
            }
        }
    }
}