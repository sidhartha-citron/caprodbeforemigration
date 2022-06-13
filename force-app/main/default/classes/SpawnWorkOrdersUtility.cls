/**
 * SpawnWorkOrdersUtility: Implements all the functions required to generate the work order according to Fixed Route requirements 
 * @author Shashi
 * @version 1.0 
 * @since 12-16-2019
 **/
public class SpawnWorkOrdersUtility {
	/**Variables**/
    private Field_Service_Settings__c dataSets;
    private List<Advanced_Days__c> advDaysCSets;
    
    public Boolean IS_EMERGENCY = false;
    public Integer CONTROL_WO_TYPE = 0;
    public Integer ADD_DAYS = 0;
    private String C_OTDELIVERY = 'ONE-TIME-DELIVERY';
    private String C_OTSERVICE = 'ONE-TIME-SERVICE';
    private String C_INSTALL = 'INSTALLATION';
    private String C_REPLACE = 'REPLACE';
    private String C_DEINSTALL = 'DEINSTALL';
    private String C_RECURRING = 'RECURRING';
    
    /**Collections**/
    public Set<ID> fltOrderIds = new Set<ID>();
    public Set<ID> orderIds = new Set<ID>();
    public Set<ID> fltaccntIds = new Set<ID>();
    public List<Order> orderList = new List<Order>();
    private List<WorkOrder> workOrdersToInsert = new List<WorkOrder>();
    private List<WorkOrderLineItem> workOrderLineItemYesInsert = new List<WorkOrderLineItem>();
    private List<Related_Work_Order__c> relatedWoToInsert = new List<Related_Work_Order__c>();
    private List<ResourcePreference> resoucePrefInsert = new List<ResourcePreference>();
    private List<Batch_Errors__c> tErrorsList = new List<Batch_Errors__c>();
    private List<Id> lEquipments = new List<Id>();//FIFO Queue
    private List<OrderItem> orderItemListUpdate = new List<OrderItem>();
    
    //ACCOUNTID, ACCOUNT
    private Map<Id, Account> accountMap = new Map<Id, Account>();
    //STRING, ACCOUNTID
    private Map<String, Id> accountLOBOperatingHoursMap = new Map<String,Id>();
    //ID, OPERATINGHOURS
    Map<Id, OperatingHours> workOrderOperatingHours = new Map<Id, OperatingHours>();
    //ACCOUNTID, LIST<ORDER>
    private Map<Id,List<Order>> mpacctOrders = new Map<Id,List<Order>>();
    //WORKTYPE,ACCOUNT + ORDER.EFFECTIVE DATE + LOB + SERVICE PLAN, WORKORDERRECORD
    private Map<String,Map<String,WorkOrderRecord>> mpGroupedWOs = new Map<String,Map<String,WorkOrderRecord>>();
    //ACCOUNT + ORDER.EFFECTIVE DATE + LOB + SERVICE PLAN, WORKORDERRECORD
    Map<String,WorkOrderRecord> recurDelServ = new Map<String,WorkOrderRecord>();
    //DATE, <ORDERID, <WORKORDERID, WORKORDERRECORD>>
    private Map<String,Map<Id,Map<String,WorkOrderRecord>>> dateMatrix = new Map<String,Map<Id,Map<String,WorkOrderRecord>>>();
    //String, Related Work Order
    private Map<String,List<Related_Work_Order__c>> mpDeleteRELWOs = new Map<String,List<Related_Work_Order__c>>();
    //String, WorkorderRecord
    private Map<String,List<WorkOrder>> mpDeleteWOs = new Map<String,List<WorkOrder>>();
    
    /**Objects**/
    public class MatrixRecord {
        public Id workOrderId { get; set; }
        public WorkOrderLineItem workOrderLineItemRec { get; set; }
        public Id orderId { get; set;}
        public Integer orderNum {get; set;}
        public Id orderItemId { get; set; }
        public Id assetId { get; set; }
        public String schedulecode { get; set; }
        public Date effectiveDate { get; set; }
        public Date startDate { get; set; }
        public Date scheduleDate { get; set; }
        public Date endDate { get; set; }
        public String lineOfBusiness { get; set; } 
        public String workType { get; set; }
        public String workOrderStatus { get; set; }
        public String workTypeId { get; set; }
        public String installationNotes { get; set; }
        public String serviceNotes { get; set; }
        public Id relatedProductId { get; set; }
        public Id productId { get; set; }
        public String productName { get; set; }
        public Integer qty { get; set; }
        public Id priceBookEntryId { get; set; }
        public Boolean isPestControlMonthly {get; set;}
        public Boolean seasonal { get; set; }
        public Date SeasonStart { get; set; }
        public Date SeasonEnd { get; set; }
        public Set<Date> setItmSchedules { get; set; }
        public OrderItem orderItemRec {get; set;}
        public String Frequency {get; set;}
        public Date LastCompletionDate {get; set;}
       
        public MatrixRecord(){
            setItmSchedules = new Set<Date>();
        }
    }
    
    public class WorkOrderRecord {
        public String grpKey {get;set;}
        public WorkOrder WorkOrderRec { get; set; }
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
        public String orderNumber { get; set; }
        public Id pricebook2Id { get; set; }
        public Id siteSurveyId { get; set; }
        public Id serviceTerritoryId { get; set; }
        public Id visitingHoursId { get; set; }
        public String siteSurveyNotes { get; set; }
        public Boolean hasPestControlMonthly {get; set;}
        public String accpacDeliveryOrderNumber {get; set;}
        public String orderRecordTypeId {get; set;}
        public String serviceReportLanguage {get; set;} //Case 21621 MD
        public Boolean isEquipment {get;set;}
        public Boolean isServiceInstall {get;set;}
        public String Frequency {get;set;}
        public String ScheduleCode {get;set;}
        public Date EffectiveDate {get;set;}
        public Boolean seasonal {get;set;}
        public String InstallationLOB {get;set;}
        public String description {get; set;}
        public Id ServiceResourceId {get; set;}
        public Date LastCompletionDate {get; set;}
        public Boolean isRecurring {get; set;}
        
        public Set<Id> setOrderIds {get;set;}
        public Set<Date> setSchedules {get;set;}
        public Map<Id,MatrixRecord> mpMatrixRecords { get; set; }

        public WorkOrderRecord() {
            mpMatrixRecords = new Map<Id,MatrixRecord>();
            setOrderIds = new Set<Id>();
            setSchedules = new Set<Date>();
            isEquipment = false;
            InstallationLOB = '';
            isRecurring = false;
        }
    }
    
    public class OrderGroup{
        public Order order_int = null;
        public List<OrderItem> orderItm_int = new List<OrderItem>();
    }

    /**
     * Constuctor
     **/
    public SpawnWorkOrdersUtility(){
        dataSets = Field_Service_Settings__c.getOrgDefaults();
        advDaysCSets = Advanced_Days__c.getall().values();
        
        mpDeleteRELWOs.put(C_OTDELIVERY,new List<Related_Work_Order__c>());
        mpDeleteRELWOs.put(C_OTSERVICE,new List<Related_Work_Order__c>());
        mpDeleteRELWOs.put(C_INSTALL,new List<Related_Work_Order__c>());
        mpDeleteRELWOs.put(C_REPLACE,new List<Related_Work_Order__c>());
        mpDeleteRELWOs.put(C_DEINSTALL,new List<Related_Work_Order__c>());
        mpDeleteRELWOs.put(C_RECURRING,new List<Related_Work_Order__c>());
        
        mpDeleteWOs.put(C_OTDELIVERY,new List<WorkOrder>());
        mpDeleteWOs.put(C_OTSERVICE,new List<WorkOrder>());
        mpDeleteWOs.put(C_INSTALL,new List<WorkOrder>());
        mpDeleteWOs.put(C_REPLACE,new List<WorkOrder>());
        mpDeleteWOs.put(C_DEINSTALL,new List<WorkOrder>());
        mpDeleteWOs.put(C_RECURRING,new List<WorkOrder>());
    }
    
    /**
     * Generate On-Demand Work Orders
     **/
    public void onDemandWOs(Id actid, Id ordid){
        Boolean flag = true;
        Set<Id> workorderIds = new Set<Id>();
               
        if(actid!=null && ordid!=null){flag=true;}
        System.debug('..AID..' + actid + '...OID...' + ordid + '...FLAG...' + flag);
        
        if(actid!=null){fltaccntIds.add(actid);}
        if(ordid!=null){fltOrderIds.add(ordid);} 
        else{
            for (Order o : [SELECT id FROM order WHERE AccountId=:fltaccntIds AND isValid__c=TRUE AND Emergency__c=FALSE]) {
                fltOrderIds.add(o.id);
            }
        }

        //flag = false;
        //Generate Work Orders
		getOrdersWOByAccount();
        mergeOrSplitWO();
        generateWOs(flag);
        
        for(Related_Work_Order__c rwo: [SELECT id, WorkOrder__c FROM Related_Work_Order__c 
                                         WHERE Order__c =:fltOrderIds AND WorkOrder__r.isValid__c = TRUE]){
                workorderIds.add(rwo.WorkOrder__c);
        }
        System.debug('--WO Generated--' + workorderIds.size());
        if(workorderIds.size()>0){
            //Generate Work Order Rooms
            SpawnWorkOrderRooms swr = new SpawnWorkOrderRooms();
            swr.processWorkOrders(workorderIds);    
            //Generate Service Appointments
            SpawnServiceAppointments ssp = new SpawnServiceAppointments();
            ssp.processWorkOrders(workorderIds);
        }
    }
    
