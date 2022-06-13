global class SpawnServiceAppointments implements Database.Batchable<SObject>, Schedulable {
    public Boolean IS_ORDER_ID = false;
    public Boolean IS_DATE_FILTER = false;
    public String queryString;
    private Field_Service_Settings__c dataSets;
    public DateTime startDT, endDT;

    global SpawnServiceAppointments() {
        this(null, false);
    }
    
    global SpawnServiceAppointments(String s) {
        this(s, false);
    }
    
    global SpawnServiceAppointments(DateTime startTime, DateTime endTime){
        IS_DATE_FILTER = true;
        this.startDT = startTime;
        this.endDT = endTime;
        System.debug('--START TIME FRAME--' + startDT + '--' + endDT);
    }
    
    global SpawnServiceAppointments(String s, Boolean isOrderId) {
        this.IS_ORDER_ID = isOrderId;
        if (isOrderId) {
            queryString = 'SELECT Id, WorkOrder__c FROM Related_Work_Order__c WHERE Order__c = \'' + s + '\' AND WorkOrder__r.isValid__c = TRUE';
        } else if (String.isNotBlank(s)) {
            queryString = 'SELECT Id FROM WorkOrder WHERE Id = \'' + s + '\'';
        }
    }
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        if (queryString == null && !IS_DATE_FILTER) {
            System.debug('--NDF Query--' + IS_DATE_FILTER);
            return Database.getQueryLocator([SELECT Id FROM WorkOrder 
                                             WHERE isValid__c = TRUE AND Account.isValid__c=TRUE
                                             ORDER BY WorkOrderNumber
                                            ]);
        } else if(queryString == null && IS_DATE_FILTER){
            System.debug('--DF Query--' + IS_DATE_FILTER);
            return Database.getQueryLocator([SELECT Id FROM WorkOrder 
                                             WHERE isValid__c = TRUE AND Account.isValid__c=TRUE AND 
                          						  (CREATEDDATE >=:startDT AND CREATEDDATE <=:endDT)
                                             ORDER BY WorkOrderNumber
                                            ]);
        } else {
            System.debug('--Query String--');
            return Database.getQueryLocator(queryString);
        }
    }

    global void execute(Database.BatchableContext bc, List<SObject> batch) {
        Set<Id> workOrderIds = new Set<Id>();
        for (SObject o : batch){
            Id workOrderId;
            if(IS_ORDER_ID) {
                workOrderId = (Id) o.get('WorkOrder__c');
            } else {
                workOrderId = (Id) o.get('Id');
            }
            workOrderIds.add(workOrderId);
        }
        processWorkOrders(workOrderIds);
    }
    
    global void processWorkOrders(Set<Id> workOrderIds) {
        Map<Id, String> woliServiceFrequencyMap = new Map<Id, String>();
        Map<Id, Decimal> woliServiceFrequencyCountMap = new Map<Id, Decimal>();
        dataSets = Field_Service_Settings__c.getOrgDefaults();
        
        Map<Id, WorkOrder> workOrders = new Map<Id, WorkOrder>([
            SELECT Id, StartDate, EndDate, isValid__c, Line_of_Business__c, Type__c, ContactId, AccountId, IsSeasonal__c,
                    FSL__VisitingHours__c, WorkOrderNumber, Site_Survey__r.Health_Safety_Orientation_Required__c, 
                    Emergency__c, Site_Survey__r.Pest_Duration_Calculation__c, Status, 
                    Site_Survey__r.Duration_Adjustment_Time__c, Site_Survey__c, HasPestControlMonthly__c, 
                    Site_Survey__r.Work_Order_Calculation_Adjustment__c, 
                    Site_Survey__r.Chem_WorkOrder_Calculation_Adjustment__c, 
                    Site_Survey__r.Min_Chemical_Work_Order_Lines__c, Site_Survey__r.Min_Hygiene_Work_Order_Lines__c, 
                    Site_Survey__r.Pest_WorkOrder_Calculation_Adjustment__c, 
                    Site_Survey__r.Min_Pest_Work_Order_Lines__c, Service_Appointment__c, 
                    Site_Survey__r.Signature_Required_For__c,
                    (SELECT SkillId, SkillLevel 
                    FROM SkillRequirements), 
                    (SELECT Id, SchedStartTime, SchedEndTime, DueDate, EarliestStartTime, Status 
                    FROM ServiceAppointments 
                    ORDER BY CreatedDate
                    LIMIT 1),
                    (SELECT Quantity, WorkTypeId, IsInstallation__c, PricebookEntry.Product2.IsPestService__c, 
                            LineItemNumber, Type_of_Service__c, Service_Frequency__c,
                            Order_Product__r.Product2.Family,Order_Product__r.Product2.Name, Order_Product__c  
                    FROM WorkOrderLineItems) 
            FROM WorkOrder
            WHERE Id IN :workOrderIds AND StartDate != NULL]);
            
        Set<Id> workTypeIds = new Set<Id>();
        Set<Id> operatingHoursIds = new Set<Id>();
        Set<Id> siteSurveyIds = new Set<Id>();
        Set<ServiceAppointment> updateServiceAppointments = new Set<ServiceAppointment>();
        List<ServiceAppointment> updateServiceAppointmentsList = new List<ServiceAppointment>();
        Map<Id, List<SiteSurvey_RequiredSkills__c>> surveySkillMap = new Map<Id, List<SiteSurvey_RequiredSkills__c>>();
        Datetime todaysDate = Datetime.now();
        
        for (WorkOrder wo : workOrders.values()) {
            for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                workTypeIds.add(woli.WorkTypeId);
            }
            
            siteSurveyIds.add(wo.Site_Survey__c);
            operatingHoursIds.add(wo.FSL__VisitingHours__c);
        }
        operatingHoursIds.remove(null);

        List<SiteSurvey_RequiredSkills__c> siteSurveyRequiredSkills = [
                SELECT Id, Site_Survey__c, Skill_Level__c, Skill_Name__c, Skill_Record_Id__c, Name, Line_of_Business__c
                FROM SiteSurvey_RequiredSkills__c
                WHERE Site_Survey__c IN :siteSurveyIds
        ];

        for (SiteSurvey_RequiredSkills__c sr : siteSurveyRequiredSkills) {
            String key = sr.Site_Survey__c;

            if (surveySkillMap.containsKey(key)) {
                surveySkillMap.get(key).add(sr);
            } else {
                surveySkillMap.put(key, new List<SiteSurvey_RequiredSkills__c>{sr});
            }
        }
        
        Map<Id, WorkType> workTypes = new Map<Id, WorkType>([
                SELECT EstimatedDuration, DurationType,
                        (SELECT SkillId, SkillLevel
                        FROM SkillRequirements)
                FROM WorkType WHERE Id IN :workTypeIds
        ]);

        Map<Id, OperatingHours> workOrderOperatingHours = new Map<Id, OperatingHours>([
                SELECT Id, Name, TimeZone,
                        (SELECT Id, DayOfWeek, StartTime, EndTime
                        FROM TimeSlots
                        ORDER BY DayOfWeek, StartTime, EndTime)
                FROM OperatingHours WHERE Id IN :operatingHoursIds
        ]);

        Map<String,ServiceAppointment> serviceAppointments = new Map<String,ServiceAppointment>();
        Map<String, SkillRequirement> skillRequirements = new Map<String, SkillRequirement>();
        
        for (WorkOrder wo : workOrders.values()) {
            String saId;
            
            if(wo.Status!=dataSets.Work_Order_New_Status__c && wo.Status!=dataSets.Work_Order_Scheduled_Status__c){continue;}

            if(!wo.ServiceAppointments.isEmpty()) {saId = wo.ServiceAppointments.get(0).Id;}

            Map<String, WorkType> deliveryWorkTypeMap = new Map<String, WorkType>();

            Datetime earliestStartDate = todaysDate;
            Datetime dueDate = todaysDate;
            
            if (wo.StartDate != null && wo.StartDate > todaysDate) {
                earliestStartDate = wo.StartDate;
                dueDate = earliestStartDate;
            }

            if (wo.EndDate != null && wo.EndDate > todaysDate) {
                dueDate = wo.EndDate;
            } 

            if(wo.SkillRequirements != null) {
                for (SkillRequirement sr : wo.SkillRequirements) {
                    String srKey = sr.SkillId + '|' + wo.Id;
                    SkillRequirement wosr = skillRequirements.get(srKey);
                    if (wosr == null) {
                        skillRequirements.put(srKey, new SkillRequirement(
                            RelatedRecordId = wo.Id,
                            SkillId = sr.SkillId,
                            SkillLevel = sr.SkillLevel,
                            EID__c = srKey
                        ));
                    } else {
                        wosr.SkillLevel = Math.min(sr.SkillLevel, wosr.SkillLevel);
                    }
                }
            }

            String eId = dueDate.year() + '-' + dueDate.month() + '-' + dueDate.day() + '-' + wo.Id;
            ServiceAppointment sa = new ServiceAppointment(
                ParentRecordId = wo.Id, 
                ContactId = wo.ContactId,
                EarliestStartTime = earliestStartDate,
                DueDate = dueDate,
                Duration = wo.Site_Survey__r.Duration_Adjustment_Time__c != null ? wo.Site_Survey__r.Duration_Adjustment_Time__c : 0,
                Type__c = wo.Type__c,
                Line_Of_Business__c = wo.Line_of_Business__c,
                DurationType = 'Minutes',
                EID__c = eId,
                FSL__Emergency__c = wo.Emergency__c,
                IsSeasonal__c = wo.IsSeasonal__c,
                Id = saId
            );
            
            //updated to be more efficient and calculate Pest LoB - case 21530 [dk]
            Decimal adjustmentAmount, numOfLines;
            
            if (sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Hygiene_LOB__c) {
                adjustmentAmount = wo.Site_Survey__r.Work_Order_Calculation_Adjustment__c;
                numOfLines = wo.Site_Survey__r.Min_Hygiene_Work_Order_Lines__c;
            } else if (sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Chemical_LOB__c) {
                adjustmentAmount = wo.Site_Survey__r.Chem_WorkOrder_Calculation_Adjustment__c;
                numOfLines = wo.Site_Survey__r.Min_Chemical_Work_Order_Lines__c;
            } else if (sa.Line_Of_Business__c == QueryUtils.fieldServiceSettings.Pest_LOB__c) {
                adjustmentAmount = wo.Site_Survey__r.Pest_WorkOrder_Calculation_Adjustment__c;
                numOfLines = wo.Site_Survey__r.Min_Pest_Work_Order_Lines__c;
            }
            
            List<String> signatureReq = new List<String>();
            if(wo.Site_Survey__c!=null && wo.Site_Survey__r.Signature_Required_For__c!=null){
                System.debug('~~Signature Req~~' + wo.Site_Survey__r.Signature_Required_For__c);
                signatureReq = wo.Site_Survey__r.Signature_Required_For__c.split(';');
            }
            
            System.debug('..BL..' + sa.Line_Of_Business__c + '..ADJ..' + adjustmentAmount + '..NOL..' + 
                          numOfLines + '..Duration..' + sa.Duration);

            if(numOfLines != null
                    && adjustmentAmount != null
                    && wo.WorkOrderLineItems.size() >= numOfLines)
            {
                sa.Duration += adjustmentAmount;
            }
            
            System.debug('..NOL Duration..' + sa.Duration);

            if(saId==null) {
                serviceAppointments.put(eId,sa);
            } else {
                updateServiceAppointments.add(sa);
            }
            
            List<SiteSurvey_RequiredSkills__c> skillsRequired = surveySkillMap.get(wo.Site_Survey__c); 

            if (skillsRequired != null) {
                for(SiteSurvey_RequiredSkills__c sr : skillsRequired) {
                    if(sr.Line_of_Business__c != null && wo.Line_of_Business__c != null) {
                        if(sr.Line_of_Business__c.contains(wo.Line_of_Business__c)) {
                            String srKey = sr.Skill_Record_Id__c + '|' + wo.Id;
                            SkillRequirement wosr = skillRequirements.get(srKey);
                            if (wosr == null) {
                                skillRequirements.put(srKey, new SkillRequirement(
                                    RelatedRecordId = wo.Id,
                                    SkillId = sr.Skill_Record_Id__c,
                                    SkillLevel = sr.Skill_Level__c, 
                                    EID__c = srKey
                                ));
                            } else {
                                wosr.SkillLevel = Math.min(sr.Skill_Level__c, wosr.SkillLevel);
                            }
                        }
                    }
                }
            }

            Boolean hasPestService = false;
            Boolean hasInstallation = false;
            for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                // Case 21592 - MD
                Frequency__c freq = Frequency__c.getInstance(woli.Service_Frequency__c);
                Decimal priority = freq.Evaluation_Priority__c;
                
                if (woliServiceFrequencyCountMap.get(sa.Id) != null){
                    Decimal prevPriority = woliServiceFrequencyCountMap.get(sa.Id);                  
                    if (priority < prevPriority){
                        woliServiceFrequencyCountMap.put(sa.Id, priority);
                        woliServiceFrequencyMap.put(sa.Id, woli.Service_Frequency__c);
                    }
                }
                else {
                    woliServiceFrequencyCountMap.put(sa.Id, priority);
                    woliServiceFrequencyMap.put(sa.Id, woli.Service_Frequency__c);
                }
                System.debug('--Work Types--' + woli.WorkTypeId);
                System.debug('--Name--' + woli.Order_Product__r.Product2.Name + '--Family--' + woli.Order_Product__r.Product2.Family);
                
                WorkType wt = workTypes.get(woli.WorkTypeId);
                Boolean isValid = woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c;
                
                if(woli.Order_Product__c!=null){
                    for(Integer c=0;c<signatureReq.size();c++){
                        if(signatureReq[c]==woli.Order_Product__r.Product2.Family){
                            sa.Duration+=5;
                            signatureReq[c]='XXX';
                        }
                    }
                }
                System.debug('..Signature Duration..' + sa.Duration);
          
                if (!hasInstallation && woli.IsInstallation__c) {
                    sa.Duration += (QueryUtils.fieldServiceSettings.Installation_Cleanup_Duration__c != null ? QueryUtils.fieldServiceSettings.Installation_Cleanup_Duration__c : 0);
                	hasInstallation = true;
                    System.debug('..Has Install..' + sa.Duration);
                }
                if (woli.PricebookEntry.Product2.IsPestService__c && !hasPestService) {
                    //first time seeing a pest service, include the fixed length duration from site survey
                    sa.Duration += (wo.Site_Survey__r.Pest_Duration_Calculation__c != null ? wo.Site_Survey__r.Pest_Duration_Calculation__c : 0);
                    hasPestService = true;
                    System.debug('..Pest Service Duration..' + sa.Duration);
                }
                else if (woli.PricebookEntry.Product2.IsPestService__c) {
                    //do nothing, already added duration
                } 
                else if (wt != null) {
                    System.debug('..Qty..' + woli.Quantity + '..EST Duration..' + wt.EstimatedDuration + '..Duration..' + wt.DurationType);
                    if(isValid) {
                        String key = QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c+'|'+wt.Id;
                        if(!deliveryWorkTypeMap.containsKey(key)) {
                            deliveryWorkTypeMap.put(key, wt);
                            sa.Duration += wt.EstimatedDuration * (wt.DurationType == 'Hours' ? 60 : 1);
                            System.debug('..Delivery Duration..' + sa.Duration);
                        }
                    } else {
                        sa.Duration += (woli.Quantity * wt.EstimatedDuration * (wt.DurationType == 'Hours' ? 60 : 1));
                        System.debug('..Not-Delivery Duration..' + sa.Duration);
                    }
                }
                
                if (wt != null) {
                    for (SkillRequirement sr : wt.SkillRequirements) {
                        String srKey = sr.SkillId + '|' + wo.Id;
                        SkillRequirement wosr = skillRequirements.get(srKey);

                        if (wosr == null) {
                            skillRequirements.put(srKey, new SkillRequirement(
                                RelatedRecordId = wo.Id,
                                SkillId = sr.SkillId,
                                SkillLevel = sr.SkillLevel,
                                EID__c = srKey
                            ));
                        } else {
                            if(sr.SkillLevel != null && wosr.SkillLevel != null) {
                                wosr.SkillLevel = Math.min(sr.SkillLevel, wosr.SkillLevel);
                            }
                        }
                    }
                }
            }
			
         	sa.FSL__GanttLabel__c = woliServiceFrequencyMap.get(sa.Id);
            woliServiceFrequencyMap.clear();
            woliServiceFrequencyCountMap.clear();

            if (sa.DurationType=='Minutes' && sa.Duration<6) {
                sa.Duration=6.0;
                sa.DurationType='Minutes';
            }
            System.debug('..Less than 1(Min) Duration..' + sa.Duration);
        }

        List<ServiceAppointment> sas = [
                SELECT Id, EID__c
                FROM ServiceAppointment
                WHERE EID__c IN :serviceAppointments.keySet()
        ];
        
        for (ServiceAppointment sa : sas) {
            ServiceAppointment temp = serviceAppointments.remove(sa.EID__c);
            temp.Id = sa.Id;
            updateServiceAppointments.add(temp);
        }

        if (!updateServiceAppointments.isEmpty()) {
            updateServiceAppointmentsList.addAll(updateServiceAppointments);
        }
        
        Database.SaveResult[] insertSA = Database.insert(serviceAppointments.values(), false);
        Database.SaveResult[] updateSA = Database.update(updateServiceAppointmentsList, false);
        
        if (!skillRequirements.isEmpty()) {
            upsert skillRequirements.values() EID__c;
        }

        List<SkillRequirement> deleteSkillRequirements = [
                SELECT Id
                FROM SkillRequirement
                WHERE RelatedRecordId IN :workOrders.keySet()
                AND EID__c NOT IN :skillRequirements.keySet()
        ];

        delete deleteSkillRequirements;
        
        List<Batch_Errors__c> tErrorsList = new List<Batch_Errors__c>();

        for (Integer i = 0; i < updateSA.size(); i++) {
            if (!updateSA[i].isSuccess()) {
                String errors = '';

                for (Database.Error err : updateSA[i].getErrors()) {
                    errors = errors + err.getMessage();
                }

                ServiceAppointment sa = updateServiceAppointmentsList[i];

                tErrorsList.add(new Batch_Errors__c(
                    Name = String.valueOf(System.today()),
                    Error_Messages__c = errors, 
                    StartTime__c = sa.EarliestStartTime, 
                    EndTime__c = sa.DueDate, 
                    OrderId__c = sa.ParentRecordId,  
                    Failed_Batch__c = 'SpawnServiceAppointments'
                ));
            }
        }

        for (Integer i = 0; i < insertSA.size(); i++) {
            if (!insertSA[i].isSuccess()) {
                String errors = '';

                for (Database.Error err : insertSA[i].getErrors()) {
                    errors = errors + err.getMessage();
                }

                ServiceAppointment sa = serviceAppointments.values()[i];

                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c = errors, 
                    StartTime__c = sa.EarliestStartTime, 
                    EndTime__c = sa.DueDate, 
                    OrderId__c = sa.ParentRecordId,  
                    Failed_Batch__c = 'SpawnServiceAppointments'
                ));
            }
        }

        insert tErrorsList;
    }

    global void finish(Database.BatchableContext bc){
        if(!Test.isRunningTest()){
            System.debug('--PASS TIME FRAME--' + startDT + '--' + endDT);
            if(!IS_DATE_FILTER){Database.executeBatch(new SpawnWorkOrderFiles(), 50);}
            //if(IS_DATE_FILTER){Database.executeBatch(new SpawnWorkOrderFiles(), 50);}
        }
    }
    
    global void execute(SchedulableContext ctx) {
        Database.executeBatch(new SpawnServiceAppointments(), 50);
    }
}