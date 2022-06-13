global class SpawnInstallsRemovalsAndReplaces implements Database.Batchable<SObject> /*, Schedulable*/ {
    
    global class MatrixRecord implements Comparable {
        public Id workOrderId { get; set; }
        public WorkOrderLineItem workOrderLineItemRec { get; set; }
        public Id orderItemId { get; set; }
        public Id assetId { get; set; }
        public Date minDate { get; set; }
        public Date scheduleDate { get; set; }
        public Date maxDate { get; set; }
        public String lineOfBusiness { get; set; } 
        public String workType { get; set; }
        public String workOrderStatus { get; set; }
        public String workTypeId { get; set; }
        public String installationNotes { get; set; }
        public String serviceNotes { get; set; }
        public Id relatedProductId { get; set; }
        public Id productId { get; set; }
        public Integer qty { get; set; }
        public Id priceBookEntryId { get; set; }
        public Boolean isPestControlMonthly {get; set;}
        
        public MatrixRecord(Id woId, WorkOrderLineItem woli, Date min, Date sd, Date max, String lob, String wt) {
            workOrderId = woId;
            workOrderLineItemRec = woli;
            minDate = min;
            scheduleDate = sd;
            maxDate = max;
            lineOfBusiness = lob;
            workType = wt;
        }
        
        public MatrixRecord(Id oiId, Date min, Date sd, Date max, String lob, String wt) {
            orderItemId = oiId;
            minDate = min;
            scheduleDate = sd;
            maxDate = max;
            lineOfBusiness = lob;
            workType = wt;
        }
        
        global Integer compareTo(Object compObj) {
            MatrixRecord compTo = (MatrixRecord) compObj;
            if (this.minDate < compTo.minDate) {
                return -1;
            } else if (this.minDate == compTo.minDate) {
                return 0;
            } else {
                return 1;
            }
        }
    }
    
    global class WorkOrderRecord {
        public WorkOrder WorkOrderRec { get; set; }
        public Set<MatrixRecord> MatrixRecords { get; set; }
        public String status { get; set; }
        public Date startDate { get; set; }
        public Date endDate { get; set; }
        public String lineOfBusiness { get; set; }
        public String workType { get; set; }
        public String workTypeId { get; set; }
        public Boolean emergency { get; set; }
        public Id workOrderId { get; set; }
        public Id ownerId { get; set; }
        public Id accountId { get; set; }
        public Id operatingHoursId { get; set; }
        public Id contactId { get; set; }
        public Id opportunityId { get; set; }
        public Id orderId { get; set; }
        public Id pricebook2Id { get; set; }
        public Id siteSurveyId { get; set; }
        public Id serviceTerritoryId { get; set; }
        public Id visitingHoursId { get; set; }
        public String siteSurveyNotes { get; set; }
        public Boolean hasPestControlMonthly {get; set;}
        public String accpacDeliveryOrderNumber {get; set;}
        //Aleena update orderitems with lastinflight when added to dispatched WO
        public String orderRecordTypeId {get; set;}

        public WorkOrderRecord() {
            MatrixRecords = new Set<MatrixRecord>();
        }
    }
    
    public String queryString { get; set; }
    public Field_Service_Settings__c dataSets { get; set; }
    public Map<String,Frequency__c> freqMap { get; set; }
    
    global SpawnInstallsRemovalsAndReplaces() {
        dataSets = Field_Service_Settings__c.getOrgDefaults();
        freqMap = Frequency__c.getAll();
    }
    
    global SpawnInstallsRemovalsAndReplaces(String s) {
        queryString = 'SELECT Id FROM Order WHERE Id=\'' + s + '\'';
        dataSets = Field_Service_Settings__c.getOrgDefaults();
        freqMap = Frequency__c.getAll();
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc){

        if (queryString == null) {
            System.debug('executing default query');
            return Database.getQueryLocator([SELECT Id FROM Order WHERE isValid__c=TRUE AND Order.Account.isValid__c=TRUE AND Emergency__c=FALSE]);
        } else {
            System.debug('executing custom query: ' + queryString);
            return Database.getQueryLocator(queryString);
        }
    }
    
    global void execute(Database.BatchableContext bc, List<SObject> batch){
        Set<Id> orders = new Set<Id>();
        
        for(Order o : (List<Order>) batch){
            orders.add(o.Id);
        }
        
        processOrders(orders);
    }
    
    global void processOrders(Set<Id> orders) {
        if (dataSets == null) {
            dataSets = Field_Service_Settings__c.getOrgDefaults();
        }
        if (freqMap == null) {
            freqMap = Frequency__c.getAll();
        }
        /* 
         *  Work Order preservation
         */
        Map<Id,Map<String,Map<Date,List<MatrixRecord>>>> workOrderMaster = new Map<Id,Map<String,Map<Date,List<MatrixRecord>>>>();
        Map<Id, Date> orderItemPreviousScheduledDates = new Map<Id, Date>();
        Map<Id, Date> workOrderScheduledDates = new Map<Id, Date>(); 
        Map<Id, OrderItem> orderItemUpdates = new Map<Id, OrderItem>(); 
        Map<Id, Order> deactivateOrders = new Map<Id, Order>(); 
        Map<Id, Order> activateOrders = new Map<Id, Order>(); 
        Map<Id, Date> orderItemUpdateDates = new Map<Id, Date>();
        Map<Id, Account> accountMap = new Map<Id, Account>();
        Set<Id> operatingHoursIds = new Set<Id>();
        Set<Id> newInstallsReplaceOrderItems = new Set<Id>(); 
        
        List<WorkOrder> workOrdersToDelete = new List<WorkOrder>();
        for (WorkOrder wo : [SELECT Id, Order__c, HasBeenDispatched__c, Line_Of_Business__c, Type__c, StartDate, WorkOrderNumber, StatusCategory, Status, /*Accpac_Delivery_Order_Number__c,*/
                                (SELECT Id, SchedStartTime, SchedEndTime, DueDate, EarliestStartTime, Status FROM ServiceAppointments WHERE 
                                 IsDispatched__c=TRUE OR Status=:dataSets.Missed_SA_Status_Value__c LIMIT 1),
                                (SELECT Id, PricebookEntryId, Product__c, Quantity, workTypeId, Order_Product__c, Related_Product__c, AssetId, Type_Of_Service__c, 
                                 Installation_Notes__c, Service_Notes__c FROM WorkOrderLineItems ORDER BY StartDate DESC)
                             FROM WorkOrder WHERE Order__c IN : orders AND Type__c NOT IN ('Service','Delivery') 
                             AND (IsValidForUpdate__c=TRUE OR IsValidForUpdateEmergency__c=TRUE)  ORDER BY StartDate DESC]) {
            Boolean HasBeenDispatched = wo.ServiceAppointments!=null&&!wo.ServiceAppointments.isEmpty();
            System.debug('** WorkOrder: ' + wo.WorkOrderNumber + ' ** StatusCategory: ' + wo.StatusCategory + ' ** HasBeenDispatched__c ' + wo.HasBeenDispatched__c + ' ** SACount: ' + wo.ServiceAppointments.size());

            if (!HasBeenDispatched) { 
                workOrdersToDelete.add(wo);
            } else {
                if (!wo.ServiceAppointments.isEmpty() &&  wo.ServiceAppointments[0].Status!=dataSets.Missed_SA_Status_Value__c) {
                    Date minDate = wo.ServiceAppointments[0].SchedStartTime.date();
                    Date maxDate = wo.ServiceAppointments[0].SchedEndTime.date();
                    workOrderScheduledDates.put(wo.Id, minDate);
                    
                    Map<String,Map<Date,List<MatrixRecord>>> workOrderMatrix = new Map<String,Map<Date,List<MatrixRecord>>>();
                    for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                        
                        Date previousDate = orderItemPreviousScheduledDates.get(woli.Order_Product__c);
                        if(previousDate == null) {
                            orderItemPreviousScheduledDates.put(woli.Order_Product__c, wo.ServiceAppointments[0].SchedStartTime.date()); //was DueDate
                        }
                        
                        String key1 = wo.Line_Of_Business__c + '|' + wo.Type__c;
                        
                        Date currDate = minDate;
                        MatrixRecord itemInstance = new MatrixRecord(wo.Id, woli, minDate, maxDate, maxDate, wo.Line_Of_Business__c, wo.Type__c);
                        itemInstance.workOrderStatus=wo.Status;
                        while (currDate <= maxDate) {
                            Map<Date,List<MatrixRecord>> dateMap = workOrderMatrix.get(key1);
                            if (dateMap == null) {
                                dateMap = new Map<Date,List<MatrixRecord>>();
                                workOrderMatrix.put(key1,dateMap);
                            }
                            
                            Date key2 = currDate;
                            List<MatrixRecord> orderItems = dateMap.get(currDate);
                            if (orderItems == null) {
                                orderItems = new List<MatrixRecord>();
                                dateMap.put(key2,orderItems);
                            }
                            
                            orderItems.add(itemInstance);
                            currDate = currDate.addDays(1);
                        }
                    }
                    workOrderMaster.put(wo.Order__c, workOrderMatrix);
                } 
            }
        }
        
        /*
         * Work Order Scheduling logic
         *   1. First build a matrix, for each applicable line of business and work type combination, on each order that plots out the next <Work_Orders_In_Advance__c> days.
         *   2. Go through all order line items.  Insert the line item Id into any matrix date bucket that fits into the range.  The insertion must put the item into sorted order, by END DATE.
         *   3. - Update the line item dates based on frequency +/- swing dates and repeat until the date falls outside of the work order in advance timeframe (or seasonality ends)
         *   4. Start from the beginning of the matrix and find the first index that contains an item.  Take a line item from that list and get the due date.
         *   5. - Go to the due date, pop out every single applicable order item and make that into a work order.
         *   6. Repeat step 4 until the matrix is empty.
         *   7. Insert the work orders, or update existing ones.
         *   8. Upsert work order lines //(Integer)dataSets.Work_Orders_In_Advance__c
         */
        List<WorkOrderRecord> workOrders = new List<WorkOrderRecord>();
        
        Date todaysDate = Date.today();
        Datetime todaysDateTime = Datetime.now();
        Date maxDateWindow = todaysDate.addDays(Integer.valueOf(dataSets.Work_Orders_In_Advance__c));
        
        System.debug('maxDate for scheduling: ' + maxDateWindow);
    
        for (Order o : [SELECT Id, AccountId, Account.Account_Balance__c, Account.Credit_Limit__c, EffectiveDate, Pricebook2Id, OpportunityId, Account.Service_Territory__c, 
                            Service_Territory__c, Emergency__c, BillToContactId, ShipToContactId, OwnerId, Site_Survey__c, Account.Site_Survey__c, /*Accpac_Delivery_Order_Number__c,*/
                            Season_End_Date__c, Season_Start_Date__c, OrderNumber, Account.Hygiene_OperatingHoursId__c, Account.Life_Safety_OperatingHoursId__c, RecordTypeId,
                            Account.Chemical_OperatingHoursId__c, Account.Pest_Control_OperatingHoursId__c, Account.OperatingHoursId, Account.Id, Site_Survey__r.Notes__c,
                            (SELECT Id, Asset__c, Asset__r.Last_Scanned_Date__c, Last_Scanned_Date__c, isInstallation__c, isPurchase__c, isPurchaseOnly__c, isService__c, IsActive__c,
                                PricebookEntryId, Line_Of_Business__c, Quantity, UnitPrice, ServiceDate, ListPrice, Product2Id, Related_Product__c, Last_InFlight_WO_Date__c,
                                Delivery_Work_Type__c, Installation_Work_Type__c, Service_Work_Type__c, Separate_Delivery__c, DeInstallation_Work_Type__c,  
                                isValid__c, isSchedulable__c, Frequency__c, FrequencyInDays__c, Installation_Status__c, Asset__r.Status, Remove_Installation_Work_Type__c, 
                             	OrderItemNumber, Valid_for_Install_Remove_Replace__c, Last_Automation_Created_Date__c, Installation_Notes__c, Service_Notes__c
                            FROM OrderItems WHERE IsActive__c=TRUE AND isValid__c=TRUE AND Valid_for_Install_Remove_Replace__c=TRUE)
                        FROM Order WHERE Id IN :orders]
        ) {
            Boolean seasonalOrder = (o.Season_Start_Date__c != null);
            Map<String,Map<Date,List<MatrixRecord>>> orderMatrix = workOrderMaster.get(o.Id);
            if (orderMatrix == null) {
                orderMatrix = new Map<String,Map<Date,List<MatrixRecord>>>(); //Map of {Key1:LineOfBusiness + WorkType |-> Map of {Key2:Acceptable Service Date |-> Set(MatrixRecord)}}
            }
            System.debug('Initial matrix: for OrderItem ' + o.OrderNumber + ' ' + orderMatrix);
            Set<MatrixRecord> processedRecords = new Set<MatrixRecord>();
            
            accountMap.put(o.AccountId, o.Account);
            
            for (OrderItem oi : o.OrderItems) {
                
                Date servDate;
                String workType = oi.Installation_Status__c;
                
                if(workType=='Install') {
                    workType='Installation';
                } else if(workType=='Remove') {
                    workType='DeInstall';
                }
                
                if(o.Emergency__c) {
                    servDate = o.EffectiveDate; 
                    if((oi.Last_InFlight_WO_Date__c!=null || oi.Last_Automation_Created_Date__c!=null ) && oi.FrequencyInDays__c==0){
                         servDate = maxDateWindow;
                    }
                    System.debug('** Emergency Order : ' + oi.OrderItemNumber + ' **Service Date ** ' + servDate + '** Frequency** ' + oi.Frequency__c);
                    System.debug('** HasService Last Automation Created Date : ' + oi.Last_Automation_Created_Date__c + ' ** Last In Flight Date ** ' + oi.Last_InFlight_WO_Date__c);
                } else {
                    servDate = o.EffectiveDate.addDays(Integer.valueOf(dataSets.Service_Start__c));
                    if(oi.Last_InFlight_WO_Date__c==null && oi.Last_Automation_Created_Date__c==null) {
                        newInstallsReplaceOrderItems.add(oi.Id);
                    }
                }
                
                Boolean isGreater = servDate < todaysDate;
                servDate = isGreater ? todaysDate : servDate;
                String frequency = oi.Frequency__c!=null ? oi.Frequency__c : dataSets.Non_Recurring_Frequency_Value__c;
                
                System.debug('** Service Date final ** ' + servDate + ' for Order Item ' + oi.FrequencyInDays__c + ' ** Last In Flight Date ** ' + oi.Last_InFlight_WO_Date__c + ' **Frequency** ' + frequency);
                System.debug('** Service Date final ** ' + servDate + ' for Order Item ' + oi.OrderItemNumber + ' ** Max Date ** ' + maxDateWindow + ' ** Last Automationn Date ** ' + oi.Last_Automation_Created_Date__c);
                
                while (servDate < maxDateWindow) {
                    if (!seasonalOrder || (seasonalOrder && o.Season_Start_Date__c <= servDate && servDate <= o.Season_End_Date__c)) {
                        
                        List<Integer> dateWindow = getFrequencyOffset(frequency, oi.Line_Of_Business__c);
                         
                        Date minDate = servDate; 
                        Date maxDate = servDate;
                        
                        if(dateWindow!=null && !o.Emergency__c) {
                            minDate = servDate.addDays(-dateWindow[0]); 
                            maxDate = servDate.addDays(dateWindow[1]);
                        }
                        if(minDate<todaysDate) { minDate=todaysDate; } 
                        
                        Date currDate = minDate;
                        String key1 = oi.Line_Of_Business__c + '|' + workType;
                        
                        MatrixRecord itemInstance = new MatrixRecord(oi.Id, minDate, servDate, maxDate, oi.Line_Of_Business__c, workType);
                        itemInstance.workTypeId = (workType == 'Installation' ? oi.Installation_Work_Type__c : 
                                                    (workType == 'Replace' ? oi.Remove_Installation_Work_Type__c : 
                                                     (workType == 'DeInstall' ? oi.DeInstallation_Work_Type__c : oi.Service_Work_Type__c)));
                        itemInstance.relatedProductId = oi.Related_Product__c;
                        itemInstance.productId = oi.Product2Id;
                        itemInstance.priceBookEntryId = oi.PricebookEntryId;
                        itemInstance.assetId = oi.Asset__c;
                        itemInstance.orderItemId = oi.Id;
                        if (workType == 'Installation' || workType == 'Replace' || workType == 'DeInstall'){
                        	itemInstance.installationNotes = oi.Installation_Notes__c;
                        } else{
                            itemInstance.installationNotes = '';
                        }
                        itemInstance.serviceNotes = workType == 'Service' ? oi.Service_Notes__c : '';
                        
                        while (currDate <= maxDate) {
                            Map<Date,List<MatrixRecord>> dateMap = orderMatrix.get(key1);
                            if (dateMap == null) {
                                dateMap = new Map<Date,List<MatrixRecord>>();
                                orderMatrix.put(key1,dateMap);
                            }
                            
                            Date key2 = currDate;
                            List<MatrixRecord> orderItems = dateMap.get(currDate);
                            if (orderItems == null) {
                                orderItems = new List<MatrixRecord>();
                                dateMap.put(key2,orderItems);
                            }
                            orderItems.add(itemInstance);
                            currDate = currDate.addDays(1);
                        }
                    }
                    servDate = maxDateWindow;
                }
            }
            for (String key1 : orderMatrix.keyset()) {  //This is the line of business / work type level
                Map<Date,List<MatrixRecord>> dateMap = orderMatrix.get(key1);
                List<Date> sortedDates = new List<Date>();
                sortedDates.addAll(dateMap.keyset());
                System.debug('** Next Iteration of Order Matrix ** ' + key1);
                System.debug('** Sorted Dates ** ' + sortedDates.size() + ', ' + sortedDates);
                
                sortedDates.sort();
                
                while (!sortedDates.isEmpty()) {  //These are the applicable dates
                    List<MatrixRecord> sortedRecords = new List<MatrixRecord>();
                    sortedRecords = dateMap.get(sortedDates.get(0));                    
                    if (sortedRecords != null) {
                        sortedRecords.sort();
                        System.debug('** DateMap ** ' + sortedRecords.size());
                        MatrixRecord referenceRec = sortedRecords.get(0);
                        WorkOrderRecord wo = new WorkOrderRecord();
                        System.debug('Work Order Creation: MinDate ' + referenceRec.minDate + ' MaxDate ' + referenceRec.maxDate);
                        wo.startDate = referenceRec.minDate;
                        wo.endDate = referenceRec.maxDate;
                        wo.status = referenceRec.workOrderStatus==null ? 'New' : referenceRec.workOrderStatus;
                        System.debug('>>Work Order Existing:  Status ' + wo.status);
                        wo.lineOfBusiness = referenceRec.lineOfBusiness;
                        wo.workType = referenceRec.workType;
                        wo.emergency = o.Emergency__c;
                        wo.ownerId = o.OwnerId;
                        wo.accountId = o.AccountId;
                        wo.contactId = o.ShipToContactId==null ? o.BillToContactId : o.ShipToContactId;
                        wo.opportunityId = o.OpportunityId;
                        wo.orderId = o.Id;
                        wo.pricebook2Id = o.Pricebook2Id;
                        wo.siteSurveyId = o.Site_Survey__c;
                        wo.siteSurveyNotes = o.Site_Survey__r.Notes__c;
                        wo.serviceTerritoryId = o.Service_Territory__c==null ? o.Account.Service_Territory__c : o.Service_Territory__c;
                        wo.visitingHoursId = o.Account.OperatingHoursId;
                        wo.orderRecordTypeId = o.RecordTypeId;
                        if(!processedRecords.contains(referenceRec)) { 
                            wo.MatrixRecords.add(referenceRec);
                        } 
                        processedRecords.add(referenceRec);
                        
                        Date referenceDate = referenceRec.minDate;
                        System.debug('Reference Date before calculations: ' + referenceDate);
                        while (referenceDate <= referenceRec.maxDate) {
                            if (dateMap.containsKey(referenceDate)) { 
								Integer counter = 0;   
                                List<MatrixRecord> matrixRecords = dateMap.remove(referenceDate);
                                List<MatrixRecord> savingMatrix = new List<MatrixRecord>();
                                for (MatrixRecord m : matrixRecords) {
                                    if(m.minDate >= wo.startDate && m.minDate <= wo.startDate) {
                                        Date endDate = wo.endDate;
                                        System.debug('Work Order Change: StartDate ' + wo.startDate + ' EndDate ' + wo.endDate);
                                        wo.startDate = m.minDate <= wo.startDate ? m.minDate : wo.startDate;
                                        wo.endDate = m.maxDate > wo.endDate ? wo.endDate : m.maxDate;
                                        wo.endDate = wo.endDate < wo.startDate ? wo.StartDate : wo.endDate;
                                        System.debug('Matrix: MinDate ' + m.minDate + ' MaxDate ' + m.maxDate);
                                        //2, 5
                                        System.debug('>>Matrix Record: ' + m);
                                        if (m.WorkOrderId != null && wo.WorkOrderId == null) {
                                            wo.WorkOrderId = m.WorkOrderId;
                                        } else if (m.WorkOrderId != null && wo.WorkOrderId != null && m.WorkOrderId != wo.WorkOrderId) {
                                            if (dateMap.get(referenceDate) == null) {
                                                dateMap.put(referenceDate, new List<MatrixRecord>{ m }); 
                                            } else {
                                                dateMap.get(referenceDate).add(m);
                                            }
                                            continue;
                                        }
                                        if (!processedRecords.contains(m)) {
                                            processedRecords.add(m);
                                            wo.MatrixRecords.add(m);
                                        }
                                    } else {
                                        savingMatrix.add(m);
                                    }
                                }
                                if(!savingMatrix.isEmpty()) {
                                    dateMap.put(referenceDate, savingMatrix);
                                }
                                
                            }
                            referenceDate = referenceDate.addDays(1);
                        }
                        if(!wo.MatrixRecords.isEmpty()) {
                            workOrders.add(wo);   
                            System.debug('>> Work Order generated: ' + wo);
                        }
                    }
                    sortedDates.remove(0);
                }
            }
        }
            
        /*  
         *   7. Insert the work orders, or update existing ones.
         *   8. Upsert work order lines
         */
        
        accountMap.remove(null);
        Map<String, Id> accountLOBOperatingHoursMap = getLOBSpecificOperatingHours(accountMap);
        operatingHoursIds.addAll(accountLOBOperatingHoursMap.values());
        Map<Id, OperatingHours> workOrderOperatingHours = new Map<Id, OperatingHours>([SELECT Id, Name, TimeZone, 
                                                                                       (SELECT Id, DayOfWeek, StartTime, EndTime FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime) 
                                                                                       FROM OperatingHours WHERE Id IN :operatingHoursIds]);        
        System.debug('Final list of work orders: ');
        List<WorkOrder> workOrderUpsert = new List<WorkOrder>();
        List<WorkOrder> workOrderInsert = new List<WorkOrder>();
        List<WorkOrderLineItem> workOrderLineItemInsert = new List<WorkOrderLineItem>();
        List<WorkOrderLineItem> workOrderLineItemUpdate = new List<WorkOrderLineItem>();
        for (WorkOrderRecord wor : workOrders) {
            System.debug('Work Order Line of Business: ' + wor.lineOfBusiness);
            String key = (wor.lineOfBusiness==null) ? String.valueOf(wor.accountId) : wor.accountId+'.'+wor.lineOfBusiness;
            OperatingHours oh = workOrderOperatingHours.get(accountLOBOperatingHoursMap.get(key));
            System.debug('Key: ' + key);
            Datetime startDate =  Datetime.newInstance(wor.startDate.year(), wor.startDate.month(), wor.startDate.day(), 00, 00, 00);
            Datetime endDate =  Datetime.newInstance(wor.endDate.year(), wor.endDate.month(), wor.endDate.day(), 23, 59, 59);
            DatetimeRecord woDates = new DatetimeRecord(startDate, endDate);
            if(oh!=null) {
                woDates.opHours = oh;
                woDates.emergency = wor.emergency;
                woDates.hasPestControlMonthly = false;
                woDates = DatetimeRecord.getWODates(woDates, todaysDateTime);
            }
            System.debug('>>Work Order Existing: ' + wor.workOrderId + ' Status ' + wor.status);
            WorkOrder wo = new WorkOrder(
                Id = wor.workOrderId,
                StartDate = woDates.startDate, 
                EndDate = woDates.endDate,
                Status = wor.status,
                Line_Of_Business__c = wor.lineOfBusiness,
                Type__c = wor.workType,
                OwnerId = wor.ownerId,
                AccountId = wor.accountId,
                ContactId = wor.contactId,
                Opportunity__c = wor.opportunityId,
                Order__c = wor.orderId,
                Pricebook2Id = wor.pricebook2Id,
                Site_Survey__c = wor.siteSurveyId,
                ServiceTerritoryId = wor.serviceTerritoryId,
                FSL__VisitingHours__c = oh==null ? wor.visitingHoursId : oh.Id, 
                Emergency__c = wor.emergency, 
                Site_Survey_Notes__c = wor.siteSurveyNotes, 
                Last_Batch_Updated_Date__c = todaysDate
            );
            
            wor.WorkOrderRec = wo;
            if(wo.Id==null){
                workOrderInsert.add(wo);
            } else {
                workOrderUpsert.add(wo);
            }
        }
        System.debug('Work Orders');
        System.debug(workOrderUpsert);
        System.debug(workOrderInsert);
        
        Database.SaveResult[] insertWOSR = Database.insert(workOrderInsert, false);
        Database.SaveResult[] updateWOSR = Database.update(workOrderUpsert, false);
        
        for (WorkOrderRecord wor : workOrders) {
            if(wor.WorkOrderRec.Id!=null){
                for (MatrixRecord m : wor.MatrixRecords) {
                    WorkOrderLineItem woli = new WorkOrderLineItem(
                        WorkOrderId = wor.WorkOrderRec.Id,
                        OrderId = wor.orderId,
                        Order_Product__c = m.orderItemId,
                        AssetId = m.assetId,
                        Type_Of_Service__c = m.workType,
                        WorkTypeId = m.workTypeId,
                        Related_Product__c = m.relatedProductId,
                        PricebookEntryId = m.priceBookEntryId,
                        Product__c = m.productId,
                        StartDate = wor.WorkOrderRec.StartDate,
                        EndDate = wor.WorkOrderRec.EndDate,
                        Quantity = 1, 
                        Installation_Notes__c = m.installationNotes,
                        Service_Notes__c = m.serviceNotes
                    );
                    System.debug('>> Work Order Line Item for ' + m.orderItemId + ' **Date** ' + woli.StartDate);
                    if (m.WorkOrderLineItemRec == null) {
                        workOrderLineItemInsert.add(woli);
                        
                        Date lastInflightDate = workOrderScheduledDates.get(woli.WorkOrderId);
                        if(lastInflightDate!=null && woli.Order_Product__c!=null && newInstallsReplaceOrderItems.contains(woli.Order_Product__c)) {
                            orderItemUpdates.put(woli.Order_Product__c, new OrderItem(Id=woli.Order_Product__c, Last_InFlight_WO_Date__c=lastInflightDate));
                            if(wor.orderRecordTypeId==dataSets.Regular_Order_Record_Type_Id__c) {
                                deactivateOrders.put(wor.OrderId, new Order(Id=wor.OrderId, Status=dataSets.Regular_Order_Draft_Stage__c));
                            } else {
                                deactivateOrders.put(wor.OrderId, new Order(Id=wor.OrderId, Status=dataSets.Shopping_Cart_Order_Draft_Stage__c));
                            }
                            activateOrders.put(wor.OrderId, new Order(Id=wor.OrderId, Status=dataSets.Order_Active_Stage__c));
                        }
                    } else {
                        woli.Id = m.WorkOrderLineItemRec.Id;
                        woli.Quantity = m.WorkOrderLineItemRec.Quantity;
                        woli.Product__c = m.WorkOrderLineItemRec.Product__c;
                        woli.PricebookEntryId = m.WorkOrderLineItemRec.PricebookEntryId;
                        woli.WorkTypeId = m.WorkOrderLineItemRec.workTypeId;
                        woli.Order_Product__c = m.WorkOrderLineItemRec.Order_Product__c;
                        woli.Related_Product__c = m.WorkOrderLineItemRec.Related_Product__c;
                        woli.AssetId = m.WorkOrderLineItemRec.AssetId;
                        woli.Type_Of_Service__c = m.WorkOrderLineItemRec.Type_Of_Service__c;
                        workOrderLineItemUpdate.add(woli);
                    }
                }
                System.debug('-- wor: [' + wor.MatrixRecords.size() + ']' + wor);
            }
        }
               
        Database.SaveResult[] insertWOLISR = Database.insert(workOrderLineItemInsert, false);
        Database.SaveResult[] updateWOLISR = Database.update(workOrderLineItemUpdate, false);
        
        if (!workOrdersToDelete.isEmpty()) {
            System.debug('Work Orders deleted count: ' + workOrdersToDelete.size());
            Database.DeleteResult[] deleteWOLISR = Database.delete(workOrdersToDelete, false);
        }
        
        orderItemUpdates.remove(null);
        deactivateOrders.remove(null);
        activateOrders.remove(null);
        Database.SaveResult[] deactivateOrdersSR = Database.update(deactivateOrders.values(), false);
        Database.SaveResult[] updateOrderItems = Database.update(orderItemUpdates.values(), false);
        Database.SaveResult[] activateOrdersSR = Database.update(activateOrders.values(), false);
        
        List<Batch_Errors__c> tErrorsList = new List<Batch_Errors__c>();
        for(Integer i=0;i<insertWOSR.size();i++){
            if(!insertWOSR[i].isSuccess()){
                String errors = '';
                for(Database.Error err : insertWOSR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
                WorkOrder wo = workOrderInsert[i];
                System.debug('Failed WO >>: ' + wo);
                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c = errors, 
                    StartTime__c = wo.StartDate, 
                    EndTime__c = wo.EndDate, 
                    OrderId__c = wo.Order__c, 
                    OperatingHoursId__c = wo.FSL__VisitingHours__c, 
                    Failed_Batch__c = 'SpawnInstallsRemovalsAndReplaces'
                ));
            }
        }
        
        for(Integer i=0;i<updateWOSR.size();i++){
            if(!updateWOSR[i].isSuccess()){//only look at failures, or NOT Successes
                String errors = '';
                for(Database.Error err : updateWOSR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
                WorkOrder wo = workOrderUpsert[i];
                System.debug('Failed WO >>: ' + wo);
                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c= errors, 
                    StartTime__c = wo.StartDate, 
                    EndTime__c= wo.EndDate, 
                    OrderId__c = wo.Order__c, 
                    OperatingHoursId__c = wo.FSL__VisitingHours__c, 
                    Failed_Batch__c = 'SpawnInstallsRemovalsAndReplaces'
                ));
            }
        }
        
        for(Integer i=0;i<insertWOLISR.size();i++){
            if(!insertWOLISR[i].isSuccess()){//only look at failures, or NOT Successes
                String errors = '';
                for(Database.Error err : insertWOLISR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
                WorkOrderLineItem woli = workOrderLineItemInsert[i];
                System.debug('Failed WOLI >>: ' + woli);
                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c= errors, 
                    OrderId__c = woli.OrderId, 
                    OrderProductId__c = woli.Order_Product__c, 
                    Failed_Batch__c = 'SpawnInstallsRemovalsAndReplaces'
                ));
            }
        }
        
        for(Integer i=0;i<updateWOLISR.size();i++){
            if(!updateWOLISR[i].isSuccess()){//only look at failures, or NOT Successes
                String errors = '';
                for(Database.Error err : updateWOLISR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
                WorkOrderLineItem woli = workOrderLineItemUpdate[i];
                System.debug('Failed WOLI >>: ' + woli);
                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c= errors, 
                    OrderId__c = woli.OrderId, 
                    OrderProductId__c = woli.Order_Product__c, 
                    Failed_Batch__c = 'SpawnInstallsRemovalsAndReplaces'
                ));
            }
        }
        
        for(Integer i=0;i<updateOrderItems.size();i++){
            if(!updateOrderItems[i].isSuccess()){//only look at failures, or NOT Successes
                String errors = '';
                for(Database.Error err : updateOrderItems[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
                OrderItem oi = orderItemUpdates.values()[i];
                //System.debug('Failed WOLI >>: ' + woli);
                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c= errors, 
                    OrderProductId__c = oi.Id, 
                    Failed_Batch__c = 'SpawnWorkOrders'
                ));
            }
        }
        
        for(Integer i=0;i<activateOrdersSR.size();i++){
            if(!activateOrdersSR[i].isSuccess()){//only look at failures, or NOT Successes
                String errors = '';
                for(Database.Error err : activateOrdersSR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
                Order o = activateOrders.values()[i];
                //System.debug('Failed WOLI >>: ' + woli);
                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c= errors, 
                    OrderId__c = o.Id, 
                    Failed_Batch__c = 'SpawnWorkOrders'
                ));
            }
        }

        System.debug(tErrorsList);
        insert tErrorsList;
    }
    
    private List<Integer> getFrequencyOffset(String frequency, String lob) {
        if (lob == null) {
            return null;
        } else if (lob == 'Chemical') {
            Frequency__c f = freqMap.get(frequency);
            return new List<Integer>{ (Integer)f.Chemical_Minus_Days__c, (Integer)f.Chemical_Plus_Days__c};
        } else if (lob == 'Life Safety') {
            Frequency__c f = freqMap.get(frequency);
            return new List<Integer>{ (Integer)f.Life_Safety_Minus_Days__c, (Integer)f.Life_Safety_Plus_Days__c };
        } else if (lob == 'Pest Control') {
            Frequency__c f = freqMap.get(frequency);
            return new List<Integer>{ (Integer)f.Pest_Minus_Days__c, (Integer)f.Pest_Plus_Days__c };
        } else if (lob == 'Hygiene') {
            Frequency__c f = freqMap.get(frequency);
            return new List<Integer>{ (Integer)f.Hygiene_Minus_Days__c, (Integer)f.Hygiene_Plus_Days__c };
        } else {
            return null;
        }
    }
    
    private Map<String, Id> getLOBSpecificOperatingHours(Map<Id, Account> accountMap){
        
        Map<String, Id> accountLOBOperatingHoursMap = new Map<String, Id>();
        
        if(!accountMap.isEmpty()) {
            for(Account a : accountMap.values()) {
                accountLOBOperatingHoursMap.put(a.Id+'.'+dataSets.Hygiene_LOB__c, a.Hygiene_OperatingHoursId__c);
                accountLOBOperatingHoursMap.put(a.Id+'.'+dataSets.Chemical_LOB__c, a.Chemical_OperatingHoursId__c);
                accountLOBOperatingHoursMap.put(a.Id+'.'+dataSets.Pest_LOB__c, a.Pest_Control_OperatingHoursId__c);
                accountLOBOperatingHoursMap.put(a.Id+'.'+dataSets.Life_Safety_LOB__c, a.Life_Safety_OperatingHoursId__c);
                accountLOBOperatingHoursMap.put(String.valueOf(a.Id), a.OperatingHoursId);
            }
        }
        accountLOBOperatingHoursMap.remove(null);
        return accountLOBOperatingHoursMap;
    } 
    
    global void finish(Database.BatchableContext bc){
        if(!Test.isRunningTest()){
            Database.executeBatch(new SpawnFollowUpWorkOrders(), 10);
        }
    }
    
    global void execute(SchedulableContext ctx) {
        Database.executeBatch(new SpawnInstallsRemovalsAndReplaces(), 10);
    }
}