/**
 * VMIReport: Controller that contains the logic to display stock summary and print functionality
 * @author: Shashi
 * @Date:8-20-2019
 **/
public with sharing class VMIReport {
    //VARIABLES//
    private static final String NO_RECORDS = 'No records found. Please select a different filter criteria.';
    public Boolean isDtls { get; set; }

    //OBJECT ATTRIBUTES//
    public class PayLoad {
        @AuraEnabled public List<LineItem> summaryPayLoad;
        @AuraEnabled public List<LineItem> detailPayLoad;
        @AuraEnabled public String strMessage;
    }

    public class LineItem {
        @AuraEnabled public String srName { get; set; } // Service Resource Name
        @AuraEnabled public String acctId { get; set; } // Account Id
        @AuraEnabled public String acctName { get; set; } // Account Name
        @AuraEnabled public String address { get; set; } // Address
        @AuraEnabled public String wrkordNo { get; set; } // Work Order Number
        @AuraEnabled public String saNo { get; set; } // Service Appointment Number
        @AuraEnabled public String saStatus { get; set; } // Service Appointment Status
        @AuraEnabled public String sTer { get; set; } // Service Territory
        @AuraEnabled public String woStatus { get; set; } // Service Territory
        @AuraEnabled public Integer rowCount { get; set; }
        @AuraEnabled public List<VMIProduct> vimList { get; set; } //List of VMI Products
    }

    public class VMIProduct {
        @AuraEnabled public String vmiProd { get; set; } // VMI Product Number
        @AuraEnabled public Decimal Quantity { get; set; }// Quantity
        @AuraEnabled public Decimal parLevel { get; set; } // Par Level
        public String ProdId { get; set; } // Product Id
        //Begin:Shashi:8-20-2019:Blank "Quantity Picked" & most recent "Completed" Work Orders column
        public String QtyPicked { get; set; }
        @AuraEnabled public Decimal QtyLV { get; set; }
        //End
        //Begin:Shashi:01-02-2020:Blank "Starting Truck Stock" & "Remaining on Truck"
        Public String Starting_Truck_Stock {get;set;}
        Public String Remaining_On_Truck {get;set;}
        Public String Products_Sold {get;set;}
        //End       
    }

    /**
     * @function: Generate PDF content
     **/
    public List<List<LineItem>> getVMIPDF() {
        String filter = ApexPages.currentPage().getParameters().get('fltr');
        String dts = ApexPages.currentPage().getParameters().get('dtStart');
        String dte = ApexPages.currentPage().getParameters().get('dtEnd');
        String strWoli = ApexPages.currentPage().getParameters().get('Woli');
        String strTer = ApexPages.currentPage().getParameters().get('Ter');
        String strRes = ApexPages.currentPage().getParameters().get('Res');
        String strStatus = ApexPages.currentPage().getParameters().get('Status');
        String dtls = ApexPages.currentPage().getParameters().get('isDtls');
        Datetime dtStart = Datetime.valueOf(dts + ' 00:00:00');
        Datetime dtEnd = Datetime.valueOf(dte + ' 00:00:00');

        if (dtls == 'false') {
            isDtls = false;
        } else {
            isDtls = true;
        }

        PayLoad pL = getWorkOrderItems(filter, dtStart, dtEnd, strWoli, strTer, strRes, strStatus);
        if (isDtls) {
            return prepareLinesForPrinting(pL.detailPayLoad);
        } else {
            return prepareLinesForPrinting(pL.summaryPayLoad);
        }
    }

    //CONTROLLER FUNCTIONS//

    @AuraEnabled
    public static PayLoad getWorkOrderItems(String filter, Datetime dtStart, Datetime dtEnd, String strWoli, String strTer, String strRes, String strStatus) {
        Datetime ndtStart = Datetime.newInstanceGmt(dtStart.yearGmt(), dtStart.monthGmt(), dtStart.dayGmt(), 00, 00, 00);
        Datetime ndtEnd = Datetime.newInstanceGmt(dtEnd.yearGmt(), dtEnd.monthGmt(), dtEnd.dayGmt(), 23, 59, 59);

        return getVMIItems(filter, strWoli, strTer, ndtStart, ndtEnd, strRes, strStatus);
    }

    @AuraEnabled
    public static PayLoad getVMIItems(String filter, String strWoli, String strTer, Datetime startDate, Datetime endDate, String strRes, String strStatus) {
        String query = '';

        PayLoad pLoad = new PayLoad();
        pLoad.strMessage = '';

        Set<Id> stWOIds = new Set<Id>();
        Set<Id> stAccIds = new Set<Id>();
        List<LineItem> lItem = new List<LineItem>();
        List<LineItem> lsItem = new List<LineItem>();
        List<AssignedResource> lstARs = new List<AssignedResource>();
        List<WorkOrderLineItem> workOrderlItems = new List<WorkOrderLineItem>();
        List<VMI_Product__c> lstVMIProds = new List<VMI_Product__c>();

        Map<Id, WorkOrder> mpIdtoWrkOrd = new Map<Id, WorkOrder>();
        Map<Id, String> mpSrvRestoUser = new Map<Id, String>();
        Map<Id, Set<Id>> mpIdtosId = new Map<Id, Set<Id>>(); //[ServiceResourceId,Set<WorkOrderId>],[ServiceAppiontmentId,Set<ServiceResourceId>]
        Map<Id, List<ServiceAppointment>> mpWrkOrdtoSrvAppt = new Map<Id, List<ServiceAppointment>>();
        Map<Id, List<VMI_Product__c>> mpAcctoVMIProd = new Map<Id, List<VMI_Product__c>>();
        Map<String, VMIProduct> mpSrvPrdIdtoVMIProd = new Map<String, VMIProduct>(); //Summarized by Service Resource
        Map<Id, Id> mapActToWO = new Map<Id, Id>();
        Map<String, Map<Id, Decimal>> mmActToPrdQ = new Map<String, Map<Id, Decimal>>();

        try {
            //GET ALL SERVICE APPIOINTMENTS AND SERVICE RESOURCES
            query = 'SELECT ServiceAppointmentId,ServiceAppointment.Id,ServiceAppointment.AppointmentNumber,ServiceAppointment.ParentRecordId,' +
                    'ServiceAppointment.AccountId,ServiceAppointment.SchedStartTime,ServiceResourceId,' +
                    'ServiceAppointment.Street,ServiceAppointment.State,ServiceAppointment.City,ServiceAppointment.Status,' +
                    'ServiceAppointment.PostalCode,ServiceAppointment.Country,ServiceResource.RelatedRecord.Name,' +
                    'ServiceAppointment.ServiceTerritory.ParentTerritory.City,ServiceAppointment.ServiceTerritory.City ' +
                    ' FROM AssignedResource WHERE ServiceAppointment.ParentRecord.Type=\'WorkOrder\'';

            if (filter != 'Custom') {
                query += ' AND ServiceAppointment.SchedStartTime = ' + filter;
            }
            else {
                query += ' AND ServiceAppointment.SchedStartTime >= :startDate AND ServiceAppointment.SchedStartTime <= :endDate';
            }

            if (strTer != null && strTer != '') {
                query += ' AND (ServiceAppointment.ServiceTerritory.ParentTerritory.Name like \'' + strTer + '%\' OR' +
                        ' (ServiceAppointment.ServiceTerritory.ParentTerritoryId=null AND ServiceAppointment.ServiceTerritory.Name like \'' + strTer + '%\'))';
            }

            if (strRes != null && strRes != '') {
                query += ' AND ServiceResource.RelatedRecord.Name like \'' + strRes + '%\'';
            }

            if (strStatus != null && strStatus != '' && strStatus != 'ALL') {
                query += ' AND ServiceAppointment.Status = \'' + strStatus + '\'';
            }

            lstARs = Database.query(query);

            for (AssignedResource ar : lstARs) {
                ServiceAppointment sa = ar.ServiceAppointment;
                ServiceResource sr = ar.ServiceResource;

                //Add WorkOrderIds
                stWOIds.add(sa.ParentRecordId);

                //List of all Service Resource
                if (!mpSrvRestoUser.containsKey(ar.ServiceResourceId)) {
                    if (sr.RelatedRecord != null) {
                        mpSrvRestoUser.put(ar.ServiceResourceId, sr.RelatedRecord.Name);
                    }
                }

                //ServiceResourceId, Set<WorkOrderId>
                Set<Id> sIds = new Set<Id>();
                if (mpIdtosId.containsKey(ar.ServiceResourceId)) {
                    sIds = mpIdtosId.get(ar.ServiceResourceId);
                    sIds.add(sa.ParentRecordId);
                } else {
                    sIds.add(sa.ParentRecordId);
                    mpIdtosId.put(ar.ServiceResourceId, sIds);
                }

                //ServiceAppointmentId,Set<ServiceResourceId>
                Set<Id> nIds = new Set<Id>();

                if (mpIdtosId.containsKey(ar.ServiceAppointmentId)) {
                    nIds = mpIdtosId.get(ar.ServiceAppointmentId);
                    nIds.add(ar.ServiceResourceId);
                } else {
                    nIds.add(ar.ServiceResourceId);
                    mpIdtosId.put(ar.ServiceAppointmentId, nIds);
                }

                //WorkOrderId, List<ServiceAppointment>
                List<ServiceAppointment> lstSrvAppt = new List<ServiceAppointment>();

                if (mpWrkOrdtoSrvAppt.containsKey(sa.ParentRecordId)) {
                    lstSrvAppt = mpWrkOrdtoSrvAppt.get(sa.ParentRecordId);
                    lstSrvAppt.add(sa);
                } else {
                    lstSrvAppt.add(sa);
                    mpWrkOrdtoSrvAppt.put(sa.ParentRecordId, lstSrvAppt);
                }
            }

            //GET ALL WORK ORDER LINE ITEMS : This is what decides the Accounts and workOrders to display
            query = 'SELECT Id, WorkOrderId, WorkOrder.Status, WorkOrder.WorkOrderNumber, WorkOrder.AccountId, ' +
                            'WorkOrder.Account.Name, Product2Id, Product2.Name ' +
                    'FROM WorkOrderLineItem ' +
                    'WHERE workorderId = :stWOIds ' +
                    'AND Product2.Name = \'' + strWoli + '\'';

            workOrderlItems = Database.query(query);

            //If there are no Work Order Line Items check out
            if (workOrderlItems.size() == 0) {
                pLoad.strMessage = VMIReport.NO_RECORDS;
                return pLoad;
            }

            for (WorkOrderLineItem wli : workOrderlItems) {
                WorkOrder wo = wli.WorkOrder;
                stAccIds.add(wo.AccountId);
                //Id, WorkOrder
                if (!mpIdtoWrkOrd.containsKey(wli.WorkOrderId)) {
                    mpIdtoWrkOrd.put(wli.WorkOrderId, wo);
                }
            }

            //GET ALL VMA Products
            query = 'SELECT Id, Account__c, Product__c, Product__r.Name, Quantity_Per_Visit__c, Par_Level__c ' +
                    'FROM VMI_Product__c ' +
                    'WHERE Account__c =:stAccIds';

            lstVMIProds = Database.query(query);

            //If there are no VMI Products check out
            if (lstVMIProds.size() == 0) {
                pLoad.strMessage = VMIReport.NO_RECORDS;
                return pLoad;
            }

            for (VMI_Product__c vmi : lstVMIProds) {

                List<VMI_Product__c> lVMIs = new List<VMI_Product__c>();

                if (mpAcctoVMIProd.containsKey(vmi.Account__c)) {
                    lVMIs = mpAcctoVMIProd.get(vmi.Account__c);
                    lVMIs.add(vmi);
                }
                else {
                    lVMIs.add(vmi);
                    mpAcctoVMIProd.put(vmi.Account__c, lVMIs);
                }
            }

            //Begin:Shashi:8-20-2019:Get most recent "Completed" Work Orders for associated accounts
            query = 'SELECT WorkOrder.AccountId ACT,WorkOrderId,MAX(WorkOrder.LastModifiedDate) DT ' +
                    'FROM WorkOrderLineItem ' +
                    'WHERE WorkOrder.Status = \'Completed\' ' +
                    'AND Product2.Name = \'' + strWoli + '\' ' +
                    'AND WorkOrder.AccountId=:stAccIds ' +
                    'GROUP BY WorkOrder.AccountId, WorkOrderId ' +
                    'ORDER BY WorkOrder.AccountId';

            List<AggregateResult> grpRes = Database.query(query);

            for (AggregateResult ar : grpRes) {
                String ActId = String.valueOf(ar.get('ACT'));
                String WrkId = String.valueOf(ar.get('WorkOrderId'));
                mapActToWO.put(ActId, WrkId);
            }
            List<Id> lstWrkId = mapActToWO.values();
            query = 'SELECT WorkOrder.AccountId ACT,Product2Id,SUM(QuantityConsumed) QTY ' +
                    'FROM ProductConsumed ' +
                    'WHERE WorkOrderId=:lstWrkId GROUP BY WorkOrder.AccountId,Product2Id ' +
                    'ORDER BY WorkOrder.AccountId';

            List<AggregateResult> grpPC = Database.query(query);

            for (AggregateResult ar : grpPC) {
                String ActId = String.valueOf(ar.get('ACT'));
                String PrdId = String.valueOf(ar.get('Product2Id'));
                Decimal QtyLV = 0;

                if (ar.get('QTY') != null) {
                    QtyLV = Decimal.valueOf(String.valueOf(ar.get('QTY')));
                }

                Map<Id, Decimal> mPC = new Map<Id, Decimal>();

                if (mmActToPrdQ.containsKey(ActId)) {
                    mPC = mmActToPrdQ.get(ActId);
                    mPC.put(PrdId, QtyLV);
                }
                else {
                    mPC.put(PrdId, QtyLV);
                    mmActToPrdQ.put(ActId, mPC);
                }
            }
            //End

            //Populate Response Data
            for (Id srId : mpSrvRestoUser.keySet()) {
                Set<Id> setWrkOrdIds = mpIdtosId.get(srId);

                if (setWrkOrdIds == null) continue;

                for (Id wrkOrdId : setWrkOrdIds) {
                    WorkOrder wrkOrd = mpIdtoWrkOrd.get(wrkOrdId);
                    if (wrkOrd == null) {
                        continue;
                    }

                    List<ServiceAppointment> ltSrvAppts = mpWrkOrdtoSrvAppt.get(wrkOrdId);
                    if (ltSrvAppts == null) {
                        continue;
                    }

                    for (ServiceAppointment sa : ltSrvAppts) {
                        Set<Id> setSrvRess = mpIdtosId.get(sa.Id);

                        if (!setSrvRess.contains(srId)) continue;

                        LineItem itm = new LineItem();
                        itm.srName = mpSrvRestoUser.get(srId);
                        itm.acctId = wrkOrd.AccountId;
                        itm.acctName = wrkOrd.Account.Name;
                        itm.wrkordNo = wrkOrd.WorkOrderNumber;
                        itm.woStatus = wrkOrd.Status;
                        itm.saNo = sa.AppointmentNumber;
                        itm.saStatus = sa.Status;

                        if (sa.ServiceTerritory != null) {
                            if (sa.ServiceTerritory.ParentTerritory != null) {
                                itm.sTer = sa.ServiceTerritory.ParentTerritory.City;
                            }

                            if (sa.ServiceTerritory.ParentTerritory == null) {
                                itm.sTer = sa.ServiceTerritory.City;
                            }
                        }

                        itm.address = sa.Street + ' ,'
                                + sa.City + ' ,'
                                + sa.State + ' ,'
                                + sa.Country + ' '
                                + sa.PostalCode;

                        List<VMI_Product__c> ltVprod = mpAcctoVMIProd.get(wrkOrd.AccountId);

                        if (ltVprod == null) continue;


                        List<VMIProduct> ltVItems = new List<VMIProduct>();

                        for (VMI_Product__c vmi : ltVprod) {
                            //Detail VMIProduct line items
                            VMIProduct vmiItm = new VMIProduct();
                            vmiItm.ProdId = vmi.Product__c;
                            vmiItm.vmiProd = vmi.Product__r.Name;
                            //Begin:Shashi:8-20-2019:Blank "Quantity Picked" & most recent "Completed" Work Orders column
                            vmiItm.QtyPicked = '';

                            if (mmActToPrdQ.containsKey(wrkOrd.AccountId)) {
                                Map<Id, Decimal> mPC = mmActToPrdQ.get(wrkOrd.AccountId);
                                if (mPC.containsKey(vmi.Product__c)) {
                                    vmiItm.QtyLV = mPC.get(vmi.Product__c);
                                }
                            }
                            //End
                            //Begin:Shashi:01-02-2020:Blank "Starting Truck Stock" & "Remaining on Truck"
                            vmiItm.Starting_Truck_Stock='';
                            vmiItm.Remaining_On_Truck='';
                            vmiItm.Products_Sold = '';
                            //End                            
                            if (vmi.Quantity_Per_Visit__c != null) {
                                vmiItm.Quantity = vmi.Quantity_Per_Visit__c.setScale(2);
                            }
                            else {
                                vmiItm.Quantity = vmi.Quantity_Per_Visit__c;
                            }

                            vmiItm.parLevel = vmi.Par_Level__c;
                            ltVItems.add(vmiItm);

                            //Summarized VMIProduct line items
                            VMIProduct vmisItm = new VMIProduct();
                            String strCompositeKey = srId + '-' + vmi.Product__c;

                            if (mpSrvPrdIdtoVMIProd.containsKey(strCompositeKey)) {
                                vmisItm = mpSrvPrdIdtoVMIProd.get(strCompositeKey);

                                if (vmi.Quantity_Per_Visit__c != null) {
                                    if (vmisItm.Quantity == null) {
                                        vmisItm.Quantity = 0;
                                    }

                                    vmisItm.Quantity += vmi.Quantity_Per_Visit__c.setScale(2);
                                }
                                //Begin:Shashi:8-20-2019:Blank "Quantity Picked" & most recent "Completed" Work Orders column
                                if (mmActToPrdQ.containsKey(wrkOrd.AccountId)) {
                                    Map<Id, Decimal> mPC = mmActToPrdQ.get(wrkOrd.AccountId);

                                    if (mPC.containsKey(vmi.Product__c)) {
                                        if (vmisItm.QtyLV == null) {
                                            vmisItm.QtyLV = 0;
                                        }

                                        vmisItm.QtyLV += mPC.get(vmi.Product__c);
                                    }
                                }
                                //End
                            }
                            else {
                                vmisItm.ProdId = vmi.Product__c;
                                vmisItm.vmiProd = vmi.Product__r.Name;

                                if (vmi.Quantity_Per_Visit__c != null) {
                                    vmisItm.Quantity = vmi.Quantity_Per_Visit__c.setScale(2);
                                }

                                vmisItm.parLevel = vmi.Par_Level__c;
                                //Begin:Shashi:8-20-2019:Blank "Quantity Picked" & most recent "Completed" Work Orders column
                                vmisItm.QtyPicked = '';

                                if (mmActToPrdQ.containsKey(wrkOrd.AccountId)) {
                                    Map<Id, Decimal> mPC = mmActToPrdQ.get(wrkOrd.AccountId);

                                    if (mPC.containsKey(vmi.Product__c)) {
                                        vmisItm.QtyLV = mPC.get(vmi.Product__c);
                                    }
                                }
                                //End
                                //Begin:Shashi:01-02-2020:Blank "Starting Truck Stock" & "Remaining on Truck"
                                vmisItm.Starting_Truck_Stock='';
                                vmisItm.Remaining_On_Truck='';
                                vmisItm.Products_Sold='';
                                //End                                
                                mpSrvPrdIdtoVMIProd.put(strCompositeKey, vmisItm);
                            }
                        }

                        itm.vimList = ltVItems;
                        itm.rowCount = ltVItems.size() + 1;
                        lItem.add(itm);
                    }
                }

                if (mpSrvPrdIdtoVMIProd.size() > 0) {
                    LineItem sitm = new LineItem();
                    sitm.srName = mpSrvRestoUser.get(srId);
                    sitm.vimList = mpSrvPrdIdtoVMIProd.values();
                    sitm.rowCount = sitm.vimList.size() + 1;
                    lsItem.add(sitm);
                    mpSrvPrdIdtoVMIProd.clear();
                }
            }

        } catch (Exception e) {
            pLoad.strMessage = 'ERROR@' + e.getLineNumber() + '<Message>' + e.getMessage() + '<Cause>' + e.getCause();
        }

        pLoad.summaryPayLoad = lsItem;
        pLoad.detailPayLoad = lItem;

        if (pLoad.detailPayLoad.size() == 0 && pLoad.strMessage == '') {
            pLoad.strMessage = VMIReport.NO_RECORDS;
        }

        return pLoad;
    }


    //GENERAL FUNCTIONS//

    /**
     * @function : splits the quote lines into an approx no. of rows that can be displayed per page
     **/
    private List<List<LineItem>> prepareLinesForPrinting(List<LineItem> qLineItems) {
        Integer counter = 1, PAGE_BREAK = 30;
        LineItem iList = new LineItem();
        List<List<LineItem>> pageBrokenLines = new List<List<LineItem>>();
        List<LineItem> pageOfLines = new List<LineItem>();

        if (isDtls == false) {
            PAGE_BREAK = 18;
        }
        else {
            PAGE_BREAK = 8;
        }
        if (qLineItems.size() == 0) {
            return null;
        }

        for (LineItem q : qLineItems) {
            iList = copyLineItem(q);
            if (counter <= PAGE_BREAK) {
                pageOfLines.add(iList);
            }

            for (VMIProduct v : q.vimList) {
                if (counter <= PAGE_BREAK) {
                    counter++;
                    copyVMiProduct(iList, v);
                }
                else {
                    counter = 1;
                    pageBrokenLines.add(pageOfLines);
                    pageOfLines = new List<LineItem>();

                    iList = copyLineItem(q);
                    copyVMiProduct(iList, v);

                    pageOfLines.add(iList);
                }
            }
        }

        //if we have finished looping and have some quotes left let's assign them
        if (pageOfLines.size() > 0) {
            pageBrokenLines.add(pageOfLines);
        }

        return pageBrokenLines;
    }

    private LineItem copyLineItem(LineItem oList) {
        LineItem nList = new LineItem();
        nList.srName = oList.srName;
        nList.acctName = oList.acctName;
        nList.address = oList.address;
        nList.wrkordNo = oList.wrkordNo;
        nList.saNo = oList.saNo;
        nList.vimList = new List<VMIProduct>();
        return nList;
    }

    private void copyVMiProduct(LineItem nList, VMIProduct vp) {
        VMIProduct vn = new VMIProduct();
        vn.vmiProd = vp.vmiProd;
        vn.Quantity = vp.Quantity;
        vn.parLevel = vp.parLevel;
        vn.QtyLV = vp.QtyLV;
        nList.vimList.add(vn);
        nList.rowCount = nList.vimList.size() + 1;
    }
}