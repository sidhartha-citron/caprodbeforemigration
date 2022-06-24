public class AssignResourceTriggerHandler extends TriggerHandler{
    
    public AssignResourceTriggerHandler(){
        this.setMaxLoopCount(20);
    }
    
    //Before delete because the status and dates on SA gets erased when AR id deleted.
    public override void beforeDelete() {
        TrackAssignResource((List<AssignedResource>)Trigger.new,(List<AssignedResource>) Trigger.old,(Map<Id,AssignedResource>)Trigger.oldMap,'Delete');
    }
    
    public override void afterUpdate() {
        TrackAssignResource((List<AssignedResource>) Trigger.new,(List<AssignedResource>) Trigger.old,(Map<Id,AssignedResource>)Trigger.oldMap,'Update'); 
        System.debug('**AFTER UPDATE**');
        UpdateServiceResourceOnSA((List<AssignedResource>)Trigger.new,(List<AssignedResource>) Trigger.old,'Update');
        System.debug('**UpdateServiceResourceOnSA**');
    }
    
    public override void afterInsert() {
        System.debug('**AFTER INSERT**');
        TrackAssignResource((List<AssignedResource>)Trigger.new,(List<AssignedResource>) Trigger.old,(Map<Id,AssignedResource>)Trigger.oldMap,'Insert');
        System.debug('**AFTER HIS**');
        UpdateServiceResourceOnSA((List<AssignedResource>)Trigger.new,(List<AssignedResource>) Trigger.old,'Insert');
        handleAssignedResourceAfterInsert((List<AssignedResource>)Trigger.New);
    }
    public override void afterDelete() {
        UpdateServiceResourceOnSA((List<AssignedResource>)Trigger.new,(List<AssignedResource>) Trigger.old,'Delete');
    }
    /*  Author: Aieleeta
        Purpose : To track Service Resource assignment on Service Appointment */
    public static void TrackAssignResource(List<AssignedResource> listAssignedResource,List<AssignedResource> oldListAssignedResource, Map<Id,AssignedResource> oldMap, String Event){
        
        Set<Id> setOldAssignedResourceIds = new Set<Id>();
        Map<Id,ServiceResource> MapOldServiceResource = new map<Id,ServiceResource>();
        Map<Id,ServiceAppointment> MapOldServiceAppointment = new map<Id,ServiceAppointment>();
        List<Assign_Resource_History__c> listAssignedResourceHistory = new List<Assign_Resource_History__c>();
        Set<id> ServiceAppointmentIds = new Set<Id>();
        Set<Id> setAssignedResourceIds = new Set<Id>();
        Set<Id> setOldServiceResourceIds = new Set<Id>();
        Map<Id,ServiceAppointment> MapServiceAppointment = new Map<Id,ServiceAppointment>();
        Map<Id,ServiceResource> MapServiceResource = new Map<Id,ServiceResource>();
        Map<Id,ServiceResource> MapOldServiceResourceRemove = new map<Id,ServiceResource>();
        
        
        /** For updating SA**/
        Set<Id> setSAIds = new Set<Id>();
        Map<Id,String> mapSAToSRName = new Map<Id,String>();
        List<ServiceAppointment> listSAToUpdate = new List<ServiceAppointment>();
        
        
        if(Event == 'Delete'){
            for(AssignedResource ar : oldListAssignedResource){
                setOldAssignedResourceIds.add(ar.id);
                setSAIds.add(ar.ServiceAppointmentId);//TO HOLD SA IDS FOR UPDATE
            }
            /**FOR INSERTING ASSIGN HISTORY RECORDS**/          
            // FOR OLD RECORD VALUES
            
            //changed to check for empty [dk]
            if (!setOldAssignedResourceIds.isEmpty()) {
                for(AssignedResource ar : [Select ServiceResourceId,ServiceResource.name,ServiceAppointmentId,ServiceAppointment.SchedEndTime,ServiceAppointment.SchedStartTime,ServiceAppointment.Status from AssignedResource where id in : setOldAssignedResourceIds ALL ROWS]){
                    
                    MapOldServiceAppointment.put(ar.ServiceAppointmentId,new ServiceAppointment(Id = ar.ServiceAppointmentId,SchedStartTime = ar.ServiceAppointment.SchedStartTime,
                                                                                                SchedEndTime = ar.ServiceAppointment.SchedEndTime,Status = ar.ServiceAppointment.Status
                                                                                               ));
                    
                    MapOldServiceResource.put(ar.ServiceResourceId,new ServiceResource(id = ar.ServiceResourceId,Name = ar.ServiceResource.Name));              
                } 
            }           
            
            for(AssignedResource ar : oldListAssignedResource){
                Assign_Resource_History__c arh = new Assign_Resource_History__c();
                arh.Event__c = 'Removed';
                arh.Service_Appointment__c = ar.ServiceAppointmentId;
                arh.Service_Appointment_Id__c = ar.ServiceAppointmentId;
                arh.Service_Resource_Id__c = MapOldServiceResource.get(ar.ServiceResourceId).Id;
                arh.Resource_Name__c = MapOldServiceResource.get(ar.ServiceResourceId).name;
                arh.SchedStartTime__c = MapOldServiceAppointment.get(ar.ServiceAppointmentId).SchedStartTime;
                arh.SchedEndTime__c = MapOldServiceAppointment.get(ar.ServiceAppointmentId).SchedEndTime;
                arh.Service_Appointment_Status__c = MapOldServiceAppointment.get(ar.ServiceAppointmentId).Status;
                arh.Date__c = System.Now();
                listAssignedResourceHistory.add(arh);               
            }
        }
        else{
            
            for(AssignedResource ar : listAssignedResource){
                setAssignedResourceIds.add(ar.Id);
                if(Event == 'Update'){
                    setOldServiceResourceIds.add(oldMap.get(ar.id).ServiceResourceId);
                }
                setSAIds.add(ar.ServiceAppointmentId);
            }
            
            //FOR CURRENT RECORD VALUES
            //changed to check for empty [dk]
            if (!setAssignedResourceIds.isEmpty()) {
                for(AssignedResource ar : [Select Id,ServiceAppointmentId,ServiceAppointment.SchedStartTime,ServiceAppointment.SchedEndTime                             ,ServiceAppointment.Status,ServiceResourceId,ServiceResource.Name from AssignedResource where id in : setAssignedResourceIds]){ 
                    
                    MapServiceAppointment.put(ar.ServiceAppointmentId,new ServiceAppointment(Id = ar.ServiceAppointmentId,SchedStartTime = ar.ServiceAppointment.SchedStartTime,
                                                                                             SchedEndTime = ar.ServiceAppointment.SchedEndTime,Status = ar.ServiceAppointment.Status
                                                                                            ));
                    
                    MapServiceResource.put(ar.ServiceResourceId,new ServiceResource(id = ar.ServiceResourceId,Name = ar.ServiceResource.Name));
                    
                    // THIS IS FOR UPDATING SA
                    if(mapSAToSRName.containsKey(ar.ServiceAppointmentId)){
                        mapSAToSRName.put(ar.ServiceAppointmentId,mapSAToSRName.get(ar.ServiceAppointmentId) +','+ar.ServiceResource.Name);
                    }else{
                        mapSAToSRName.put(ar.ServiceAppointmentId,ar.ServiceResource.Name);
                    }                                       
                }
            }
            if(Event == 'Update'){ // To get the previous service resource's name
                //changed to check for empty [dk]
                if (!setOldServiceResourceIds.isEmpty()) {
                    for(ServiceResource sr : [Select Id,name from ServiceResource where id in : setOldServiceResourceIds]){
                        MapOldServiceResourceRemove.put(sr.id,new ServiceResource(Id= sr.id,name = sr.name));
                    }
                }
            }
            
            for(AssignedResource ar : listAssignedResource){
                if(Event == 'Insert'){
                    Assign_Resource_History__c arh = new Assign_Resource_History__c();
                    arh.Event__c = 'Assigned';
                    arh.Resource_Name__c = MapServiceResource.get(ar.ServiceResourceId).Name;
                    arh.SchedStartTime__c = MapServiceAppointment.get(ar.ServiceAppointmentId).SchedStartTime;
                    arh.SchedEndTime__c = MapServiceAppointment.get(ar.ServiceAppointmentId).SchedEndTime;
                    arh.Service_Appointment_Status__c = MapServiceAppointment.get(ar.ServiceAppointmentId).Status;
                    arh.Date__c = System.Now();
                    arh.Service_Appointment__c = ar.ServiceAppointmentId;
                    arh.Service_Resource_Id__c = MapServiceResource.get(ar.ServiceResourceId).Id;
                    arh.Service_Appointment_Id__c = ar.ServiceAppointmentId;
                    listAssignedResourceHistory.add(arh);
                    
                }
                if(Event == 'Update'){
                    
                    if(ar.ServiceResourceId != oldMap.get(ar.Id).ServiceResourceId){
                        
                        Assign_Resource_History__c arhRemove = new Assign_Resource_History__c();
                        Assign_Resource_History__c arhAssign = new Assign_Resource_History__c();
                        
                        arhRemove.Event__c = 'Removed';
                        arhRemove.Resource_Name__c = MapOldServiceResourceRemove.get(oldMap.get(ar.Id).ServiceResourceId).Name;
                        arhRemove.Date__c = System.Now();
                        arhRemove.SchedStartTime__c = MapServiceAppointment.get(ar.ServiceAppointmentId).SchedStartTime;
                        arhRemove.SchedEndTime__c = MapServiceAppointment.get(ar.ServiceAppointmentId).SchedEndTime;
                        arhRemove.Service_Appointment_Status__c = MapServiceAppointment.get(ar.ServiceAppointmentId).Status;
                        arhRemove.Service_Appointment__c = ar.ServiceAppointmentId;
                        arhRemove.Service_Resource_Id__c = MapOldServiceResourceRemove.get(oldMap.get(ar.Id).ServiceResourceId).Id;
                        arhRemove.Service_Appointment_Id__c = ar.ServiceAppointmentId;
                        
                        arhAssign.Event__c = 'Assigned';
                        arhAssign.Date__c = System.Now();
                        arhAssign.Resource_Name__c = MapServiceResource.get(ar.ServiceResourceId).Name;
                        arhAssign.SchedStartTime__c = MapServiceAppointment.get(ar.ServiceAppointmentId).SchedStartTime;
                        arhAssign.SchedEndTime__c = MapServiceAppointment.get(ar.ServiceAppointmentId).SchedEndTime;
                        arhAssign.Service_Appointment_Status__c = MapServiceAppointment.get(ar.ServiceAppointmentId).Status;
                        arhAssign.Service_Appointment__c = ar.ServiceAppointmentId;
                        arhAssign.Service_Resource_Id__c = MapServiceResource.get(ar.ServiceResourceId).Id;
                        arhAssign.Service_Appointment_Id__c = ar.ServiceAppointmentId;
                        
                        listAssignedResourceHistory.add(arhRemove);
                        listAssignedResourceHistory.add(arhAssign);                                                    
                    }
                }
                
            }           
        }
        insert listAssignedResourceHistory;
        
    }
    /*  Author : Aieleeta
        Purpose: To stamp Serviced_By__c and License_Number__c on SA*/
    public static void UpdateServiceResourceOnSA(List<AssignedResource> listAssignedResource,List<AssignedResource> oldListAssignedResource,String Event){
        
        Set<Id> setSAIds = new Set<Id>();
        Map<Id,ServiceResource> mapSAToSRName = new Map<Id,ServiceResource>();
        List<ServiceAppointment> listSAToUpdate = new List<ServiceAppointment>();
        
        if(Event != 'Delete'){
            for(AssignedResource ar : listAssignedResource){                    
                setSAIds.add(ar.ServiceAppointmentId);
            }
        }else{
            for(AssignedResource ar : oldListAssignedResource){
                setSAIds.add(ar.ServiceAppointmentId);//TO HOLD SA IDS FOR UPDATE
            }
        } 
        
        if(!setSAIds.isEmpty()){
            for(AssignedResource ar : [SELECT Id,ServiceAppointmentId,CreatedDate,ServiceAppointment.Serviced_By__c,ServiceAppointment.SchedStartTime,
                                       ServiceAppointment.SchedEndTime,ServiceAppointment.Status,ServiceResourceId,ServiceResource.Name,
                                       ServiceResource.License_Number__c 
                                       FROM AssignedResource 
                                       WHERE ServiceAppointmentId IN : setSAIds ORDER BY CreatedDate ASC]){
                                           
                                           mapSAToSRName.put(ar.ServiceAppointmentId, new ServiceResource(
                                                                                        Id = ar.ServiceResourceId,
                                                                                        Name = ar.ServiceResource.Name,
                                                                                        License_Number__c = ar.ServiceResource.License_Number__c ));
                                           
                                       }
        }
        if(mapSAToSRName.size() != null){
            for(ServiceAppointment sa : [SELECT Id, Serviced_By__c, License_Number__c FROM ServiceAppointment WHERE Id IN : mapSAToSRName.keySet()]){
                sa.Serviced_By__c = mapSAToSRName.get(sa.Id).Name;
                sa.License_Number__c = mapSAToSRName.get(sa.Id).License_Number__c;
                listSAToUpdate.add(sa);
            }
        }
        if(Event == 'Delete'){
            for(ServiceAppointment sa : [SELECT Id, Serviced_By__c, License_Number__c FROM ServiceAppointment WHERE Id IN : setSAIds]){
                if (mapSAToSRName.containsKey(sa.Id) == false) {
                    sa.Serviced_By__c = '';
                    sa.License_Number__c = '';
                    listSAToUpdate.add(sa);
                }
            }   
        }
        //changed to check for empty [dk]
        if (!listSAToUpdate.isEmpty()) {
        	update listSAToUpdate;
        }
        
    }
    
    /**
     * Takes the ServiceAppointment records that just received a resource, and are flagged as Pest Emergency (Multi-Res) and flags the record as receiving a resource (case 21618)
     */
    public static void handleAssignedResourceAfterInsert(List<AssignedResource> assignedResources) {
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        
        /*List<AssignedResource> assignedResources = Trigger.isInsert
            ? Trigger.New
            : Trigger.Old;*/
        
        Map<Id, ServiceAppointment> serviceAppointmentMap = new Map<Id, ServiceAppointment>();
        Set<Id> saIds = new Set<Id>();
        
        for (AssignedResource res : assignedResources) {
            saIds.add(res.ServiceAppointmentId);
        }
        
        saIds.remove(null);
        
        if (!saIds.isEmpty()) {
            for (ServiceAppointment sa : [SELECT Id, Has_Resource_Assigned__c, DurationType, ParentRecordId, (SELECT Id FROM ServiceResources) FROM ServiceAppointment WHERE Id IN :saIds AND Is_Pest_Emergency__c = TRUE]) {
                sa.Has_Resource_Assigned__c = sa.ServiceResources.size() > 0;//note: if this trigger becomes expanded upon this will require being more flushed out
                sa.DurationType = dataSets.Duration_Type_Minutes__c;//GetCandidates defaults to Hours
        		System.debug('**STATUS**' + sa.Id);
                serviceAppointmentMap.put(sa.Id, sa);
            }
        
            update serviceAppointmentMap.values();
        }
    }
}