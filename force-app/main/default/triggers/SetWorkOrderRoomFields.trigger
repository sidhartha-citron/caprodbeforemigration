trigger SetWorkOrderRoomFields on Work_Order_Room__c (before insert, before update) {

    Field_Service_Settings__c fss = Field_Service_Settings__c.getOrgDefaults();
    Map<Id, Work_Order_Room__c> worMap = new Map<Id, Work_Order_Room__c>();
    Map<Id, List<Set<String>>> worParsedScans = new Map<Id, List<Set<String>>>();   //Map of work order to all scanned in and scanned out values
    Map<String, Asset> assetMap = new Map<String, Asset>();
    Map<String,Work_Order_Room__c> scannedInMap = new Map<String,Work_Order_Room__c>();
    Map<String,Work_Order_Room__c> scannedOutMap = new Map<String,Work_Order_Room__c>();
    Map<Id, WorkOrder> workOrderMap = new Map<Id, WorkOrder>();

    Map<Id, Asset> updateAssets = new Map<Id, Asset>();
    List<WorkOrderLineItem> updateLineItems = new List<WorkOrderLineItem>();
    List<WorkOrder> updateWorkOrders = new List<WorkOrder>();
    List<ServiceAppointment> updateServiceAppointments = new List<ServiceAppointment>();

    for (Work_Order_Room__c wor : Trigger.new) {
        Work_Order_Room__c oldRec = Trigger.isInsert ? new Work_Order_Room__c() : Trigger.oldMap.get(wor.Id);
        if(String.isNotBlank(wor.Location_Notes__c)) {
            wor.Location_Notes__c = wor.Location_Notes__c.replaceAll('<[^>]+>','');
        }
        List<Set<String>> scans = new List<Set<String>>{new Set<String>(), new Set<String>()};

        if ((wor.Location_Barcode__c != null && wor.Location_Barcode__c != oldRec.Location_Barcode__c && wor.Status__c != fss.Work_Order_Room_Complete_Status__c) ||
                (wor.Status__c != null && wor.Status__c == fss.Work_Order_Room_Complete_Status__c && wor.Status__c != oldRec.Status__c)) {
            worMap.put(wor.Id,wor);
            continue;
        }

        //Parse the scanned in bar codes
        if (wor.Scanned_In__c != null){
            System.debug(' --> Scanned In ' + wor.Scanned_In__c + ' **Delimiter** ' + fss.Scan_Delimiter__c);
            for (String s: wor.Scanned_In__c.split(fss.Scan_Delimiter__c)){ //check if it expects regex. whitespace takes care of both line breaks and space. find all \n and replace with \s.
                s = s.trim();
                if (s.length() > 0) {
                    scans[0].add(s);
                    scannedInMap.put(s, wor);
                }

                if (wor.Scanned_In_Processed__c == null) {
                    wor.Scanned_In_Processed__c = '';
                }
                wor.Scanned_In_Processed__c += ' ' + s;
            }
            //Store a consolidated list of scans (in and out) for the work order
            worParsedScans.put(wor.Id, scans);
            worMap.put(wor.Id,wor);
        }

        //Parse the scanned out bar codes
        if (wor.Scanned_Out__c != null){
            System.debug(' --> Scanned Out ' + wor.Scanned_Out__c );
            for (String s: wor.Scanned_Out__c.split(fss.Scan_Delimiter__c)){
                s = s.trim();
                if (s.length() > 0) {
                    scans[1].add(s);
                    scannedOutMap.put(s, wor);
                }

                if (wor.Scanned_Out_Processed__c == null) {
                    wor.Scanned_Out_Processed__c = '';
                }
                wor.Scanned_Out_Processed__c += ' ' + s;
            }
            worParsedScans.put(wor.Id, scans);
            worMap.put(wor.Id,wor);
        }
    }

    scannedInMap.remove(null);
    scannedOutMap.remove(null);

    if (!worMap.isEmpty() || !worParsedScans.isEmpty()) {
        for (Asset a : [SELECT Id, AccountId, Status, Product2Id, Bar_Code__c, InstallDate FROM Asset WHERE (Bar_Code__c IN : scannedInMap.keySet() OR Bar_Code__c IN : scannedOutMap.keySet()) AND Bar_Code__c != NULL]) {
            assetMap.put(a.Bar_Code__c, a);
        }
        System.debug('**AssetMap** ' + assetMap);
    }

    if (Trigger.isUpdate && !worMap.isEmpty()) {

        for(WorkOrderLineItem woli : [SELECT Id, Work_Order_Location__c, Work_Order_Location__r.Work_Order__r.Line_of_Business__c, Status, Completed_Date__c, PricebookEntry.Product2.Family, PricebookEntry.Product2.Does_not_require_scanning__c FROM WorkOrderLineItem
        WHERE Status != :fss.Work_Order_Line_Item_Completed_Status__c
        AND Work_Order_Location__c IN :worMap.keySet()
        AND ((PricebookEntry.Product2.Family = :fss.Pest_LOB__c OR PricebookEntry.Product2.Does_not_require_scanning__c = TRUE)
        OR (Work_Order_Location__r.Work_Order__r.Line_of_Business__c = :fss.Pest_LOB__c AND Work_Order_Location__r.PestAuditable__c = FALSE)
        )])
        {
            System.debug('**Door or NOB scan**');
            Work_Order_Room__c wor = worMap.get(woli.Work_Order_Location__c);
            if (worParsedScans.isEmpty()) {
                woli.Status = fss.Work_Order_Line_Item_Completed_Status__c;
                woli.Completed_Date__c = System.today();
                updateLineItems.add(woli);
                workOrderMap.put(wor.Work_Order__c, null);
            } else {
                List<Set<String>> scans = worParsedScans.get(wor.Id);
                if (scans != null) {
                    if (scans[0] != null) {
                        for (String s : scans[0]) {
                            Asset scannedAsset = assetMap.get(s);
                            if (scannedAsset != null) {

                            } else {
                                if (wor.Scanned_In_Unknown_Barcodes__c == null) {
                                    wor.Scanned_In_Unknown_Barcodes__c = '';
                                }
                                wor.Scanned_In_Unknown_Barcodes__c += ' ' + s;
                            }
                        }
                    }
                    if (scans[1] != null) {
                        for (String s : scans[1]) {
                            Asset scannedAsset = assetMap.get(s);
                            if (scannedAsset != null) {

                            } else {
                                if (wor.Scanned_Out_Unknown_Barcodes__c == null) {
                                    wor.Scanned_Out_Unknown_Barcodes__c = '';
                                }
                                wor.Scanned_Out_Unknown_Barcodes__c += ' ' + s;
                            }
                        }
                    }
                }
            }
        }
    }

    System.debug('Scanned In Keys: ' + scannedInMap.keySet());
    System.debug('Scanned Out Keys: ' + scannedOutMap.keySet());
    if (!worParsedScans.isEmpty()) {

        for (Work_Order_Room__c wor : [SELECT Id, Work_Order__r.Line_of_Business__c, Work_Order__r.Site_Survey__c, Survey_Location__c, PestAuditable__c, Work_Order__r.Type__c, Work_Order__r.AccountId, Scanned_In_Excess_Bar_Codes__c, Scanned_In_Unknown_Barcodes__c, Scanned_Out_Excess_Bar_Codes__c, Scanned_Out_Unknown_Barcodes__c, Status__c,
        (SELECT Id, Bar_Code__c, Status, AssetId, Asset.isReallocated__c, Asset.Last_Scanned_Date__c, Asset.Last_Scanned_Work_Order__c, Asset.Last_Scanned_By__c, WorkOrderId, Product2Id, Type_of_Service__c
        FROM Work_Order_Line_Items__r WHERE Status != :fss.Work_Order_Line_Item_Completed_Status__c OR Type_of_Service__c = :fss.Label_for_Replace_Work_Order_Type__c ORDER BY AssetId NULLS LAST)
        FROM Work_Order_Room__c WHERE Id IN :worParsedScans.keySet()]) {

            Boolean proceedScan = wor.Work_Order__r.Line_of_Business__c!=fss.Pest_LOB__c ? true : wor.PestAuditable__c;
            Set<Id> matchedWorkOrderLineItemIds = new Set<Id>();
            Map<String, List<WorkOrderLineItem>> unmatchedLineItemsByProductIds = new Map<String, List<WorkOrderLineItem>>();
            System.debug('--> This Scan is for a ' + wor.Work_Order__r.Line_of_Business__c+' LOB and scan proceed is ' + proceedScan);
            System.debug('-->Account Level PestFlag, only valid for PEST ' + wor.PestAuditable__c);
            if (proceedScan) {
                List<Set<String>> scans = worParsedScans.get(wor.Id);

                // Scanned expected Asset
                for (WorkOrderLineItem woli : wor.Work_Order_Line_Items__r) {
                    // Checking Work Order Line Items for exact Bar Code Matches
                    if (scans[0].contains(woli.Bar_Code__c) && woli.Type_of_Service__c != fss.DeInstall_Work_Order_Type__c && woli.Status != fss.Work_Order_Line_Item_Completed_Status__c) {
                        woli.Status = fss.Work_Order_Line_Item_Completed_Status__c;
                        woli.Completed_Date__c = System.today();
                        updateLineItems.add(woli);
                        matchedWorkOrderLineItemIds.add(woli.Id);
                        updateAssets.put(woli.AssetId, new Asset(Id=woli.AssetId, isReallocated__c=false, Status = fss.Scanned_In_Status__c, AccountId = wor.Work_Order__r.AccountId, Site_Survey__c=wor.Work_Order__r.Site_Survey__c, Work_Order_Location__c=wor.Id, Survey_Location__c=wor.Survey_Location__c, Last_Scanned_Date__c=System.today(), Last_Scanned_By__c=UserInfo.getUserId(), Last_Scanned_Work_Order__c=wor.Work_Order__c));

                        //Remove the item from scanned set
                        scans[0].remove(woli.Bar_Code__c);
                    } else if (scans[1].contains(woli.Bar_Code__c) && (woli.Type_of_Service__c == fss.DeInstall_Work_Order_Type__c || woli.Type_of_Service__c == fss.Label_for_Replace_Work_Order_Type__c)) {
                        if (woli.Type_of_Service__c != fss.Label_for_Replace_Work_Order_Type__c) {
                            // Do not autocomplete for replace type
                            woli.Status = fss.Work_Order_Line_Item_Completed_Status__c;
                            woli.Completed_Date__c = System.today();
                            matchedWorkOrderLineItemIds.add(woli.Id);
                            updateLineItems.add(woli);
                        } else {
                            matchedWorkOrderLineItemIds.add(woli.Id);
                        }
                        updateAssets.put(woli.AssetId, new Asset(Id = woli.AssetId, isReallocated__c=false, Status = fss.Scanned_Out_Status__c, AccountId = fss.Scanned_Out_Account_Record_ID__c, Site_Survey__c = null, Survey_Location__c = null, Work_Order_Location__c = null, Last_Scanned_Date__c = System.today(), Last_Scanned_By__c = UserInfo.getUserId(), Last_Scanned_Work_Order__c = wor.Work_Order__c));
                        scans[1].remove(woli.Bar_Code__c);
                    } else {
                        String mapKey = woli.Product2Id;
                        if ((woli.Type_of_Service__c == fss.Label_for_Service_Work_Order_Type__c || woli.Type_of_Service__c == fss.Label_for_Install_Work_Order_Type__c) && woli.Status != fss.Work_Order_Line_Item_Completed_Status__c) {
                            mapKey += 'IN';
                        } else if (woli.Type_of_Service__c == fss.DeInstall_Work_Order_Type__c && woli.Status != fss.Work_Order_Line_Item_Completed_Status__c) {
                            mapKey += 'OUT';
                        } else if (woli.Type_of_Service__c == fss.Label_for_Replace_Work_Order_Type__c) {
                            if (woli.Status != fss.Work_Order_Line_Item_Completed_Status__c) {
                                mapKey += 'IN';
                                if (!unmatchedLineItemsByProductIds.containsKey(mapKey)) {
                                    unmatchedLineItemsByProductIds.put(mapKey, new List<WorkOrderLineItem>());
                                }
                                unmatchedLineItemsByProductIds.get(mapKey).add(woli);
                            }
                            mapKey = woli.Product2Id + 'OUT';
                        }
                        System.debug('mapKey: '+mapKey);
                        if (!unmatchedLineItemsByProductIds.containsKey(mapKey)) {
                            unmatchedLineItemsByProductIds.put(mapKey, new List<WorkOrderLineItem>());
                        }
                        unmatchedLineItemsByProductIds.get(mapKey).add(woli);
                        System.debug('**Unmatched Line Items** ' + unmatchedLineItemsByProductIds);
                    }
                }

                // Scanned in unexpected Bar Code
                for (String s : scans[0]) {
                    Asset scannedAsset = assetMap.get(s);
                    System.debug('**Scanned Asset From Map**' + scannedAsset);
                    if (scannedAsset != null) {
                        // Asset bar code is known
                        List<WorkOrderLineItem> unmatchedLineItems = unmatchedLineItemsByProductIds.get(scannedAsset.Product2Id + 'IN');
                        System.debug('unmatchedLineItems: '+unmatchedLineItems);
                        if (unmatchedLineItems != null && !unmatchedLineItems.isEmpty()) {
                            if (scannedAsset.AccountId == wor.Work_Order__r.AccountId || scannedAsset.AccountId == fss.Scanned_Out_Account_Record_ID__c) {
                                String productId = unmatchedLineItems[0].Product2Id;
                                Asset updateAsset = new Asset(Id = scannedAsset.Id, Status = fss.Scanned_In_Status__c, AccountId = wor.Work_Order__r.AccountId, Site_Survey__c = wor.Work_Order__r.Site_Survey__c, isReallocated__c = false, Survey_Location__c = wor.Survey_Location__c, Work_Order_Location__c = wor.Id, Last_Scanned_Date__c = System.today(), Last_Scanned_By__c = UserInfo.getUserId(), Last_Scanned_Work_Order__c = unmatchedLineItems[0].WorkOrderId);
                                // Asset is assigned to the same Account as the Work Order Room, or the Citron Warehouse
                                if (unmatchedLineItems[0].AssetId != null ) {
                                    // orphan this work order line item's asset
                                    if  (unmatchedLineItems[0].Asset.isReallocated__c) {
                                        updateAssets.put(unmatchedLineItems[0].AssetId, new Asset(Id = unmatchedLineItems[0].AssetId, isReallocated__c=false));
                                    } else {
                                        updateAssets.put(unmatchedLineItems[0].AssetId, new Asset(Id = unmatchedLineItems[0].AssetId, Work_Order_Location__c = null, Survey_Location__c = null));
                                    }
                                }
                                // link work item to new scanned asset
                                unmatchedLineItems[0].AssetId = scannedAsset.Id;
                                unmatchedLineItems[0].Status = fss.Work_Order_Line_Item_Completed_Status__c;
                                updateLineItems.add(unmatchedLineItems[0]);
                                matchedWorkOrderLineItemIds.add(unmatchedLineItems[0].Id);
                                if (scannedAsset.AccountId == wor.Work_Order__r.AccountId) {
                                    updateAsset.isReallocated__c = true;
                                }
                                if (unmatchedLineItems[0].Type_of_Service__c == fss.Label_for_Replace_Work_Order_Type__c || unmatchedLineItems[0].Type_of_Service__c == fss.Label_for_Install_Work_Order_Type__c) {
                                    updateAsset.InstallDate = System.today();
                                }
                                System.debug('updateAsset: '+updateAsset);
                                updateAssets.put(scannedAsset.Id, updateAsset);
                                // remove line items from unmatched list
                                unmatchedLineItems.remove(0);
                                unmatchedLineItemsByProductIds.put(productId,unmatchedLineItems);
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

                // Scanned out unexpected Bar Code
                for (String s : scans[1]) {
                    Asset scannedAsset = assetMap.get(s);
                    System.debug('**Scanned Asset From Map**' + scannedAsset);
                    if (scannedAsset != null) {
                        // Asset bar code is known
                        System.debug('scannedAsset key:'+scannedAsset.Product2Id + 'OUT');
                        System.debug('unmatchedLineItemsByProductIds: '+unmatchedLineItemsByProductIds);
                        List<WorkOrderLineItem> unmatchedLineItems = unmatchedLineItemsByProductIds.get(scannedAsset.Product2Id + 'OUT');
                        System.debug('unmatchedLineItems: '+unmatchedLineItems);
                        if (unmatchedLineItems != null && !unmatchedLineItems.isEmpty()) {

                            if (scannedAsset.AccountId == wor.Work_Order__r.AccountId || scannedAsset.AccountId == fss.Scanned_Out_Account_Record_ID__c) {
                                String productId = unmatchedLineItems[0].Product2Id;
                                // Asset is assigned to the same Account as the Work Order Room, or the Citron Warehouse
                                if (unmatchedLineItems[0].AssetId != null ) {
                                    // orphan this work order line item's asset
                                    if  (unmatchedLineItems[0].Asset.isReallocated__c) {
                                        updateAssets.put(unmatchedLineItems[0].AssetId, new Asset(Id = unmatchedLineItems[0].AssetId, isReallocated__c=false));
                                    } else {
                                        updateAssets.put(unmatchedLineItems[0].AssetId, new Asset(Id = unmatchedLineItems[0].AssetId, Work_Order_Location__c = null, Survey_Location__c = null));
                                    }
                                }
                                updateAssets.put(scannedAsset.Id, new Asset(Id=scannedAsset.Id, Status=fss.Scanned_Out_Status__c, AccountId=fss.Scanned_Out_Account_Record_ID__c, Site_Survey__c=null, isReallocated__c=true, Survey_Location__c=null, Work_Order_Location__c=null, Last_Scanned_Date__c=System.today(), Last_Scanned_By__c=UserInfo.getUserId(), Last_Scanned_Work_Order__c=unmatchedLineItems[0].WorkOrderId));

                                if (unmatchedLineItems[0].Type_of_Service__c != fss.Label_for_Replace_Work_Order_Type__c) {
                                    unmatchedLineItems[0].Status = fss.Work_Order_Line_Item_Completed_Status__c;
                                    updateLineItems.add(unmatchedLineItems[0]);
                                    matchedWorkOrderLineItemIds.add(unmatchedLineItems[0].Id);
                                    // remove line items from unmatched list
                                    unmatchedLineItems.remove(0);
                                    unmatchedLineItemsByProductIds.put(productId,unmatchedLineItems);
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

                System.debug('WOLI Count: '+wor.Work_Order_Line_Items__r.size()+' | Matched WOLI Count: '+matchedWorkOrderLineItemIds.size());
                if (wor.Work_Order_Line_Items__r.size() == matchedWorkOrderLineItemIds.size()) {
                    // All Work Order Line Items were completed, auto complete the work order location
                    wor.Status__c = fss.Work_Order_Room_Complete_Status__c;
                    workOrderMap.put(wor.Work_Order__c,null);
                }
                worMap.put(wor.Id,wor);
            }
        }
    }

    for (Work_Order_Room__c wor : Trigger.new) {
        Work_Order_Room__c procWOR = worMap.get(wor.Id);

        if (procWOR != null) {
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

    if (!updateAssets.isEmpty()) {
        System.debug('**Updating Work Order Assets**');
        System.debug(updateAssets);
        update updateAssets.values();
    }


    if (!updateLineItems.isEmpty()) {
        System.debug('**Updating Work Order Line Items**');
        System.debug(updateLineItems);
        update updateLineItems;
    }

    if (!workOrderMap.isEmpty() && fss.Enable_Automatic_WO_Completed_Status__c) {
        // At least one Work Order Location was completed and custom setting is enabled
        String queryString = 'SELECT Id, Status, ';
        queryString += '(SELECT Status, '+ ServiceAppointmentSignatureUtilities.SA_REQUIRED_FIELDS_FOR_SIGNATURE_CHECK +' FROM ServiceAppointments WHERE Status != \''+fss.Service_Appointment_Completed_Status__c+'\'), ';
        queryString += '(SELECT Id, Status FROM WorkOrderLineItems WHERE Status != \''+fss.Work_Order_Line_Item_Completed_Status__c+'\') ';
        queryString += 'FROM WorkOrder WHERE Id IN (';
        for (String key : workOrderMap.keySet()) {
            queryString += '\'' + key + '\',';
        }
        queryString = queryString.removeEnd(',');
        queryString += ') AND Status != \''+fss.Work_Order_Completion_Status__c+'\'';
        System.debug(queryString);
        List<ServiceAppointment> serviceAppointments = new List<ServiceAppointment>();
        List<WorkOrder> workOrders = Database.query(queryString);
        for (WorkOrder wo : workOrders) {
            System.debug('WorkOrder: '+wo);
            System.debug('Related Service Appointments: '+wo.ServiceAppointments);
            if (wo.WorkOrderLineItems.size() == 0) {
                // No uncompleted Line Items
                serviceAppointments.addAll(wo.ServiceAppointments);
            }
        }
        System.debug('serviceAppointments: '+serviceAppointments);
        if (!serviceAppointments.isEmpty()) {
            Map<Id, Boolean> saSignatureRequiredMap = ServiceAppointmentSignatureUtilities.isSignatureRequired(serviceAppointments);
            System.debug('saSignatureRequiredMap: ' + saSignatureRequiredMap);
            if (!saSignatureRequiredMap.isEmpty()) {
                for (WorkOrder wo : workOrders) {
                    Boolean requiresSignature = false;
                    for (ServiceAppointment sa : wo.ServiceAppointments) {
                        if (saSignatureRequiredMap.containsKey(sa.Id)) {
                            if (saSignatureRequiredMap.get(sa.Id)) {
                                System.debug('saSignatureRequiredMap.get(sa.Id): ' + saSignatureRequiredMap.get(sa.Id));
                                requiresSignature = true;
                                break;
                            } else {
                                sa.Status = fss.Service_Appointment_Completed_Status__c;
                                updateServiceAppointments.add(sa);
                            }
                        } else {
                            // No result for Service Appointment in the map, so better to not automate closing of Work Order
                            requiresSignature = true;
                        }
                    }
                    System.debug('requiresSignature: ' + requiresSignature);
                    if (!requiresSignature) {
                        wo.Status = fss.Work_Order_Completion_Status__c;
                        updateWorkOrders.add(wo);
                    }
                }
            }
        }
    }

    if (!updateWorkOrders.isEmpty()) {
        System.debug('**Updating Work Orders**');
        System.debug(updateWorkOrders);
        update updateWorkOrders;
    }

    if (!updateServiceAppointments.isEmpty()) {
        System.debug('**Updating Service Appointments**');
        System.debug(updateServiceAppointments);
        update updateServiceAppointments;
    }
}