trigger SetServiceAppointmentFields on ServiceAppointment (before insert, before update) {
    System.debug('SA Line Items Before Trigger');
    
    Map<Id, Account> accMap = new Map<Id, Account>();
    Map<Id, WorkOrder> woMap = new Map<Id, WorkOrder>();
    Map<Id, WorkOrder> completedWoMap = new Map<Id, WorkOrder>();
    Map<Id, WorkOrder> woSAStatusSyncMap = new Map<Id, WorkOrder>();
    Map<Id, WorkOrderLineItem> woliMap = new Map<Id, WorkOrderLineItem>();
    Map<Id, Opportunity> oppMap = new Map<Id, Opportunity>();
    Map<Id, Asset> astMap = new Map<Id, Asset>();
    Set<Id> SAsWithSignedSRs = new Set<Id>();
    Map<Id, Set<Id>> SAtoSR = new Map<Id, Set<Id>>();
    Map<Id, ServiceAppointment> ServiceResourceServiceAppointments = new Map<Id, ServiceAppointment>();
    List<ServiceAppointment> onSiteStatusChangeSAs = new List<ServiceAppointment>();
    List<Service_Appointment_Same_Location_Status__c> statuses = Service_Appointment_Same_Location_Status__c.getAll().values();
    Set<String> concurrentStatuses = new Set<String>();
    Set<String> concurrentEntryStatuses = new Set<String>();
    
    List<Id> SAFutureIds = new List<Id>();
    
    List<ServiceAppointment> completedSAs = new List<ServiceAppointment>();
    
    Set<Id> SANotificationIds = new Set<Id>();
    
    Messaging.SingleEmailMessage[] emails = new Messaging.SingleEmailMessage[]{};
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    /* Aleena */
    Set<Id> saAutoGenerateSendReportIds = new  Set<Id>();
    Set<Id> completedSAParentIds = new Set<Id>();
    /* Aleena */
    
    String accountPrefix = Account.sobjecttype.getDescribe().getKeyPrefix();
    String workOrderPrefix = WorkOrder.sobjecttype.getDescribe().getKeyPrefix();
    String workOrderLineItemPrefix = WorkOrderLineItem.sobjecttype.getDescribe().getKeyPrefix();
    String opportunityPrefix = Opportunity.sobjecttype.getDescribe().getKeyPrefix();
    String assetPrefix = Asset.sobjecttype.getDescribe().getKeyPrefix();
    
    if (Trigger.isUpdate && Trigger.isBefore){
        List<Tech_Profile_Ids_Bulk_status_change__c> validProfiles = Tech_Profile_Ids_Bulk_status_change__c.getAll().values();
        List<String> validProfileIds = new List<String>();
        for (Tech_Profile_Ids_Bulk_status_change__c validProfile : validProfiles){
            validProfileIds.add(validProfile.Profile_Id__c);
        }
        
        for (Service_Appointment_Same_Location_Status__c status : statuses) {
            concurrentEntryStatuses.add(status.Name);
            if (status.Considered_For_Conditional__c){
                concurrentStatuses.add(status.Name);
            }
        }
        
        if (validProfileIds.contains(UserInfo.getProfileId())){
            for (AssignedResource AR : [SELECT ID, ServiceResourceId, ServiceAppointmentId FROM AssignedResource WHERE ServiceAppointment.Status IN: concurrentEntryStatuses AND ServiceAppointment.Same_Day_Appointment__c = TRUE]){ //Case 21626 - MD       
                if (!SAtoSR.containsKey(AR.ServiceAppointmentId)){
                    SAtoSR.put(AR.ServiceAppointmentId, new Set<Id>());
                }
                SAtoSR.get(AR.ServiceAppointmentId).add(AR.ServiceResourceId);
            }
            ServiceResourceServiceAppointments = new Map<Id, ServiceAppointment>([SELECT Id, Street, City, Country, PostalCode, Status, SchedStartTime FROM ServiceAppointment WHERE Id IN: SAtoSR.keySet()]);
            
            for (ServiceReport sr : [SELECT ParentId, IsSigned FROM ServiceReport WHERE ParentId IN :Trigger.New AND IsSigned = true ORDER BY CreatedDate DESC]){
                SAsWithSignedSRs.add(sr.ParentId);
            }
        } 
    }
            
    SAtoSR.remove(null);
    ServiceResourceServiceAppointments.remove(null);
    
    for (ServiceAppointment sa : Trigger.new) { 

        ServiceAppointment oldRec = (Trigger.isInsert ? new ServiceAppointment() : Trigger.oldMap.get(sa.Id));
        if(Trigger.isUpdate){
             if (concurrentStatuses.contains(sa.Status) && sa.Status != oldRec.Status){ //Case 21626 - MD
                System.debug('SATOSRMAP: ' + SAtoSR.keyset());
                System.debug('ServiceResourceServiceAppointments: ' + ServiceResourceServiceAppointments.keyset());
                
                for (Id SAId : SAtoSR.keyset()){
                    if (ServiceResourceServiceAppointments.get(SAId) == null || !SAtoSR.containsKey(sa.Id)) {
                        continue;
                    }
                    
                    ServiceAppointment otherSA = ServiceResourceServiceAppointments.get(SAId);
                    Set<Id> SRIds = SAtoSR.get(SAId);
                    Set<Id> cloneOfSRIds = SAtoSR.get(SAId).Clone();
                    cloneOfSRIds.retainAll(SAtoSR.get(sa.Id));
                    
                    if (!cloneOfSRIds.isEmpty() && otherSA.Street == sa.Street && otherSA.City == sa.City && otherSA.Country == sa.Country && otherSA.PostalCode == sa.PostalCode && otherSA.Status == oldRec.Status && date.newinstance(otherSA.SchedStartTime.year(), otherSA.SchedStartTime.month(), otherSA.SchedStartTime.day()) == date.newinstance(sa.SchedStartTime.year(), sa.SchedStartTime.month(), sa.SchedStartTime.day())){
                        otherSA.Status = sa.Status;
                        
                        if (!trigger.newMap.containsKey(otherSA.Id) && !checkRecursive.SetOfIDs.contains(otherSA.Id)){
                            System.debug('otherSA: ' + checkRecursive.SetOfIDs);
                            checkRecursive.SetOfIDs.add(sa.Id);
                            onSiteStatusChangeSAs.add(otherSA);
                        }
                    }
                }
            }
            if (sa.Email_Sent__c == true && sa.Email_Sent__c != oldRec.Email_Sent__c){ //Case 21616 - MD
                SANotificationIds.add(SA.Id);
            }
            if (sa.Status != oldRec.Status) {
                if (sa.Status == dataSets.Service_Appointment_Completed_Status__c && ((String)sa.ParentRecordId).startsWith(workOrderPrefix)){ //only enter if WO is the Parent
                    /* This logic performed below via ServiceAppointmentSignatureUtilities.setSignatureFields()
                      if(!sa.Customer_Signature_Captured__c && sa.Signature_Required__c) {
                        sa.Customer_Signature_Captured__c.addError(Label.Signature_Required_Error_Message);
                    }*/
                    completedSAParentIds.add(sa.ParentRecordId);
                    completedSAs.add(sa);
                }
                DateTime lastTimeStamp = (sa.Time_Of_Last_Status_Change__c != null ? sa.Time_Of_Last_Status_Change__c : sa.CreatedDate);
                sa.Time_Of_Last_Status_Change__c = System.now();
                Long timeInStatus = (System.now().getTime() - lastTimeStamp.getTime()) / (1000 * 60);  //Captured in minutes
                if (oldRec.Status == 'Dispatched') {
                    sa.Time_In_Dispatched__c = (oldRec.Time_In_Dispatched__c != null ? oldRec.Time_In_Dispatched__c : 0) + timeInStatus;
                } else if (oldRec.Status == 'On Route') {
                    sa.Time_In_On_Route__c = (oldRec.Time_In_On_Route__c != null ? oldRec.Time_In_On_Route__c : 0) + timeInStatus;
                } else if (oldRec.Status == 'On Site') {
                    sa.Time_In_On_Site__c = (oldRec.Time_In_On_Site__c != null ? oldRec.Time_In_On_Site__c : 0) + timeInStatus;
                } else if (oldRec.Status == 'In Progress') {
                    sa.Time_In_In_Progress__c = (oldRec.Time_In_In_Progress__c != null ? oldRec.Time_In_In_Progress__c : 0) + timeInStatus;
                } else if (oldRec.Status == 'On Hold') {
                    sa.Time_In_On_Hold__c = (oldRec.Time_In_On_Hold__c != null ? oldRec.Time_In_On_Hold__c : 0) + timeInStatus;
                }
            }
        } else {
            sa.FSL__Schedule_over_lower_priority_appointment__c = true;
        }
        
        //set actual dates - 21531 [dk]
        if (sa.Status == dataSets.Service_Appointment_Arrived_Status__c && oldRec.Status != sa.Status && sa.ActualStartTime == null) {
            sa.ActualStartTime = DateTime.now();
        } else if (new String[] {dataSets.Service_Appointment_Completed_Status__c, dataSets.Cannot_Complete_Status_Value__c}.contains(sa.Status) && oldRec.Status != sa.Status && sa.ActualEndTime == null) {
            sa.ActualEndTime = DateTime.now();
        }
        
        if (sa.ParentRecordId != null && sa.RecordTypeId!=dataSets.SA_Vehicle_Inspection_Record_Type_Id__c) {
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
        if (sa.SchedStartTime!=null) {
            sa.Scheduled_Start_Date__c = sa.SchedStartTime.format('EEE, MMM d yyyy');
            Integer dayOfWeek = math.MOD(Date.newInstance(1900, 1, 7).daysBetween(sa.SchedStartTime.date()),7);
            
            if (dayOfWeek == 0) {
                sa.Customer_Notification_Time__c = DateTime.newInstance(sa.SchedStartTime.year(), sa.SchedStartTime.month(), sa.SchedStartTime.day() - 1, 6, 0, 0);
            } else if ((dayOfWeek == 1) || (dayOfWeek == 2 && sa.Require_48_Hour_Notification__c)) {
                sa.Customer_Notification_Time__c = DateTime.newInstance(sa.SchedStartTime.year(), sa.SchedStartTime.month(), sa.SchedStartTime.day() - 2, 6, 0, 0);
            } else {
                sa.Customer_Notification_Time__c = DateTime.newInstance(sa.SchedStartTime.year(), sa.SchedStartTime.month(), sa.SchedStartTime.day(), 6, 0, 0);
            }
        }
    }
    /**if (!SANotificationIds.isEmpty() && !System.isBatch() && !System.isFuture()){
        ServiceAppointmentFutureCalls.sendCongaNotificationEmails(SANotificationIds);
    }**/
    
    if (!onSiteStatusChangeSAs.isEmpty()){
        update onSiteStatusChangeSAs;
    }
    
    // Check if signature was required, and if so, was it captured or a reason given etc.
    if (!completedSAs.isEmpty()) {
        ServiceAppointmentSignatureUtilities.setSignatureFields(completedSAs);
    }
    
    for (ServiceAppointment sa : completedSAs){

        System.debug('>>SA Number: ' + sa.AppointmentNumber + ' | SA Should AutoGenerate:' + sa.Should_Auto_Generate_Service_report__c + ' | SA Should AutoSend: ' + sa.Should_Auto_Send_Service_report__c);
        if(sa.Should_Auto_Generate_Service_report__c || sa.Should_Auto_Send_Service_report__c) {
            saAutoGenerateSendReportIds.add(sa.Id);
        }  
    }
    
    if (!saAutoGenerateSendReportIds.isEmpty() && !System.isBatch() && !System.isFuture()){
        ServiceAppointmentFutureCalls.createSendServiceReport(saAutoGenerateSendReportIds, completedSAParentIds, userInfo.getSessionId());
    }
    
    if (!accMap.isEmpty()) {
        for (Account a : [SELECT Id, Shipping_Suite_Number__c, ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry FROM Account WHERE Id IN :accMap.keyset()]) {
            accMap.put(a.Id, a);
        }
    }
    
    if (!woMap.isEmpty()) {
        for (WorkOrder wo : [SELECT Id, Suite_Number__c, Street, City, State, PostalCode, Country, AccountId, Status FROM WorkOrder WHERE Id IN :woMap.keyset()]) {
            woMap.put(wo.Id, wo);
        }
    }
    
    if (!woliMap.isEmpty()) {
        for (WorkOrderLineItem li : [SELECT Id, Suite_Number__c, Street, City, State, PostalCode, Country, WorkOrder.AccountId FROM WorkOrderLineItem WHERE Id IN :woliMap.keyset()]) {
            woliMap.put(li.Id, li);
        }
    }
    
    if (!oppMap.isEmpty()) {
        for (Opportunity op : [SELECT Id, AccountId, Account.Shipping_Suite_Number__c, Account.ShippingStreet, Account.ShippingCity, Account.ShippingState, Account.ShippingPostalCode, 
                               Account.ShippingCountry FROM Opportunity WHERE Id IN :oppMap.keyset()]) 
        {
            oppMap.put(op.Id, op);
        }
    }
    
    if (!astMap.isEmpty()) {
        for (Asset ast : [SELECT Id, AccountId, Account.Shipping_Suite_Number__c, Account.ShippingStreet, Account.ShippingCity, Account.ShippingState, Account.ShippingPostalCode, 
                          Account.ShippingCountry FROM Asset WHERE Id IN :astMap.keyset()]) 
        {
            astMap.put(ast.Id, ast);
        }
    }
    
    for (ServiceAppointment sa : Trigger.new) {
        ServiceAppointment oldRec = (Trigger.isInsert ? new ServiceAppointment() : Trigger.oldMap.get(sa.Id));
        if (sa.ParentRecordId != null) {
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
                        sa.Country = wo.Country ;
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

    /*if(Trigger.isUpdate && Trigger.isBefore){
        ServiceAppointmentFutureCalls.sendNotificationEmails(Trigger.new,Trigger.OldMap);
        
    }*/
}