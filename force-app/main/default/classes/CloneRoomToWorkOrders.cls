public class CloneRoomToWorkOrders {
    
    @AuraEnabled
    public static List<String> cloneRoom(String recordId) {
        Set<Id> saIds = new Set<Id>();
        List<Work_Order_Room__c> workOrderRooms = new List<Work_Order_Room__c>();
        Map<Id, WorkOrder> workOrders = new Map<Id, WorkOrder>();
        
        List<String> response = new List<String>{'', '', ''};
        
        Id loggedInUserId = UserInfo.getUserId();
        
        if(recordId!=null) {
            System.debug('>>Apex Controller for Cloning Room: ' + recordId);
            
            try {
                Datetime todaysDate = System.now();
                
                Survey_Location__c sl = [SELECT Id, Account__c, Building__c, Floor__c, Location_SubType__c, Location_Type__c, Notes__c, Site_Survey__c, Site_Survey__r.Account__c, Name 
                                         FROM Survey_Location__c WHERE Id=:recordId];
                
                if(sl!=null) {
                    ServiceResource resourceRecord = [SELECT Id, (SELECT ServiceAppointmentId FROM ServiceAppointments) FROM ServiceResource WHERE RelatedRecordId=:loggedInUserId 
                                                      AND ResourceType='T' AND IsActive=TRUE LIMIT 1];
                    
                    if(resourceRecord!=null && !resourceRecord.ServiceAppointments.isEmpty()) {
                        for(AssignedResource ar : resourceRecord.ServiceAppointments) {
                            saIds.add(ar.ServiceAppointmentId);
                        }
                        
                        for(ServiceAppointment sa : [SELECT Id, ParentRecordId, ParentRecordType, EarliestStartTime, DueDate, AccountId, IsInProgress__c
                                                     FROM ServiceAppointment WHERE Id IN :saIds 
                                                     AND EarliestStartTime <=TODAY AND DueDate >=TODAY AND AccountId=:sl.Site_Survey__r.Account__c 
                                                     AND ParentRecordType='WorkOrder' AND IsInProgress__c=TRUE])
                        {
                            workOrders.put(sa.ParentRecordId, null);
                        }
                        workOrders.remove(null);
                        
                        workOrders = new Map<Id, WorkOrder>([SELECT Id, StartDate, EndDate, (SELECT Id, Survey_Location__c FROM Work_Order_Rooms__r WHERE Survey_Location__c=:sl.Id) 
                                                                          FROM WorkOrder WHERE Id IN :workOrders.keySet() AND AccountId=:sl.Site_Survey__r.Account__c]);
                    }
                    
                    if(!workOrders.isEmpty()) {
                        for(WorkOrder wo : workOrders.values()) {
                            if(wo.Work_Order_Rooms__r.isEmpty()) {
                                Work_Order_Room__c newRoom = new Work_Order_Room__c(
                                    Work_Order__c = wo.Id, 
                                    Site_Survey__c = sl.Site_Survey__c, 
                                    Name = sl.Name, 
                                    Building__c = sl.Building__c, 
                                    Floor__c = sl.Floor__c, 
                                    Location_Type__c = sl.Location_Type__c, 
                                    Location_SubType__c = sl.Location_SubType__c, 
                                    Survey_Location__c = sl.Id, 
                                    Location_Notes__c = sl.Notes__c
                                );
                                workOrderRooms.add(newRoom);
                            }
                        }
                        
                        System.debug('>> Work Order Locations: ');
                        System.debug(workOrderRooms);
                        upsert workOrderRooms;
                        
                        response[0]='success';
                        response[1]='Success!';
                        response[2]='Work Order Room(s) Successfully Created!';
                    }
                } else {
                    response[0]='error';
                    response[1]='Error!';
                    response[2]='An error has occured';
                	System.debug('***** ERROR *****\n'+response+'\n\n');
                }
            } catch (Exception e) {
                response[0]='error';
                response[1]='Error!';
                response[2]='An error has occured: '+e.getMessage();
                System.debug('***** ERROR *****\n'+response+'\n\n'+e);
            }
        }
        return response;
    }
}