/**************** HANDLER FOR SA ****************/

public class ServiceAppointmentTriggerHandler extends TriggerHandler {
    public List<ServiceAppointment> serviceAppointments;
    public List<ServiceAppointment> oldList;
    public Map<Id,ServiceAppointment> serviceAppointmentsMap;
    public Map<Id,ServiceAppointment> oldMap;
    
    public ServiceAppointmentTriggerHandler() {
        //this.setMaxLoopCount(20);

        this.serviceAppointments = (List<ServiceAppointment>) Trigger.new;
        this.oldList = (List<ServiceAppointment>) Trigger.old;
        this.serviceAppointmentsMap = (Map<Id,ServiceAppointment>) Trigger.newMap;
        this.oldMap = (Map<Id,ServiceAppointment>) Trigger.oldMap;
    }

    public override void beforeInsert() {
        settingScheduleOverLowPrioritySA();
        updateServiceAppointmentDates();
    }

    public override void beforeUpdate() {
        System.debug('ServiceAppointmentTriggerHandler beforeUpdate');
        sendNotificationEmails();
        updateServiceAppointment();
        updateServiceAppointmentDates();
        setSignatureFields();
    }

    public override void afterInsert() {
        updateWorkOrder();
    }
    
    public override void afterUpdate() {
        callCreateSendServiceReport();
        updateWorkOrder();
    }

    /**ONLY ON BEFORE INSERT **/
    /**@Author : PWC
    @Purpose : to update the FSL__Schedule_over_lower_priority_appointment__c to true on creation of an SA.
    **/
    private void settingScheduleOverLowPrioritySA(){
        for(ServiceAppointment sa : serviceAppointments) {
            sa.FSL__Schedule_over_lower_priority_appointment__c = true;
        }
    }

    /** ON BOTH BEFORE INSERT AND UPDATE **/
    /**@Author : PWC
    @Purpose : 1) Setting the ActualStartTime and ActualEndTime on SA.
    2) Sets Customer_Notification_Time__c
    3) Sets the Account__c on SA and address of the SA from the parent reocrd (incase address is blank)
    **/
    public void updateServiceAppointmentDates(){
        Map<Id, Account> accMap = new Map<Id, Account>();
        Map<Id, WorkOrder> woMap = new Map<Id, WorkOrder>();
        Map<Id, WorkOrderLineItem> woliMap = new Map<Id, WorkOrderLineItem>();
        Map<Id, Opportunity> oppMap = new Map<Id, Opportunity>();
        Map<Id, Asset> astMap = new Map<Id, Asset>();

        String accountPrefix = Account.SObjectType.getDescribe().getKeyPrefix();
        String workOrderPrefix = WorkOrder.SObjectType.getDescribe().getKeyPrefix();
        String workOrderLineItemPrefix = WorkOrderLineItem.SObjectType.getDescribe().getKeyPrefix();
        String opportunityPrefix = Opportunity.SObjectType.getDescribe().getKeyPrefix();
        String assetPrefix = Asset.SObjectType.getDescribe().getKeyPrefix();

        List<String> statuses = new List<String> {
                QueryUtils.fieldServiceSettings.Service_Appointment_Completed_Status__c,
                QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
        };

        for(ServiceAppointment sa : serviceAppointments){
            ServiceAppointment oldRec = (Trigger.isInsert ? new ServiceAppointment() : oldMap.get(sa.Id));

            if (sa.Status == QueryUtils.fieldServiceSettings.Service_Appointment_Arrived_Status__c
                    && oldRec.Status != sa.Status && sa.ActualStartTime == null)
            {
                sa.ActualStartTime = Datetime.now();
            }
            else if (statuses.contains(sa.Status)
                    && oldRec.Status != sa.Status
                    && sa.ActualEndTime == null)
            {
                sa.ActualEndTime = Datetime.now();
            }

            if (sa.ParentRecordId != null
                    && sa.RecordTypeId != QueryUtils.fieldServiceSettings.SA_Vehicle_Inspection_Record_Type_Id__c)
            {
                if (((String)sa.ParentRecordId).startsWith(accountPrefix)) {
                    accMap.put(sa.ParentRecordId, null);
                } else if (((String)sa.ParentRecordId).startsWith(workOrderPrefix)) {
                    woMap.put(sa.ParentRecordId, null);
                } else if (((String)sa.ParentRecordId).startsWith(workOrderLineItemPrefix)) {
                    woliMap.put(sa.ParentRecordId, null);
                } else if (((String)sa.ParentRecordId).startsWith(opportunityPrefix)) {
                    oppMap.put(sa.ParentRecordId, null);
                } else if (((String)sa.ParentRecordId).startsWith(assetPrefix)) {
                    astMap.put(sa.ParentRecordId, null);
                }
            }

            if (sa.SchedStartTime!=null && sa.SchedStartTime != oldRec.SchedStartTime) {
                sa.Scheduled_Start_Date__c = sa.SchedStartTime.format('EEE, MMM d yyyy');
                Integer dayOfWeek = math.MOD(Date.newInstance(1900, 1, 7).daysBetween(sa.SchedStartTime.date()),7);
                //Varun: 06-18-2020 Production Fix
                //Sunday-->Customer_Notification_Time__c(24hrs)--will be set to Saturday--->Email will be sent on Friday
                //Monday-->Customer_Notification_Time__c(24hrs)--will be set to Saturday--->Email will be sent on Friday
                //Monday-->Customer_Notification_Time__c(48hrs)--will be set to Sunday--->Email will be sent on Friday     
                //Tuesday-->Customer_Notification_Time__c(48hrs)--will be set to Sunday--->Email will be sent on Friday                
                //If hour of notification is in PM (>12) customer notification will be moved to 8 hours earlier. 
                
                if((dayOfWeek == 0 && sa.Require_24_Hour_Notification__c) || (dayOfWeek == 1 && sa.Require_48_Hour_Notification__c)){
                   sa.Customer_Notification_Time__c = sa.SchedStartTime.addDays(-1); 
                }else if((dayOfWeek == 1 && sa.Require_24_Hour_Notification__c) || (dayOfWeek == 2 && sa.Require_48_Hour_Notification__c)){
                   sa.Customer_Notification_Time__c = sa.SchedStartTime.addDays(-2); 
                }else{
                   sa.Customer_Notification_Time__c = sa.SchedStartTime; 
                }
                
                Integer hourofNotification = sa.Customer_Notification_Time__c.hour();
                
                if(hourofNotification > 12){
                    sa.Customer_Notification_Time__c = sa.Customer_Notification_Time__c.addhours(-8);
                }
            }

            //21618 multi-res - setting the date/time field for the workflow rule to be picked up
            if (Trigger.isInsert
                    && sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Pest_LOB__c
                    && sa.FSL__Emergency__c
                    && sa.Pest_Emergency_Notification_Date_Time__c == null)
            {
                sa.Pest_Emergency_Notification_Date_Time__c = System.now();
            } else if (Trigger.isUpdate
                    && (sa.SchedStartTime != oldRec.SchedStartTime
                    || sa.SchedEndTime != oldRec.SchedEndTime)
                    && sa.Send_Pest_Emergency_Dispatch_Not__c)
            {
                sa.Pest_Emergency_Notification_Date_Time__c = System.now();
                sa.Send_Pest_Emergency_Dispatch_Not__c  = false;
                sa.Trigger_Dispatch_notification__c = false;
            }
        }

        if (!accMap.isEmpty()) {
            List<Account> accounts = [
                    SELECT Id, Shipping_Suite_Number__c, ShippingStreet, ShippingCity, ShippingState,
                            ShippingPostalCode, ShippingCountry
                    FROM Account
                    WHERE Id IN :accMap.keySet()
            ];

            for (Account a : accounts) {
                accMap.put(a.Id, a);
            }
        }

        if (!woMap.isEmpty()) {
            List<WorkOrder> wos = [
                    SELECT Id, Suite_Number__c, Street, City, State, PostalCode, Country, AccountId, Status, ServiceReportLanguage
                    FROM WorkOrder
                    WHERE Id IN :woMap.keySet()
            ];

            for (WorkOrder wo : wos) {
                woMap.put(wo.Id, wo);
            }
        }

        if (!woliMap.isEmpty()) {
            List<WorkOrderLineItem> lis = [
                    SELECT Id, Suite_Number__c, Street, City, State, PostalCode, Country, WorkOrder.AccountId
                    FROM WorkOrderLineItem
                    WHERE Id IN :woliMap.keySet()
            ];

            for (WorkOrderLineItem li : lis) {
                woliMap.put(li.Id, li);
            }
        }

        if (!oppMap.isEmpty()) {
            List<Opportunity> opps = [
                    SELECT Id, AccountId, Account.Shipping_Suite_Number__c, Account.ShippingStreet, Account.ShippingCity,
                            Account.ShippingState, Account.ShippingPostalCode,Account.ShippingCountry
                    FROM Opportunity
                    WHERE Id IN :oppMap.keySet()
            ];

            for (Opportunity opp : opps) {
                oppMap.put(opp.Id, opp);
            }
        }

        if (!astMap.isEmpty()) {
            List<Asset> assets = [
                    SELECT Id, AccountId, Account.Shipping_Suite_Number__c, Account.ShippingStreet, Account.ShippingCity,
                            Account.ShippingState, Account.ShippingPostalCode,Account.ShippingCountry
                    FROM Asset
                    WHERE Id IN :astMap.keySet()
            ];

            for (Asset asset : assets) {
                astMap.put(asset.Id, asset);
            }
        }

        for(ServiceAppointment sa : serviceAppointments){
            if (String.isBlank(sa.ParentRecordId)) continue;
            if (((String)sa.ParentRecordId).startsWith(accountPrefix)) {
                Account a = accMap.get(sa.ParentRecordId);
                if (a != null) {
                    sa.Account__c = a.Id;
                    if(sa.Address == null){
                        sa.Suite_Number__c = a.Shipping_Suite_Number__c;
                        sa.Street = a.ShippingStreet;
                        sa.City = a.ShippingCity;
                        sa.State = a.ShippingState;
                        sa.PostalCode = a.ShippingPostalCode;
                        sa.Country = a.ShippingCountry ;
                    }
                }
            } else if (((String)sa.ParentRecordId).startsWith(workOrderPrefix)) {
                WorkOrder wo = woMap.get(sa.ParentRecordId);
                if (wo != null) {
                    sa.Account__c = wo.AccountId;
                    if(sa.Address == null){
                        sa.Suite_Number__c = wo.Suite_Number__c;
                        sa.Street = wo.Street;
                        sa.City = wo.City;
                        sa.State = wo.State;
                        sa.PostalCode = wo.PostalCode;
                        sa.Country = wo.Country;
                        sa.Notification_Language_Locale_Key__c = wo.ServiceReportLanguage;
                    }
                }
            } else if (((String)sa.ParentRecordId).startsWith(workOrderLineItemPrefix)) {
                WorkOrderLineItem li = woliMap.get(sa.ParentRecordId);
                if (li != null) {
                    sa.Account__c = li.WorkOrder.AccountId;
                    if(sa.Address == null){
                        sa.Suite_Number__c = li.Suite_Number__c;
                        sa.Street = li.Street;
                        sa.City = li.City;
                        sa.State = li.State;
                        sa.PostalCode = li.PostalCode;
                        sa.Country = li.Country ;
                    }
                }
            } else if (((String)sa.ParentRecordId).startsWith(opportunityPrefix)) {
                Opportunity op = oppMap.get(sa.ParentRecordId);
                if (op != null) {
                    sa.Account__c = op.AccountId;
                    if(sa.Address == null){
                        sa.Suite_Number__c = op.Account.Shipping_Suite_Number__c;
                        sa.Street = op.Account.ShippingStreet;
                        sa.City = op.Account.ShippingCity;
                        sa.State = op.Account.ShippingState;
                        sa.PostalCode = op.Account.ShippingPostalCode;
                        sa.Country = op.Account.ShippingCountry ;
                    }
                }
            } else if (((String)sa.ParentRecordId).startsWith(assetPrefix)) {
                Asset ast = astMap.get(sa.ParentRecordId);
                if (ast != null) {
                    sa.Account__c = ast.AccountId;
                    if(sa.Address == null){
                        sa.Suite_Number__c = ast.Account.Shipping_Suite_Number__c;
                        sa.Street = ast.Account.ShippingStreet;
                        sa.City = ast.Account.ShippingCity;
                        sa.State = ast.Account.ShippingState;
                        sa.PostalCode = ast.Account.ShippingPostalCode;
                        sa.Country = ast.Account.ShippingCountry ;
                    }
                }
            }
        }
    }

