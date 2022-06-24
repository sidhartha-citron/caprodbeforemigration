public with sharing class CreateEventController {
    public static Id relId;
    
    @AuraEnabled()
    public static String  getUserSignature(){
        User us = [select id, Signature from User where Id =:UserInfo.getUserId()];
        return us.Signature;
    }
    
    public class flowInputVar {
        @InvocableVariable public Datetime followUpDate;
        @InvocableVariable public Id recId;
        @InvocableVariable public String evtCountry;
        @InvocableVariable public String evtState;
        @InvocableVariable public String evtStreet;
        @InvocableVariable public String evtPostal;
        
        public flowInputVar(){
            
        }
    }
    public class RequiredException extends Exception {}
    
    @AuraEnabled
    public static String createEventAndUpdate(Event evtdetails, Lead ld, Task tsk) {
        String message = '';
        Id evt;
        
        if(evtdetails !=null) {
            relId = evtdetails.WhoId ;
            evtdetails.WhoId = null;
            evtdetails.DurationInMinutes = Integer.valueof(System.Label.EventDuration);
            evt = createEventfromFlowNLWC(null,evtdetails);
        }
        
        if(ld.Email !=null) {
            try{
                update ld;
            }catch(exception e){
                throw new AuraHandledException(e.getMessage() + e.getStackTraceString());
            }
        }

        if(tsk !=null && evt !=null){
            system.debug('tsk ' + tsk);
            try{
                update tsk;
            }catch(exception e){
                throw new AuraHandledException(e.getMessage() + e.getStackTraceString());
            }
        }
        
        return message;
    }
    @InvocableMethod(label='Create Events' description='Create Event from Hornets flow and call block manager')
    public static List<List<String>> getEventData (List<flowInputVar> inputVars){       
        List<String> ss = new List<String>();
        Id evtId;
        evtId = createEventfromFlowNLWC(inputVars, null);
        if(evtId !=null){
            ss.add('Event Created');  
        }else{
            new CreateEventController.RequiredException('Event Creation failed.');
        }
        return new List<List<String>>{ss};
     } 
    
    public static Id createEventfromFlowNLWC(List<flowInputVar> flowinputVars, Event lwcinputVars) {
        List<Event> lstev = new List<Event>();
        String evtlc;
        Id relationId;
        if(flowinputVars !=null) {
            relationId = flowinputVars[0].recId;
            evtlc = flowinputVars[0].evtStreet + ''+ flowinputVars[0].evtState + '' + flowinputVars[0].evtPostal;
            Event evt = new Event(StartDateTime = flowinputVars[0].followUpDate,
                                  Subject = System.Label.EventSubject,
                                  DurationInMinutes = Integer.valueof(System.Label.EventDuration),
                                  location = evtlc,
                                  OwnerId = UserInfo.getUserId(),
                                  WhoId = null,
                                  Call_Objective__c  = System.Label.eventCallObj,
                                  Type = System.Label.eventType );
            lstev.add(evt);
        }
        if(lwcinputVars !=null) {
            relationId = lwcinputVars.WhoId;
            lwcinputVars.Call_Objective__c = System.Label.eventCallObj;
            lwcinputVars.Type = System.Label.eventType;
            lwcinputVars.WhoId = null;
            lstev.add(lwcinputVars);
        }
        system.debug('lstev ' + lstev);
        try{
            insert lstev;
        }catch(exception e){
            throw new AuraHandledException(e.getMessage() + e.getStackTraceString());
        }
        
        EventRelation er = new EventRelation();
        er.RelationId = relId == null ? relationId : relId; 
        er.IsInvitee = true;
        er.IsParent = true;
        er.IsWhat = false;
        er.EventId = lstev[0].Id;
        try{
            insert er;
        }catch (exception ex){
            throw new AuraHandledException(ex.getMessage() + ex.getStackTraceString());
        }
        return lstev[0].Id;
    }
}