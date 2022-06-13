global class RecalculateServiceAppointmentDates implements Database.Batchable<SObject>, Schedulable {
    public String queryString { get; set; }
    
    global RecalculateServiceAppointmentDates() {
        queryString = 'SELECT Id, Status ' +
                'FROM ServiceAppointment ' +
                'WHERE Status = \'Missed Service\' ' +
                'AND ParentRecordType = \'WorkOrder\' ' +
                'AND DueDate <= TODAY ' +
                'AND (Reschedule_Counter__c < 2 ' +
                'OR Reschedule_Counter__c=NULL)';
    }
    
    global RecalculateServiceAppointmentDates(String s) {
        queryString = 'SELECT Id, Status ' +
                'FROM ServiceAppointment ' +
                'WHERE Status = \'Missed Service\' ' +
                'AND Id = \'' + s + '\' ' +
                'AND ParentRecordType = \'WorkOrder\' ' +
                'AND DueDate <= TODAY ' +
                'AND (Reschedule_Counter__c < 2 ' +
                'OR Reschedule_Counter__c=NULL)';

    }
    
    global Database.QueryLocator start(Database.BatchableContext bc){
        return Database.getQueryLocator(queryString);
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch){
        Set<Id> saIds = new Set<Id>();
        
        for(ServiceAppointment sa : (List<ServiceAppointment>) batch){
            saIds.add(sa.Id);
        }
        
        recalculateDates(saIds);
    }
    
    global void recalculateDates(Set<Id> saIds) {
        Map<Id, ServiceAppointment> rescheduleAppointmentMap = new Map<Id, ServiceAppointment>([
                SELECT Id, ParentRecordId, Status, DueDate, EarliestStartTime, FSL__Emergency__c,
                        AppointmentNumber, Reschedule_Counter__c
                FROM ServiceAppointment
                WHERE Id IN :saIds
        ]);

        if(rescheduleAppointmentMap.isEmpty()) return;

        Map<Id, Id> woSAMap = new Map<Id, Id>();

        for (ServiceAppointment sa : rescheduleAppointmentMap.values()) {
            woSAMap.put(sa.ParentRecordId, sa.Id);
        }

        /*
         * Should only work orders with orders that are still active be considered ?
         * Would these service appointment adjusted dates be the starting point of future services? No, to ensure this service appointments going through the logic
         * would be stamped with a boolean field HasBeenRescheduled, and such appointments wont be affecting future service dates
        */
        Map<Id,WorkOrder> woMap = new Map<Id,WorkOrder>([
                SELECT Id, StartDate, EndDate, FSL__VisitingHours__c, WorkOrderNumber, HasBeenRescheduled__c,
                        (SELECT Id, LineItemNumber, Service_Frequency__c, Order_Product__c, PricebookEntryId,
                                PricebookEntry.Product2.Family, WorkOrderId, StartDate, EndDate
                        FROM WorkOrderLineItems
                        WHERE Order_Product__c <> NULL)
                FROM WorkOrder
                WHERE Order__c != NULL
                AND Id IN :woSAMap.keySet()
        ]);

        Map<Id, OperatingHours> workOrderOperatingHours = new Map<Id, OperatingHours>();

        for(WorkOrder wo : woMap.values()) {
            if(String.isNotBlank(wo.FSL__VisitingHours__c)) {
                workOrderOperatingHours.put(wo.FSL__VisitingHours__c, null);
            }
        }

        workOrderOperatingHours = new Map<Id, OperatingHours>([
                SELECT Id, Name, TimeZone,
                        (SELECT Id, DayOfWeek, StartTime, EndTime FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime)
                FROM OperatingHours
                WHERE Id IN :workOrderOperatingHours.keySet()
        ]);

        List<WorkOrder> workOrders = new List<WorkOrder>();

        Date todaysDate = Date.today();
        Datetime todaysDatetime = Datetime.now();

        for(WorkOrder wo : woMap.values()) {
            Id saId = woSAMap.get(wo.Id);

            if(saId != null) {
                ServiceAppointment sa = rescheduleAppointmentMap.get(saId);
                Date dueDate;
                Date serviceStartDate = todaysDate;

                sa.EarliestStartTime =  Datetime.newInstance(serviceStartDate.year(), serviceStartDate.month(), serviceStartDate.day(), 00, 00, 00);

                for(WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                    Integer rescheduleDays = getRescheduleDays(woli.Service_Frequency__c, woli.PricebookEntry.Product2.Family);

                    if(rescheduleDays != null) {
                        Date rescheduleDate = serviceStartDate.addDays(rescheduleDays);

                        if(rescheduleDate>=serviceStartDate && (rescheduleDate<=dueDate || dueDate == null)) {
                            dueDate = rescheduleDate;
                        }
                    }
                }

                dueDate = dueDate == null ? serviceStartDate : dueDate;
                sa.DueDate =  Datetime.newInstance(dueDate.year(), dueDate.month(), dueDate.day(), 23, 59, 59);
                sa.Reschedule_Counter__c = sa.Reschedule_Counter__c == null ? 1 : sa.Reschedule_Counter__c+1;

                OperatingHours oh = workOrderOperatingHours.get(wo.FSL__VisitingHours__c);

                if(oh != null){
                    DatetimeRecord saDates = new DatetimeRecord(sa.EarliestStartTime, sa.DueDate);
                    saDates.opHours = oh;
                    saDates.emergency = sa.FSL__Emergency__c;
                    saDates.hasPestControlMonthly = false;
                    saDates = DatetimeRecord.getWODates(saDates, todaysDatetime);
                    sa.EarliestStartTime = saDates.startDate;
                    sa.DueDate = saDates.endDate;
                }

                wo.StartDate = sa.EarliestStartTime;
                wo.EndDate = sa.DueDate;
                wo.HasBeenRescheduled__c = true;
                workOrders.add(wo);
            }
        }

        Map<Id, WorkOrderLineItem> woLineItemMap = new Map<Id, WorkOrderLineItem>();

        for(WorkOrderLineItem woli : woLineItemMap.values()) {
            WorkOrder wo = woMap.get(woli.WorkOrderId);
            if(wo!=null) {
                woli.StartDate = wo.StartDate;
                woli.EndDate = wo.EndDate;
            }
        }

        Database.update(rescheduleAppointmentMap.values(), false);
        Database.update(workOrders, false);
        Database.update(woLineItemMap.values(), false);
    }
    
    private Integer getRescheduleDays(String frequency, String lob) {
        Frequency__c f = QueryUtils.yearlyFrequencies.get(frequency);
        if (String.isBlank(lob)) {
            return null;
        }
        else if (lob == QueryUtils.fieldServiceSettings.Chemical_LOB__c) {
            return Integer.valueOf(f.Chemical_Reschedule_Plus_Days__c);
        }
        else if (lob == QueryUtils.fieldServiceSettings.Hygiene_LOB__c) {
            return Integer.valueOf(f.Hygiene_Reschedule_Plus_Days__c);
        }
        else if (lob == QueryUtils.fieldServiceSettings.Pest_LOB__c) {
            return Integer.valueOf(f.Pest_Reschedule_Plus_Days__c);
        }
        else if (lob == QueryUtils.fieldServiceSettings.Life_Safety_LOB__c) {
            return Integer.valueOf(f.Life_Safety_Reschedule_Plus_Days__c);
        }
        else {
            return null;
        }
    }
    
    global void finish(Database.BatchableContext bc) {}
        
    global void execute(SchedulableContext ctx) {
        Database.executeBatch(new RecalculateServiceAppointmentDates(), 10);
    }
}