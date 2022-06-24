/**
 * @FileName: WorkOrderLocationValidateItemsWrapper
 * @Description: Wrapper class to validate scanned items
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/9/2020        Created
 *-----------------------------------------------------------  
 */
public inherited sharing class WorkOrderLocationValidateItemsWrapper {
    private List<Work_Order_Room__c> workOrderRooms;
    private Map<Id, Work_Order_Room__c> oldMap;
    private Map<Id, Work_Order_Room__c> worMap;
    private Map<Id, List<Set<String>>> worParsedScans;
    private Map<String, Work_Order_Room__c> scannedInMap;
    private Map<String, Work_Order_Room__c> scannedOutMap;
    private Map<String, Asset> assetMap;
    private List<WorkOrderLineItem> updateLineItems;
    private Map<Id, WorkOrder> workOrderMap;
    private Map<Id, Asset> updateAssets;
    private Set<Id> matchedWorkOrderLineItemIds;
    private Map<String, List<WorkOrderLineItem>> unmatchedLineItemsByProductIds;
    private Set<String> addedBarCodesToUnknownScanIn;
    private Set<String> addedBarCodesToUnknownScanOut;

    public WorkOrderLocationValidateItemsWrapper(List<Work_Order_Room__c> workOrderRooms) {
        this(workOrderRooms, null);
    }

    public WorkOrderLocationValidateItemsWrapper(
            List<Work_Order_Room__c> workOrderRooms,
            Map<Id, Work_Order_Room__c> oldMap)
    {
        this.workOrderRooms = workOrderRooms;
        this.oldMap = oldMap;
        this.worMap = new Map<Id, Work_Order_Room__c>();
        this.worParsedScans = new Map<Id, List<Set<String>>>();
        this.scannedInMap = new Map<String, Work_Order_Room__c>();
        this.scannedOutMap = new Map<String, Work_Order_Room__c>();
        this.assetMap = new Map<String, Asset>();
        this.updateLineItems = new List<WorkOrderLineItem>();
        this.workOrderMap = new Map<Id, WorkOrder>();
        this.updateAssets = new Map<Id, Asset>();
        this.matchedWorkOrderLineItemIds = new Set<Id>();
        this.unmatchedLineItemsByProductIds = new Map<String, List<WorkOrderLineItem>>();
        this.addedBarCodesToUnknownScanIn = new Set<String>();
        this.addedBarCodesToUnknownScanOut = new Set<String>();

        validateScannedItems();
    }

    private void validateScannedItems() {
        parseScannedBarCodes();

        if (!worMap.isEmpty() || !worParsedScans.isEmpty()) {
            populateAssetMap();
        }

        if (oldMap != null && !worMap.isEmpty()) {
            doorOrNobScan();
        }

        updateAssetsAndLineItems();
        updateWorkOrdersAndServiceAppointments();
        updateWorkOrderRooms();
    }
    
    private void parseScannedBarCodes() {
        for (Work_Order_Room__c wor : workOrderRooms) {
            Work_Order_Room__c oldRec;
            
            if (oldMap == null) {
                oldRec = new Work_Order_Room__c();
            }
            else {
                oldRec = oldMap.get(wor.Id);
            }
            
            setWorMap(wor, oldRec);
            
            List<Set<String>> scans = new List<Set<String>>{new Set<String>(), new Set<String>()};
                
                if (wor.Scanned_In__c != null) {
                    scans[0] = parseScannedInBarCodes(wor);
                }
            
            if (wor.Scanned_Out__c != null) {
                scans[1] = parseScannedOutBarCodes(wor);
            }
            
            if ((wor.Scanned_In__c != null)||(wor.Scanned_Out__c != null)) {
                worParsedScans.put(wor.Id, scans);
                worMap.put(wor.Id, wor);
            }
                }
                }

    private void setWorMap(Work_Order_Room__c wor, Work_Order_Room__c oldRec) {
        if (String.isNotBlank(wor.Location_Notes__c)) {
            wor.Location_Notes__c = wor.Location_Notes__c.replaceAll('<[^>]+>', '');
        }

        if ((wor.Location_Barcode__c != null
                    && wor.Location_Barcode__c != oldRec.Location_Barcode__c
                    && wor.Status__c != QueryUtils.fieldServiceSettings.Work_Order_Room_Complete_Status__c)
                || (wor.Status__c != null
                    && wor.Status__c == QueryUtils.fieldServiceSettings.Work_Order_Room_Complete_Status__c
                    && wor.Status__c != oldRec.Status__c))
        {
            worMap.put(wor.Id, wor);
        }
    }

    private Set<String> parseScannedInBarCodes(Work_Order_Room__c wor) {
        Set<String> scanIns = new Set<String>();

        //check if it expects regex. whitespace takes care of both line breaks and space. find all \n and replace with \s.
        for (String s : wor.Scanned_In__c.split(QueryUtils.fieldServiceSettings.Scan_Delimiter__c)) {
            if (String.isNotBlank(s)) {
                scanIns.add(s);
                scannedInMap.put(s, wor);
            }

            if (wor.Scanned_In_Processed__c == null) {
                wor.Scanned_In_Processed__c = '';
            }

            wor.Scanned_In_Processed__c += ' ' + s;
        }

        return scanIns;
    }

    private Set<String> parseScannedOutBarCodes(Work_Order_Room__c wor) {
        Set<String> scanOuts = new Set<String>();

        for (String s : wor.Scanned_Out__c.split(QueryUtils.fieldServiceSettings.Scan_Delimiter__c)) {

            if (String.isNotBlank(s)) {
                scanOuts.add(s);
                scannedOutMap.put(s, wor);
            }

            if (wor.Scanned_Out_Processed__c == null) {
                wor.Scanned_Out_Processed__c = '';
            }

            wor.Scanned_Out_Processed__c += ' ' + s;
        }

        return scanOuts;
    }

    private void populateAssetMap() {
        List<Asset> assets = WorkOrderLocationTriggerHelper.getAssets(scannedInMap.keySet(), scannedOutMap.keySet());

        for (Asset a : assets) {
            assetMap.put(a.Bar_Code__c, a);
        }
    }

    private void doorOrNobScan() {
        System.debug('In doorOrNobScan');
        System.debug('This is woMap '+worMap);
        List<WorkOrderLineItem> wolis = WorkOrderLocationTriggerHelper.getWorkOrderLineItems(worMap.keySet());
		System.debug('These are wolis in NOB'+wolis);
        for (WorkOrderLineItem woli : wolis) {
            Work_Order_Room__c wor = worMap.get(woli.Work_Order_Location__c);
			System.debug('These are wolis in NOB'+wolis);
            System.debug('These are worParsed scans'+worParsedScans);
            if (worParsedScans.isEmpty()) {
                System.debug('In worParsedScans empty');
                woli.Status = QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c;
                woli.Completed_Date__c = System.today();
                updateLineItems.add(woli);
                workOrderMap.put(wor.Work_Order__c, null);
            }
            else {
                System.debug('In evaluateParsedScans');
                evaluateParsedScans(wor);
            }
        }
    }

    private void evaluateParsedScans(Work_Order_Room__c wor) {
        List<Set<String>> parsedScans = worParsedScans.get(wor.Id);
        System.debug('This is the parsed scan location '+wor.Id);

        if (parsedScans == null) return;

        if (!parsedScans[0].isEmpty()) {
            for (String s : parsedScans[0]) {
                Asset scannedAsset = assetMap.get(s);
                System.debug('Scanned asset parsedScans[0] '+scannedAsset);

                if (scannedAsset != null || addedBarCodesToUnknownScanIn.contains(s)) continue;

                addedBarCodesToUnknownScanIn.add(s);

                if (wor.Scanned_In_Unknown_Barcodes__c == null) {
                    wor.Scanned_In_Unknown_Barcodes__c = '';
                }

                wor.Scanned_In_Unknown_Barcodes__c += ' ' + s;
            }
        }

        if (!parsedScans[1].isEmpty()) {
            for (String s : parsedScans[1]) {
                Asset scannedAsset = assetMap.get(s);
                System.debug('Scanned asset parsedScans[1] '+scannedAsset);

                if (scannedAsset != null || addedBarCodesToUnknownScanOut.contains(s)) continue;

                addedBarCodesToUnknownScanOut.add(s);

                if (wor.Scanned_Out_Unknown_Barcodes__c == null) {
                    wor.Scanned_Out_Unknown_Barcodes__c = '';
                }

                wor.Scanned_Out_Unknown_Barcodes__c += ' ' + s;
            }
        }

    }

    private void updateAssetsAndLineItems() {
        if (!worParsedScans.isEmpty()) {
            List<Work_Order_Room__c> wors = WorkOrderLocationTriggerHelper.getWorkOrderRooms(worParsedScans.keySet());

            for (Work_Order_Room__c wor : wors) {
                Boolean proceedScan = wor.Work_Order__r.Line_of_Business__c != QueryUtils.fieldServiceSettings.Pest_LOB__c ? true : wor.PestAuditable__c;

                if(proceedScan) {
                    getAssetsAndLineItemsToUpdate(wor);
                }
            }
        }

        update updateAssets.values();
        update updateLineItems;
    }

    private void getAssetsAndLineItemsToUpdate(Work_Order_Room__c wor) {
        List<Set<String>> parsedScans = worParsedScans.get(wor.Id);
		/*System.debug('This is parsed scans '+parsedScans);
        System.debug('This is parsed scans[0] '+parsedScans[0]);
        System.debug('This is parsed scans[1] '+parsedScans[1]);*/
        scannedExpectedAsset(wor, parsedScans);
        scannedInUnexpectedBarCodes(wor, parsedScans[0]);
        scannedOutUnexpectedBarCodes(wor, parsedScans[1]);

        if (wor.Work_Order_Line_Items__r.size() == matchedWorkOrderLineItemIds.size()) {
            // All Work Order Line Items were completed, auto complete the work order location
            wor.Status__c = QueryUtils.fieldServiceSettings.Work_Order_Room_Complete_Status__c;
            workOrderMap.put(wor.Work_Order__c, null);
        }

        worMap.put(wor.Id, wor);
    }

    private void scannedExpectedAsset(Work_Order_Room__c wor, List<Set<String>> parsedScans) {
        for (WorkOrderLineItem woli : wor.Work_Order_Line_Items__r) {
            // Checking Work Order Line Items for exact Bar Code Matches
            System.debug('Work order line item in scannedExpectedAsset '+woli);
            System.debug('Work order line item barcode in scannedExpectedAsset '+woli.Bar_Code__c);
            if (parsedScans[0].contains(woli.Bar_Code__c)
                    && woli.Type_of_Service__c != QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c
                    && woli.Status != QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c) {
                woli.Status = QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c;
                woli.Completed_Date__c = System.today();

                updateLineItems.add(woli);
                matchedWorkOrderLineItemIds.add(woli.Id);

                updateAssets.put(
                        woli.AssetId,
                        new Asset(
                                Id = woli.AssetId,
                                IsReallocated__c = false,
                                Status = QueryUtils.fieldServiceSettings.Scanned_In_Status__c,
                                AccountId = wor.Work_Order__r.AccountId,
                                Site_Survey__c = wor.Work_Order__r.Site_Survey__c,
                                Work_Order_Location__c = wor.Id,
                                Survey_Location__c = wor.Survey_Location__c,
                                Last_Scanned_Date__c = System.today(),
                                Last_Scanned_By__c = UserInfo.getUserId(),
                                Last_Scanned_Work_Order__c = wor.Work_Order__c
                        )
                );

                //Remove the item from scanned set
                parsedScans[0].remove(woli.Bar_Code__c);
            }
            else if (parsedScans[1].contains(woli.Bar_Code__c)
                    && (woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c
                    || woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c))
            {
                if (woli.Type_of_Service__c != QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c) {
                    // Do not autocomplete for replace type
                    woli.Status = QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c;
                    woli.Completed_Date__c = System.today();

                    matchedWorkOrderLineItemIds.add(woli.Id);
                    updateLineItems.add(woli);
                }
                else {
                    matchedWorkOrderLineItemIds.add(woli.Id);
                }

                updateAssets.put(
                        woli.AssetId,
                        new Asset(
                                Id = woli.AssetId,
                                IsReallocated__c = false,
                                Status = QueryUtils.fieldServiceSettings.Scanned_Out_Status__c,
                                AccountId = QueryUtils.fieldServiceSettings.Scanned_Out_Account_Record_ID__c,
                                Site_Survey__c = null,
                                Survey_Location__c = null,
                                Work_Order_Location__c = null,
                                Last_Scanned_Date__c = System.today(),
                                Last_Scanned_By__c = UserInfo.getUserId(),
                                Last_Scanned_Work_Order__c = wor.Work_Order__c
                        )
                );

                parsedScans[1].remove(woli.Bar_Code__c);
            } else {
                String mapKey = woli.Product2Id;

                if (woli.Status != QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c
                        && (woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Service_Work_Order_Type__c
                        || woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Install_Work_Order_Type__c)) {
                    mapKey += 'IN';
                } else if (woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c
                        && woli.Status != QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c) {
                    mapKey += 'OUT';
                } else if (woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c) {
                    if (woli.Status != QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c) {
                        mapKey += 'IN';
                        if (!unmatchedLineItemsByProductIds.containsKey(mapKey)) {
                            unmatchedLineItemsByProductIds.put(mapKey, new List<WorkOrderLineItem>());
                        }
                        unmatchedLineItemsByProductIds.get(mapKey).add(woli);
                    }

                    mapKey = woli.Product2Id + 'OUT';
                }

                if (!unmatchedLineItemsByProductIds.containsKey(mapKey)) {
                    unmatchedLineItemsByProductIds.put(mapKey, new List<WorkOrderLineItem>());
                }

                unmatchedLineItemsByProductIds.get(mapKey).add(woli);
            }
        }
    }

    private void scannedInUnexpectedBarCodes(Work_Order_Room__c wor, Set<String> parsedScans) {
        for (String s : parsedScans) {
            Asset scannedAsset = assetMap.get(s);

            if (scannedAsset != null) {
                // Asset bar code is known
                List<WorkOrderLineItem> unmatchedLineItems = unmatchedLineItemsByProductIds.get(scannedAsset.Product2Id + 'IN');

                if (unmatchedLineItems != null && !unmatchedLineItems.isEmpty()) {
                    if (scannedAsset.AccountId == wor.Work_Order__r.AccountId
                            || scannedAsset.AccountId == QueryUtils.fieldServiceSettings.Scanned_Out_Account_Record_ID__c)
                    {
                        String productId = unmatchedLineItems[0].Product2Id;

                        Asset updateAsset = new Asset(
                                Id = scannedAsset.Id,
                                Status = QueryUtils.fieldServiceSettings.Scanned_In_Status__c,
                                AccountId = wor.Work_Order__r.AccountId,
                                Site_Survey__c = wor.Work_Order__r.Site_Survey__c,
                                IsReallocated__c = false,
                                Survey_Location__c = wor.Survey_Location__c,
                                Work_Order_Location__c = wor.Id,
                                Last_Scanned_Date__c = System.today(),
                                Last_Scanned_By__c = UserInfo.getUserId(),
                                Last_Scanned_Work_Order__c = unmatchedLineItems[0].WorkOrderId
                        );

                        // Asset is assigned to the same Account as the Work Order Room, or the Citron Warehouse
                        if (unmatchedLineItems[0].AssetId != null) {
                            // orphan this work order line item's asset
                            if (unmatchedLineItems[0].Asset.IsReallocated__c) {
                                updateAssets.put(
                                        unmatchedLineItems[0].AssetId,
                                        new Asset(
                                                Id = unmatchedLineItems[0].AssetId,
                                                IsReallocated__c = false
                                        )
                                );
                            } else {
                                updateAssets.put(
                                        unmatchedLineItems[0].AssetId,
                                        new Asset(
                                                Id = unmatchedLineItems[0].AssetId,
                                                Work_Order_Location__c = null,
                                                Survey_Location__c = null
                                        )
                                );
                            }
                        }
                        // link work item to new scanned asset
                        unmatchedLineItems[0].AssetId = scannedAsset.Id;
                        unmatchedLineItems[0].Status = QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c;

                        updateLineItems.add(unmatchedLineItems[0]);
                        matchedWorkOrderLineItemIds.add(unmatchedLineItems[0].Id);

                        if (scannedAsset.AccountId == wor.Work_Order__r.AccountId) {
                            updateAsset.IsReallocated__c = true;
                        }

                        if (unmatchedLineItems[0].Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c
                                || unmatchedLineItems[0].Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Install_Work_Order_Type__c)
                        {
                            updateAsset.InstallDate = System.today();
                        }

                        updateAssets.put(scannedAsset.Id, updateAsset);

                        // remove line items from unmatched list
                        unmatchedLineItems.remove(0);
                        unmatchedLineItemsByProductIds.put(productId, unmatchedLineItems);
                    } else {
                        // no unmatched products for this scanned Asset??
                        if (wor.Scanned_In_Excess_Bar_Codes__c == null) {
                            wor.Scanned_In_Excess_Bar_Codes__c = '';
                        }
                        wor.Scanned_In_Excess_Bar_Codes__c += ' ' + s ;
                    }
                } else {
                    // no unmatched products for this scanned Asset??
                    if (wor.Scanned_In_Excess_Bar_Codes__c == null) {
                        wor.Scanned_In_Excess_Bar_Codes__c = '';
                    }

                    wor.Scanned_In_Excess_Bar_Codes__c += ' ' + s ;
                }

            } else {
                //Serial number is unknown in system
                if (wor.Scanned_In_Unknown_Barcodes__c == null) {
                    wor.Scanned_In_Unknown_Barcodes__c = '';
                }

                wor.Scanned_In_Unknown_Barcodes__c += ' ' + s;
            }
        }
    }

    private void scannedOutUnexpectedBarCodes(Work_Order_Room__c wor, Set<String> parsedScans) {
        for (String s : parsedScans) {
            Asset scannedAsset = assetMap.get(s);

            if (scannedAsset != null) {
                // Asset bar code is known
                List<WorkOrderLineItem> unmatchedLineItems = unmatchedLineItemsByProductIds.get(scannedAsset.Product2Id + 'OUT');

                if (unmatchedLineItems != null && !unmatchedLineItems.isEmpty()) {
                    if (scannedAsset.AccountId == wor.Work_Order__r.AccountId
                            || scannedAsset.AccountId == QueryUtils.fieldServiceSettings.Scanned_Out_Account_Record_ID__c) {
                        String productId = unmatchedLineItems[0].Product2Id;

                        // Asset is assigned to the same Account as the Work Order Room, or the Citron Warehouse
                        if (unmatchedLineItems[0].AssetId != null) {
                            // orphan this work order line item's asset
                            if (unmatchedLineItems[0].Asset.IsReallocated__c) {
                                updateAssets.put(
                                        unmatchedLineItems[0].AssetId,
                                        new Asset(
                                                Id = unmatchedLineItems[0].AssetId,
                                                IsReallocated__c = false
                                        )
                                );
                            } else {
                                updateAssets.put(
                                        unmatchedLineItems[0].AssetId,
                                        new Asset(
                                                Id = unmatchedLineItems[0].AssetId,
                                                Work_Order_Location__c = null,
                                                Survey_Location__c = null
                                        )
                                );
                            }
                        }

                        updateAssets.put(
                                scannedAsset.Id,
                                new Asset(
                                        Id = scannedAsset.Id,
                                        Status = QueryUtils.fieldServiceSettings.Scanned_Out_Status__c,
                                        AccountId = QueryUtils.fieldServiceSettings.Scanned_Out_Account_Record_ID__c,
                                        Site_Survey__c = null,
                                        IsReallocated__c = true,
                                        Survey_Location__c = null,
                                        Work_Order_Location__c = null,
                                        Last_Scanned_Date__c = System.today(),
                                        Last_Scanned_By__c = UserInfo.getUserId(),
                                        Last_Scanned_Work_Order__c = unmatchedLineItems[0].WorkOrderId
                                )
                        );

                        if (unmatchedLineItems[0].Type_of_Service__c != QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c) {
                            unmatchedLineItems[0].Status = QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c;
                            updateLineItems.add(unmatchedLineItems[0]);
                            matchedWorkOrderLineItemIds.add(unmatchedLineItems[0].Id);

                            // remove line items from unmatched list
                            unmatchedLineItems.remove(0);
                            unmatchedLineItemsByProductIds.put(productId, unmatchedLineItems);
                        }
                    } else {
                        // no unmatched products for this scanned Asset??
                        if (wor.Scanned_Out_Excess_Bar_Codes__c == null) {
                            wor.Scanned_Out_Excess_Bar_Codes__c = '';
                        }

                        wor.Scanned_Out_Excess_Bar_Codes__c += ' ' + s ;
                    }
                } else {
                    // no unmatched products for this scanned Asset??
                    if (wor.Scanned_Out_Excess_Bar_Codes__c == null) {
                        wor.Scanned_Out_Excess_Bar_Codes__c = '';
                    }

                    wor.Scanned_Out_Excess_Bar_Codes__c += ' ' + s ;
                }

            } else {
                //Serial number is unknown in system
                if (wor.Scanned_Out_Unknown_Barcodes__c == null) {
                    wor.Scanned_Out_Unknown_Barcodes__c = '';
                }

                wor.Scanned_Out_Unknown_Barcodes__c += ' ' + s;
            }
        }
    }

    private void updateWorkOrdersAndServiceAppointments() {
        List<ServiceAppointment> updateServiceAppointments = new List<ServiceAppointment>();
        List<WorkOrder> updateWorkOrders = new List<WorkOrder>();

        if (!workOrderMap.isEmpty() && QueryUtils.fieldServiceSettings.Enable_Automatic_WO_Completed_Status__c) {
            // At least one Work Order Location was completed and custom setting is enabled
            String queryString = 'SELECT Id, Status, ' +
                                '(SELECT Status, ' +
                                ServiceAppointmentSignatureUtilities.SA_REQUIRED_FIELDS_FOR_SIGNATURE_CHECK +
                                ' FROM ServiceAppointments WHERE Status != \'' +
                                QueryUtils.fieldServiceSettings.Service_Appointment_Completed_Status__c + '\'), ' +
                                 '(SELECT Id, Status FROM WorkOrderLineItems WHERE Status != \'' +
                                QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c + '\') ' +
                                'FROM WorkOrder WHERE Id IN (';

            for (String key : workOrderMap.keySet()) {
                queryString += '\'' + key + '\',';
            }

            queryString = queryString.removeEnd(',');
            queryString += ') AND Status != \'' + QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c + '\'';

            List<ServiceAppointment> serviceAppointments = new List<ServiceAppointment>();
            List<WorkOrder> workOrders = Database.query(queryString);

            for (WorkOrder wo : workOrders) {
                if (wo.WorkOrderLineItems.size() == 0) {
                    // No incomplete Line Items
                    serviceAppointments.addAll(wo.ServiceAppointments);
                }
            }

            if (!serviceAppointments.isEmpty()) {
                Map<Id, Boolean> saSignatureRequiredMap = ServiceAppointmentSignatureUtilities.isSignatureRequired(serviceAppointments);

                if (!saSignatureRequiredMap.isEmpty()) {
                    for (WorkOrder wo : workOrders) {
                        Boolean requiresSignature = false;

                        for (ServiceAppointment sa : wo.ServiceAppointments) {
                            if (saSignatureRequiredMap.containsKey(sa.Id)) {
                                if (saSignatureRequiredMap.get(sa.Id)) {
                                    requiresSignature = true;
                                    break;
                                } else {
                                    sa.Status = QueryUtils.fieldServiceSettings.Service_Appointment_Completed_Status__c;
                                    updateServiceAppointments.add(sa);
                                }
                            } else {
                                // No result for Service Appointment in the map, so better to not automate closing of Work Order
                                requiresSignature = true;
                            }
                        }

                        if (!requiresSignature) {
                            wo.Status = QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c;
                            updateWorkOrders.add(wo);
                        }
                    }
                }
            }
        }

        update updateWorkOrders;
        update updateServiceAppointments;
    }

    private void updateWorkOrderRooms() {
        for (Work_Order_Room__c wor : workOrderRooms) {
            Work_Order_Room__c procWOR = worMap.get(wor.Id);

            if(procWOR == null) continue;

            wor.Scanned_In_Excess_Bar_Codes__c = procWOR.Scanned_In_Excess_Bar_Codes__c;
            wor.Scanned_In_Unknown_Barcodes__c = procWOR.Scanned_In_Unknown_Barcodes__c;
            wor.Scanned_Out_Excess_Bar_Codes__c = procWOR.Scanned_Out_Excess_Bar_Codes__c;
            wor.Scanned_Out_Unknown_Barcodes__c = procWOR.Scanned_Out_Unknown_Barcodes__c;
            wor.Scanned_In__c = '';
            wor.Scanned_Out__c = '';

            if (procWOR.Status__c != null) {
                wor.Status__c = procWOR.Status__c;
            }
        }
    }
}