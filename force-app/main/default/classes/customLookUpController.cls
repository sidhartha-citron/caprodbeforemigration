public class customLookUpController{
    public static Id SResourceId;
    @AuraEnabled
    public static List < ServiceResource > fetchLookUpValues(String searchKeyWord) {
        String searchKey = searchKeyWord + '%';
        system.debug('searchKeyWord-->' + searchKeyWord);
        List <ServiceResource> returnList = new List < ServiceResource >();

       for (ServiceResource obj: [select id, Name, IsActive from ServiceResource where Name LIKE: searchKey AND IsActive= true order by createdDate DESC limit 5]) {
            returnList.add(obj);
        }
        return returnList;
    }
    
    @AuraEnabled
    public static List<String> UpdateServiceAppointments(List<String> listSAIds,Id asId, Date schStartDate){
       
         system.debug('pigpig' + listSAIds + asId);
         List<String> listIds = new List<String>();
         List<AssignedResource> listAR = new List<AssignedResource>();
         List<ServiceAppointment> listSA = new List<ServiceAppointment>();
         List<String> result = new List<String>{'',''};
         Integer countSA = 0;  
         Set<Id> setOfServiceResourceIds = new Set<Id>();
         Set<Date> setOfScheduleStartDate = new Set<Date>();
         Set<String> setSAStatus = new Set<String>();
         Integer countSuccess = 0;
         Integer countFailures = 0;
         Database.SaveResult[] listSASR;
         Database.SaveResult[] listARSR;
         String strCountSuccess;
         String strcountFailures;
         List<Id>listSuccessSA = new List<Id>();
         Boolean failedAR = false;
         
         
        for(AssignedResource ar : [Select ServiceAppointmentId,ServiceResourceId,ServiceAppointment.SchedStartTime,ServiceAppointment.Status from AssignedResource where ServiceAppointmentId in : listSAIds] ){
            
            setOfServiceResourceIds.add(ar.ServiceResourceId);
            setOfScheduleStartDate.add(ar.ServiceAppointment.SchedStartTime.Date());
            system.debug('henhenhen'+ setOfScheduleStartDate);
            if(ar.ServiceAppointment.Status != 'Dispatched'){
                setSAStatus.add(ar.ServiceAppointment.Status);
            }                       
        }

        for(ServiceAppointment sa : [Select Id, SchedStartTime,Duration,SchedEndTime from ServiceAppointment where id in : listSAIds]){
            //Setting Start Date with existing time
            Time startTime = sa.SchedStartTime.Time();
            sa.SchedStartTime = Datetime.newInstance(schStartDate,startTime);
            
            
            Time endTime = sa.SchedStartTime.Time();
            Decimal i =  sa.Duration;
            Long l = i.round();
            Integer n = l.intValue();
            
            Time finalEndTime = Time.newInstance(endTime.hour(),endTime.minute()+n,endTime.second(),endTime.millisecond());
            
            system.debug('lionlion--->' +  finalEndTime);
            sa.SchedEndTime = Datetime.newInstance(schStartDate,finalEndTime);
            
            system.debug('horsehorse'+sa.SchedStartTime + sa.SchedEndTime + sa.Id);
            listSA.add(sa);
            countSA = countSA + 1;
        }

            if(listSA.size() > 0 || listAR.size() > 0){
                system.debug('turtleturtle-->');
                if(setOfServiceResourceIds.size() > 1){
                    system.debug('swanswan');
                    result[0] = 'multipleSRError';
                    system.debug('parrotparrot' + result[0]);
                }else if(setOfScheduleStartDate.size() > 1){
                    system.debug('cockcock'+ setOfScheduleStartDate.size());
                    result[0] = 'multipleDatesError' ;
                }else if(setSAStatus.size() > 0 ){
                    result[0] = 'nonDispatchedStatusError' ;
                }else if(countSA > 30){
                    result[0] = 'moreThan30SAError' ;
                }else if(asId == null){
                    result[0] = 'mustbeaValidServiceresource' ;
                }
                else{   
                        Savepoint sp = Database.setSavepoint(); // Saving point incase update of service resource fails in any on the assign resource.
                        
                        listSASR = Database.update(listSA,false);
                        
                        for(Integer i = 0; i < listSASR.size(); i++){
                            if(listSASR[i].isSuccess()){
                                countSuccess = countSuccess + 1;
                                listSuccessSA.add(listSASR[i].Id);
                            }else{
                                countFailures = countFailures + 1;
                            }
                        }
                        for(AssignedResource ar : [Select ServiceAppointmentId,ServiceResourceId,ServiceAppointment.SchedStartTime,ServiceAppointment.Status from AssignedResource where ServiceAppointmentId in : listSuccessSA]){
                            ar.ServiceResourceId = asId;
                            system.debug('zebrazebra' + ar.ServiceResourceId);
                            listAR.add(ar);
                            system.debug('puppypuppy'+listAR +setOfServiceResourceIds.size());
                        }
                        listARSR = Database.update(listAR,false);
                        system.debug('kangaroo'+ listARSR+ listSASR);
                        
                        for(Integer i = 0; i < listARSR.size(); i++){
                            if(!listARSR[i].isSuccess()){
                                failedAR = true;
                                Database.rollback(sp);
                                break;
                            }
                        }
                        strCountSuccess = String.valueOf(countSuccess);
                        strcountFailures = String.valueOf(countFailures);
                        if(failedAR == true){
                            result[0] = 'Mass reassignment failed because of unavailable primary territory on the service resource.Please allocate primary territory and try again.';
                        }else{
                            //result[0] = 'Result:' + strCountSuccess + ' SAs are successfully transferred and '+ strcountFailures + 'failed'; 
                            result[0] = 'Successes: ' + strCountSuccess + '<br/>' + 'Failures: ' + strcountFailures; 
                            //result[1] = strcountFailures + 'SAs failed and were not transferred'; 
                        }                                                                     
                }
            }
          
            system.debug('jackaljackal'+ result);

        return result;
       
    }

}