    /*
    @Author : Aieleeta
    @Purpose : When Email_Sent__c field on SA is true, 24 hours notification email will be sent to the contact added to the account with role 'Appointment Notification Opt-In'.
    If not such contact exist, email will be sent to the contact related the the SA.
    @ Origin :  ServiceAppointmentFutureCalls
    @ Event :   BEFORE UPDATE
    */
    public void sendNotificationEmails() {

        Map<Id,Set<Id>> mapSAIdToAccount = new Map<Id,Set<Id>>();
        Map<Id,Id> mapSAToWorkOrder = new Map<Id,Id>();
        
        for(ServiceAppointment sa : serviceAppointments){
            
            if(sa.Email_Sent__c == true && !oldMap.get(sa.Id).Email_Sent__c == true){
                
                if (mapSAIdToAccount.containsKey(sa.Account__c)) {
                    mapSAIdToAccount.get(sa.Account__c).add(sa.Id);
                } else {
                    mapSAIdToAccount.put(sa.Account__c,new Set<Id>{sa.Id});
                }
                mapSAToWorkOrder.put(sa.Id,sa.ParentRecordId);
            }
            
        }
        
        Map<Id,String> MapWOToWORoom = new Map<Id,String>();
        Map<Id,String> MapWOToWORoomForTask = new Map<Id,String>();
        
        //changed to check if empty [dk]
        if (!mapSAToWorkOrder.isEmpty()) {
            List<Work_Order_Room__c> rooms = [
                SELECT Id, Name, Work_Order__c
                FROM Work_Order_Room__c
                WHERE Work_Order__c IN :mapSAToWorkOrder.values()
                ORDER BY Name ASC
            ];
            
            for(Work_Order_Room__c woRoom : rooms){
                if (MapWOToWORoom.containsKey(woRoom.Work_Order__c)){
                    
                    MapWOToWORoom.put(woRoom.Work_Order__c, MapWOToWORoom.get(woRoom.Work_Order__c) + '<br/>\n' + woRoom.Name);
                    MapWOToWORoomForTask.put(woRoom.Work_Order__c, MapWOToWORoomForTask.get(woRoom.Work_Order__c) + ' ' + woRoom.Name );
                } else {
                    MapWOToWORoom.put(woRoom.Work_Order__c, '<br/>\n' + woRoom.Name);
                    MapWOToWORoomForTask.put(woRoom.Work_Order__c, ' ' + woRoom.Name );
                }
                
            }
        }
       
        //20210908 Darcy #930 https://trello.com/c/ZGGrJkJ0 indirect contact not getting notification
        Set<Id> setNotifyContactId =  new Set<Id>();
        Map<Id,List<Contact>> mapAccountToContact2 = new Map<Id,List<Contact>>();

        if (!mapSAIdToAccount.isEmpty()) {
            List<AccountContactRelation> acrs = [
                    SELECT AccountId, ContactId, Roles, Contact.Email
                    FROM AccountContactRelation
                    WHERE AccountId IN :mapSAIdToAccount.keySet()
                    AND Roles INCLUDES ('Appointment Notification Opt-In') 
                    AND Contact.Email != null
                    ORDER BY accountid ASC, IsDirect DESC 
                ];
            for (AccountContactRelation acr : acrs) {

                setNotifyContactId.add(acr.ContactId);

                List<Contact> lstContact = new List<Contact>();
                Contact con = new Contact();
                con.Id = acr.ContactId;
                con.Email = acr.Contact.Email;
                if (mapAccountToContact2.containsKey(acr.AccountId)) {
                    lstContact = mapAccountToContact2.get(acr.AccountId);
                    lstContact.add(con);
                } else {
                    lstContact.add(con);
                    mapAccountToContact2.put(acr.AccountId,lstContact);
                }
            }
        }   
        //END 930


        List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();
        Map<Id,Task> mapSAIdToTask = new Map<Id,Task>();
        Set<Id> setContactIdsForTask = new Set<Id>();
        String taskLOB;
        Map<Id,ServiceAppointment> mapContactToSA = new Map<Id,ServiceAppointment>();
        Map<Id,String> mapContactToSAAccoutAccpac = new Map<Id,String>();
        
        Map<Id,Task> mapConIdToTask = new Map<Id,Task>();

        //changed to check if empty [dk]
        if (!mapSAToWorkOrder.isEmpty()) {
            List<ServiceAppointment> sas = [
                SELECT Id, Type__c, Line_Of_Business__c, Scheduled_Start_Date__c, AccountId, Account__c,
                Account.AccPac_Account__c, Address, ParentRecordId, Street, City, Country, ContactId,
                Contact.Email
                FROM ServiceAppointment
                WHERE Id IN :mapSAToWorkOrder.keySet()
            ];
            
            Id templateId = Id.valueOf(QueryUtils.fieldServiceSettings.Service_Notification_Email_Template_Id__c);
                        
            for (ServiceAppointment sa : sas){
                Messaging.SingleEmailMessage mail =  new Messaging.SingleEmailMessage();
                
                String subject;
                String body;
                String surveyLocations = MapWOToWORoom.get(mapSAToWorkOrder.get(sa.Id));
                surveyLocations = surveyLocations != null ? surveyLocations : '';
				
                //Darcy 2021-06-21 Moved email contents to visualforce template
                mail = Messaging.renderStoredEmailTemplate(templateId, null, sa.id);
                body = mail.getHtmlBody();
                body = body.replace('{surveylocations}', surveyLocations);
                mail.setHtmlBody(body);

                //setSaveAsActivity default is TRUE - create EmailMessage and Task RelatedTo the SA
                //mail.setSaveAsActivity(false); 

                List<Contact> listContact =  new List<Contact>();
                
                //Begin:Shashi:2019-07-8:Moved initialization inside the loop
                List<String> sendTo = new List<String>();
                //End
                String whoId = null;

                if(mapAccountToContact2.get(sa.Account__c) != null){
                    
                    if(mapAccountToContact2.get(sa.Account__c).size() > 0){
                        
                        listContact = mapAccountToContact2.get(sa.Account__c);
    
                        for(Contact con : listContact){

                            if(con.Email != null){					  
                                sendTo.add(con.Email);
                                
                                //Not setting the whoId on the Email. RingDNA would update their stat fields as if it was user-sent email
                                //(it updates the Contact and Account)
                                /*
                                if(whoId == null){
                                    whoId = con.Id; 
                                }
                                */
     
                                setContactIdsForTask.add(con.Id); 

                                Task newTask = new Task();
                                newTask.Subject = mail.getSubject();
                                String description = mail.getHtmlBody();
                                newTask.Description = description.stripHtmlTags();
                                newTask.Type = 'Email';
                                newTask.WhoId = con.Id;
                                newTask.WhatId = sa.Id;
                                newTask.Status = 'Completed';
                                newTask.ActivityDate = System.today();
                                mapConIdToTask.put(con.Id, newTask);
                                
                                
                                mapContactToSA.put(con.Id,sa);
                                mapContactToSAAccoutAccpac.put(con.Id,sa.Account.AccPac_Account__c);
                            }

                        }
                        if(sendTo!=null){
                            mail.setToAddresses(sendTo);    
                        }
                    }   
                }
                else {
                    
                    if(sa.Contact.Email != null && sa.Contact != null){											   
                        sendTo.add(sa.Contact.Email);
                        mail.setToAddresses(sendTo);
                        mapContactToSA.put(sa.ContactId,sa);
                        mapContactToSAAccoutAccpac.put(sa.ContactId,sa.Account.AccPac_Account__c);
                        whoId = sa.ContactId;
                    } 
                }
                
                if(whoId != null){
                    mail.setTargetObjectId(Id.valueOf(whoId));
                }
                
                if(!sendTo.isEmpty()){															  
                    String replyTo = QueryUtils.fieldServiceSettings.Customer_Success_Email_Id__c;
                    mail.setReplyTo(replyTo);
                    mail.setOrgWideEmailAddressId(QueryUtils.fieldServiceSettings.Customer_Success_OWA_Id__c);
                    mails.add(mail);
                }				 
  
            }
        }
         
        Messaging.SendEmailResult [] emailResult = Messaging.sendEmail(mails,true);
        
        Set<Id> failedSA = new Set<Id>();
        
        for (Messaging.SendEmailResult  result : emailResult) {
            if (!result.isSuccess()) {
                Messaging.SendEmailError[] errArr = new Messaging.SendEmailError[]{};
                    errArr = result.getErrors();
                failedSA.add(errArr[0].getTargetObjectId());
            }
        }

        List<Task> listSATask = new List<Task>();
 
        if (!setNotifyContactId.isEmpty()) {
            List<Contact> cons = [
                SELECT Id, Email, AccountId
                FROM Contact
                WHERE Id IN :setNotifyContactId
                AND Id NOT IN :failedSA
            ];
 
            for (Contact con : cons) {
                Task newTask1 = new Task();
                newTask1 = mapConIdToTask.get(con.Id);
                
                if(newTask1 != null){
                    listSATask.add(newTask1);    
                }       
            }    
        }
        
        //changed to check if empty [dk]
        if (!listSATask.isEmpty() && setContactIdsForTask.size()>0){
            System.debug('In final: '+setContactIdsForTask);
            Database.insert(listSATask);
        }
    }


