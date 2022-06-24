public class WorkOrderTriggerHandler extends TriggerHandler {
    private List<WorkOrder> lstNewWorkOrders;
    private List<WorkOrder> lstOldWorkOrders;
    private Map<Id,WorkOrder> mapNewWorkOrders;
    private Map<Id,WorkOrder> mapOldWorkOrders;
    
    Static List<WorkOrderLineItem> woliUpdate;
    Static List<Asset> assetUpdate;
    
    public static boolean firstRun = true;

    public WorkOrderTriggerHandler() {
        //this.setMaxLoopCount(20);

        this.lstNewWorkOrders = (List<WorkOrder>) Trigger.new;
        this.lstOldWorkOrders = (List<WorkOrder>) Trigger.old;
        this.mapNewWorkOrders = (Map<Id,WorkOrder>) Trigger.newMap;
        this.mapOldWorkOrders = (Map<Id,WorkOrder>) Trigger.oldMap;
    }

    protected override void beforeInsert() {
        setWorkOrderFields();
    }

    protected override void beforeUpdate() {
        setWorkOrderFields();
        // prepareUpdatesFromScannedBarcodes(); //RAS
        
    }
    
    protected override void afterInsert() {
        executePriorityLogic();
    }

    protected override void afterUpdate() {
        System.debug('--WO AFTER UPDATE--');
        // updatesFromScannedBarcodes();  //RAS
        updateWorkOrderFieldsAfterUpdate();
        createWorkOrderCases();
        updateQAInformation();
        updateSendPostInstallationSurvey();
        executePriorityLogic();
        sendCertificate();
    }
    
	//RAS Room Agnostic Scanning - commented while project on-hold
    /*
    private void prepareUpdatesFromScannedBarcodes() {
		//update work order barcodes fields 
        //prepare a list of Woli and Assets to update from barcodes gathered with Room Agnostic Scanning
       
        Set<Id> woCompletedId = new Set<Id>();
        List<WorkOrder> lstCompletedWO = new List<WorkOrder>();
        Map<Id, Set<String>> mapWOMatchedBarcodes = new Map<Id, Set<String>>();
        Map<Id, Set<String>> mapWOUnmatchedBarcodes = new Map<Id, Set<String>>();
        Map<String, WorkOrder> mapScannedBarcodes = new Map<String, WorkOrder>{};

        for (WorkOrder wo : lstNewWorkOrders) {

            WorkOrder oldRec = mapOldWorkOrders.get(wo.Id);

            if(oldRec.Status != wo.Status && (wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c)
                && (!String.isEmpty(wo.Scanned_In__c) || wo.Count_of_Matched_Barcodes__c > 0)) {
                woCompletedId.add(wo.Id);
                lstCompletedWO.add(wo);

                //parse the scanned barcodes that were not a direct match
                if (wo.Scanned_In__c != null && wo.Scanned_In__c != '') {
                    Set<String> barcodes = new Set<String>();
                    for (String s : wo.Scanned_In__c.split(QueryUtils.fieldServiceSettings.Scan_Delimiter__c)) {
                        if (String.isNotBlank(s)) {
                            barcodes.add(s);
                            mapScannedBarcodes.put(s, wo);
                        }
                    }
                    mapWOUnmatchedBarcodes.put(wo.Id,barcodes);
                }
            }
        }
        //no completed work orders, so nothing to do
        if (woCompletedId.isEmpty()) {
            System.debug('Darcy: no completed work orders, so nothing to do');
            return;
        }

        
        Map<Id, List<WorkOrderLineItem>> mapWoliUnmatchedBarcodes = new Map<Id, List<WorkOrderLineItem>>{};
        Map<Id, List<WorkOrderLineItem>> mapWoliDirectMatches = new Map<Id, List<WorkOrderLineItem>>{};

        for(WorkOrderLineItem woli : [SELECT Id, Status, Product2Id, AssetId, Bar_Code__c, Barcode_Matched__c, 
                                            WorkOrderId, Work_Order_Location__r.Survey_Location__c, Work_Order_Location__c
                                     FROM WorkOrderLineItem WHERE WorkOrderId IN :woCompletedId]) {


            if(woli.Barcode_Matched__c != null && woli.Barcode_Matched__c != '' && woli.Barcode_Matched__c == woli.Bar_Code__c ) {
                if (woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c) { 
                    mapScannedBarcodes.put(woli.Barcode_Matched__c, mapNewWorkOrders.get(woli.WorkOrderId));

                    List<WorkOrderLineItem> matchedWoli = new List<WorkOrderLineItem>();
                    If (mapWoliDirectMatches.get(woli.WorkOrderId) != null) {
                        matchedWoli = mapWoliDirectMatches.get(woli.WorkOrderId);
                    } 
                    matchedWoli.add(woli);
                    mapWoliDirectMatches.put(woli.WorkOrderId,matchedWoli);

                }
            }
            else {
                //add a list of woli by wo that are candidates for indirect matches
                If (woli.Status == QueryUtils.fieldServiceSettings.Work_Order_New_Status__c) {
                    List<WorkOrderLineItem> unmatchedWoli = new List<WorkOrderLineItem>();
                    If (mapWoliUnmatchedBarcodes.get(woli.WorkOrderId) != null) {
                        unmatchedWoli = mapWoliUnmatchedBarcodes.get(woli.WorkOrderId);
                    } 
                    unmatchedWoli.add(woli);
                    mapWoliUnmatchedBarcodes.put(woli.WorkOrderId,unmatchedWoli);
                }
            }
        }
        //nothing scanned with RAS, so nothing to do
        if (mapScannedBarcodes.isEmpty()) {
            System.debug('Darcy: nothing scanned with RAS, so nothing to do');
            return;
        }

        
        Map<String, Asset> mapAssetBarcodes = new Map<String, Asset>{};
        for(Asset a : [SELECT Id, AccountId, Status, Product2Id, Bar_Code__c, Asset_ID__c, InstallDate,
                            Site_Survey__c, Work_Order_Location__c, Survey_Location__c, Last_Scanned_Work_Order__c,
                            Last_Scanned_By__c, Last_Scanned_Date__c, IsReallocated__c
                        FROM Asset
                        WHERE Asset_ID__c IN :mapScannedBarcodes.keySet()] ) {

            mapAssetBarcodes.put(a.Asset_ID__c, a);
 
        }
        
        woliUpdate = new List<WorkOrderLineItem>();
    	assetUpdate = new List<Asset>();
        
        //*************Find indirect matches and update wo/woli/asset*********************
        for (WorkOrder wo : lstCompletedWO) {

            Set<String> barcodes = mapWOUnmatchedBarcodes.get(wo.Id);
            if (barcodes != null && !barcodes.isEmpty()) {
                for (String barcode : barcodes) {

                    Asset scannedAsset = mapAssetBarcodes.get(barcode);
                    
                    if (scannedAsset == null) {
                        //barcode not found - is unknown
                        wo.Unknown_Barcodes__c = AddToBarcodeString(wo.Unknown_Barcodes__c, barcode);
                    }
                    else if (scannedAsset.AccountId != wo.AccountId 
                            && scannedAsset.AccountId != QueryUtils.fieldServiceSettings.Scanned_Out_Account_Record_ID__c) {
                        //asset needs to be same Account or Citron Warehouse Account - excess
                        wo.Excess_Barcodes__c = AddToBarcodeString(wo.Excess_Barcodes__c, barcode);
                    }
                    else {
                        //look for indirect match
                        Boolean foundIndirectMatch = false;
                        List<WorkOrderLineItem> unmatchedWoli = new List<WorkOrderLineItem>();
                        If (mapWoliUnmatchedBarcodes.get(wo.Id) != null) {
                            unmatchedWoli = mapWoliUnmatchedBarcodes.get(wo.Id);
                            Integer i = 0;
                                        
                            for (WorkOrderLineItem woli : unmatchedWoli){
                                //check if same product

                                if(woli.Product2Id == scannedAsset.Product2Id) {
                                    System.debug('FOUND INDIRECT MATCH: ' + barcode);

                                    //indirect match found updating woli and asset                                
                                
                                    woli.status = QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c;
                                    woli.Barcode_Matched__c = barcode;
                                    //woli.AssetId = scannedAsset.Id;

                                    //scannedAsset.IsReallocated__c = false;
                                    scannedAsset.Status = QueryUtils.fieldServiceSettings.Scanned_In_Status__c;
                                    scannedAsset.AccountId = wo.AccountId;
                                    scannedAsset.Site_Survey__c = wo.Site_Survey__c;
                                    scannedAsset.Survey_Location__c = woli.Work_Order_Location__r.Survey_Location__c;
                                    scannedAsset.Last_Scanned_Date__c = System.today();
                                    scannedAsset.Last_Scanned_By__c = UserInfo.getUserId();
                                    scannedAsset.Last_Scanned_Work_Order__c = wo.Id;
                                                                        
                                    woliUpdate.add(woli);
                                    assetUpdate.add(scannedAsset);

                                    foundIndirectMatch = true;

                                    wo.Processed_Barcodes__c = AddToBarcodeString(wo.Processed_Barcodes__c, barcode); 
                                    
                                    //remove this woli from map of unmatched
                                    unmatchedWoli.remove(i);
                                    mapWoliUnmatchedBarcodes.put(woli.WorkOrderId,unmatchedWoli);

                                    break;
                                } 
                                i++;
                            }
                        }
                        if (foundIndirectMatch == false) {
                            //no indirect match found with any woli - excess
                            wo.Excess_Barcodes__c = AddToBarcodeString(wo.Excess_Barcodes__c, barcode);
                        }
                    }
                }
            }

            //cycle the direct matches to update asset
            if (mapWoliDirectMatches.get(wo.Id) != null) {
                for (WorkOrderLineItem woli : mapWoliDirectMatches.get(wo.Id)){
                    Asset scannedAsset = mapAssetBarcodes.get(woli.Barcode_Matched__c);
                    if(scannedAsset != null) {
                        scannedAsset.Last_Scanned_Date__c = System.today();
                        scannedAsset.Last_Scanned_By__c = UserInfo.getUserId();
                        scannedAsset.Last_Scanned_Work_Order__c = wo.Id;
                        scannedAsset.Work_Order_Location__c = woli.Work_Order_Location__c;
                        assetUpdate.add(scannedAsset);
                    }
                    else {
                        System.debug('Asset not found for direct match on woli: ' + woli.Id + ' ' + woli.Barcode_Matched__c);
                    }
                    wo.Processed_Barcodes__c = AddToBarcodeString(wo.Processed_Barcodes__c, woli.Barcode_Matched__c); 
                }
            }
	
            wo.Scanned_In__c = null;
           
		}
    }
    
	private void updatesFromScannedBarcodes() {
        
    	if (woliUpdate != null && !woliUpdate.isEmpty()){
            update woliUpdate;
        }
        if (assetUpdate != null && !assetUpdate.isEmpty()){
            update assetUpdate;
        }  
    }

    private String AddToBarcodeString(String barcodeString, String barcode) {
        if (String.isBlank(barcodeString)) {
            return barcode;
        }
        else {
            return barcodeString + ' ' + barcode;
        }  
    }
*/

    private void sendCertificate() {
        List<WorkOrder> lstwk = new List<WorkOrder>();
        Map<Id, WorkOrder> mapOfCompletedWorkOrder = new Map<Id, WorkOrder>();
        for (WorkOrder wo : lstNewWorkOrders) {
            WorkOrder oldRec = mapOldWorkOrders.get(wo.Id);
            if(oldRec.Status != wo.Status && (wo.Status == 'Completed')) {
                lstwk.add(wo);
            }
        }
        
        if (FALSE == System.isBatch() || FALSE == System.isFuture()) {
            If( Limits.getQueueableJobs() != Limits.getLimitQueueableJobs()) {
                if(lstwk.size() > 0 && lstwk !=null) {
                    Id job = System.enqueueJob(new SaniCertificatesAsFileController(lstwk));
                }
            }
        }
    } 

    private void setWorkOrderFields() {
        WorkOrderSetFieldsWrapper wrapper = new WorkOrderSetFieldsWrapper(lstNewWorkOrders, mapOldWorkOrders);
        wrapper.generateDeliveryServiceReports();
        wrapper.collectSummarizedResults();

        createWorkOrderRooms(wrapper.workOrderLocationMap, wrapper.workOrderMap);
        setWorkOrderFields(wrapper);
    }

    private void createWorkOrderRooms(Map<Id, Survey_Location__c> workOrderLocationMap, Map<Id, WorkOrder> workOrderMap) {
        List<Work_Order_Room__c> workOrderRooms = new List<Work_Order_Room__c>();

        for (Id workOrderId : workOrderLocationMap.keySet()) {
            WorkOrder wo = workOrderMap.get(workOrderId);
            Survey_Location__c sl = workOrderLocationMap.get(workOrderId);

            Work_Order_Room__c newRoom = new Work_Order_Room__c(
                    Work_Order__c = wo.Id,
                    Site_Survey__c = wo.Site_Survey__c,
                    Name = sl.Name,
                    Building__c = sl.Building__c,
                    Floor__c = sl.Floor__c,
                    Location_Type__c = sl.Location_Type__c,
                    Location_SubType__c = sl.Location_SubType__c,
                    Survey_Location__c = sl.Id,
                    Location_Notes__c = sl.Notes__c
            );
            workOrderRooms.add(newRoom);
        }

        insert workOrderRooms;
    }

    private void setWorkOrderFields(WorkOrderSetFieldsWrapper wrapper) {
        for (WorkOrder wo : lstNewWorkOrders) {
            if (wo.Type__c == QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c) {
                wo.WorkTypeId = WorkOrderConstants.WORK_TYPE_MAP.get(wo.Type__c);
                WorkType wType = WorkOrderConstants.WORK_TYPE_RECORDS.get(wo.WorkTypeId);

                if (wType != null && wType.ServiceReportTemplateId != null) {
                    wo.ServiceReportTemplateId = wType.ServiceReportTemplateId;
                }
            }

            Account a = wrapper.accountMap.get(wo.AccountId);

            if (a != null) {
                setRelatedAccountDetails(wo, a, wrapper.orderMap);
            }

            //Begin:Shashi:8-6-2019:Stock Summary:Set Stock Summary field
            if (wrapper.stockSmryMap.size() > 0
                    && wrapper.stockSmryMap.containsKey(wo.Id)
                    && wo.Type__c != QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c)
            {
                wo.Product_Summary__c = wrapper.stockSmryMap.get(wo.Id);
            }
            //End

            //Begin:Shashi:8-26-2019:Generate Delivery service report
            if ((wrapper.mpDelvSmry.size() > 0)
                    && wo.Type__c == QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c
                    && wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Dispatched_Status__c)
            {
                if (wo.ServiceReportLanguage == 'fr') {
                    wo.Product_Summary__c = 'Produits commandés\n' + '_______________________________________\n';
                } else {
                    wo.Product_Summary__c = 'Product Ordered\n' + '_______________________________________\n';
                }
                if (wrapper.mpDelvSmry.containsKey(wo.Id)){
                    Map<String,Integer> mPQ = wrapper.mpDelvSmry.get(wo.Id);

                    for (String pc : mPQ.keySet()){
                        String pName = '(' + wrapper.mpProdIdToName.get(pc) + ')';
                        String qty = '[' + mPQ.get(pc) + ']';

                        for (Integer q = 8 - qty.length(); q > 0; q--) {
                            qty += '.';
                        }

                        if (pc == null) {
                            pc = '';
                        }

                        for (Integer p = 18 - pc.length(); p > 0;p--) {
                            pc += '.';
                        }

                        wo.Product_Summary__c += qty + pc + pName + '\n';
                    }
                }
            }

            if (wo.Type__c == QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c
                    && (wo.Status == QueryUtils.fieldServiceSettings.Service_Appointment_Arrived_Status__c
                        || wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c)
                    && (wrapper.mpDelvSmry.size() > 0
                        || wrapper.mpNoDelvSmry.size() > 0))
            {
                if (wo.ServiceReportLanguage == 'fr') {
                    wo.Product_Summary__c = 'Produits livrés\n' + '_______________________________________\n';
                } else {
                    wo.Product_Summary__c = 'Product Delivered\n' + '_______________________________________\n';
                }
                if (wrapper.mpDelvSmry.containsKey(wo.Id)){
                    Map<String,Integer> mPQ = wrapper.mpDelvSmry.get(wo.Id);
                    for (String pc : mPQ.keySet()) {
                        String pName = '(' + wrapper.mpProdIdToName.get(pc) + ')';
                        String qty = '[' + mPQ.get(pc) + ']';

                        for (Integer q = 8 - qty.length(); q > 0; q--) {
                            qty += '.';
                        }

                        if (pc == null) {
                            pc = '';
                        }

                        for (Integer p = 18 - pc.length(); p > 0; p--) {
                            pc += '.';
                        }

                        wo.Product_Summary__c += qty + pc + pName + '\n';
                    }
                }

                if (wrapper.mpNoDelvSmry.size() > 0){
                    if (wo.ServiceReportLanguage == 'fr') {
                        wo.Product_Summary__c += '\n\nProduits non livrés\n' + '_______________________________________\n';
                    } else {    
                        wo.Product_Summary__c += '\n\nProduct Not Delivered\n' + '_______________________________________\n';
                    }
                }

                if (wrapper.mpNoDelvSmry.containsKey(wo.Id)) {
                    Map<String,Integer> mPQ = wrapper.mpNoDelvSmry.get(wo.Id);

                    for (String pc : mPQ.keySet()) {
                        String pName = '(' + wrapper.mpProdIdToName.get(pc) + ')';
                        String Qty = '[' + mPQ.get(pc) + ']';

                        for (Integer q = 8 - Qty.length(); q > 0; q--) {
                            Qty += '.';
                        }

                        if (pc == null) {
                            pc = '';
                        }

                        for (Integer p = 18 - pc.length(); p > 0; p--) {
                            pc += '.';
                        }

                        wo.Product_Summary__c += Qty + pc + pName +'\n';
                    }
                }
            }

            if (wo.Type__c == QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c
                    && (wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Scheduled_Status__c
                    || wo.Status == QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c))
            {
                wo.Product_Summary__c = '';
            }
            
			//End

            //2021-07-27 Darcy #929 https://trello.com/c/4hGrQLMq 
            //2021-11-03 Darcy #987 https://trello.com/c/RPj5eM80
            if (wo.State == 'QC') {
                wo.ServiceReportLanguage = 'fr';
            }
            else {
                wo.ServiceReportLanguage = 'en_US';
            }
        }
    }

    private void setRelatedAccountDetails(WorkOrder wo, Account a, Map<Id,Order> orderMap) {
        SObject sourceRecord;

        if (wo.Address == null && String.isNotBlank(wo.Order__c)) {
            sourceRecord = (SObject) orderMap.get(wo.Order__c);
        } else if (wo.Address == null) {
            sourceRecord = (SObject) a;
        }

        wo = (WorkOrder) ApexUtils.writeToTargetRecord(
                (SObject) wo,
                sourceRecord,
                WorkOrderConstants.ORDER_AND_ACCOUNT_TO_WORK_ORDER_FIELD_MAPPING
        );

        if (String.isNotBlank(a.Site_Survey__c)) {
            wo.Site_Survey__c = a.Site_Survey__c;
            wo.Site_Survey_Notes__c = a.Site_Survey__r.Notes__c;
        }

        if (String.isNotBlank(wo.Line_of_Business__c)) {
            if (wo.Type__c != QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c) {
                wo.WorkTypeId = WorkOrderConstants.WORK_TYPE_MAP.get(wo.Line_of_Business__c + '.' + String.valueOf(a.Detailing_Reporting__c));
                WorkType wType = WorkOrderConstants.WORK_TYPE_RECORDS.get(wo.WorkTypeId);

                if (wType != null && wType.ServiceReportTemplateId != null) {
                    wo.ServiceReportTemplateId = wType.ServiceReportTemplateId;
                }
            }

            if (wo.Line_of_Business__c == QueryUtils.fieldServiceSettings.Hygiene_LOB__c) {
                wo.FSL__VisitingHours__c = a.Hygiene_OperatingHoursId__c;
            } else if (wo.Line_of_Business__c == QueryUtils.fieldServiceSettings.Chemical_LOB__c) {
                wo.FSL__VisitingHours__c = a.Chemical_OperatingHoursId__c;
            } else if (wo.Line_of_Business__c == QueryUtils.fieldServiceSettings.Pest_LOB__c) {
                wo.FSL__VisitingHours__c = a.Pest_Control_OperatingHoursId__c;
            } else if (wo.Line_of_Business__c == QueryUtils.fieldServiceSettings.Life_Safety_LOB__c) {
                wo.FSL__VisitingHours__c = a.Life_Safety_OperatingHoursId__c;
            }
        } else {
            wo.FSL__VisitingHours__c = a.OperatingHoursId;
        }
    }

    private void executePriorityLogic() {
        new WorkOrderPriorityFactory().executePriorityLogicV2();
    }

    private void updateWorkOrderFieldsAfterUpdate() {
        WorkOrderUpdateFieldsWrapper wrapper = new WorkOrderUpdateFieldsWrapper(lstNewWorkOrders, mapOldWorkOrders);

        if (!System.isBatch() && !System.isFuture()) {
            updateWorkOrdersSynchronous(wrapper);
        }

        createWarranties(wrapper.completedWOs);
    }

    private void updateWorkOrdersSynchronous(WorkOrderUpdateFieldsWrapper wrapper) {
        System.debug('--UPDATE WO ASYNC--');
        //21618
        if (!wrapper.workOrderPestCannotCompleteIds.isEmpty()) {
            WorkOrderUtil.updateWorkOrderCannotComplete(wrapper.workOrderPestCannotCompleteIds);
        }
        //21618
        if (!wrapper.workOrderCompletedIds.isEmpty()) {
            WorkOrderUtil.createOrderProductsOnCompletedWorkOrders(wrapper.workOrderCompletedIds);
            Map<Id, WorkOrder> workOrdersWithError = WorkOrderUtil.updateOrderStatusToActiveFromNotInvoicing(wrapper.workOrderCompletedIds);
            System.debug('--AFTER INVOICE SYNC--' + workOrdersWithError);
            WorkOrderUtil.sendDocuSignForPONumberAfterCompletion(wrapper.workOrderCompletedIds);

            for (Id woId : workOrdersWithError.keySet()) {
                WorkOrder triggerWorkOrder = mapNewWorkOrders.get(woId);

                triggerWorkOrder.addError(QueryUtils.emergencyDispatchSettings.PO_Required_for_Closing_Work_Order_Error__c);
            }
        }
        //21618
        if (!wrapper.workOrderSwappedProductIds.isEmpty()) {
            WorkOrderFutureCalls.sendEmailsOnSwappedOrderProducts(wrapper.workOrderSwappedProductIds);
        }
        //21618
        if (!wrapper.workOrderCancelledIds.isEmpty()) {
            WorkOrderUtil.cancelWorkOrderAndServiceAppointments(wrapper.workOrderCancelledIds);
        }
        //21618
        if (!wrapper.workOrderPONumberCase.isEmpty()) {
            WorkOrderFutureCalls.createPONumberCases(wrapper.workOrderPONumberCase);
        }
        //21618
        if (!wrapper.workOrderResetAppointmentIds.isEmpty()) {
            WorkOrderUtil.setAllServiceAppointmentsToSpecificStatus(
                    wrapper.workOrderResetAppointmentIds,
                    QueryUtils.fieldServiceSettings.Work_Order_New_Status__c
            );
        }
		//This will cause an issue 
        WorkOrderFutureCalls.futureUpdates(wrapper.cannotCompleteWorkOrderIds, wrapper.completedWOs);
    }

    private void createWarranties(Set<Id> completedWOs) {
        List<Warranty__c> warrantiesToCreate = new List<Warranty__c>();
        Set<String> productsWithExistingWarranties = new Set<String>();

        if (!completedWOs.isEmpty()) {
            List<WorkOrderLineItem> lineItems = [
                    SELECT Id, PricebookEntry.Product2Id, PricebookEntry.Product2.Clean_Out_Type__c, WorkOrderId,
                            WorkOrder.Completed_Date__c, PricebookEntry.Product2.Warranty_Period__c, WorkOrder.AccountId
                    FROM WorkOrderLineItem
                    WHERE WorkOrderId IN :completedWOs
                    ORDER BY WorkOrderId
            ];

            for (WorkOrderLineItem woli : lineItems) {
                if (woli.PricebookEntry.Product2.Clean_Out_Type__c != null
                        && woli.PricebookEntry.Product2.Clean_Out_Type__c != ''
                        && !productsWithExistingWarranties.contains(woli.PricebookEntry.Product2Id + '' + woli.WorkOrderId))
                {
                    productsWithExistingWarranties.add(woli.PricebookEntry.Product2Id + '' + woli.WorkOrderId);

                    warrantiesToCreate.add(new Warranty__c(
                            Product__c = woli.PricebookEntry.Product2Id,
                            Work_Order__c = woli.WorkOrderId,
                            Ship_To__c = woli.WorkOrder.AccountId,
                            Warranty_Start__c = woli.WorkOrder.Completed_Date__c,
                            Warranty_Period__c = woli.PricebookEntry.Product2.Warranty_Period__c
                    ));
                }
            }

            insert warrantiesToCreate;
        }
    }

    /* Case Creation block
     * If WO is marked complete and the Repair Complete field is set to true
     * and Products Consumed is not empty
     * create a case of "Invoice Information" Record Type, Setting Type to a default value
     * assign it to Customer Success Queue
     * && wo.Repair_Completed__c != oldRec.Repair_Completed__c
     */
    private void createWorkOrderCases() {
        Set<Id> repairWorkOrders = new Set<Id>();

        for (WorkOrder wo : lstNewWorkOrders) {
            if (wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c
                    && String.isNotBlank(wo.Status)
                    && wo.Repair_Completed__c
                    && wo.Repair_Ticket__c == null)
            {
                repairWorkOrders.add(wo.Id);
            }
        }

        Map<Id, WorkOrder> repairWorkOrdersMap = new Map<Id, WorkOrder>();

        if (!repairWorkOrders.isEmpty()) {
            List<ProductConsumed> productsConsumed = [
                    SELECT Id, WorkOrderId
                    FROM ProductConsumed
                    WHERE WorkOrderId IN :repairWorkOrders
            ];

            for (ProductConsumed pc : productsConsumed) {
                repairWorkOrdersMap.put(pc.WorkOrderId, null);
            }
        }

        if (!repairWorkOrdersMap.isEmpty()) {
            repairWorkOrdersMap = new Map<Id, WorkOrder>([
                    SELECT Id, Status, Repair_Completed__c, AccountId, ContactId, Line_of_Business__c,
                            Unit_to_Repair_Include_Colour__c, Repair_Notes__c, Repair_Ticket__c,
                            (SELECT Id, Order__c
                            FROM Related_Work_Orders__r)
                    FROM WorkOrder
                    WHERE Id IN :repairWorkOrdersMap.keySet()
            ]);
        }

        Map<Id,Case> workOrderCases = new Map<Id,Case>();

        for (WorkOrder wo : repairWorkOrdersMap.values()) {
            for(Related_Work_Order__c rwo : wo.Related_Work_Orders__r) {
                Case newCase = new Case(
                        AccountId = wo.AccountId,
                        ContactId = wo.ContactId,
                        Lines_of_Business__c = wo.Line_of_Business__c,
                        Order__c = rwo.Order__c,
                        Subject = 'Repair Work Order Completed',
                        Work_Order__c = wo.Id,
                        RecordTypeId = QueryUtils.fieldServiceSettings.Repair_WorkOrder_Case_Record_Type__c,
                        OwnerId = QueryUtils.fieldServiceSettings.Customer_Service_Queue__c,
                        Type = 'Invoice Adjustment',
                        Repair_Notes__c = wo.Repair_Notes__c,
                        IsRepairTicket__c = true
                );

                workOrderCases.put(wo.Id, newCase);
            }
        }

        upsert workOrderCases.values();

        for (WorkOrder wo : repairWorkOrdersMap.values()) {
            if(!workOrderCases.containsKey(wo.Id)){continue;}
            Id caseId = workOrderCases.get(wo.Id).Id;

            if (caseId != null) {
                wo.Repair_Completed__c = false;
                wo.Repair_Ticket__c = caseId;
            }
        }

        if (!repairWorkOrdersMap.isEmpty()) {
            upsert repairWorkOrdersMap.values();
        }
    }

    private void updateQAInformation() {
        /* QA Work Order Section*/
        Set<Id> parentWorkOrderIds = new Set<Id>();
        Set<Id> workOrderIdsForQA = new Set<Id>();

        for (WorkOrder wo : lstNewWorkOrders) {
            WorkOrder oldRec = mapOldWorkOrders.get(wo.Id);

            if (wo.ParentWorkOrderId != null
                    && wo.Status ==QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c
                    && wo.RecordTypeId == QueryUtils.fieldServiceSettings.QA_WorkOrder_RecordTypeId__c)
            {
                parentWorkOrderIds.add(wo.ParentWorkOrderId);
            }

            if (oldRec.Create_Quality_Assurance__c != wo.Create_Quality_Assurance__c
                    && wo.Create_Quality_Assurance__c != null
                    && !System.isBatch()
                    && !System.isFuture())
            {
                workOrderIdsForQA.add(wo.Id);
            }
        }

        /* Completing QA Info on Parent Work Orders */
        List<WorkOrder> parentWorkOrders = new List<WorkOrder>();

        if (!parentWorkOrderIds.isEmpty()) {
            List<WorkOrder> workOrders = [SELECT Id, QA_Status__c FROM WorkOrder WHERE Id IN:parentWorkOrderIds];

            for (WorkOrder wo : workOrders) {
                wo.QA_Status__c = 'Completed';
                wo.QA_Completed_Date__c = System.today();
                parentWorkOrders.add(wo);
            }

            update parentWorkOrders;
        }

        if (!workOrderIdsForQA.isEmpty()) {
            WorkOrderFutureCalls.createQA(workOrderIdsForQA, UserInfo.getUserId());
        }
    }

    /**
        @Author : Aieleeta
        @Purpose : To set the 'Installation_Survey_Sent__c' and 'Install_Survey_Received_by_Work_Order__c' on Billing Account.
                   To set the 'Send_Post_Installation_Survey__c' and 'Related_Survey_Account__c' on Contact.
    **/
    private void updateSendPostInstallationSurvey(){
        Set<Id> setWOId = new Set<Id>();

        for (WorkOrder wo: lstNewWorkOrders){
            Boolean fieldChanged = ApexUtils.fieldChanged(
                    (SObject) wo,
                    (SObject) mapOldWorkOrders.get(wo.Id),
                    new Set<String>{'Status'}
            );

            if (wo.Status == 'Completed' && wo.Type__c == 'Installation' && fieldChanged) {
                setWOId.add(wo.Id);
            }
        }

        if(setWOId.isEmpty()) return;

        List<WorkOrder> filteredWorkOrders = [
                SELECT Id, Status, Type__c, AccountId, Account.ParentId,
                        Account.Parent.Installation_Survey_Sent__c, WorkOrderNumber,
                        (SELECT Id, OrderId, Service_Frequency__c, WorkOrderId
                        FROM WorkOrderLineItems WHERE Service_Frequency__c != 'One-Time'),
                        (SELECT Id, Order__c, Order__r.Recurring_Lines__c, Order__r.ShipToContactId,
                                Order__r.Account.ParentId, Order__r.Account.Parent.Installation_Survey_Sent__c
                        FROM Related_Work_Orders__r
                        WHERE Order__r.ShipToContact.Send_Post_Installation_Survey__c = FALSE
                        AND Order__r.Recurring_Lines__c > 0
                        ORDER BY Order__r.CreatedDate DESC)
                FROM WorkOrder
                WHERE Id IN :setWOId
                AND Account.Parent.Installation_Survey_Sent__c = FALSE
        ];

        Map<Id,Contact> mapContact = new Map<Id,Contact>();
        Map<Id,Account> mapParentAcc = new Map<Id,Account>();

        for (WorkOrder wo : filteredWorkOrders){
            for(Related_Work_Order__c rwo : wo.Related_Work_Orders__r) {
                Boolean sendSurvey = false;

                for (WorkOrderLineItem wli : wo.WorkOrderLineItems) {
                    if(wli.OrderId == rwo.Order__c) {
                        sendSurvey = true;
                        break;
                    }
                }

                if(sendSurvey) {
                    if(!mapParentAcc.containsKey(wo.Account.ParentId)) {
                        mapParentAcc.put(
                                wo.Account.ParentId,
                                new Account(
                                        Id = wo.Account.ParentId,
                                        Installation_Survey_Sent__c = true,
                                        Install_Survey_Received_by_Work_Order__c = wo.WorkOrderNumber
                                )
                        );
                    }
                    if(rwo.Order__r.ShipToContactId!=null){
                        if(!mapContact.containsKey(rwo.Order__r.ShipToContactId)) {
                            mapContact.put(
                                    rwo.Order__r.ShipToContactId,
                                    new Contact(
                                            Id = rwo.Order__r.ShipToContactId,
                                            Send_Post_Installation_Survey__c = true,
                                            Related_Survey_Account__c = rwo.Order__r.AccountId
                                    )
                            );
                        }
                    }
                }
            }
        }

        update mapContact.values();
        update mapParentAcc.values();
    }
}