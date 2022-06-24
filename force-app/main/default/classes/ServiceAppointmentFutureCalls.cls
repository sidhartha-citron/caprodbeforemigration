global class ServiceAppointmentFutureCalls {
    
    @Future
    global static void statusSyncMethod(Set<String> statusSyncSAIds) {
        if (!statusSyncSAIds.isEmpty()) {
            
            List<WorkOrder> workOrders = new List<WorkOrder>();
            
            Map<Id,ServiceAppointment> serviceAppointmentsWOMap = new Map<Id, ServiceAppointment>();

            List<ServiceAppointment> sas = [
                    SELECT Id, Status, ParentRecordId, Status_WO_SA__c, Status_UnSync_WO_SA__c, AppointmentNumber
                    FROM ServiceAppointment
                    WHERE Id IN :statusSyncSAIds
                    AND Status_UnSync_WO_SA__c = FALSE
            ];

            for (ServiceAppointment sa: sas) {
                serviceAppointmentsWOMap.put(sa.ParentRecordId, sa);
            }

            List<WorkOrder> wos = [
                    SELECT Id, Status, WorkOrderNumber
                    FROM WorkOrder
                    WHERE Id IN :serviceAppointmentsWOMap.keySet()
            ];

            for(WorkOrder wo : wos) {
                ServiceAppointment sa = serviceAppointmentsWOMap.get(wo.Id);
                
                if(sa != null) {
                    wo.Status = sa.Status;
                    workOrders.add(wo);
                }
            }
            upsert workOrders;
        }
    }
    
    @Future
    global static void lastInFlightDateUpdates(Set<Id> workOrderIds) {
        if (workOrderIds.isEmpty()) return;

        List<Order> updateOrders = new List<Order>();
        Map<Id,OrderItem> updateOrderItems = new Map<Id,OrderItem>();
        Map<Id,WorkOrder> workOrders = new Map<Id,WorkOrder>();

        Set<Order> updateOrdersSet = new Set<Order>();
        Set<WorkOrderLineItem> workOrderLineItems = new Set<WorkOrderLineItem>();

        workOrders = new Map<Id,WorkOrder>([
                SELECT Id, Next_Scheduled_Appointment__c, HasBeenDispatched__c, Emergency__c, Type__c,
                        (SELECT Id, IsPending__c, IsOpen__c, IsDispatched__c, DueDate, SchedStartTime, SchedEndTime,
                                Status
                        FROM ServiceAppointments
                        WHERE IsOpen__c = TRUE
                        ORDER BY DueDate)
                FROM WorkOrder
                WHERE Id IN :workOrderIds
        ]);

        for (WorkOrder wo : workOrders.values()) {
            WorkOrder updatedWo = new WorkOrder(Id=wo.Id, HasBeenDispatched__c=false);
            for (ServiceAppointment sa : wo.ServiceAppointments) {
                if (updatedWo.Next_Scheduled_Appointment__c == null && sa.IsPending__c) {
                    updatedWo.Next_Scheduled_Appointment__c = sa.SchedStartTime != null ? sa.SchedStartTime : sa.DueDate;
                }
                if (sa.IsDispatched__c) {
                    updatedWo.HasBeenDispatched__c = sa.IsDispatched__c;
                }
            }

            if (wo.Next_Scheduled_Appointment__c != updatedWo.Next_Scheduled_Appointment__c || wo.HasBeenDispatched__c != updatedWo.HasBeenDispatched__c) {
                workOrders.put(wo.Id, updatedWo);
            } else {
                workOrders.remove(wo.Id);
            }
        }

        update workOrders.values();

        List<WorkOrderLineItem> wolis = [
                SELECT Id, LineItemNumber, Order_Product__c, Order_Product__r.Id, Order_Product__r.OrderItemNumber,
                        Order_Product__r.Last_Work_Order_Completed_Date__c, WorkOrderId, OrderId,
                        Order_Product__r.Last_Automation_Created_Date__c, Order_Product__r.Last_InFlight_WO_Date__c,
                        Last_Automation_Created_Date__c, WorkOrder.StartDate, Order.Status, Order.RecordTypeId,
                        WorkOrder.Type__c, WorkOrder.HasBeenDispatched__c, WorkOrder.Emergency__c
                FROM WorkOrderLineItem
                WHERE Order_Product__c != NULL
                AND WorkOrder.HasBeenDispatched__c = TRUE
                AND WorkOrderId IN :workOrders.keySet()
        ];

        for (WorkOrderLineItem woli : wolis) {
            if (woli.WorkOrder.HasBeenDispatched__c) {
                if (woli.Order.Status == QueryUtils.fieldServiceSettings.Order_Active_Stage__c) {
                    updateOrdersSet.add(woli.Order);
                }
                if (!woli.WorkOrder.Emergency__c && woli.WorkOrder.Type__c!='Follow-Up'){
                    workOrderLineItems.add(woli);
                    OrderItem oi = updateOrderItems.get(woli.Order_Product__c);
                    Date startDate = woli.WorkOrder.StartDate.date();
                    if (oi==null){
                        oi = woli.Order_Product__r;
                        updateOrderItems.put(oi.Id, oi);
                    }

                    if (oi.Last_InFlight_WO_Date__c == null || oi.Last_InFlight_WO_Date__c < startDate){
                        oi.Last_InFlight_WO_Date__c = startDate;
                    }
                }
            }
        }

        if(!updateOrdersSet.isEmpty()) {
            updateOrders.addAll(updateOrdersSet);
        }

        for(Order o : updateOrders) {
            if(o.RecordTypeId == QueryUtils.fieldServiceSettings.Regular_Order_Record_Type_Id__c) {
                o.Status = QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c;
            } else {
                o.Status = QueryUtils.fieldServiceSettings.Shopping_Cart_Order_Draft_Stage__c;
            }
        }

        update updateOrders;

        update updateOrderItems.values();

        for(Order o : updateOrders) {
            o.Status = QueryUtils.fieldServiceSettings.Order_Active_Stage__c;
        }

        update updateOrders;
    }
    
    @Future (Callout = true)
    global static void createSendServiceReport(
            Set<Id> saAutoGenerateSendReports,
            Set<Id> completedSAParentIds,
            String passedSessionId)
    {
        Map<Id, Id> serviceAppointmentReportMap = new Map<Id, Id>();

       	Id noReplyConId = [SELECT Id, Email FROM Contact WHERE Email = :QueryUtils.fieldServiceSettings.CitronDoNotReply__c LIMIT 1].Id;

        Id emailTemplateId = QueryUtils.fieldServiceSettings.ServiceReportTemplateId__c;
        Id orgWideAddress = QueryUtils.fieldServiceSettings.Org_Wide_Email_Address__c;
        
        Map<Id, ServiceAppointment> completedSAMap =  new Map<Id, ServiceAppointment>([
                SELECT Id, AppointmentNumber, ParentRecordId, ContactId, ServiceReportAlreadySent__c,
                        Should_Auto_Generate_Service_Report__c, Should_Auto_Send_Service_Report__c
                FROM ServiceAppointment
                WHERE Id IN :saAutoGenerateSendReports
        ]);
        
        Map<Id, WorkOrder> workOrderMap = new Map<Id, WorkOrder>([
                SELECT Id, ServiceReportTemplateId
                FROM WorkOrder
                WHERE Id IN :completedSAParentIds
        ]);

        List<ServiceReport> srs = [
                SELECT Id, ParentId, CreatedDate, DocumentBody, ContentVersionDocumentId
                FROM ServiceReport
                WHERE ParentId IN :saAutoGenerateSendReports
                ORDER BY CreatedDate DESC
        ];

        for(ServiceReport sr : srs) {
            serviceAppointmentReportMap.put(sr.ParentId, sr.ContentVersionDocumentId);
        }
        
        Messaging.SingleEmailMessage[] emails = new Messaging.SingleEmailMessage[]{};
            
            for (ServiceAppointment sa : completedSAMap.values()) {
                Id reportId = serviceAppointmentReportMap.get(sa.Id);

                if(reportId == null && sa.Should_Auto_Generate_Service_Report__c) {
                    if (!Test.isRunningTest()) {
                        String content = Page.SessionId.getContent().toString();
                        Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length(),
                            e = content.indexOf('End_Of_Session_Id');
                        passedSessionId = content.substring(s, e);
                    }

                    Http http = new Http();
                    HttpRequest request = new HttpRequest();
                    request.setEndpoint('callout:ServiceReportCreate/services/data/v43.0/actions/standard/createServiceReport');
                    request.setMethod('POST');
                    request.setHeader('Content-Type', 'application/json;charset=UTF-8'); 
                    request.setHeader('Authorization', 'OAuth ' + passedSessionId); //This was fun
                    request.setBody('{"inputs" : [ {"entityId" : "' + sa.Id + '","templateId" : "' + workOrderMap.get(sa.ParentRecordId).ServiceReportTemplateId + '" } ]}');
                    HttpResponse response = http.send(request);

                    if (response.getStatusCode() != 201 && response.getStatusCode() != 200) {
                        System.debug('The status code returned was not expected: ' + response.getStatusCode() + ', ' + response.getStatus());
                    } else {
                        String srId = response.getBody().substring(response.getBody().indexOf('"contentVersionId":"')+20,response.getBody().indexOf('","entityId"'));
                        serviceAppointmentReportMap.put(sa.Id, srId); 
                    }
                }
                
                if(sa.Should_Auto_Send_Service_Report__c) {
                    reportId = serviceAppointmentReportMap.get(sa.Id);

                    if(reportId!=null) {
                        if (sa.ContactId != null) {
                            emails.add(ServiceAppointmentFutureCalls.sendSREmail(sa.ContactId, reportId, emailTemplateId, orgWideAddress));
                        } else {
                            emails.add(ServiceAppointmentFutureCalls.sendSREmail(noReplyConId, reportId, emailTemplateId, orgWideAddress));
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
        } catch (Exception exc) {
            System.debug('Emails Failed: ' + exc.getMessage());
        }
    }
    
    global static Messaging.SingleEmailMessage sendSREmail(Id contactId, Id srId, Id emailTemplateId, Id orgWideAddress){
        Messaging.SingleEmailMessage SREmail = new Messaging.SingleEmailMessage();
        SREmail.setTargetObjectId(contactId);
        List<String> completedSRIds = new List<String> { srId };                            
        SREmail.setEntityAttachments(completedSRIds);
        SREmail.setTemplateId(emailTemplateId);
        SREmail.setSaveAsActivity(false);
        SREmail.setOrgWideEmailAddressId(orgWideAddress);
        return SREmail;
    }
    
    @Future (Callout = true)
    global static void sendCongaNotificationEmails(Set<Id> ServiceAppointmentIds){ //Case 21616 - MD
        List<ServiceAppointment> SAs = [
                SELECT Id, CongaServiceAppointmentEmail__c
                FROM ServiceAppointment
                WHERE Id IN: ServiceAppointmentIds
        ];

        String servURL = Url.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/u/29.0/'+UserInfo.getOrganizationId();
        Http h = new Http();
        String content = Page.SessionId.getContent().toString();
        Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length();
        Integer e = content.indexOf('End_Of_Session_Id');
        String passedSessionId = content.substring(s, e);

        for (ServiceAppointment SA : SAs){
            HttpRequest req = new HttpRequest();
            req.setMethod('GET');
            req.setTimeout(60000);
            req.setEndpoint('https://composer.congamerge.com/composer8/index.html?sessionId='+passedSessionId+'&ServerURL=' + EncodingUtil.urlEncode(servURL, 'UTF-8') + SA.CongaServiceAppointmentEmail__c);
            h.send(req);
        }
    }
}