public without sharing class SpawnWorkOrdersController {
    
    @AuraEnabled
    public static List<String> createWorkOrder(String recordId) {
        List<String> response = new List<String>{'', '', ''};
            
            if(recordId==null||recordId=='') {
                response[0] = 'error';
                response[2] = 'A record ID has not been provided.';
                System.debug('***** No ID Provided *****\n'+response);
            } else {
                
                Savepoint sp = Database.setSavepoint();

                try {
                    Order record = [SELECT Id, Status, Emergency__c, AccountId FROM Order WHERE Id=:recordId]; 
                    if(record.Emergency__c) {
                        List<OrderItem> productItems = [
                                SELECT Id, Item_Type__c, OrderId
                                FROM OrderItem
                                WHERE OrderId = :recordId
                                AND Item_Type__c !=:QueryUtils.fieldServiceSettings.Item_Type_of_Services__c
                                LIMIT 1
                        ];
                        
                        if(!productItems.isEmpty()) {
                            response[0] = 'error';
                            response[1] = 'Error!';
                            response[2] = ' You should only allocate Services to create an emergency work order. ';
                            System.debug('***** Other Products *****\n' + response);
                        } 
                        else {
                            List<Order_Item_Location__c> s = [
                                    SELECT Id
                                    FROM Order_Item_Location__c
                                    WHERE Order__c = :recordId AND Survey_Asset_Location__r.Status__c = 'Unallocated'
                            ];

                            if (s.isEmpty()) {
                                response[0] = 'success';
                                response[1] = 'Success!';
                                response[2] = 'Work Order(s) Successfully Created!';
                                
                                if(record.Status != QueryUtils.fieldServiceSettings.Order_Active_Stage__c) {
                                    record.Status = QueryUtils.fieldServiceSettings.Order_Active_Stage__c; 
                                    update record; 
                                }
                                
                                DeleteResourcePreferenceBatch del = new DeleteResourcePreferenceBatch(true);
                                del.handleRecords(new Set<Id>{record.AccountId});

                                SpawnWorkOrders sw = new SpawnWorkOrders();
                                sw.spawnWOUtil.fltaccntIds.add(record.AccountId);
                                sw.spawnWOUtil.fltOrderIds.add(record.Id);
                                sw.spawnWOUtil.IS_EMERGENCY=true;
                                sw.processOrders();
                                
                                Set<Id> workorderIds = new Set<Id>();
                                for(Related_Work_Order__c rwo: [SELECT id, WorkOrder__c FROM Related_Work_Order__c 
                                         WHERE Order__c =:record.Id AND WorkOrder__r.isValid__c = TRUE]){
                                            workorderIds.add(rwo.WorkOrder__c);
                                }


                                if(workorderIds.size()>0){
                                    //Generate Work Order Rooms
                                    SpawnWorkOrderRooms swr = new SpawnWorkOrderRooms();
                                    swr.processWorkOrders(workorderIds);    
                                    //Generate Service Appointments
                                    SpawnServiceAppointments ssp = new SpawnServiceAppointments();
                                    ssp.processWorkOrders(workorderIds);
                                }
                                
                                //SpawnWorkOrderFiles swf = new SpawnWorkOrderFiles(recordId, true);
                                //swf.processWorkOrderFiles(new Set<Id>{recordId});

                            } else {
                                response[0] = 'error';
                                response[1] = 'Error!';
                                response[2] = s.size()+' item(s) have not been allocated for this Order. Please allocate these items before creating a Work Order.';
                                System.debug('***** Unallocated Items *****\n'+response); 
                            }
                        }
                    } else {
                        response[0] = 'error';
                        response[1] = 'Error!';
                        response[2] = ' This is not an emergency Order. Please wait for the nightly job to create Work Orders and Service Appointments Or check the Emergency checkbox. ';
                        System.debug('***** No Services *****\n'+response);
                    }
                    
                } catch(DMLException e) {
                    Database.rollback(sp);
                    response[0]='error';
                    response[1]='Error!';
                    response[2]='An error has occured: ';
                    for (Integer i = 0; i < e.getNumDml(); i++) {
                        response[2]+=(e.getDmlMessage(i)+'\n');
                    }
                    System.debug('***** DML ERROR *****\n'+response+'\n\n'+e);
                } catch(Exception e) {
                    Database.rollback(sp);
                    response[0]='error';
                    response[1]='Error!';
                    response[2]='An error has occured: '+e.getMessage();
                    System.debug('***** ERROR *****\n'+response+'\n\n'+e);
                }
            }
        return response;    
    }
    
    @AuraEnabled
    public static List<String> compareWorkOrderToAppointments(String recordId) {
        String workOrderPrefix = Schema.WorkOrder.SObjectType.getDescribe().getKeyPrefix();
        List<String> response = new List<String>{'', '', ''};
            
        if(recordId.startsWith(workOrderPrefix)) {
            WorkOrder w = [
                    SELECT Id, Duration,
                            (SELECT Id, Duration
                            FROM ServiceAppointments)
                    FROM WorkOrder
                    WHERE Id = :recordId
            ];
            
            Decimal woDuration = w.Duration != null ? w.Duration:0;
            
            Decimal apptDuration = 0;
            
            if (w.ServiceAppointments != null && !w.ServiceAppointments.isEmpty()) {
                for (ServiceAppointment s : w.ServiceAppointments) {
                    if(s.Duration != null) {
                        apptDuration += s.Duration;
                    }
                }
            }
            
            if(woDuration > apptDuration) {
                response[0] = 'warning';
                response[1] = 'Warning!';
                response[2] = 'Work Order Duration (' + woDuration + ' hours) exceeds Service Appointment Duration  (' + apptDuration + ' hours)!';
            }
        }
        return response;    
    }
}