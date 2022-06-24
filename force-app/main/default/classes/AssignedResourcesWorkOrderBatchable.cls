global class AssignedResourcesWorkOrderBatchable implements Database.Batchable<SObject>, Schedulable {
    private static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    private String queryString = 'SELECT Id FROM ServiceAppointment WHERE (Status=\'' + dataSets.Service_Appointment_Completed_Status__c + '\'' + ' OR Status=\'' + dataSets.Cannot_Complete_Status_Value__c + '\''+ ') AND ActualStartTime = LAST_N_DAYS:14'; 

    private class MatrixRecord {
        public String WorkOrderId {get;set;}
        public WorkOrder WorkOrder {get;set;}
        public Map<Id, AssignedResource> AssignedResources {get;set;}
        public Map<Id, ServiceResource> ServiceResources {get;set;}
        public Map<Id, ServiceCrew> ServiceCrews {get;set;}
        public Set<Id> ServiceAppointments {get;set;}
        
        public MatrixRecord(String WorkOrderId, WorkOrder WorkOrder, Set<Id> ServiceAppointments) {
            this.WorkOrderId = WorkOrderId;
            this.WorkOrder = WorkOrder;
            AssignedResources = new Map<Id, AssignedResource>();
            ServiceResources = new Map<Id, ServiceResource>();
            ServiceCrews = new Map<Id, ServiceCrew>();
            this.ServiceAppointments = ServiceAppointments;
        } 
    }
    
    public AssignedResourcesWorkOrderBatchable() {
        
    }
    
    public AssignedResourcesWorkOrderBatchable(String id) {
        queryString += ' AND Id=\'' + id + '\'';
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        System.debug('Query -->' + queryString); //remove
        return Database.getQueryLocator(queryString);
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch) {
        Set<Id> ids = new Set<Id>();
        System.debug('records -->' + batch); //remove
        for (ServiceAppointment sa : (List<ServiceAppointment>)batch) {
            ids.add(sa.Id);
        }
        
        handleRecords(ids);
    }
    
    global void finish(Database.BatchableContext bc) {

    }
    
    global void execute(SchedulableContext sc) {
        Database.executeBatch(new AssignedResourcesWorkOrderBatchable());
    }
    
    public void handleRecords(Set<Id> ids) {
        if (!ids.isEmpty()) {
            Map<Id, MatrixRecord> matrixRecords = new Map<Id, MatrixRecord>();
            Map<String, AssignedResource> resources = new Map<String, AssignedResource>();
            Set<Id> relatedAppointmentsToWorkOrders = new Set<Id>();
            Set<Id> serviceApptIds = new Set<Id>();
            
            for (WorkOrder wo : [SELECT Id, Assigned_Resources_AccPac_Rep_Numbers__c, Assigned_Resources_Names__c, (SELECT FSL__Related_Service__c FROM ServiceAppointments) FROM WorkOrder WHERE Completed_Date__c = LAST_N_DAYS:7 AND Id IN (SELECT ParentRecordId FROM ServiceAppointment WHERE ParentRecord.Type = 'WorkOrder' AND Id IN: ids)]) {
                Set<Id> appointments = new Set<Id>();
                
                for (ServiceAppointment sa : wo.ServiceAppointments) {
                    serviceApptIds.add(sa.Id);
                    appointments.add(sa.Id);
                    
                    if (sa.FSL__Related_Service__c != null) {
                        serviceApptIds.add(sa.FSL__Related_Service__c);
                        relatedAppointmentsToWorkOrders.add(sa.FSL__Related_Service__c);
                        appointments.add(sa.FSL__Related_Service__c);
                    }
                }
                
                matrixRecords.put(wo.Id, new MatrixRecord(wo.Id, wo, appointments));
            }
            
            matrixRecords.remove(null);
            
            for (AssignedResource ar : [SELECT Id, ServiceAppointmentId, ServiceAppointment.ParentRecordId, ServiceCrewId, ServiceAppointment.FSL__Related_Service__c, ServiceResourceId FROM AssignedResource WHERE (ServiceAppointment.Status =: dataSets.Service_Appointment_Completed_Status__c or ServiceAppointment.status =: dataSets.Cannot_Complete_Status_Value__c) AND ServiceAppointment.ParentRecord.Type = 'WorkOrder' AND (ServiceAppointmentId IN: serviceApptIds OR ServiceAppointmentId IN: relatedAppointmentsToWorkOrders)]) {                
                resources.put(ar.Id + '.' + ar.ServiceAppointmentId, ar);
            }
            
            resources.remove(null);
            
            for (MatrixRecord matrix : matrixRecords.values()) {
                for (String resourceKey : resources.keySet()) {
                    String arKey = resourceKey.split('\\.')[0];
                    String serviceApptKey = resourceKey.split('\\.')[1];
                    
                    if (matrix.ServiceAppointments.contains(serviceApptKey)) {
                        AssignedResource ar = resources.get(resourceKey);
                        
                        matrix.ServiceResources.put(ar.ServiceResourceId, null);
                        matrix.ServiceCrews.put(ar.ServiceCrewId, null);
                    }
                }
                
                matrix.ServiceCrews.remove(null);
                matrix.ServiceResources.remove(null);
            }
            
            //System.debug(matrixRecords);
            
            //*flatten* records - one resource can belong to multiple work orders 
            Map<Id, Map<Id, WorkOrder>> crewIds = new Map<Id, Map<Id, WorkOrder>>();
            Map<Id, Map<Id, WorkOrder>> resourceIds = new Map<Id, Map<Id, WorkOrder>>();
            
            for (MatrixRecord matrix : matrixRecords.values()) {
                for (Id scId : matrix.ServiceCrews.keySet()) {
                    if (crewIds.get(scId) != null) {
                		crewIds.get(scId).put(matrix.WorkOrderId, matrix.WorkOrder);
                    } else {
                        crewIds.put(scId, new Map<Id, WorkOrder>{matrix.WorkOrderId => matrix.WorkOrder});
                    }
                }
                
                for (Id resId : matrix.ServiceResources.keySet()) {
                    if (resourceIds.get(resId) != null) {
                		resourceIds.get(resId).put(matrix.WorkOrderId, matrix.WorkOrder);
                    } else {
                        resourceIds.put(resId, new Map<Id, WorkOrder>{matrix.WorkOrderId => matrix.WorkOrder});
                    }
                }
            }
            
            crewIds.remove(null);
            resourceIds.remove(null);
            
            //System.debug('Resource IDs #1: ' + resourceIds);
            
            //only run this query if crews are activated
            if (dataSets.Are_Service_Crews_Active__c) {
                for (ServiceCrewMember member : [SELECT Id, ServiceResourceId, ServiceCrewId FROM ServiceCrewMember WHERE ServiceCrewId IN: crewIds.keySet()]) {
                    Map<Id, WorkOrder> woFromServiceCrew = crewIds.get(member.ServiceCrewId);
                    
                    if (woFromServiceCrew != null) {
                        if (resourceIds.get(member.ServiceResourceId) != null) {
                            resourceIds.get(member.ServiceResourceId).putAll(woFromServiceCrew);
                        } else {
                            resourceIds.put(member.ServiceResourceId, woFromServiceCrew);
                        }
                    }
                }
            }
            
            //System.debug('Resource IDs #2: ' + resourceIds);
            
            //retrieve resources from related crews and merge with assigned resources for each work order, and populate ServiceResource values from above query iterator
            for (ServiceResource sr : [SELECT Id, Name, RelatedRecord.AccPac_Rep_Number__c, ServiceCrewId FROM ServiceResource WHERE IsActive = true AND Id IN: resourceIds.keySet()]) {
                Map<Id, WorkOrder> woFromServiceCrew = crewIds.get(sr.ServiceCrewId);
                Map<Id, WorkOrder> woFromServiceResource = resourceIds.get(sr.Id);
                
                //System.debug(woFromServiceCrew);
                //System.debug(woFromServiceResource);
                //System.debug(sr.ServiceCrewId);
                
                if (woFromServiceResource != null) {
                    for (Id woId : woFromServiceResource.keySet()) {
                    	matrixRecords.get(woId).ServiceResources.put(sr.Id, sr); 
                    }
                }
            }
            
            //System.debug(matrixRecords);
            
            Map<Id, WorkOrder> workOrdersToUpdate = new Map<Id, WorkOrder>();
            
            //build the two fields
            for (MatrixRecord matrix : matrixRecords.values()) {
                WorkOrder wo = matrix.WorkOrder;
                wo.Assigned_Resources_Names__c = '';//reset the values
                wo.Assigned_Resources_AccPac_Rep_Numbers__c = '';//reset the values
                
                for (ServiceResource sr : matrix.ServiceResources.values()) {
                    if (sr != null) {
                        wo.Assigned_Resources_Names__c += sr.Name + ',';
                        wo.Assigned_Resources_AccPac_Rep_Numbers__c += sr.RelatedRecord.AccPac_Rep_Number__c != null ? sr.RelatedRecord.AccPac_Rep_Number__c + ',' : '';
                    }
                }
                
                wo.Assigned_Resources_Names__c = wo.Assigned_Resources_Names__c.removeEnd(',');
                wo.Assigned_Resources_AccPac_Rep_Numbers__c = wo.Assigned_Resources_AccPac_Rep_Numbers__c.removeEnd(',');
                
                //only add if a value exists - removed for now
                //if (!String.isEmpty(wo.Assigned_Resources_Names__c) || !String.isEmpty(wo.Assigned_Resources_AccPac_Rep_Numbers__c)) {
                	workOrdersToUpdate.put(wo.Id, wo);
                //}
            }
            
            System.debug(workOrdersToUpdate.size());
            System.debug(workOrdersToUpdate);
            System.debug('Total Number of SOQL Queries used: ' +  Limits.getQueries());
            
            Database.SaveResult[] saveResults = Database.update(workOrdersToUpdate.values(), false);
            
            //System.enqueueJob(new BatchErrorsQueueable(saveResults, AssignedResourcesWorkOrderBatchable.class.getName()));
        }
    }
}