    /**
     * Fetch a list of orders using account id. This ensures all orders are accounted for in a given account also 
     * allows generating work orders by Account.
     **/
    public void getOrdersWOByAccount(){
        //WORKORDERID, RELATEDWO
        Map<Id,List<Related_Work_Order__c>> mpRelWOUK = new Map<Id,List<Related_Work_Order__c>>();
        //WORKORDERID, SET<ORDERID>
        Map<Id,Set<Id>> mpWoOrdSet = new Map<Id,Set<Id>>();
        
        System.debug('**IS EMERGENCY**' + IS_EMERGENCY);
        if(!IS_EMERGENCY){
            orderList = [SELECT Id, Description, AccountId, Account.Account_Balance__c, Account.Credit_Limit__c, EffectiveDate, Pricebook2Id, OpportunityId, Account.Service_Territory__c, 
                            Service_Territory__c,Emergency__c, BillToContactId,ShipToContactId,OwnerId,Site_Survey__c,Account.Site_Survey__c,Accpac_Delivery_Order_Number__c,
                            Season_End_Date__c,Season_Start_Date__c,OrderNumber,Account.Hygiene_OperatingHoursId__c,Account.Life_Safety_OperatingHoursId__c,RecordTypeId,
                           	Account.Chemical_OperatingHoursId__c, Account.Pest_Control_OperatingHoursId__c, Account.OperatingHoursId,Account.Id, Site_Survey__r.Notes__c,Line_of_Businesses__c,
                            (SELECT Id,orderId,Order.OrderNumber,Asset__c, Asset__r.Last_Scanned_Date__c, Last_Scanned_Date__c, isInstallation__c, isPurchase__c,isPurchaseOnly__c,isService__c,IsActive__c,
                                	PricebookEntryId, Line_Of_Business__c, Quantity, UnitPrice, ListPrice, Product2Id, Product_Type__c, Product2.Family,Related_Product__c,
                                	Delivery_Work_Type__c,Installation_Work_Type__c,Service_Work_Type__c,Separate_Delivery__c,DeInstallation_Work_Type__c,Product2.Name,Product2.Is_Inventory_Item__c, 
                                	Last_Automation_Created_Date__c,isValid__c, isSchedulable__c, Frequency__c, Installation_Status__c, Asset__r.Status,  
                             		Remove_Installation_Work_Type__c, OrderItemNumber, Last_InFlight_WO_Date__c, Valid_for_Install_Remove_Replace__c, Installation_Notes__c,Service_Notes__c,
                             		Service_Plan__c,Service_Plan__r.Effective_Date__c, Service_Plan__r.Frequency__c, Service_Plan__r.Job_Type__c, Service_Plan__r.Line_of_Business__c,
                             	    Service_Plan__r.Route__c, Service_Plan__r.Route__r.Name, Service_Plan__r.Route__r.Service_Resource__c, Service_Plan__r.Schedule_Type__c,Is_Completed__c,
                             		Service_Plan__r.Schedule_Type__r.Code__c,Service_Plan__r.Schedule_Type__r.Frequency__c,Is_Never_Generate_Work_order__c,Inventory_Allocated__c,
                                    ServiceDate,Next_Scheduled_Date__c,Next_Schedule_Due_Date__c,Next_Service_Date__c,Installation_Date__c, Last_Work_Order_Completed_Date__c 
                            FROM OrderItems WHERE Active__c=TRUE AND isValid__c=TRUE ORDER BY OrderId,Product2.Family,Sort_Order__c ASC) 
                      FROM Order WHERE isValid__c=TRUE AND Order.AccountId IN:fltaccntIds AND Order.Account.isValid__c=TRUE AND Emergency__c = FALSE AND
                                       ((Service_Territory__c!=null AND Service_Territory__r.Include_In_Integration__c=true) OR 
                                       (Service_Territory__c=null AND Order.Account.Service_Territory__c!=null AND Order.Account.Service_Territory__r.Include_In_Integration__c=true))];
        }
        else {
            orderList = [SELECT Id, Description, AccountId, Account.Account_Balance__c, Account.Credit_Limit__c, EffectiveDate, Pricebook2Id, OpportunityId, Account.Service_Territory__c, 
                            Service_Territory__c,Emergency__c, BillToContactId,ShipToContactId,OwnerId,Site_Survey__c,Account.Site_Survey__c,Accpac_Delivery_Order_Number__c,
                            Season_End_Date__c,Season_Start_Date__c,OrderNumber,Account.Hygiene_OperatingHoursId__c,Account.Life_Safety_OperatingHoursId__c,RecordTypeId,
                           	Account.Chemical_OperatingHoursId__c, Account.Pest_Control_OperatingHoursId__c, Account.OperatingHoursId,Account.Id, Site_Survey__r.Notes__c,Line_of_Businesses__c,
                            (SELECT Id,orderId,Order.OrderNumber,Asset__c, Asset__r.Last_Scanned_Date__c, Last_Scanned_Date__c, isInstallation__c, isPurchase__c,isPurchaseOnly__c,isService__c,IsActive__c,
                                	PricebookEntryId, Line_Of_Business__c, Quantity, UnitPrice, ListPrice, Product2Id, Product_Type__c, Product2.Family,Related_Product__c,
                                	Delivery_Work_Type__c,Installation_Work_Type__c,Service_Work_Type__c,Separate_Delivery__c,DeInstallation_Work_Type__c,Product2.Name,Product2.Is_Inventory_Item__c, 
                                	Last_Automation_Created_Date__c,isValid__c, isSchedulable__c, Frequency__c, Installation_Status__c, Asset__r.Status,  
                             		Remove_Installation_Work_Type__c, OrderItemNumber, Last_InFlight_WO_Date__c, Valid_for_Install_Remove_Replace__c, Installation_Notes__c,Service_Notes__c,
                             		Service_Plan__c,Service_Plan__r.Effective_Date__c, Service_Plan__r.Frequency__c, Service_Plan__r.Job_Type__c, Service_Plan__r.Line_of_Business__c,
                             	    Service_Plan__r.Route__c, Service_Plan__r.Route__r.Name, Service_Plan__r.Route__r.Service_Resource__c, Service_Plan__r.Schedule_Type__c,Is_Completed__c,
                             		Service_Plan__r.Schedule_Type__r.Code__c,Service_Plan__r.Schedule_Type__r.Frequency__c,Is_Never_Generate_Work_order__c,Inventory_Allocated__c,
                                    ServiceDate,Next_Scheduled_Date__c,Next_Schedule_Due_Date__c,Next_Service_Date__c,Installation_Date__c, Last_Work_Order_Completed_Date__c 
                            FROM OrderItems WHERE Active__c=TRUE AND isValid__c=TRUE ORDER BY OrderId,Product2.Family,Sort_Order__c ASC) 
                      FROM Order WHERE isValid__c=TRUE AND Order.AccountId IN:fltaccntIds AND Order.Account.isValid__c=TRUE AND
                                       ((Service_Territory__c!=null AND Service_Territory__r.Include_In_Integration__c=true) OR 
                                       (Service_Territory__c=null AND Order.Account.Service_Territory__c!=null AND Order.Account.Service_Territory__r.Include_In_Integration__c=true))];

        }
        
        System.debug('--Listed Orders--' + fltOrderIds.size());
        for(Order o:orderList){
            if(fltOrderIds.size()>0){
                if(fltOrderIds.contains(o.Id)){orderIds.add(o.Id);System.debug('--ADHOC PROCESSING--');} 
                else {continue;}
            } 
            else {
                System.debug('--BATCH PROCESSING--');
                if(o.Emergency__c!=null && o.Emergency__c==true){System.debug('--Emergency Order:' + o.OrderNumber);continue;}
                orderIds.add(o.Id); 
            }
            accountMap.put(o.AccountId,o.Account);
            List<Order> ordSm = new List<Order>();
            if(mpacctOrders.containsKey(o.AccountId)){
                ordSm = mpacctOrders.get(o.AccountId);
                ordSm.add(o);
            } else {
                ordSm.add(o);
                mpacctOrders.put(o.AccountId,ordSm);
            }
        }
        
        System.debug('Number of Orders:' + orderIds);
        
        //Gather all Operating hours
        accountLOBOperatingHoursMap = getLOBSpecificOperatingHours(accountMap);
        Set<Id> operatingHoursIds = new Set<Id>();
        operatingHoursIds.addAll(accountLOBOperatingHoursMap.values());
        workOrderOperatingHours = new Map<Id, OperatingHours>([SELECT Id, Name, TimeZone, 
                                                               (SELECT Id, DayOfWeek, StartTime, EndTime 
                                                                FROM TimeSlots ORDER BY DayOfWeek, StartTime, EndTime) 
                                                               FROM OperatingHours WHERE Id IN :operatingHoursIds]);  
        
       
        //Work Order list from account
        List<WorkOrder> woList=[SELECT Id,AccountId,Order__c,Order__r.OrderNumber,HasBeenDispatched__c,Line_Of_Business__c,Type__c,StartDate,EndDate, 
                                       WorkOrderNumber, StatusCategory,Status,Accpac_Delivery_Order_Number__c,IsRecurring__c,isSeasonal__c,
                                      (SELECT Id,PricebookEntryId,Product__c,Quantity,workTypeId,OrderId,Order_Product__c,Order_Product__r.Product2.Name,
                                       		  Order_Product__r.Frequency__c,Related_Product__c,AssetId,Type_Of_Service__c,Installation_Notes__c,
                                              Service_Notes__c,Order.OrderNumber,Order_Product__r.Product2.Family 
                                       FROM WorkOrderLineItems ORDER BY StartDate DESC)
                                FROM WorkOrder WHERE Order__c IN:orderIds AND 
                                                     Type__c IN ('Service','Delivery','Installation','DeInstall','Replace') AND 
                                                     (IsValidForUpdate__c=TRUE OR IsValidForUpdateEmergency__c=TRUE OR 
                                                     STATUS IN ('Cancelled','Cancelled - Frequency Change','On Site','On Route') OR 
                                                     (STATUS IN ('Completed') AND StartDate >= Today))
                                                ORDER BY StartDate DESC];
        
        //Query related list
        List<Related_Work_Order__c> relWOList = [SELECT Id,Order__c,WorkOrder__c,Work_Order_Number__c,
                                                        StartDate__c,WorkOrder__r.IsRecurring__c,WorkOrder__r.Type__c 
                                                 FROM Related_Work_Order__c 
                                                 WHERE Order__c IN:orderIds];
        for(Related_Work_Order__c rwo:relWOList){
            List<Related_Work_Order__c> lstRWO = new List<Related_Work_Order__c>();
            if(!mpRelWOUK.containsKey(rwo.WorkOrder__c)){
                lstRWO.add(rwo);
                mpRelWOUK.put(rwo.WorkOrder__c,lstRWO);
            } else {
                lstRWO = mpRelWOUK.get(rwo.WorkOrder__c);
                lstRWO.add(rwo);
            }
        }
        
        for(WorkOrder wo:woList) {
            //Past work orders based on work order type
            if (wo.Status==dataSets.Work_Order_New_Status__c || 
                wo.Status==dataSets.Work_Order_Scheduled_Status__c) { 
                    
                    List<WorkOrder> lstWODels = new List<WorkOrder>();
                    if(wo.Type__c==dataSets.Label_for_Install_Work_Order_Type__c){
                        lstWODels=mpDeleteWOs.get(C_INSTALL);
                        lstWODels.add(wo);  
                    }
                    if(wo.Type__c==dataSets.Label_for_Replace_Work_Order_Type__c){
                        lstWODels=mpDeleteWOs.get(C_REPLACE);
                        lstWODels.add(wo);  
                    }
                    if(wo.Type__c==dataSets.DeInstall_Work_Order_Type__c){
                        lstWODels=mpDeleteWOs.get(C_DEINSTALL);
                        lstWODels.add(wo);  
                    }
                    if(!wo.IsRecurring__c && wo.Type__c==dataSets.Label_for_Delivery_Work_Type__c){
                        lstWODels=mpDeleteWOs.get(C_OTDELIVERY);
                        lstWODels.add(wo);
                    }
                    if(!wo.IsRecurring__c && wo.Type__c==dataSets.Label_for_Service_Work_Order_Type__c){
                        lstWODels=mpDeleteWOs.get(C_OTSERVICE);
                        lstWODels.add(wo); 
                    }
                    if(wo.IsRecurring__c && wo.StartDate >= Date.today()){
                        System.debug('~~Delete~~' + wo.WorkOrderNumber);
                        lstWODels=mpDeleteWOs.get(C_RECURRING);
                        lstWODels.add(wo); 
                    }
                    
                    if(mpRelWOUK.containsKey(wo.Id)){
                        for(Related_Work_Order__c rwo:mpRelWOUK.get(wo.Id)){
                            List<Related_Work_Order__c> lstRWODels = new List<Related_Work_Order__c>();
                            if(rwo.WorkOrder__r.Type__c==dataSets.Label_for_Install_Work_Order_Type__c){
                                lstRWODels=mpDeleteRELWOs.get(C_INSTALL);
                                lstRWODels.add(rwo);  
                            }
                            if(rwo.WorkOrder__r.Type__c==dataSets.Label_for_Replace_Work_Order_Type__c){
                                lstRWODels=mpDeleteRELWOs.get(C_REPLACE);
                                lstRWODels.add(rwo);  
                            }
                            if(rwo.WorkOrder__r.Type__c==dataSets.DeInstall_Work_Order_Type__c){
                                lstRWODels=mpDeleteRELWOs.get(C_DEINSTALL);
                                lstRWODels.add(rwo);  
                            }
                            if(!rwo.WorkOrder__r.IsRecurring__c && rwo.WorkOrder__r.Type__c==dataSets.Label_for_Delivery_Work_Type__c){
                                lstRWODels=mpDeleteRELWOs.get(C_OTDELIVERY);
                                lstRWODels.add(rwo);
                            }
                            if(!rwo.WorkOrder__r.IsRecurring__c && rwo.WorkOrder__r.Type__c==dataSets.Label_for_Service_Work_Order_Type__c){
                                lstRWODels=mpDeleteRELWOs.get(C_OTSERVICE);
                                lstRWODels.add(rwo); 
                            }
                            if(rwo.WorkOrder__r.IsRecurring__c && rwo.StartDate__c >= Date.today()){
                                lstRWODels=mpDeleteRELWOs.get(C_RECURRING); 
                                lstRWODels.add(rwo); 
                            }
                        }
                    }
                }
            else {
                Map<Id,Map<String,WorkOrderRecord>> ordermap = new Map<Id,Map<String,WorkOrderRecord>>();
                Map<String,WorkOrderRecord> womap = new Map<String,WorkOrderRecord>();
                WorkOrderRecord wor = new WorkOrderRecord();
                
                Date xStartDate = Date.newinstance(wo.StartDate.year(), wo.StartDate.month(), wo.StartDate.day());
                
                //Dispatched earlier than today
                if((wo.Type__c==dataSets.Label_for_Replace_Work_Order_Type__c || wo.Type__c==dataSets.DeInstall_Work_Order_Type__c || 
                    wo.Type__c==dataSets.Label_for_Install_Work_Order_Type__c) && xStartDate <= Date.today() && 
                    (wo.Status==dataSets.Work_Order_Dispatched_Status__c || wo.Status=='On Site' || wo.Status=='On Route')){
                       xStartDate = Date.today();
                }
                
               
                //Dispatched earlier than today
                if((wo.Type__c==dataSets.Label_for_Delivery_Work_Type__c || 
                    wo.Type__c==dataSets.Label_for_Service_Work_Order_Type__c) && xStartDate <= Date.today() && 
                   (wo.Status==dataSets.Work_Order_Dispatched_Status__c || wo.Status=='On Site' || wo.Status=='On Route')){
                    for(WorkOrderLineItem woli:wo.WorkOrderLineItems){
                        if(woli.Order_Product__r.Frequency__c==dataSets.Non_Recurring_Frequency_Value__c){
                            xStartDate = Date.today();
                        }
                    } 
                }

				String dtKey = wo.AccountId + '$' + xStartDate;                 
                if(dateMatrix.containsKey(dtKey)){ordermap = dateMatrix.get(dtKey);} 
                else {dateMatrix.put(dtKey,ordermap);}
                
                for(WorkOrderLineItem woli:wo.WorkOrderLineItems){
                    String woKey = wo.Id + '-' + woli.orderId;
                    if(ordermap.containsKey(woli.orderId)){
                        womap = ordermap.get(woli.orderId);
                        if(womap.containsKey(woKey)){wor = womap.get(woKey);}
                        else{
                            wor = setPreWOFields(wo);
                            womap.put(woKey,wor);
                            ordermap.put(woli.orderId,womap);
                        }
                    } 
                    else {
                        wor = setPreWOFields(wo);
                        womap.put(woKey,wor);
                        ordermap.put(woli.orderId,womap);
                    }
                    
                    MatrixRecord mtxrec = new MatrixRecord();
                    mtxrec.orderId = woli.orderId;
                    mtxrec.orderItemId = woli.Order_Product__c;
                    System.debug(wo.Status + '-- On -- ' + xStartDate + '-(' + woli.Order_Product__c +')-' + 
                                 woli.Order_Product__r.Product2.Name + '--' + woli.Order.OrderNumber + '(' + woli.orderId + ')');
                    wor.mpMatrixRecords.put(woli.Order_Product__c,mtxrec);
                }
            }
        }
        
        //Enable only for debugging
        /*for(Date dt:dateMatrix.keySet()){
            System.debug('**SPWOUTIL::DATE::' + dt);
            Map<Id,Map<String,WorkOrderRecord>> om = dateMatrix.get(dt);
            for(Id oi:om.keySet()){
                System.debug('**SPWOUTIL::ORDID::' + oi);
                Map<String,WorkOrderRecord> wom = om.get(oi);
                for(WorkOrderRecord wr:wom.values()){
                	System.debug('**SPWOUTIL::WO::' + wr.worktype + '::' + wr.Status);
                    System.debug('**SPWOUTIL::WOLI::' + wr.mpMatrixRecords.KeySet());
                }
            }
        }*/
    }
    