    /*************************************MOVING SetServiceAppointmentFields TRIGGER************************************/

    /*** ONLY ON BEFORE UPDATE**/
    /**
        @Author : PWC
        @Purpose : 1)For tech profiles,if status of the SA is updated to On Route/On Site and Same_Day_Appointment__c = true, it will check for existing SA in the system where Same_Day_Appointment__c is true and status is On Route/On Site and is owned by the same technician. If found any, it will update the status of thise SA matching the incoming SA's.
        2) If the status of an SA is updated Time_Of_Last_Status_Change__c is updated to now. If the earlier status was  either Dispatched/On Route/On Site/In Progress/On Hold,and it is moved to a different status, Time_In_Dispatched__c,Time_In_On_Route__c,Time_In_On_Site__c,Time_In_In_Progress__c,Time_In_On_Hold__c are updated.
        @Origin :
        @Event : BEFORE UPDATE
    **/
    public void updateServiceAppointment(){
        List<Service_Appointment_Same_Location_Status__c> statuses = Service_Appointment_Same_Location_Status__c.getAll().values();
        Set<String> concurrentStatuses = new Set<String>();
        Set<String> concurrentEntryStatuses = new Set<String>();
        Map<Id, Set<Id>> SAtoSR = new Map<Id, Set<Id>>();
        Map<Id, ServiceAppointment> ServiceResourceServiceAppointments = new Map<Id, ServiceAppointment>();
        Set<Id> pestEmergencyServiceAppointmentParentIds = new Set<Id>(); //21618
        Map<Id, ServiceAppointment> pestEmergencyServiceAppointmentsValidated = new Map<Id, ServiceAppointment>(); //21618
        List<ServiceAppointment> onSiteStatusChangeSAs = new List<ServiceAppointment>();
        String workOrderPrefix = WorkOrder.SObjectType.getDescribe().getKeyPrefix();

        List<Tech_Profile_Ids_Bulk_status_change__c> validProfiles = Tech_Profile_Ids_Bulk_status_change__c.getAll().values();
        List<String> validProfileIds = new List<String>();


        for (Tech_Profile_Ids_Bulk_status_change__c validProfile : validProfiles){
            validProfileIds.add(validProfile.Profile_Id__c);
        }

        for (Service_Appointment_Same_Location_Status__c status : statuses) {
            concurrentEntryStatuses.add(status.Name);
            if (status.Considered_for_Conditional__c){
                concurrentStatuses.add(status.Name);
            }
        }

        if (validProfileIds.contains(UserInfo.getProfileId())){

            List<AssignedResource> resources = [
                    SELECT Id, ServiceResourceId, ServiceAppointmentId
                    FROM AssignedResource
                    WHERE ServiceAppointment.Status IN :concurrentEntryStatuses
                    AND ServiceAppointment.Same_Day_Appointment__c = TRUE
                    AND ServiceResource.RelatedRecordId = :UserInfo.getUserId()
                    AND (ServiceAppointment.Status != 'Completed'
                    OR ServiceAppointment.Status != 'Cannot Complete'
                    OR ServiceAppointment.Status != 'Data Error')
            ];

            for (AssignedResource resource : resources) { //Case 21626 - MD
                if (!SAtoSR.containsKey(resource.ServiceAppointmentId)) {
                    SAtoSR.put(resource.ServiceAppointmentId, new Set<Id>());
                }

                SAtoSR.get(resource.ServiceAppointmentId).add(resource.ServiceResourceId);
            }

            ServiceResourceServiceAppointments = new Map<Id, ServiceAppointment>([
                    SELECT Id, Street, City, Country, PostalCode, Status, SchedStartTime
                    FROM ServiceAppointment
                    WHERE Id IN :SAtoSR.keySet()
            ]);
        }

        SAtoSR.remove(null);
        ServiceResourceServiceAppointments.remove(null);

        for(ServiceAppointment sa : serviceAppointments){
            if (sa.Is_Pest_Emergency__c
                    && sa.Status == QueryUtils.fieldServiceSettings.Work_Order_Dispatched_Status__c
                    && sa.Status != oldMap.get(sa.Id).Status
                    && String.valueOf(sa.ParentRecordId).left(3) == workOrderPrefix)
            {
                pestEmergencyServiceAppointmentParentIds.add(sa.ParentRecordId);
                pestEmergencyServiceAppointmentsValidated.put(sa.Id, sa);
            }

            if (concurrentStatuses.contains(sa.Status) && sa.Status != oldMap.get(sa.Id).Status) { //Case 21626 - MD
                for (Id SAId : SAtoSR.keySet()) {
                    if (ServiceResourceServiceAppointments.get(SAId) == null || !SAtoSR.containsKey(sa.Id)) {
                        continue;
                    }

                    ServiceAppointment otherSA = ServiceResourceServiceAppointments.get(SAId);
                    Set<Id> cloneOfSRIds = SAtoSR.get(SAId).clone();
                    cloneOfSRIds.retainAll(SAtoSR.get(sa.Id));

                    Date otherSADate = Date.newInstance(
                            otherSA.SchedStartTime.year(),
                            otherSA.SchedStartTime.month(),
                            otherSA.SchedStartTime.day()
                    );

                    Date saDate = Date.newInstance(
                            sa.SchedStartTime.year(),
                            sa.SchedStartTime.month(),
                            sa.SchedStartTime.day()
                    );

                    if (!cloneOfSRIds.isEmpty()
                            && otherSA.Street == sa.Street
                            && otherSA.City == sa.City
                            && otherSA.Country == sa.Country
                            && otherSA.PostalCode == sa.PostalCode
                            && otherSA.Status == oldMap.get(sa.Id).Status
                            && otherSADate == saDate)
                    {
                        otherSA.Status = sa.Status;

                        if (!serviceAppointmentsMap.containsKey(otherSA.Id) && !CheckRecursive.SetOfIDs.contains(otherSA.Id)){
                            CheckRecursive.SetOfIDs.add(sa.Id);
                            onSiteStatusChangeSAs.add(otherSA);
                        }
                    }
                }
            }

            ServiceAppointment oldRecord = oldMap.get(sa.Id);

            if (sa.Status != oldRecord.Status) {
                Datetime lastTimeStamp = (sa.Time_Of_Last_Status_Change__c != null ? sa.Time_Of_Last_Status_Change__c : sa.CreatedDate);
                sa.Time_Of_Last_Status_Change__c = System.now();
                Long timeInStatus = (System.now().getTime() - lastTimeStamp.getTime()) / (1000 * 60);  //Captured in minutes
                if (oldRecord.Status == 'Dispatched') {
                    sa.Time_In_Dispatched__c = (oldRecord.Time_In_Dispatched__c != null ? oldRecord.Time_In_Dispatched__c : 0) + timeInStatus;
                } else if (oldRecord.Status == 'On Route') {
                    sa.Time_In_On_Route__c = (oldRecord.Time_In_On_Route__c != null ? oldRecord.Time_In_On_Route__c : 0) + timeInStatus;
                } else if (oldRecord.Status == 'On Site') {
                    sa.Time_In_On_Site__c = (oldRecord.Time_In_On_Site__c != null ? oldRecord.Time_In_On_Site__c : 0) + timeInStatus;
                } else if (oldRecord.Status == 'In Progress') {
                    sa.Time_In_In_Progress__c = (oldRecord.Time_In_In_Progress__c != null ? oldRecord.Time_In_In_Progress__c : 0) + timeInStatus;
                } else if (oldRecord.Status == 'On Hold') {
                    sa.Time_In_On_Hold__c = (oldRecord.Time_In_On_Hold__c != null ? oldRecord.Time_In_On_Hold__c : 0) + timeInStatus;
                }
            }
        }
        //21618
        Map<Id, ServiceAppointment> validatedServiceAppointments = WorkOrderUtil.validateServiceAppointmentPOReturnedStatus(
                pestEmergencyServiceAppointmentParentIds,
                pestEmergencyServiceAppointmentsValidated
        );
        //21618
        for (ServiceAppointment sa : validatedServiceAppointments.values()) {
            sa.addError(Label.Service_Appointment_Dispatched_PO_Not_Returned_Error);
        }

        if (!onSiteStatusChangeSAs.isEmpty()){
            update onSiteStatusChangeSAs;
        }

    }