    /**
     * 
     **/
    private WorkOrderRecord setPreWOFields(WorkOrder oWO){
        WorkOrderRecord wor = new WorkOrderRecord(); 
        wor.workOrderId = oWO.Id;
        wor.WorkOrderRec = oWO;
        wor.status = oWO.Status;
        wor.lineOfBusiness = oWO.Line_of_Business__c;
        wor.worktype = oWO.Type__c;
        wor.orderId = oWO.Order__c;
        return wor;
    }
   
    /**
     * Installation Work Order Logic
     * 1. Same Account + Same LOB + Equipment/Consumables/Service + Order Start Date is Same
     * 2. Valid_for_Install_Remove_Replace__c = false, Is_Never_Generate_Work_order__c = false
     * 3. Installation_Status__c = Install for Equipment and Service
     * 4. Service Frequency is One-Time for Equipment and Consumables
     **/
    public void mergeOrSplitWO(){
        String strNonRecEffDate = '';
        String strLOB = '';
        Map<Id,OrderGroup> prevOrdGrp=new Map<Id,OrderGroup>();
        
        mpGroupedWOs.put(dataSets.Label_for_Install_Work_Order_Type__c,new Map<String,WorkOrderRecord>());
        mpGroupedWOs.put(dataSets.Label_for_Delivery_Work_Type__c,new Map<String,WorkOrderRecord>());
        mpGroupedWOs.put(dataSets.Label_for_Service_Work_Order_Type__c,new Map<String,WorkOrderRecord>());
        mpGroupedWOs.put(dataSets.Label_for_Replace_Work_Order_Type__c,new Map<String,WorkOrderRecord>());
        mpGroupedWOs.put(dataSets.DeInstall_Work_Order_Type__c,new Map<String,WorkOrderRecord>());
        
        for(Id acctid:mpacctOrders.keySet()){
            List<Order> processOrders = mpacctOrders.get(acctid);
            prevOrdGrp.clear();
            lEquipments.clear();
            for(Order curOrd:processOrders){
                System.debug('**ORDER**' + curOrd.OrderNumber + '::DATE::' + curOrd.EffectiveDate);
                
                for(OrderItem curOrdItm:curOrd.OrderItems){
                    System.debug('**ORDER ITEM**' + curOrdItm.Product2.Name + ':' + curOrdItm.Product2.Family +
                                  ':' + curOrdItm.Product_Type__c + ':' + curOrdItm.Frequency__c);

                    if(!curOrd.Emergency__c && !curOrdItm.Inventory_Allocated__c){
                            System.debug('**Missing Inventory**');continue;
                    }
                    
                    Boolean isByPass_OTCompleted = false;
                    if(curOrdItm.Valid_for_Install_Remove_Replace__c &&
                       (curOrdItm.Installation_Status__c==dataSets.Status_Value_for_Removal_of_a_Product__c ||
                        curOrdItm.Installation_Status__c==dataSets.Status_Value_for_Replace_of_a_Product__c)){
                            isByPass_OTCompleted = true;
                            System.debug('--By Pass Completed--');
                    }
                    
                    if(!isByPass_OTCompleted && curOrdItm.Is_Completed__c){
                        	System.debug('--Completed One-Time By Flag--');continue;
                    }
                    
                    if(curOrdItm.Frequency__c==dataSets.Non_Recurring_Frequency_Value__c && !isByPass_OTCompleted && 
                       curOrdItm.Last_Automation_Created_Date__c!=null &&
                       curOrdItm.Last_Automation_Created_Date__c<Date.today()){
                           System.debug('--Completed One-Time By Date--');continue;
                    }
                    
                    String sKey = curOrd.AccountId;
                    String orderKey = ':' + curOrd.Id;
                    
                    if(curOrdItm.Product2.Family==dataSets.Life_Safety_LOB__c){strLOB= ':' + dataSets.Hygiene_LOB__c;}
                    else{strLOB= ':' + curOrdItm.Product2.Family;}
                    
                    if(curOrdItm.Product2.Family==dataSets.Pest_LOB__c){strLOB=':' + curOrdItm.Product2.Family;}
                    
                    if(curOrd.EffectiveDate<Date.today()){strNonRecEffDate= ':' + Date.today();} 
                    else {strNonRecEffDate= ':' + curOrd.EffectiveDate;}
                    
                    if(!curOrdItm.Is_Never_Generate_Work_order__c) {
                        WorkOrderRecord wor = new WorkOrderRecord();
                        Boolean isConsumableInstalled = false;
                        Boolean isServiceInstalled = false;
                        String equipmentId = '';
                        
                        if(lEquipments.size()>0){equipmentId = lEquipments.get(lEquipments.size()-1);}
                        
                        //Installation
                        if((curOrdItm.Valid_for_Install_Remove_Replace__c || 
                            curOrdItm.Product_Type__c==dataSets.Item_Type_for_Consumables__c ||
                            curOrdItm.Product_Type__c==dataSets.Item_Type_for_Equipment__c) &&
                           (curOrdItm.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c && 
                             curOrdItm.Installation_Status__c!=dataSets.Status_Value_for_Removal_of_a_Product__c)){
                            
                            Map<String, WorkOrderRecord> mpKeyWOR = mpGroupedWOs.get(dataSets.Label_for_Install_Work_Order_Type__c);
                            //If seasonal and requires installation 
                            if(curOrd.Season_Start_Date__c!=null){strNonRecEffDate=':'+curOrd.Season_Start_Date__c;}
                            
                            wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+equipmentId,curOrd,curOrdItm,'I');
                            System.debug('--Install LOB--' + wor.InstallationLOB + '--' + strLOB);
                            
                            //Create Service Installation WO 
                            if(curOrdItm.Valid_for_Install_Remove_Replace__c && wor.InstallationLOB!=strLOB &&
                               curOrdItm.Product_Type__c==dataSets.Item_Type_of_Services__c &&
                               curOrdItm.Installation_Status__c==dataSets.Status_Value_for_Install_of_a_Product__c){
                                   wor = new WorkOrderRecord();
                                   wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,curOrd,curOrdItm,'I');
                                   fillWOLIObject(wor, curOrdItm, curOrd);
                                   isServiceInstalled = true;
                                   wor.isServiceInstall = true;
                                   wor.InstallationLOB = strLOB; 
                                   System.debug('**INSTALL SERVICE ONLY**');
                                   
                                   //Adding consumables to service installation by LOB
                                   if(prevOrdGrp.size()>0){
                                       System.debug('**ADDING CONSUMABLES TO SERVICE INSTALL** ' + wor.mpMatrixRecords.size());
                                       
                                       Map<String, WorkOrderRecord> mpDelKeyWOR = mpGroupedWOs.get(dataSets.Label_for_Delivery_Work_Type__c);
                                       WorkOrderRecord petDelvWO = findWOR(mpDelKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,null,null,'D');
                                       WorkOrderRecord regDelvWO = findWOR(mpDelKeyWOR,wor,sKey+orderKey+strNonRecEffDate,null,null,'D');
                                       
                                       if(petDelvWO!=null || regDelvWO!=null){
                                           for(OrderGroup ord_grp:prevOrdGrp.values()){
                                               for(OrderItem coi:ord_grp.orderItm_int){
                                                   System.debug('--Adding--' + wor.orderId + '==' + ord_grp.order_int.id + '--' + coi.Product2.Name + '--' + coi.Product2.Family);
                                                   if(wor.orderId==ord_grp.order_int.id && wor.InstallationLOB==strLOB && coi.Product2.Family==curOrdItm.Product2.Family){
                                                       fillWOLIObject(wor, coi, ord_grp.order_int);
                                                       //Delete only added order products from Pest delivery work order
                                                       if(petDelvWO!=null && petDelvWO.mpMatrixRecords.containsKey(coi.id)){
                                                           petDelvWO.mpMatrixRecords.remove(coi.id);
                                                       }
                                                       //Delete only added order products from regular delivery work order
                                                       if(regDelvWO!=null && regDelvWO.mpMatrixRecords.containsKey(coi.id)){
                                                           regDelvWO.mpMatrixRecords.remove(coi.id);
                                                       }
                                                   }
                                               }
                                           }
                                       }
                                       System.debug('--INSTALL SERVICES WOLI -- ' + wor.mpMatrixRecords.size());
                                       
                                       System.debug('--MP WOR BEFORE-- ' + mpDelKeyWOR.size());
                                       if(petDelvWO!=null && petDelvWO.mpMatrixRecords.size()==0){mpDelKeyWOR.remove(sKey+orderKey+strNonRecEffDate+strLOB);}
                                       if(regDelvWO!=null && regDelvWO.mpMatrixRecords.size()==0){mpDelKeyWOR.remove(sKey+orderKey+strNonRecEffDate);}
                                       System.debug('--MP WOR AFTER-- ' + mpDelKeyWOR.size());
                                       
                                       prevOrdGrp.clear();
                                   }
                            }
                            
                            if(curOrdItm.Valid_for_Install_Remove_Replace__c &&
                               curOrdItm.Product_Type__c==dataSets.Item_Type_for_Equipment__c && 
                               curOrdItm.Installation_Status__c==dataSets.Status_Value_for_Install_of_a_Product__c) {
                                if(wor.InstallationLOB!=strLOB){
                                    lEquipments.add(curOrdItm.Product2Id);
                                    equipmentId=curOrdItm.Product2Id;
                                    //Create a new WorkOrderRecord with Equipment Id
                                    wor = new WorkOrderRecord();
                                    wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+equipmentId,curOrd,curOrdItm,'I');
                                }
                                   
                                fillWOLIObject(wor, curOrdItm, curOrd);
                                wor.isEquipment = true;
                                wor.InstallationLOB = strLOB;
                                System.debug('**INSTALL EQUIPMENT**');
                                
                                //Adding consumables to Equipment Installation by LOB
                                if(prevOrdGrp.size()>0){
                                       System.debug('**ADDING CONSUMABLES TO EQUIPMENT INSTALL** ' + wor.mpMatrixRecords.size());
                                       
                                       Map<String, WorkOrderRecord> mpDelKeyWOR = mpGroupedWOs.get(dataSets.Label_for_Delivery_Work_Type__c);
                                       WorkOrderRecord petDelvWO = findWOR(mpDelKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,null,null,'D');
                                       WorkOrderRecord regDelvWO = findWOR(mpDelKeyWOR,wor,sKey+orderKey+strNonRecEffDate,null,null,'D');
                                       
                                       if(petDelvWO!=null || regDelvWO!=null){
                                           for(OrderGroup ord_grp:prevOrdGrp.values()){
                                               for(OrderItem coi:ord_grp.orderItm_int){
                                                   System.debug('--Adding--' + wor.orderId + '==' + ord_grp.order_int.id + '--' + coi.Product2.Name + '--' + coi.Product2.Family);
                                                   if(wor.orderId==ord_grp.order_int.id && wor.InstallationLOB==strLOB && coi.Product2.Family==curOrdItm.Product2.Family){
                                                       fillWOLIObject(wor, coi, ord_grp.order_int);
                                                       //Delete only added order products from Pest delivery work order
                                                       if(petDelvWO!=null && petDelvWO.mpMatrixRecords.containsKey(coi.id)){
                                                           petDelvWO.mpMatrixRecords.remove(coi.id);
                                                       }
                                                       //Delete only added order products from regular delivery work order
                                                       if(regDelvWO!=null && regDelvWO.mpMatrixRecords.containsKey(coi.id)){
                                                           regDelvWO.mpMatrixRecords.remove(coi.id);
                                                       }
                                                   }
                                               }
                                           }
                                       }
                                       System.debug('--INSTALL EQUIPMENT WOLI -- ' + wor.mpMatrixRecords.size());
                                       
                                       System.debug('--MP WOR BEFORE-- ' + mpDelKeyWOR.size());
                                       if(petDelvWO!=null && petDelvWO.mpMatrixRecords.size()==0){mpDelKeyWOR.remove(sKey+orderKey+strNonRecEffDate+strLOB);}
                                       if(regDelvWO!=null && regDelvWO.mpMatrixRecords.size()==0){mpDelKeyWOR.remove(sKey+orderKey+strNonRecEffDate);}
                                       System.debug('--MP WOR AFTER-- ' + mpDelKeyWOR.size());
                                       
                                       prevOrdGrp.clear();
                                   }
                            }
                            
                            if(curOrdItm.Product_Type__c==dataSets.Item_Type_for_Equipment__c && wor!=null && wor.InstallationLOB==strLOB &&
                               curOrdItm.Installation_Status__c==null && curOrdItm.Frequency__c==dataSets.Non_Recurring_Frequency_Value__c) {
                                isConsumableInstalled = true;
                                fillWOLIObject(wor, curOrdItm, curOrd);
                                System.debug('**INSTALL EQUIPMENT WITHOUT INSTALL STATUS**');
                            }
                            
                            if(curOrdItm.Product_Type__c==dataSets.Item_Type_for_Consumables__c && wor!=null && wor.isEquipment && 
                               curOrdItm.Frequency__c==dataSets.Non_Recurring_Frequency_Value__c) {
                                if(wor.InstallationLOB==strLOB){
                                    isConsumableInstalled = true;
                                    fillWOLIObject(wor, curOrdItm, curOrd);  
                                    System.debug('**INSTALL CONSUMABLES WITH EQUIPMENT**');
                                }
                            }
                                 
                            //Below logic handles Consumables that come before and after Services in ordering 
                            if(curOrdItm.Product_Type__c==dataSets.Item_Type_for_Consumables__c && wor!=null && !wor.isEquipment && 
                               curOrdItm.Frequency__c==dataSets.Non_Recurring_Frequency_Value__c){
                               if(curOrdItm.Product2.Family==dataSets.Pest_LOB__c){
                                  wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,null,null,'I'); 
                               }
                               if(curOrdItm.Product2.Family==dataSets.Hygiene_LOB__c || curOrdItm.Product2.Family==dataSets.Life_Safety_LOB__c){
                                  wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,null,null,'I');
                               }
                               if(curOrdItm.Product2.Family==dataSets.Chemical_LOB__c){
                                  wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,null,null,'I');  
                               }
                               
                               if(wor==null){
                                   System.debug('--Preparing temporary consumables list--');
                                   OrderGroup ord_grp = new OrderGroup();
                                   if(prevOrdGrp.containsKey(curOrd.Id)){
                                        ord_grp = prevOrdGrp.get(curOrd.Id);
                                        ord_grp.orderItm_int.add(curOrdItm);
                                   } 
                                   else {
                                        ord_grp.orderItm_int.add(curOrdItm);
                                        ord_grp.order_int = curOrd;
                                        prevOrdGrp.put(curOrd.Id,ord_grp);
                                   }
                               } 
                               else {
                                   System.debug('--Adding to existing service installation--');
                                   if(wor!=null && wor.isServiceInstall){
                                       fillWOLIObject(wor, curOrdItm, curOrd);
                                       isConsumableInstalled = true;
                                   }
                               }
                            }
                            