    /**ONLY ON BEFORE UPDATE**/
    /**** ORIGIN : ServiceAppointmentSignatureUtilities class
    @Author : Ahsan
    @Purpose : Setting the Should_Auto_Generate_Service_report__c and Should_Auto_Send_Service_report__c on SA.
    ***/
    public void setSignatureFields() {
        String workOrderPrefix = WorkOrder.SObjectType.getDescribe().getKeyPrefix();
        List<ServiceAppointment> completedSAs = new List<ServiceAppointment>();

        for(ServiceAppointment sa : serviceAppointments){
            if (sa.Status != oldMap.get(sa.Id).Status
                    && sa.Status == QueryUtils.fieldServiceSettings.Service_Appointment_Completed_Status__c
                    && ((String)sa.ParentRecordId).startsWith(workOrderPrefix))
            {
                //only enter if WO is the Parent
                completedSAs.add(sa);
            }
        }

        // Query related objs
        // Changed to be Set instead of List [dk]
        Set<Id> saIds = new Set<Id>();
        Set<Id> acctIds = new Set<Id>();

        for (ServiceAppointment sa : completedSAs) {
            saIds.add(sa.Id);
            acctIds.add(sa.AccountId);
        }

        Map<Id, Account> acctMap = new Map<Id, Account>();

        //checking if empty [dk]
        if (!acctIds.isEmpty()) {
            acctMap.putAll([SELECT Id, Require_Service_Reports__c FROM Account WHERE Id IN :acctIds]);
        }

        List<ServiceReport> srs = new List<ServiceReport>();

        //checking if empty [dk]
        if (!saIds.isEmpty()) {
            srs.addAll([SELECT Id, ParentId FROM ServiceReport WHERE ParentId IN :saIds AND IsSigned = TRUE]);
        }

        Set<Id> signedSR = new Set<Id>();
        for (ServiceReport sr : srs) {
            signedSR.add(sr.ParentId);
        }

        // Check all signature required conditions
        Map<Id, Boolean> isSignatureRequiredMap = ServiceAppointmentSignatureUtilities.isSignatureRequired(completedSAs);

        for (ServiceAppointment sa : completedSAs) {

            sa.Customer_Signature_Captured__c = signedSR.contains(sa.Id);

            Account relatedAcct = acctMap.get(sa.AccountId);

            // Set is signature required field
            sa.Is_Signature_Required__c = isSignatureRequiredMap.get(sa.Id);

            // If signature is required, was not captured, and reason not given -- display error
            Boolean validReasonRequiredAndGiven = false;
            if (sa.Is_Signature_Required__c && !sa.Customer_Signature_Captured__c) {
                if (String.isBlank(sa.Signature_Not_Captured_Reason__c)) {
                    sa.Signature_Not_Captured_Reason__c.addError(Label.Signature_Required_And_Reason_Not_Given_Error_Message);
                } else if (sa.Signature_Not_Captured_Reason__c.length() < 10) {
                    sa.Signature_Not_Captured_Reason__c.addError(Label.Signature_Required_And_Reason_Too_Short_Message);
                } else {
                    validReasonRequiredAndGiven = true;
                }
            }

            // Also set auto-send and auto-gen fields
            sa.Should_Auto_Generate_Service_Report__c = !sa.ServiceReportAlreadySent__c
                    && ((sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Pest_LOB__c
                            || sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Hygiene_LOB__c)
                        || ((!sa.Is_Signature_Required__c
                            || sa.Customer_Signature_Captured__c
                            || validReasonRequiredAndGiven)
                        && (relatedAcct != null
                            && relatedAcct.Require_Service_Reports__c
                            && (sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Chemical_LOB__c
                            || sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Life_Safety_LOB__c))));

            sa.Should_Auto_Send_Service_Report__c = !sa.ServiceReportAlreadySent__c
                    && (sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Pest_LOB__c
                        || ((!sa.Is_Signature_Required__c
                                || sa.Customer_Signature_Captured__c
                                || validReasonRequiredAndGiven)
                            && (relatedAcct != null
                            && relatedAcct.Require_Service_Reports__c
                            && (sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Hygiene_LOB__c
                                || sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Chemical_LOB__c
                                || sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Life_Safety_LOB__c))));

        }

    }