                            if(curOrdItm.Valid_for_Install_Remove_Replace__c && wor!=null && wor.isEquipment && wor.InstallationLOB==strLOB &&
                               curOrdItm.Product_Type__c==dataSets.Item_Type_of_Services__c && 
                               curOrdItm.Installation_Status__c==dataSets.Status_Value_for_Install_of_a_Product__c) {
                                isServiceInstalled = true;
                                fillWOLIObject(wor, curOrdItm, curOrd);
                                System.debug('**INSTALL SERVICE WITH EQUIPMENT**');
                            }
                        }
                         
                        //Service Plan
                        if(curOrdItm.Frequency__c!=dataSets.Non_Recurring_Frequency_Value__c && 
                           curOrdItm.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c && 
                           curOrdItm.Installation_Status__c!=dataSets.Status_Value_for_Removal_of_a_Product__c){
                            if(curOrdItm.Service_Plan__c==null){System.debug('**SPNULL**::SKIPPING');continue;}
                            if(curOrdItm.Service_Plan__c!=null){
                                strNonRecEffDate = ':' + curOrdItm.Service_Plan__r.Effective_Date__c;
                                if(curOrdItm.Service_Plan__r.Route__c!=null && curOrdItm.Service_Plan__r.Schedule_Type__c!=null){
                                    sKey += ':' + curOrdItm.Service_Plan__r.Route__r.Service_Resource__c;
                                }
                            }
                        }
                                                
                        System.debug('**AFTER SP (OT) KEY--' + sKey+orderKey+strNonRecEffDate+strLOB);
                        
                        //Delivery
                        if(((curOrdItm.Product_Type__c==dataSets.Item_Type_for_Consumables__c && !isConsumableInstalled) || 
                            (curOrdItm.Product_Type__c==dataSets.Item_Type_for_Equipment__c && curOrdItm.Installation_Status__c==null && !isConsumableInstalled)) &&
                             curOrdItm.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c && 
                             curOrdItm.Installation_Status__c!=dataSets.Status_Value_for_Removal_of_a_Product__c && !curOrdItm.Is_Completed__c){
                                 Map<String, WorkOrderRecord> mpKeyWOR = mpGroupedWOs.get(dataSets.Label_for_Delivery_Work_Type__c);
                                 if(curOrdItm.Frequency__c==dataSets.Non_Recurring_Frequency_Value__c){
                                     if(curOrdItm.Product2.Family==dataSets.Pest_LOB__c){
                                         wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,curOrd,curOrdItm,'D');
                                     } else {
                                         wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate,curOrd,curOrdItm,'D');
                                     }
                                     System.debug('**ONE-TIME DELIVERY WO**');
                                 } else {
                                     if(curOrdItm.Product2.Family==dataSets.Pest_LOB__c){
                                         wor = findWOR(mpKeyWOR,wor,sKey+strLOB,curOrd,curOrdItm,'D');
                                     } else{
                                         wor = findWOR(mpKeyWOR,wor,sKey,curOrd,curOrdItm,'D');
                                     }
                                     System.debug('**RECURRING DELIVERY WO**');
                                 }
                                 fillWOLIObject(wor, curOrdItm, curOrd);  
                        }
                        
                        //Services
                        if(curOrdItm.Product_Type__c==dataSets.Item_Type_of_Services__c && !isServiceInstalled && 
                           !curOrdItm.Valid_for_Install_Remove_Replace__c && 
                           curOrdItm.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c && 
                           curOrdItm.Installation_Status__c!=dataSets.Status_Value_for_Removal_of_a_Product__c && !curOrdItm.Is_Completed__c){
                            	Map<String, WorkOrderRecord> mpKeyWOR = mpGroupedWOs.get(dataSets.Label_for_Service_Work_Order_Type__c);
                                if(curOrdItm.Frequency__c==dataSets.Non_Recurring_Frequency_Value__c){
                                    wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,curOrd,curOrdItm,'S');
                                    System.debug('**ONE-TIME SERVICE WO**');
                                } else { 
                                	wor = findWOR(mpKeyWOR,wor,sKey+strLOB,curOrd,curOrdItm,'S');
                                    System.debug('**RECURRING SERVICES WO**');
                                }
                                fillWOLIObject(wor, curOrdItm, curOrd);  
                        }
                        
                        //Replace
                        if(curOrdItm.Installation_Status__c==dataSets.Status_Value_for_Replace_of_a_Product__c && 
                          	curOrdItm.Valid_for_Install_Remove_Replace__c){
                            	Map<String, WorkOrderRecord> mpKeyWOR = mpGroupedWOs.get(dataSets.Label_for_Replace_Work_Order_Type__c);
                                wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,curOrd,curOrdItm,'RP');
                                fillWOLIObject(wor, curOrdItm, curOrd);  
                                System.debug('**REPLACE WO**');
                        }
                        
                        //De-Install
                        if(curOrdItm.Installation_Status__c==dataSets.Status_Value_for_Removal_of_a_Product__c && 
                          	curOrdItm.Valid_for_Install_Remove_Replace__c){
                            	Map<String, WorkOrderRecord> mpKeyWOR = mpGroupedWOs.get(dataSets.DeInstall_Work_Order_Type__c);
                                wor = findWOR(mpKeyWOR,wor,sKey+orderKey+strNonRecEffDate+strLOB,curOrd,curOrdItm,'DI');
                                fillWOLIObject(wor, curOrdItm, curOrd);  
                                System.debug('**DE-INSTALL WO**');
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 
     **/
    public void generateWOs(Boolean adhoc){
        boolean RUN_INSERTS = true;
        
        if(!adhoc && CONTROL_WO_TYPE==0){
            System.debug('**GENERATE::INSTALLATION');
            createInstallationWO();
        }
        if(adhoc || CONTROL_WO_TYPE==0){
            System.debug('**GENERATE::ONE-TIME & RECURRING SERVICE');
        	createWOs(dataSets.Label_for_Service_Work_Order_Type__c,adhoc);
        }
        System.debug('**GENERATE::ONE-TIME & RECURRING DELIVERY');
        createWOs(dataSets.Label_for_Delivery_Work_Type__c,adhoc);
        
        if(!adhoc && CONTROL_WO_TYPE==0){
            createReplaceWO();
            System.debug('**GENERATE::REPLACE');
        }
        
        if(!adhoc && CONTROL_WO_TYPE==0){
            createDeInstallWO();
            System.debug('**GENERATE::DEINSTALL');
        }
        
        if(RUN_INSERTS){
            insertWO();
            insertWOLI();
            insertRelWO(); 
            insertResourcePref();
            deleteNotDispatchedWO(adhoc);
            updateOrderItems();
            if(tErrorsList.size()>0){insert tErrorsList;}
        }
    }
    
    /**
     * 
     **/
    private void createInstallationWO(){
        Map<String, WorkOrderRecord> mpKWOR = mpGroupedWOs.get(dataSets.Label_for_Install_Work_Order_Type__c);
        for(WorkOrderRecord wor:mpKWOR.values()){
            System.debug('**INSTALL::KEY::' + wor.grpKey + '::ISEQIP::' + wor.effectivedate + '::SIZE::' + wor.mpMatrixRecords.size());
            Integer lineItems=0;
            if(wor.mpMatrixRecords.size()>0){
                for (MatrixRecord m : wor.mpMatrixRecords.Values()) {
                    if(!inAdvanceDaysPost(wor,m,wor.effectivedate)){continue;}
                    if(canSkipWOGen(wor,wor.effectivedate,m)){continue;}
                    initWOLI(m,wor);
                    lineItems++;
                }
                if(lineItems>0){initWO(wor);}
            } 
        }
    }
    
    /**
     * 
     **/
    public void createWOs(string workTypeLabel, Boolean adhoc){
       ServicePlanDateWrapper srvPlanDW = new ServicePlanDateWrapper();
       Map<String, WorkOrderRecord> mpKWOR = mpGroupedWOs.get(workTypeLabel);
       for(WorkOrderRecord wor:mpKWOR.values()){
            System.debug('**RECURRING KEY--' + wor.grpKey + '--FREQ--' + wor.Frequency);

           if(wor.mpMatrixRecords.size()>0){
                if(wor.Frequency!=dataSets.Non_Recurring_Frequency_Value__c){
                    if(CONTROL_WO_TYPE==1){continue;}
                    if(wor.setSchedules.size()==0){continue;}
					
                    for(Date dtStart:wor.setSchedules){
                        WorkOrderRecord newWOR = deepCloneWOR(wor);
                        List<Id> listOrdItmIds = new List<Id>();
                        
                        newWOR.grpKey+= ':' + String.valueOf(dtStart);
                        newWOR.StartDate = dtStart;
                        newWOR.EndDate = dtStart;
                        
                        System.debug('--WO START DATE--' + dtStart);
                        
                        if(recurDelServ.containsKey(newWOR.grpKey)){
                            WorkOrderRecord exWOR = recurDelServ.get(newWOR.grpKey);
                            copyLineItems(exWOR,newWOR);
                            System.debug('**COPY LINE ITEMS**');
                        } 
                        else {
                            Boolean isAdded = false;
                            for(MatrixRecord m : newWOR.mpMatrixRecords.Values()) {
                                
                                if(m.setItmSchedules.contains(dtStart)){
                                    //if consumables first schedule date is less than wo start date 
                                    if(m.orderItemRec.Product_Type__c==dataSets.Item_Type_for_Consumables__c){
                                        if(m.setItmSchedules.size()>0){
                                            Date firstDate;
                                            for(Date schdts:m.setItmSchedules){firstDate=schdts;break;}
                                            System.debug('--First Date--' + firstDate + '--' + (firstDate<dtStart));
                                            if(firstDate<dtStart){continue;}
                                        }
                                    }
                                    if(m.seasonal){
                                        if(!inAdvanceDaysPost(newWOR,m,dtStart)){continue;}
                                        if(canSkipWOGen(wor,dtStart,m)){continue;}
                                        System.debug('~~PRODUCT::' + m.orderItemId + '--' + m.productName + '--ON--' + dtStart);
                                        newWOR.seasonal = m.seasonal;
                                        newWOR.setOrderIds.add(m.orderId);
                                        initWOLI(m,newWOR);
                                        newWOR.LastCompletionDate = m.LastCompletionDate;//Assign line level Completion date
                                        isAdded = true;
                                    } 
                                    else {
                                        if(!inAdvanceDaysPost(newWOR,m,dtStart)){continue;}
                                        if(canSkipWOGen(wor,dtStart,m)){continue;}
                                        System.debug('~~PRODUCT::' + m.orderItemId + '--' + m.productName + '--ON--' + dtStart);
                                        newWOR.setOrderIds.add(m.orderId);
                                        initWOLI(m,newWOR);
                                        listOrdItmIds.add(m.orderItemId);
                                        newWOR.LastCompletionDate = m.LastCompletionDate;//Assign line level Completion date
                                        isAdded = true;
                                    }
                                }
                            }
                            if(isAdded){
                                //Generate only 1 delivery work order
                                if(newWOR.workType==dataSets.Label_for_Delivery_Work_Type__c &&
                                   (newWOR.LastCompletionDate==null || dtStart > newWOR.LastCompletionDate)){
                                       if(newWOR.mpMatrixRecords.size()>0){
                                           initWO(newWOR);
                                           recurDelServ.put(newWOR.grpKey,newWOR);
                                           //Clearing dates so only one delivery WO gets generated
                                           for(Id oid:listOrdItmIds){
                                               MatrixRecord mR = wor.mpMatrixRecords.get(oid);
                                               System.debug('---CLEARING DATES FOR--' + mR.productName + ' WITH DATES ' + mR.setItmSchedules);
                                               mR.setItmSchedules.clear();
                                           }
                                           listOrdItmIds.clear();
                                       }
                                   }
                                
                                if(newWOR.workType==dataSets.Label_for_Service_Work_Order_Type__c && 
                                   (newWOR.LastCompletionDate==null || dtStart > newWOR.LastCompletionDate)){
                                       System.debug('--Recurring Servie--' + dtStart + '--' + newWOR.LastCompletionDate);
                                       if(newWOR.mpMatrixRecords.size()>0){
                                           initWO(newWOR);
                                           recurDelServ.put(newWOR.grpKey,newWOR);
                                       }
                                   }
                            }
                        }
                    }
                    //Deleting record because it's used as a place holder
                    mpKWOR.remove(wor.grpKey);
                } 
                else {
                    if(adhoc){continue;}
                    System.debug('#ONE-TIME--LINE ITEMS--' + wor.mpMatrixRecords.size() + '--' + wor.effectivedate);
                    Integer lineItems=0;
                    for (MatrixRecord m : wor.mpMatrixRecords.Values()) {
                        if(m.seasonal){wor.seasonal=m.seasonal;}
                        if(!inAdvanceDaysPost(wor,m,wor.effectivedate)){continue;}
                        if(canSkipWOGen(wor,wor.effectivedate,m)){continue;}
                        initWOLI(m,wor);
                        lineItems++;
                    }
                    if(lineItems>0){initWO(wor);}
                }
            }
        }
    }
    
    /**
     * 
     **/
    public void createReplaceWO(){
        Map<String, WorkOrderRecord> mpKWOR = mpGroupedWOs.get(dataSets.Label_for_Replace_Work_Order_Type__c);
        for(WorkOrderRecord wor:mpKWOR.values()){
            System.debug('**REPLACE::' + wor.grpKey);
            Integer lineItems=0;
            if(wor.mpMatrixRecords.size()>0){
                for (MatrixRecord m : wor.mpMatrixRecords.Values()) {
                    if(m.seasonal){wor.seasonal=m.seasonal;}
                    if(canSkipWOGen(wor,wor.effectivedate,m)){continue;}
                    initWOLI(m,wor);
                    lineItems++;
                }
                if(lineItems>0){initWO(wor);}
            }
        } 
    }
    
    /**
     * 
     **/
    public void createDeInstallWO(){
    	Map<String, WorkOrderRecord> mpKWOR = mpGroupedWOs.get(dataSets.DeInstall_Work_Order_Type__c);
        for(WorkOrderRecord wor:mpKWOR.values()){
            System.debug('**DEINSTALL::' + wor.grpKey);
            Integer lineItems=0;
            if(wor.mpMatrixRecords.size()>0){
                for (MatrixRecord m : wor.mpMatrixRecords.Values()) {
                    if(m.seasonal){wor.seasonal=m.seasonal;}
                    if(canSkipWOGen(wor,wor.effectivedate,m)){continue;}
                    initWOLI(m,wor);
                    lineItems++;
                }
                if(lineItems>0){initWO(wor);}
            }
        }   
    }
    
    
    /***DATABASE ACTIONS***/
    
    /**
     * Delete all work orders and associated records if they are in New and Scheduled Status
     **/
    private void deleteNotDispatchedWO(Boolean adhoc){
        if(CONTROL_WO_TYPE==1){
            System.debug('#OT DELIVERY DELETE#');
            if (mpDeleteWOs.get(C_OTDELIVERY).size()>0) {
                Database.DeleteResult[] deleteWO = Database.delete(mpDeleteWOs.get(C_OTDELIVERY), false);
            }
            if (mpDeleteRELWOs.get(C_OTDELIVERY).size()>0) {
                Database.DeleteResult[] deleteRelWO = Database.delete(mpDeleteRELWOs.get(C_OTDELIVERY), false);
            }
            return;
        }
        if(adhoc){
            System.debug('#ADHOC DELETE#' + mpDeleteWOs.get(C_RECURRING));
            if (mpDeleteWOs.get(C_RECURRING).size()>0) {
                Database.DeleteResult[] deleteWO = Database.delete(mpDeleteWOs.get(C_RECURRING), false);
            }
            if (mpDeleteRELWOs.get(C_RECURRING).size()>0) {
                Database.DeleteResult[] deleteRelWO = Database.delete(mpDeleteRELWOs.get(C_RECURRING), false);
            }
        } 
        else {
            System.debug('#DELETE WO & RELATED WO#');
            List<WorkOrder> lstDelWOs = new List<WorkOrder>();
            if(mpDeleteWOs.get(C_OTDELIVERY).size()>0){lstDelWOs.addAll(mpDeleteWOs.get(C_OTDELIVERY));}
            if(mpDeleteWOs.get(C_OTSERVICE).size()>0){lstDelWOs.addAll(mpDeleteWOs.get(C_OTSERVICE));}
            if(mpDeleteWOs.get(C_INSTALL).size()>0){lstDelWOs.addAll(mpDeleteWOs.get(C_INSTALL));}
            if(mpDeleteWOs.get(C_REPLACE).size()>0){lstDelWOs.addAll(mpDeleteWOs.get(C_REPLACE));}
            if(mpDeleteWOs.get(C_DEINSTALL).size()>0){lstDelWOs.addAll(mpDeleteWOs.get(C_DEINSTALL));}
            if(mpDeleteWOs.get(C_RECURRING).size()>0){lstDelWOs.addAll(mpDeleteWOs.get(C_RECURRING));}
       
            if (!lstDelWOs.isEmpty()) {
                Database.DeleteResult[] deleteWO = Database.delete(lstDelWOs, false);
            }
            
            List<Related_Work_Order__c> lstDelRWOs = new List<Related_Work_Order__c>();
            if(mpDeleteRELWOs.get(C_OTDELIVERY).size()>0){lstDelRWOs.addAll(mpDeleteRELWOs.get(C_OTDELIVERY));}
            if(mpDeleteRELWOs.get(C_OTSERVICE).size()>0){lstDelRWOs.addAll(mpDeleteRELWOs.get(C_OTSERVICE));}
            if(mpDeleteRELWOs.get(C_INSTALL).size()>0){lstDelRWOs.addAll(mpDeleteRELWOs.get(C_INSTALL));}
            if(mpDeleteRELWOs.get(C_REPLACE).size()>0){lstDelRWOs.addAll(mpDeleteRELWOs.get(C_REPLACE));}
            if(mpDeleteRELWOs.get(C_DEINSTALL).size()>0){lstDelRWOs.addAll(mpDeleteRELWOs.get(C_DEINSTALL));}
            if(mpDeleteRELWOs.get(C_RECURRING).size()>0){lstDelRWOs.addAll(mpDeleteRELWOs.get(C_RECURRING));}
            if (!lstDelRWOs.isEmpty()) {
                Database.DeleteResult[] deleteRelWO = Database.delete(lstDelRWOs, false);
            }
        }
    }
    
    /**
     * 
     **/
    private void insertWO(){
        System.debug('#INSERT WO#' + workOrdersToInsert.size());
        if(workOrdersToInsert.size()==0){return;}
        Database.SaveResult[] insertWOSR = Database.insert(workOrdersToInsert, false);
        
        for(Integer i=0;i<insertWOSR.size();i++){
            if(!insertWOSR[i].isSuccess()){
                String errors = '';
                for(Database.Error err : insertWOSR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
				System.debug('#WO INSERT ERROR#' + errors);
                WorkOrder wo = workOrdersToInsert[i];
                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c = errors, 
                    StartTime__c = wo.StartDate, 
                    EndTime__c = wo.EndDate, 
                    OrderId__c = wo.Order__c, 
                    OperatingHoursId__c = wo.FSL__VisitingHours__c, 
                    Failed_Batch__c = 'SpawnWorkOrders'
                ));
            } 
        }
    }
    
    /**
     * 
     **/
    private void insertWOLI(){
        for(Map<String, WorkOrderRecord> mpKWOR:mpGroupedWOs.values()){
            for(WorkOrderRecord wor:mpKWOR.values()){
                //System.debug('**FREQ#' + wor.Frequency + '#SIZE#' + wor.mpMatrixRecords.size());
                if(wor.WorkOrderRec!=null && wor.WorkOrderRec.id!=null){
                    //System.debug('**WORKORDERID#' + wor.WorkOrderRec.id);
                    for(Id ordId:wor.setOrderIds){
                        Related_Work_Order__c rwo = new Related_Work_Order__c(Order__c=ordId, WorkOrder__c=wor.WorkOrderRec.id, Name=wor.OrderNumber);
                        relatedWoToInsert.add(rwo);
                    }
                    for(MatrixRecord m:wor.mpMatrixRecords.Values()){
                        if(m.workOrderLineItemRec!=null){
                            m.workOrderLineItemRec.WorkOrderId = wor.WorkOrderRec.id;
                            workOrderLineItemYesInsert.add(m.workOrderLineItemRec);
                            //System.debug('**ORDERITEMID#' + m.orderItemId + '#SIZE#' + workOrderLineItemYesInsert.size());
                        }
                    }
                }	
            }
        }
        //Recurring Services and Delivery Line Items
        for(WorkOrderRecord wor:recurDelServ.values()){
            if(wor.WorkOrderRec!=null && wor.WorkOrderRec.id!=null){
                initResourcePref(wor);
                
                for(Id ordId:wor.setOrderIds){
                    Related_Work_Order__c rwo = new Related_Work_Order__c(Order__c=ordId, WorkOrder__c=wor.WorkOrderRec.id, Name=wor.OrderNumber);
                    relatedWoToInsert.add(rwo);
                }
                
                for(MatrixRecord m:wor.mpMatrixRecords.Values()){
                    if(m.workOrderLineItemRec!=null){
                        m.workOrderLineItemRec.WorkOrderId = wor.WorkOrderRec.id;
                        workOrderLineItemYesInsert.add(m.workOrderLineItemRec);
                    }
                }
            }	
        }
        
        System.debug('#INSERT WOLI#' + workOrderLineItemYesInsert.size());
        if(workOrderLineItemYesInsert.size()==0){return;}
        
        Database.SaveResult[] insertWOLISR = Database.insert(workOrderLineItemYesInsert, false);
        List<Batch_Errors__c> tErrorsList = new List<Batch_Errors__c>();
        for(Integer i=0;i<insertWOLISR.size();i++){
            if(!insertWOLISR[i].isSuccess()){
                String errors = '';
                for(Database.Error err : insertWOLISR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
				System.debug('#WOLI INSERT ERROR#' + errors);
                WorkOrderLineItem woli = workOrderLineItemYesInsert[i];
                tErrorsList.add(new Batch_Errors__c(
                    Name=String.valueOf(System.today()), 
                    Error_Messages__c= errors, 
                    OrderId__c = woli.OrderId, 
                    OrderProductId__c = woli.Order_Product__c, 
                    Failed_Batch__c = 'SpawnWorkOrders'
                ));
            }
        }
    }
    
    /**
     * 
     **/
    private void insertRelWO(){
        System.debug('#INSERT RELWO#' + relatedWoToInsert.size());
        if(relatedWoToInsert.size()==0){return;}
        Database.SaveResult[] insertWOLISR = Database.insert(relatedWoToInsert, false);
        for(Integer i=0;i<insertWOLISR.size();i++){
            if(!insertWOLISR[i].isSuccess()){
                String errors = '';
                for(Database.Error err : insertWOLISR[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
				System.debug('#RES PREF ERROR#' + errors);
        	}
        }
    }
    
    /**
     * 
     **/
    private void insertResourcePref(){
        System.debug('#INSERT RESPREF#' + resoucePrefInsert.size());
        if(resoucePrefInsert.size()==0){return;}
        Database.SaveResult[] insertRESPREF = Database.insert(resoucePrefInsert, false);
        
        for(Integer i=0;i<insertRESPREF.size();i++){
            if(!insertRESPREF[i].isSuccess()){
                String errors = '';
                for(Database.Error err : insertRESPREF[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
				System.debug('#RES PREF ERROR#' + errors);
        	}
        }
    }
    
    /**
     * 
     **/
    private void updateOrderItems(){
        System.debug('#UPDATE ORDITM#' + resoucePrefInsert.size());
        if(orderItemListUpdate.size()==0){return;}
        TriggerHandler.bypass('OrderProductTriggerHandler');
        Database.SaveResult[] updateOIS = Database.update(orderItemListUpdate, false);
        TriggerHandler.clearBypass('OrderProductTriggerHandler');
        
        for(Integer i=0;i<updateOIS.size();i++){
            if(!updateOIS[i].isSuccess()){
                String errors = '';
                for(Database.Error err : updateOIS[i].getErrors()) {
                    errors = errors + err.getMessage();
                }
				System.debug('#RES PREF ERROR#' + errors);
        	}
        } 
    }
    
    /***UTILITY FUNCTIONS***/
       
    /**
     * 
     **/
    private boolean inAdvanceDaysPost(WorkOrderRecord wor,MatrixRecord m,Date effDt){
        Integer InDays = 0;
        Date todaysDate = Date.today();
        System.debug('##SEASONAL:' + m.seasonal + '##LOB:' + m.lineOfBusiness + '##TYPE:' + wor.WorkType + '##FREQ:' + m.Frequency);
        if(m.Frequency!=dataSets.Non_Recurring_Frequency_Value__c){m.Frequency='DEFAULT';}
        for(Advanced_Days__c Ad:advDaysCSets){
            if(m.seasonal){
                if(Ad.isSeasonal__c && Ad.LOB__c==m.lineOfBusiness && Ad.Type__c==wor.WorkType && m.Frequency==Ad.Frequency__c){
                    InDays = Integer.valueOf(Ad.Days__c);
                    //System.debug('##DAYS:#' + InDays);
                    if(InDays==0){return true;}
                    
                    Date dtInRange=effDt.addDays(Integer.valueOf(-InDays));
                    //System.debug('##EFFDT:'  + effDt + '##INRANGE:' + dtInRange);
                    if(effDt>=m.seasonStart && effDt<=m.seasonEnd){
                        if(dtInRange<=Date.today()){return true;} else {return false;}
                    } else {
                        return false;
                    }
                }
            } 
            else {
                if(!Ad.isSeasonal__c && Ad.LOB__c==m.lineofBusiness && Ad.Type__c==wor.WorkType && m.Frequency==Ad.Frequency__c){
                    InDays = Integer.valueOf(Ad.Days__c);
                    System.debug('##DAYS:#' + InDays);
                    if(InDays==0){return true;}
                    
                    Date isdtInRange = effDt.addDays(Integer.valueOf(-InDays));
                    System.debug('##EFFDT:'  + effDt + '##INRANGE:' + isdtInRange);
                    if(isdtInRange <= Date.today()){return true;}else{return false;}
                }
            }
        }
        System.debug('##AM OUT##');
        return true;
    }
    
    /**
     * 
     **/
    private boolean canSkipWOGen(WorkOrderRecord newWOR, Date dtStart,MatrixRecord m){
        Boolean skip=false;
        System.debug('#CANSKIP::' + newWOR.AccountId + '::' + newWOR.orderNumber + '::' + newWOR.workType + 
                     '::(' + m.orderItemId + ')::' + m.orderNum + '::' + m.productName + '::' + dtStart);
        
        
        if(newWOR.seasonal && newWOR.workType == dataSets.Label_for_Install_Work_Order_Type__c){
            System.debug('--Seasonal Installation Before--' + dtStart);
            if(dateMatrix.containsKey(newWOR.AccountId + '$' + Date.today())){dtStart=Date.today();}
            System.debug('--Seasonal Installation After--' + dtStart);
        }
        
        if(CONTROL_WO_TYPE==1){
            System.debug('--One-Time Delivery Before--' + dtStart);
            if(dateMatrix.containsKey(newWOR.AccountId + '$' + Date.today())){dtStart=Date.today();}
            System.debug('--One-Time Delivery After--' + dtStart);
        }
               
        String dtKey = newWOR.AccountId + '$' + dtStart;
        if(dateMatrix.containsKey(dtKey)){
            Map<Id,Map<String,WorkOrderRecord>> orderMap = dateMatrix.get(dtKey);

            for(Id order_id:orderMap.KeySet()){
                if(m.orderId!=order_id){continue;}
                Map<String,WorkOrderRecord> workOrderList = orderMap.get(order_id);
				System.debug('++WO for OrderId++' + order_id);
                for(WorkOrderRecord exWOR:workOrderList.values()){
                    System.debug('Existing WO'+ '::' + exWOR.workType + '::' + exWOR.status);
                    Boolean isPass = false;
                    if(newWOR.workType==exWOR.workType){isPass=true;}
                    if(CONTROL_WO_TYPE==1 && exWOR.workType==dataSets.Label_for_Install_Work_Order_Type__c){isPass=true;}
                    System.debug('--Is WO Type Same--' + isPass);
                    if(isPass && 
                       (exWOR.status==dataSets.Work_Order_Cancelled_Status__c ||
                        exWOR.status=='Cancelled - Frequency Change' ||
                        exWOR.status==dataSets.Work_Order_Dispatched_Status__c ||
                        exWOR.status==dataSets.Service_Appointment_Arrived_Status__c ||
                        exWOR.status=='On Route' || exWOR.status=='Data Error' ||
                        exWOR.status==dataSets.Work_Order_Rescheduled_Status__c ||
                        (exWOR.workType!=dataSets.Label_for_Install_Work_Order_Type__c && 
                         exWOR.status==dataSets.Work_Order_Completion_Status__c))){
                           System.debug('--Order Item List--'  + exWOR.mpMatrixRecords.keySet());
                           if(exWOR.mpMatrixRecords.containsKey(m.orderItemId)){
                                skip=true;
                                System.debug('**DO NOT ADD ORDPRD::' + m.orderItemId + '--'  + exWOR.status);
                           }
                    }
                }
            }
        }
        System.debug('~~SKIPPING~~' + skip);
        return skip;
    }
    
    /**
     * 
     **/
    private DatetimeRecord setWODates(WorkOrderRecord wor, OperatingHours oh){
        Datetime startDate =  Datetime.newInstance(wor.startDate.year(), wor.startDate.month(), wor.startDate.day(), 00, 00, 00);
        Datetime endDate =  Datetime.newInstance(wor.endDate.year(), wor.endDate.month(), wor.endDate.day(), 23, 59, 59);
        DatetimeRecord woDates = new DatetimeRecord(startDate, endDate);
        
        System.debug('~~WO:' + wor.workType + '~~START:' + startDate + '~~END:' + endDate + '~~RECURR:' + wor.isRecurring);
        Timezone tz;
        if(oh==null){
            tz = UserInfo.getTimeZone();
        } 
        else {
            if(oh.TimeZone!=null){
                tz = Timezone.getTimeZone(oh.TimeZone); 
            } else {
                tz = UserInfo.getTimeZone();
            }
        } 
        Integer offsetHours = tz.getOffset(woDates.startDate)/3600000;
        //System.debug('offsetHours:' + offsetHours + '--oh:' + oh);
        
        if(wor.isRecurring){
            woDates.startDate = Datetime.newInstanceGMT(startDate.yearGmt(), startDate.monthGmt(),startDate.dayGmt(),5,00,00).addHours(-offsetHours);
            woDates.endDate = Datetime.newInstanceGMT(endDate.yearGmt(), endDate.monthGmt(), endDate.dayGmt(),4,59,00).addHours(-offsetHours);
        } else {
            if(oh!=null) {
                woDates.opHours = oh;
                woDates.emergency = wor.emergency;
                woDates.hasPestControlMonthly = wor.hasPestControlMonthly;
                woDates = DatetimeRecord.getWODates(woDates, Datetime.now());
            }
            if((woDates.startDate.year()!=wor.startDate.year() || 
                woDates.startDate.month()!=wor.startDate.month() || 
                woDates.startDate.day()!=wor.startDate.day()) || oh==null) {
                woDates.startDate = Datetime.newInstanceGMT(startDate.yearGmt(), startDate.monthGmt(),startDate.dayGmt(),5,00,00).addHours(-offsetHours);
            	woDates.endDate = Datetime.newInstanceGMT(endDate.yearGmt(), endDate.monthGmt(), endDate.dayGmt(),4,59,00).addHours(-offsetHours);
            }
        }
        System.debug('~~WO:' + wor.workType + '~~START:' + woDates.startDate + '~~END:' + woDates.endDate + '~~AFTER');
        return woDates;
	}
    
    /**
     * 
     **/
    private WorkOrderRecord fillWOObject(Order ord){
        WorkOrderRecord wor = new WorkOrderRecord();
        if(ord!=null){
            wor.status = dataSets.Work_Order_New_Status__c;
            wor.lineOfBusiness = ''; //LOB is determined by work order line items
            wor.emergency = ord.Emergency__c;
            wor.orderId = ord.Id; //Assign the latest OrderId;
            wor.orderNumber = ord.OrderNumber;
            wor.ownerId = ord.OwnerId;
            wor.accountId = ord.AccountId;
            wor.contactId = ord.ShipToContactId==null ? ord.BillToContactId : ord.ShipToContactId;
            wor.opportunityId = ord.OpportunityId;
            wor.pricebook2Id = ord.Pricebook2Id;
            wor.siteSurveyId = ord.Site_Survey__c;
            wor.siteSurveyNotes = ord.Site_Survey__r.Notes__c;
            wor.hasPestControlMonthly = false;
            wor.serviceTerritoryId = ord.Service_Territory__c==null ? ord.Account.Service_Territory__c : ord.Service_Territory__c;
            wor.visitingHoursId = ord.Account.OperatingHoursId;
            wor.orderRecordTypeId = ord.RecordTypeId; 
            wor.seasonal=false;
            wor.description = ord.description;
            wor.setOrderIds.add(ord.Id);
        }
        return wor;
    }
    
    /**
     * 
     **/
    private void fillWOLIObject(WorkOrderRecord wor,OrderItem oi, Order o){
        MatrixRecord mtxrec = new MatrixRecord();
        mtxrec.relatedProductId = oi.Related_Product__c;
        mtxrec.productId = oi.Product2Id;
        mtxrec.productName = oi.Product2.Name;
        mtxrec.priceBookEntryId = oi.PricebookEntryId;
        mtxrec.assetId = oi.Asset__c;
        mtxrec.orderId = oi.orderId;
        mtxrec.orderNum = Integer.valueOf(oi.Order.OrderNumber);
        mtxrec.orderItemId = oi.Id;
        mtxrec.isPestControlMonthly = false;
        mtxrec.serviceNotes = '';
        mtxrec.installationNotes = oi.Installation_Notes__c;
        mtxrec.qty = Integer.valueOf(oi.Quantity);
        mtxrec.workOrderStatus = dataSets.Work_Order_New_Status__c;
        mtxrec.orderItemRec = oi;
        mtxrec.Frequency = oi.Frequency__c;
        mtxrec.LastCompletionDate = oi.Last_Work_Order_Completed_Date__c;
        
        if(oi.Frequency__c!=dataSets.Non_Recurring_Frequency_Value__c && 
           wor.workType!=dataSets.Label_for_Install_Work_Order_Type__c &&
           wor.workType!=dataSets.Label_for_Replace_Work_Order_Type__c &&
           wor.workType!=dataSets.DeInstall_Work_Order_Type__c){
           wor.isRecurring = true;
        }
        
        if(oi.Service_Plan__c!=null && oi.Service_Plan__r.Schedule_Type__c!=null){
            mtxrec.effectiveDate=oi.Service_Plan__r.Effective_Date__c;
            //if(o.EffectiveDate>oi.Service_Plan__r.Effective_Date__c){mtxrec.effectiveDate=o.EffectiveDate;}
            mtxrec.schedulecode = oi.Service_Plan__r.Schedule_Type__r.Code__c;
            
            if(oi.Service_Plan__r.Route__c!=null && oi.Service_Plan__r.Route__r.Service_Resource__c!=null){
                wor.ServiceResourceId = oi.Service_Plan__r.Route__r.Service_Resource__c;
            }
            
            Decimal InAdvance = 30;  
            String strFrequency=dataSets.Non_Recurring_Frequency_Value__c;
            Boolean isSeasonalFlag = (o.Season_Start_Date__c != null);
            if(oi.Frequency__c!=dataSets.Non_Recurring_Frequency_Value__c){strFrequency='DEFAULT';}
            
        	for(Advanced_Days__c Ad:advDaysCSets){
                if(Ad.isSeasonal__c==isSeasonalFlag && Ad.LOB__c==oi.Product2.Family && 
                   Ad.Type__c==wor.WorkType && strFrequency==Ad.Frequency__c){
                	InAdvance = Integer.valueOf(Ad.Days__c);
                    System.debug('--InAdvance Days--' + InAdvance);
                	break;
                }
            }
			InAdvance = Math.ceil(InAdvance/30);
            if(InAdvance<=0){InAdvance=2;}
            System.debug('==Day of Month==' + Date.Today().day());
            if(Date.Today().day()>=20){InAdvance++;}
            if(InAdvance==1){InAdvance=2;}
            ServicePlanDateWrapper srvPlanDW = new ServicePlanDateWrapper(Integer.valueOf(InAdvance));
            System.debug('--InAdvance Months--' + InAdvance + '--FROM--' + mtxrec.effectiveDate + '--' + mtxrec.schedulecode);
            List<Date> lstPreSchDates = srvPlanDW.getServicePlanDays(mtxrec.schedulecode, mtxrec.effectiveDate);
            List<Date> lstSchDates = new List<Date>();
            if(lstPreSchDates.size()>0){for(Date sdt:lstPreSchDates){if(sdt>=Date.today()){lstSchDates.add(sdt);}}}
            
            System.debug('~~PRODUCT::' + mtxrec.productName + '::SCHEDULE DATES::' + lstSchDates);
            
            Integer firstNext=1;
            for(Date dt:lstSchDates){
            	if(dt>=Date.today() && !wor.setSchedules.contains(dt)){wor.setSchedules.add(dt);}
                if(dt>=Date.today()){
                  System.debug('--Next Service Date--' + dt);
                  if(firstNext==1){
                      System.debug('--Setting Next Service Date--' + dt);
                      orderItemListUpdate.add(new OrderItem(Id=mtxrec.orderItemRec.Id,Next_Service_Date__c=dt,Next_Scheduled_Date__c=dt));
                  }
                  mtxrec.setItmSchedules.add(dt);
                  firstNext++;
                }
            }
            System.debug('::SCHEDULE DATES::' + wor.setSchedules);
		}
        
        if(o.Season_Start_Date__c != null){
            mtxrec.seasonal = true;
            mtxrec.seasonStart=o.Season_Start_Date__c;
            mtxrec.seasonEnd=o.Season_End_Date__c;
        } else {
            mtxrec.seasonal = false;
        }
        
        //System.debug('~~LOB BEFORE~~' + wor.lineOfBusiness + '--' + oi.Product2.Family);
        if(oi.Product2.Family==dataSets.Life_Safety_LOB__c){
            if(!wor.lineOfBusiness.contains(dataSets.Hygiene_LOB__c)){
                wor.lineOfBusiness+=dataSets.Hygiene_LOB__c + ';';
            }
            mtxrec.lineOfBusiness=dataSets.Hygiene_LOB__c;
        } else {
            if(!wor.lineOfBusiness.contains(oi.Product2.Family)){
                wor.lineOfBusiness+=oi.Product2.Family + ';';
            }
            mtxrec.lineOfBusiness=oi.Product2.Family;
        }
        //System.debug('~~LOB AFTER~~' + mtxrec.lineOfBusiness);
        
        if(oi.Product_Type__c==dataSets.Item_Type_of_Services__c){
            mtxrec.serviceNotes = oi.Service_Notes__c;
        }
        
        if(wor.workType==dataSets.Label_for_Install_Work_Order_Type__c){
            if(oi.Product_Type__c==dataSets.Item_Type_for_Consumables__c){
                mtxrec.workType=dataSets.Label_for_Delivery_Work_Type__c;
            	mtxrec.workTypeId=oi.Delivery_Work_Type__c;
            } else {
                mtxrec.workType=wor.workType;
            	mtxrec.workTypeId=oi.Installation_Work_Type__c;
            }
        }
        if(wor.workType==dataSets.Label_for_Delivery_Work_Type__c){
            mtxrec.workType=wor.workType;
            mtxrec.workTypeId=oi.Delivery_Work_Type__c;
        }
        if(wor.workType==dataSets.Label_for_Service_Work_Order_Type__c){
            mtxrec.workType=wor.workType;
            mtxrec.workTypeId=oi.Service_Work_Type__c;
        }
        if(wor.workType==dataSets.Label_for_Replace_Work_Order_Type__c){
            mtxrec.workType=wor.workType;
            mtxrec.workTypeId=oi.Remove_Installation_Work_Type__c;
        }
        if(wor.workType==dataSets.DeInstall_Work_Order_Type__c){
            mtxrec.workType=wor.workType;
            mtxrec.workTypeId=oi.DeInstallation_Work_Type__c;
        }
        
        wor.mpMatrixRecords.put(oi.Id,mtxrec);
    }
    
    /**
     * 
     **/
    private WorkOrderRecord deepCloneWOR(WorkOrderRecord wor){
        WorkOrderRecord newWOR = new WorkOrderRecord();
        newWOR.grpKey=wor.grpKey;
        newWOR.status=wor.status;
        newWOR.lineOfBusiness=wor.lineOfBusiness;
        newWOR.workType=wor.workType;
        newWOR.workTypeId=wor.workTypeId;
        newWOR.emergency=wor.emergency;
        newWOR.workOrderId=wor.workOrderId;
        newWOR.ownerId=wor.ownerId;
        newWOR.accountId=wor.accountId;
        newWOR.operatingHoursId=wor.operatingHoursId;
        newWOR.contactId=wor.contactId;
        newWOR.opportunityId=wor.opportunityId;
        newWOR.orderId=wor.orderId;
        newWOR.orderNumber=wor.orderNumber;
        newWOR.pricebook2Id=wor.pricebook2Id;
        newWOR.siteSurveyId=wor.siteSurveyId;
        newWOR.serviceTerritoryId=wor.serviceTerritoryId;
        newWOR.visitingHoursId=wor.visitingHoursId;
        newWOR.siteSurveyNotes=wor.siteSurveyNotes;
        newWOR.hasPestControlMonthly=wor.hasPestControlMonthly;
        newWOR.accpacDeliveryOrderNumber=wor.accpacDeliveryOrderNumber;
        newWOR.orderRecordTypeId=wor.orderRecordTypeId;
        newWOR.serviceReportLanguage=wor.serviceReportLanguage;
        newWOR.isEquipment=wor.isEquipment;
        newWOR.Frequency=wor.Frequency;
        newWOR.ScheduleCode=wor.ScheduleCode;
        newWOR.EffectiveDate=wor.EffectiveDate;
        newWOR.seasonal=wor.seasonal;
        newWOR.description=wor.description;
        newWOR.ServiceResourceId=wor.ServiceResourceId;
        newWOR.isRecurring=wor.isRecurring;
        
        for(Id idO:wor.mpMatrixRecords.KeySet()){
            MatrixRecord omtxrec = wor.mpMatrixRecords.get(idO);
            MatrixRecord mtxrec = new MatrixRecord();
            mtxrec.workOrderId=omtxrec.workOrderId;
            mtxrec.orderId=omtxrec.orderId;
            mtxrec.orderNum=omtxrec.orderNum;
            mtxrec.orderItemId=omtxrec.orderItemId;
            mtxrec.assetId=omtxrec.assetId;
            mtxrec.startDate=omtxrec.startDate;
            mtxrec.scheduleDate=omtxrec.scheduleDate;
            mtxrec.endDate=omtxrec.endDate;
            mtxrec.lineOfBusiness=omtxrec.lineOfBusiness;
            mtxrec.workType=omtxrec.workType;
            mtxrec.workOrderStatus=omtxrec.workOrderStatus;
            mtxrec.workTypeId=omtxrec.workTypeId;
            mtxrec.installationNotes=omtxrec.installationNotes;
            mtxrec.serviceNotes=omtxrec.serviceNotes;
            mtxrec.relatedProductId=omtxrec.relatedProductId;
            mtxrec.productId=omtxrec.productId;
            mtxrec.qty=omtxrec.qty;
            mtxrec.priceBookEntryId=omtxrec.priceBookEntryId;
            mtxrec.isPestControlMonthly=omtxrec.isPestControlMonthly;
            mtxrec.effectiveDate=omtxrec.effectiveDate;
            mtxrec.seasonal=omtxrec.seasonal;
            mtxrec.seasonStart=omtxrec.seasonStart;
            mtxrec.seasonEnd=omtxrec.seasonEnd;
            mtxrec.schedulecode=omtxrec.schedulecode;
            mtxrec.setItmSchedules=omtxrec.setItmSchedules;
            mtxrec.productName = omtxrec.productName;
            mtxrec.orderItemRec = omtxrec.orderItemRec;
            mtxrec.Frequency = omtxrec.Frequency;
            mtxrec.LastCompletionDate = omtxrec.LastCompletionDate;
            newWOR.mpMatrixRecords.put(idO,mtxrec);
        }
        
        //System.debug('**DEEP CLONE**');
        return newWOR;
    }
    
    /**
     * 
     **/
    private void copyLineItems(WorkOrderRecord oWO, WorkOrderRecord nWO){
        for(MatrixRecord omtxrec:nWO.mpMatrixRecords.values()){
            MatrixRecord mtxrec = new MatrixRecord();
            mtxrec.workOrderId=omtxrec.workOrderId;
            mtxrec.orderId=omtxrec.orderId;
            mtxrec.orderNum=omtxrec.orderNum;
            mtxrec.orderItemId=omtxrec.orderItemId;
            mtxrec.assetId=omtxrec.assetId;
            mtxrec.startDate=omtxrec.startDate;
            mtxrec.scheduleDate=omtxrec.scheduleDate;
            mtxrec.endDate=omtxrec.endDate;
            mtxrec.lineOfBusiness=omtxrec.lineOfBusiness;
            mtxrec.workOrderStatus=omtxrec.workOrderStatus;
            mtxrec.workType=omtxrec.workType;
            mtxrec.workTypeId=omtxrec.workTypeId;
            mtxrec.installationNotes=omtxrec.installationNotes;
            mtxrec.serviceNotes=omtxrec.serviceNotes;
            mtxrec.relatedProductId=omtxrec.relatedProductId;
            mtxrec.productId=omtxrec.productId;
            mtxrec.qty=omtxrec.qty;
            mtxrec.priceBookEntryId=omtxrec.priceBookEntryId;
            mtxrec.isPestControlMonthly=omtxrec.isPestControlMonthly;
            mtxrec.effectiveDate=omtxrec.effectiveDate;
            mtxrec.seasonal=omtxrec.seasonal;
            mtxrec.seasonStart=omtxrec.seasonStart;
            mtxrec.seasonEnd=omtxrec.seasonEnd;
            mtxrec.schedulecode=omtxrec.schedulecode;
            mtxrec.setItmSchedules=omtxrec.setItmSchedules;
            mtxrec.productName = omtxrec.productName;
            mtxrec.orderItemRec = omtxrec.orderItemRec;
            mtxrec.Frequency = omtxrec.Frequency;
            
            oWO.mpMatrixRecords.put(omtxrec.orderItemId,mtxrec);
            
            oWO.setOrderIds.add(omtxrec.orderId);
            
            initWOLI(mtxrec,oWO);
        }
        //System.debug('**COPYLINES**');
    }
    
    /**
     * 
     **/
    private void initWO(WorkOrderRecord wor){
        if(wor.lineOfBusiness.length()>0  && wor.lineOfBusiness.contains(';')){wor.lineOfBusiness=wor.lineOfBusiness.substring(0,wor.lineOfBusiness.length()-1);}
        if(wor.lineOfBusiness.contains(';')){wor.lineOfBusiness='';}
        String key = (wor.lineOfBusiness=='') ? String.valueOf(wor.accountId) : wor.accountId + '.' + wor.lineOfBusiness;
        OperatingHours oh = workOrderOperatingHours.get(accountLOBOperatingHoursMap.get(key));
        DatetimeRecord woDates = setWODates(wor, oh);
        //System.debug('**WO::' + wor.orderId + '::' + woDates.startDate + '::' + woDates.endDate);
        //System.debug('...LOB INSTALL...' + wor.InstallationLOB);
        if(wor.workType==dataSets.Label_for_Install_Work_Order_Type__c){
            if(wor.lineOfBusiness=='' && wor.InstallationLOB.length()>0){
                wor.lineOfBusiness=wor.InstallationLOB.substring(1,wor.InstallationLOB.length());
            }
        }
        System.debug('....ASSOCIATED ORDERID...' + wor.setOrderIds);
        if(wor.setOrderIds.size()>0){for(String oid:wor.setOrderIds){wor.orderId = oid;}}
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
                            HasPestControlMonthly__c = wor.hasPestControlMonthly,
                            Accpac_Delivery_Order_Number__c = wor.accpacDeliveryOrderNumber, 
                            Last_Batch_Updated_Date__c = Date.Today(),
            				Description = wor.description,
            				IsSeasonal__c = wor.seasonal,
            				isRecurring__c = wor.isRecurring
        				);
        wor.WorkOrderRec = wo;
        workOrdersToInsert.add(wo);
    }
    
    /**
     * 
     **/
    private void initWOLI(MatrixRecord m, WorkOrderRecord wor){
        WorkOrderLineItem woli = new WorkOrderLineItem(
            OrderId = m.orderId,
            Order_Product__c = m.orderItemId,
            AssetId = m.assetId,
            Type_Of_Service__c = m.workType,
            WorkTypeId = m.workTypeId,
            Related_Product__c = m.relatedProductId,
            PricebookEntryId = m.priceBookEntryId,
            Product__c = m.productId,
            StartDate = wor.StartDate,
            EndDate = wor.EndDate,
            Quantity = m.qty, 
            Service_Notes__c = m.serviceNotes,
            Installation_Notes__c = m.installationNotes
        );
        m.orderItemRec.ServiceDate = wor.StartDate;
        if(m.workType==dataSets.Label_for_Install_Work_Order_Type__c){
        	m.orderItemRec.Installation_Date__c=wor.StartDate;
        }
        m.workOrderLineItemRec = woli;
    }
    
    /**
     * 
     **/
    private void initResourcePref(WorkOrderRecord wor){
        //System.debug('...Resource Pref...' + wor.ServiceResourceId);
        if(wor.ServiceResourceId!=null){
            ResourcePreference rp = new ResourcePreference();
            rp.Line_Of_Business__c = wor.lineofBusiness;
            rp.ServiceResourceId = wor.ServiceResourceId;
            rp.RelatedRecordId = wor.WorkOrderRec.id;
            rp.PreferenceType = 'Required';
            resoucePrefInsert.add(rp);
        }
    }
    
    /**
     * Get Operating hours for specific LOB on the Account
     **/
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
    
    /**
     * 
     **/
    private WorkOrderRecord findWOR(Map<String,WorkOrderRecord> mpKeyWOR,WorkOrderRecord wor,String key,Order curOrd,OrderItem curOrdItm,String FLAG){
        if(mpKeyWOR.containsKey(key)) { 
            wor = mpKeyWOR.get(key); 
            if(curOrd!=null){wor.setOrderIds.add(curOrd.Id);}
            System.debug('--Found WorkorderRecord--');
        } else { 
            if(curOrd==null && curOrdItm==null){return null;}
            System.debug('--Did not find WorkorderRecord--');
            wor = fillWOObject(curOrd);
            wor.grpKey = key;
            wor.Frequency = curOrdItm.Frequency__c;
            wor.EffectiveDate = (curOrd.EffectiveDate<Date.today())?Date.today():curOrd.EffectiveDate;
            if(CONTROL_WO_TYPE==1 && wor.EffectiveDate==Date.Today()){wor.EffectiveDate=wor.EffectiveDate.AddDays(1);}
            
            System.debug('--EFFECTIVE DATE--' + wor.EffectiveDate);
            
            if(FLAG=='I'){
                wor.workType = dataSets.Label_for_Install_Work_Order_Type__c;
                wor.workTypeId = curOrdItm.Installation_Work_Type__c;
                wor.seasonal = (curOrd.Season_Start_Date__c != null);
                if(wor.seasonal){wor.EffectiveDate=curOrd.Season_Start_Date__c;}
            }
            if(FLAG=='D' || FLAG=='S'){
                if(FLAG=='D'){
                    wor.workType = dataSets.Label_for_Delivery_Work_Type__c;
                    wor.workTypeId = curOrdItm.Delivery_Work_Type__c;
                }
                if(FLAG=='S'){
                   wor.workType = dataSets.Label_for_Service_Work_Order_Type__c;
                   wor.workTypeId = curOrdItm.Service_Work_Type__c; 
                }
            }
            if(FLAG=='RP'){
                wor.workType = dataSets.Label_for_Replace_Work_Order_Type__c;
                wor.workTypeId = curOrdItm.Remove_Installation_Work_Type__c; 
            }
            if(FLAG=='DI'){
               wor.workType = dataSets.DeInstall_Work_Order_Type__c;
               wor.workTypeId = curOrdItm.DeInstallation_Work_Type__c;  
            }
            wor.startDate = wor.EffectiveDate;
            wor.endDate = wor.EffectiveDate;
            mpKeyWOR.put(key,wor); 
        }
        return wor;
    }
}