    /** ON BOTH AFTER INSERT AND UPDATE**/
    /** @Author: PWC. Merged from : UpdateWorkOrderFromServiceAppointment Trigger
        @Purpose: 1) Syncs the status from the SA to the WO
        2) Updates the Service_Appointment__c on WO with the first associated SA.
        // MAY NEED TO BE SPLITTED.
        3) Updates Next_Scheduled_Appointment__c on WO with SA's SchedStartTime/DueDate
        4) Updates HasBeenDispatched__c on WO from SA
    **/
    public void updateWorkOrder(){
        String workOrderPrefix = WorkOrder.SObjectType.getDescribe().getKeyPrefix();
        Set<Order> updateOrdersSet = new Set<Order>();
        List<Order> updateOrders = new List<Order>();
        List<WorkOrder> workOrderUpdateWithSA = new List<WorkOrder>();
        Map<Id,WorkOrder> workOrders = new Map<Id,WorkOrder>();
        Map<Id,WorkOrder> workOrdersForStatusSync = new Map<Id,WorkOrder>();
        Map<Id,ServiceAppointment> sAForStatusSync = new Map<Id,ServiceAppointment>();
        Map<Id,OrderItem> updateOrderItems = new Map<Id,OrderItem>();
        Map<Id, Datetime> serviceAppointmentSchedStartDate = new Map<Id, Datetime>();
        Set<Id> workOrderSAMap = new Set<Id>();
        Map<Id, Id> saPestEmergencyIds = new Map<Id, Id>(); // case 21618
        Set<WorkOrderLineItem> workOrderLineItems = new Set<WorkOrderLineItem>();

        for(ServiceAppointment sa : serviceAppointments){
            ServiceAppointment oldRec = (Trigger.isInsert ? new ServiceAppointment() : oldMap.get(sa.Id));

            if(sa.ParentRecordId != null && String.valueOf(sa.ParentRecordId).startsWithIgnoreCase(workOrderPrefix)) {
                if(sa.IsOpen__c) {
                    workOrders.put(sa.ParentRecordId,null);
                }

                if(Trigger.isUpdate
                        && sa.RecordTypeId != QueryUtils.fieldServiceSettings.SA_Vehicle_Inspection_Record_Type_Id__c
                        && !sa.Status_UnSync_WO_SA__c
                        && (sa.Status_UnSync_WO_SA__c!=oldRec.Status_UnSync_WO_SA__c
                            || sa.Status != oldRec.Status))
                {
                    workOrdersForStatusSync.put(sa.ParentRecordId, null);
                    sAForStatusSync.put(sa.ParentRecordId, sa);
                }

                if(sa.ParentRecordId!=oldRec.ParentRecordId) {
                    workOrderSAMap.add(sa.ParentRecordId);
                    workOrderSAMap.add(oldRec.ParentRecordId);
                }
            }

            // SERVICE APPOINTMENT MULTI-RES SENDING CUSTOMER NOTIFICATIONS LOGIC
            // logic to send 1 hour after creation date of SA, fires once dispatched
            // if this is toggled, please also activate the related workflow rule to have logic function -> Send Pest Emergency Dispatch Notification
            if (QueryUtils.fieldServiceSettings.Activate_Pest_Emergency_Email_Logic__c
                    && sa.Send_Pest_Emergency_Dispatch_Not__c
                    && !oldRec.Send_Pest_Emergency_Dispatch_Not__c)
            {
                saPestEmergencyIds.put(sa.ParentRecordId, sa.Id);
            }
        }

        workOrdersForStatusSync.remove(null);
        sAForStatusSync.remove(null);
        workOrderSAMap.remove(null);
        saPestEmergencyIds.remove(null); //AD: COMMENTING - related to multires

        //21618, send room emails immediately [dk], March 24, 2019 //AD: COMMENTING - related to multires
        if (!saPestEmergencyIds.isEmpty()) {
            sendMultiResNotifications(new Set<Id>(saPestEmergencyIds.values()));
        }

        //21618, getting related ServiceAppointments that are from the Emergency Dispatch Wizard to control status shifting in the event of multiple ServiceAppointment records
        workOrdersForStatusSync = new Map<Id, WorkOrder>([
                SELECT Id, Status, WorkOrderNumber,
                    (SELECT Id, Is_Pest_Emergency__c, ParentRecordId, Status
                    FROM ServiceAppointments
                    WHERE Is_Pest_Emergency__c = TRUE
                    AND Status != :QueryUtils.fieldServiceSettings.Service_Appointment_Completed_Status__c)
                FROM WorkOrder
                WHERE Id IN :workOrdersForStatusSync.keySet()
        ]);

        for (WorkOrder wo : workOrdersForStatusSync.values()) {
            ServiceAppointment sa = sAForStatusSync.get(wo.Id);

            if (sa != null) {
                wo.Status = sa.Status;
            }
        }

        update workOrdersForStatusSync.values();

        //case 21537 - append first SA onto WO [dk]
        if (!workOrderSAMap.isEmpty()) {
            List<WorkOrder> wos = [
                    SELECT Id, Service_Appointment__c,
                            (SELECT Id
                            FROM ServiceAppointments
                            ORDER BY CreatedDate
                            LIMIT 1)
                    FROM WorkOrder
                    WHERE Id IN :workOrderSAMap
            ];

            for (WorkOrder wo : wos) {
                if(wo.ServiceAppointments.isEmpty()) {
                    workOrderUpdateWithSA.add(new WorkOrder(Id=wo.Id, Service_Appointment__c=null));
                } else {
                    workOrderUpdateWithSA.add(new WorkOrder(
                            Id = wo.Id,
                            Service_Appointment__c = wo.ServiceAppointments.get(0).Id
                    ));
                }
            }
        }

        if (!workOrderUpdateWithSA.isEmpty()) {
            update workOrderUpdateWithSA;
        }

        if (!workOrders.isEmpty()) {
            List<WorkOrder> wos = [
                    SELECT Id, Next_Scheduled_Appointment__c, HasBeenDispatched__c, Emergency__c, Type__c, StartDate,
                            (SELECT Id, IsPending__c, IsOpen__c, IsDispatched__c, DueDate, SchedStartTime, SchedEndTime,
                                    Status
                            FROM ServiceAppointments
                            WHERE IsOpen__c = TRUE
                            ORDER BY DueDate)
                    FROM WorkOrder
                    WHERE Id IN :workOrders.keySet()
                    ORDER BY Order__c NULLS LAST
            ];

            for (WorkOrder wo : wos) {
                WorkOrder updatedWo = new WorkOrder(Id = wo.Id, HasBeenDispatched__c = false);
                Datetime lastInflightDate;

                for (ServiceAppointment sa : wo.ServiceAppointments) {
                    if (updatedWo.Next_Scheduled_Appointment__c == null && sa.IsPending__c) {
                        updatedWo.Next_Scheduled_Appointment__c = sa.SchedStartTime != null ? sa.SchedStartTime : sa.DueDate;
                    }

                    if (sa.IsDispatched__c) {
                        updatedWo.HasBeenDispatched__c = sa.IsDispatched__c;

                        if(sa.Status == 'Dispatched') {
                            lastInflightDate = sa.SchedStartTime != null ? sa.SchedStartTime : wo.StartDate;
                        }
                    }
                }

                if (wo.Next_Scheduled_Appointment__c != updatedWo.Next_Scheduled_Appointment__c
                        || wo.HasBeenDispatched__c != updatedWo.HasBeenDispatched__c)
                {
                    if(updatedWo.HasBeenDispatched__c && lastInflightDate != null) {
                        serviceAppointmentSchedStartDate.put(wo.Id, lastInflightDate);
                    }

                    workOrders.put(wo.Id, updatedWo);
                } else {
                    workOrders.remove(wo.Id);
                }
            }

            if (!workOrders.isEmpty()) {
                update workOrders.values();
            }

            if (!serviceAppointmentSchedStartDate.isEmpty()) {
                List<WorkOrderLineItem> wolis = [
                        SELECT Id, LineItemNumber, Order_Product__c, Order_Product__r.Id,
                                Order_Product__r.OrderItemNumber, Order_Product__r.Valid_for_Install_Remove_Replace__c,
                                Type_of_Service__c, Order_Product__r.Last_Automation_Created_Date__c,
                                Order_Product__r.Last_InFlight_WO_Date__c, Order_Product__r.Active__c,Order_Product__r.Installation_Status__c,
                                WorkOrder.StartDate, WorkOrderId, WorkOrder.WorkOrderNumber, OrderId, Order.Status,
                                Order.RecordTypeId, WorkOrder.Type__c, WorkOrder.HasBeenDispatched__c,
                                WorkOrder.Emergency__c, WorkOrder.HasBeenRescheduled__c, Service_Frequency__c
                        FROM WorkOrderLineItem
                        WHERE Order_Product__c != NULL
                        AND WorkOrder.HasBeenDispatched__c = TRUE
                        AND Order_Product__r.Active__c = TRUE
                        AND (NOT(WorkOrder.HasBeenRescheduled__c = TRUE AND Service_Frequency__c != 'One-Time'))
                        AND WorkOrderId IN :serviceAppointmentSchedStartDate.keySet()
                        ORDER BY WorkOrderId
                ];

                for (WorkOrderLineItem woli : wolis) {
                    if (woli.WorkOrder.HasBeenDispatched__c) {
                        if (woli.Order.Status == QueryUtils.fieldServiceSettings.Order_Active_Stage__c) {
                            updateOrdersSet.add(woli.Order);
                        }
                        if (!woli.WorkOrder.Emergency__c && woli.WorkOrder.Type__c!='Follow-Up') {
                            workOrderLineItems.add(woli);
                            OrderItem oi = updateOrderItems.get(woli.Order_Product__c);

                            Date startDate;

                            if(serviceAppointmentSchedStartDate.get(woli.WorkOrderId) != null) {
                                startDate = serviceAppointmentSchedStartDate.get(woli.WorkOrderId).date();
                            } else {
                                startDate = woli.WorkOrder.StartDate.date();
                            }

                            Boolean isRegularService = true;

                            if (oi == null) {
                                oi = woli.Order_Product__r;
                                updateOrderItems.put(oi.Id, oi);
                            }
	
                            //System.debug('***VALID INSTALL REMOVE REPLACE FLAG BEFORE***' + oi.Valid_for_Install_Remove_Replace__c);
                            if (woli.Type_of_Service__c != 'Service' && woli.Type_of_Service__c != 'Delivery') {
                                //oi.Valid_for_Install_Remove_Replace__c = false;
                                isRegularService =  false;
                            }
                            System.debug('***woli.Type_of_Service__c***' + woli.Type_of_Service__c);

                            if (oi.Last_InFlight_WO_Date__c == null || (oi.Last_InFlight_WO_Date__c < startDate && isRegularService)) {
                                if (woli.Type_of_Service__c == 'Service' || woli.Type_of_Service__c == 'Delivery'){
                                    System.debug('--LAST INFLIGHT DATE--' + startDate);
                                    oi.Last_InFlight_WO_Date__c = startDate;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (!updateOrdersSet.isEmpty()) {
            updateOrders.addAll(updateOrdersSet);
        }

        for(Order o : updateOrders) {
            if(o.RecordTypeId == QueryUtils.fieldServiceSettings.Regular_Order_Record_Type_Id__c) {
                o.Status = QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c;
            } else {
                o.Status = QueryUtils.fieldServiceSettings.Shopping_Cart_Order_Draft_Stage__c;
            }
        }
        TriggerHandler.bypass('OrderTriggerHandler');
        update updateOrders;
        TriggerHandler.clearBypass('OrderTriggerHandler');

        update updateOrderItems.values();

        for(Order o : updateOrders) {
            o.Status = QueryUtils.fieldServiceSettings.Order_Active_Stage__c;
        }

        TriggerHandler.bypass('OrderTriggerHandler');
        update updateOrders;
        TriggerHandler.clearBypass('OrderTriggerHandler');

    }

    /**
    @Author : Aieleeta
    @Purpose : Method to pass data and call createSendServiceReport()
    @Origin : New
    @Event :  AFTER UPDATE
    **/
    public void callCreateSendServiceReport(){
        Set<Id> completedSAParentIds = new Set<Id>();
        List<ServiceAppointment> completedSAs = new List<ServiceAppointment>();
        String workOrderPrefix = WorkOrder.SObjectType.getDescribe().getKeyPrefix();
        
        for(ServiceAppointment sa : serviceAppointments){
            ServiceAppointment oldRec = oldMap.get(sa.Id);

            if (sa.Status != oldRec.Status){
                if (sa.Status == QueryUtils.fieldServiceSettings.Service_Appointment_Completed_Status__c && ((String)sa.ParentRecordId).startsWith(workOrderPrefix)){
                    completedSAParentIds.add(sa.ParentRecordId);
                    completedSAs.add(sa);
                }
            }
        }

        Set<Id> saAutoGenerateSendReports = new  Set<Id>();

        for (ServiceAppointment sa : completedSAs){
            if (sa.Should_Auto_Generate_Service_Report__c || sa.Should_Auto_Send_Service_Report__c) {
                saAutoGenerateSendReports.add(sa.Id);
            }

            if (!saAutoGenerateSendReports.isEmpty() && !System.isFuture()) {
                createSendServiceReport(saAutoGenerateSendReports, completedSAParentIds, UserInfo.getSessionId());
            }
        }
    }
    
    /*
    @Author : PWC
    @ Origin : ServiceAppointmentFutureCalls
    @ Event : AFTER UPDATE
    @ Purpose : For every completed SA,if Should_Auto_Generate_Service_report__c is true, and there is no associated service report, it generates a service report.
    If Should_Auto_Send_Service_report__c on SA is true, the service report is emailed to the related contact on the SA.
    */
    @Future(Callout=true)
    public static void createSendServiceReport(
            Set<Id> saAutoGenerateSendReports,
            Set<Id> completedSAParentIds,
            String passedSessionId)
    {
        Map<Id, Id> serviceAppointmentReportMap = new Map<Id, Id>();
        
        List<Contact> donotReplyCon = [SELECT Id, Email FROM Contact WHERE Email =:QueryUtils.fieldServiceSettings.CitronDoNotReply__c LIMIT 1];
        Id noReplyConId = null;
        if(donotReplyCon.size()>0){noReplyConId = donotReplyCon[0].Id;}
        
        Id englishEmailTemplateId = QueryUtils.fieldServiceSettings.ServiceReportTemplateId__c;
        Id frenchEmailTemplateId = QueryUtils.fieldServiceSettings.ServiceReportTemplateFrenchId__c;
        Id emailTemplateId = englishEmailTemplateId;
        Id orgWideAddress = QueryUtils.fieldServiceSettings.Org_Wide_Email_Address__c;
        
        Map<Id, ServiceAppointment> completedSAMap =  new Map<Id, ServiceAppointment>();
        Map<Id, WorkOrder> workOrderMap = new Map<Id, WorkOrder>();
        
        if (!saAutoGenerateSendReports.isEmpty()) {
            completedSAMap.putAll([
                    SELECT Id, AppointmentNumber, ParentRecordId, ContactId, ServiceReportAlreadySent__c,
                            Should_Auto_Generate_Service_Report__c, Should_Auto_Send_Service_Report__c,
                			Notification_Language_Locale_Key__c
                    FROM ServiceAppointment
                    WHERE Id IN :saAutoGenerateSendReports
            ]);
        }

        if (!completedSAParentIds.isEmpty()) {
            workOrderMap.putAll([SELECT Id, ServiceReportTemplateId FROM WorkOrder WHERE Id IN :completedSAParentIds]);
        }

        if (!saAutoGenerateSendReports.isEmpty()) {
            for(ServiceReport sr : [SELECT Id, ParentId, CreatedDate, DocumentBody, ContentVersionDocumentId 
                                    FROM ServiceReport WHERE ParentId IN :saAutoGenerateSendReports ORDER BY CreatedDate DESC]) 
            {
                serviceAppointmentReportMap.put(sr.ParentId, sr.ContentVersionDocumentId);
            }
        }
        
        Messaging.SingleEmailMessage[] emails = new Messaging.SingleEmailMessage[]{};
            
        for (ServiceAppointment sa : completedSAMap.values()) {
            Id reportId = serviceAppointmentReportMap.get(sa.Id);
            String content; // AD update

            if (reportId == null && sa.Should_Auto_Generate_Service_Report__c) {

                if (!Test.isRunningTest()) {
                    content = Page.SessionId.getContent().toString();
                } else {
                    content = 'Start_Of_Session_Id5End_Of_Session_Id';
                }
                
                Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length();
                Integer e = content.indexOf('End_Of_Session_Id');

                passedSessionId = content.substring(s, e);

                Http http = new Http();
                HttpRequest request = new HttpRequest();
                request.setEndpoint('callout:ServiceReportCreate/services/data/v43.0/actions/standard/createServiceReport');
                request.setMethod('POST');
                request.setHeader('Content-Type', 'application/json;charset=UTF-8');
                request.setHeader('Authorization', 'OAuth ' + passedSessionId); //This was fun
                request.setBody(
                        '{"inputs" : [ {"entityId" : "' + sa.Id + '","templateId" : "'
                        + workOrderMap.get(sa.ParentRecordId).ServiceReportTemplateId + '" } ]}'
                );
                HttpResponse response = http.send(request);

                if (response.getStatusCode() != 201 && response.getStatusCode() != 200) {
                    System.debug('The status code returned was not expected: ' + response.getStatusCode() + ', ' + response.getStatus());
                } else {
                    String srId = response.getBody().substring(response.getBody().indexOf('"contentVersionId":"') +
                            20,response.getBody().indexOf('","entityId"'));
                    serviceAppointmentReportMap.put(sa.Id, srId);
                }
            }

            if(sa.Should_Auto_Send_Service_Report__c) {
                reportId = serviceAppointmentReportMap.get(sa.Id);
                
                if (sa.Notification_Language_Locale_Key__c == 'fr'){
                    emailTemplateId = frenchEmailTemplateId;
                }
                else {
                    emailTemplateId = englishEmailTemplateId;
                }

                if (reportId != null) {
                    if (sa.ContactId != null){
                        emails.add(ServiceAppointmentFutureCalls.sendSREmail(sa.ContactId, reportId, emailTemplateId, orgWideAddress));
                    } else {
                        if(noReplyConId!=null){
                          emails.add(ServiceAppointmentFutureCalls.sendSREmail(noReplyConId, reportId, emailTemplateId, orgWideAddress));
                        }
                    }
                }
            }
        }
        
        try {
            if (emails.size() > 0){
                Messaging.sendEmail(emails, false);

                for (ServiceAppointment sa : completedSAMap.values()){
                    sa.ServiceReportAlreadySent__c = true;
                }

                update completedSAMap.values();
            }
        } catch (Exception exc){
            System.debug('Emails Failed: ' + exc.getMessage());
        }
    }

    public void sendMultiResNotifications(Set<Id> setSA){
        List<ServiceAppointment> serviceAppointments = [
                SELECT Id, Type__c, Line_Of_Business__c, Scheduled_Start_Date__c, AccountId, Account__c,
                        Account.AccPac_Account__c, Address, ParentRecordId, Street, City, Country, PostalCode,
                        ContactId, Contact.Email
                FROM ServiceAppointment
                WHERE Id IN :setSA
        ];

        //changed to check if empty [dk]
        if (serviceAppointments.isEmpty()) return;

        Map<Id,Id> serviceAppointmentIdByWorkOrderId = new Map<Id,Id>();

        for(ServiceAppointment sa : serviceAppointments) {
            serviceAppointmentIdByWorkOrderId.put(sa.ParentRecordId, sa.Id);
        }

        List<WorkOrder> wos = [
                SELECT Id,
                    (SELECT Id, Name, Work_Order__c
                    FROM Work_Order_Rooms__r
                    ORDER BY Name ASC),
                    (SELECT Id, Order__c, Order__r.ShipToContact.Email
                    FROM Related_Work_Orders__r)
                FROM WorkOrder
                WHERE Id IN :serviceAppointmentIdByWorkOrderId.keySet()
        ];

        Map<Id,Set<String>> emailsByServiceAppointmentId = new Map<Id,Set<String>>();
        Map<Id,String> mapWOToWORoom = new Map<Id,String>();

        for(WorkOrder wo : wos){
            for(Related_Work_Order__c rwo : wo.Related_Work_Orders__r) {
                emailsByServiceAppointmentId.get(serviceAppointmentIdByWorkOrderId.get(wo.Id)).add(rwo.Order__r.ShipToContact.Email);
            }

            for (Work_Order_Room__c woRoom : wo.Work_Order_Rooms__r) {
                if (mapWOToWORoom.containsKey(woRoom.Work_Order__c)) {
                    mapWOToWORoom.put(woRoom.Work_Order__c, mapWOToWORoom.get(woRoom.Work_Order__c) + '</br>' + woRoom.Name);
                } else {
                    mapWOToWORoom.put(woRoom.Work_Order__c,'<br/>'+woRoom.Name);
                }
            }
        }

        List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();
        List<EmailMessage> listEmailMessage = new List<EmailMessage>();

        for (ServiceAppointment sa : serviceAppointments) {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();

            // split addresses into groups of 150 to accommodate setToAddress() limits
            List<String> allAddresses = new List<String>();
            if(emailsByServiceAppointmentId.containsKey(sa.Id)){allAddresses.addAll(emailsByServiceAppointmentId.get(sa.Id));}

            List<List<String>> toAddressesList = new List<List<String>>();

            for(Integer i = 0; i < allAddresses.size(); i++) {
                Integer idx = i / 150;

                List<String> toAddresses;

                try {
                    toAddresses = toAddressesList[idx];
                    toAddresses.add(allAddresses[i]);
                    toAddressesList[idx] = toAddresses;
                } catch(Exception e) {
                    // create a new sub list if index is out of bounds
                    toAddresses = new List<String>{allAddresses[i]};
                    toAddressesList.add(toAddresses);
                }
            }

            String replyTo = QueryUtils.fieldServiceSettings.Customer_Success_Email_Id__c;

            for(List<String> toAddresses : toAddressesList) {
                String subject = 'Your ' + sa.Line_Of_Business__c + ' appointment has been scheduled with Citron Hygiene!';
                String body = '<html><body><font size="+2"><font-family: "Verdana">Dear Customer, <br/><br/><br/>' +
                        'This email confirms that a ' + '<b>' + sa.Line_Of_Business__c + '</b>' +
                        ' appointment has been scheduled on '+ sa.Scheduled_Start_Date__c +
                        ' for Customer Account Number ' + sa.Account.AccPac_Account__c + '<br/><br/>' +
                        'This service will take place at :<br/><br/>' + sa.Street + '<br/>' + sa.City + '&nbsp;' +
                        sa.PostalCode + '<br/>' + sa.Country + '<br/><br/><br/> In the following areas:</br></br>' +
                        mapWOToWORoom.get(sa.ParentRecordId) + '<br/><br/> If you have any questions regarding this ' +
                        'appointment, please reach out to our Customer Success team and a representative would be happy to ' +
                        'assist you.<br/><br/> Regards,<br/><br/></font></body></html><html></html>' +
                        '<html><body><font-family: verdana><font size="+2"><b><p style="color:royalblue;">' +
                        'Citron Hygiene Customer Success Department</p></b></font></font><font size="+2">' +
                        '<p style="color:yellowgreen;">800.643.6922</p></font><font size="+1"><b><p style="color:blue;">' +
                        'customersuccess@citronhygiene.com</p></b></font></body></html>'+'<html><body>' +
                        '<img src="https://citronhygiene.lightning.force.com/servlet/' +
                        'servlet.ImageServer?id=0153Z000003nUsJQAU&oid=00Dj0000001oMa6EAE" /></body></html> ';

                if (String.isNotBlank(sa.Line_Of_Business__c)) {
                    mail.setSubject(subject);
                    mail.setHtmlBody(body);
                }

                mail.setToAddresses(toAddresses);
                mail.setReplyTo(replyTo);
                mail.setOrgWideEmailAddressId(QueryUtils.fieldServiceSettings.Customer_Success_OWA_Id__c);
                mails.add(mail);

                for(String email : toAddresses) {
                    EmailMessage emailMessage = new EmailMessage();
                    emailMessage.Status = '3';
                    emailMessage.RelatedToId = sa.Id;
                    emailMessage.FromAddress = replyTo;
                    emailMessage.Subject = subject;
                    emailMessage.HtmlBody = body;
                    emailMessage.ToAddress = email;

                    listEmailMessage.add(emailMessage);
                }
            }
        }

        if(!Test.isRunningTest()){
            Messaging.sendEmail(mails,true);
        }

        insert listEmailMessage;
    }
}