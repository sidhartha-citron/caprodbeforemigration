/**
 * @FileName: WorkOrderSetFieldsWrapper
 * @Description: Wrapper class to contain Work Order related data for set fields trigger method
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/6/2020         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class WorkOrderSetFieldsWrapper {
    public Map<Id, Survey_Location__c> workOrderLocationMap;
    public Map<Id, WorkOrder> workOrderMap;
    public Map<Id, Order> orderMap;
    public Map<Id, Account> accountMap;
    public Map<Id,WorkOrder> wrkOrdDispMap;
    public Map<Id,WorkOrder> mpWrkOrdDelivery;
    public Map<String,String> mpProdIdToName;
    public Map<Id,Map<String,Integer>> mpDelvSmry;
    public Map<Id,Map<String,Integer>> mpNoDelvSmry;
    public Map<Id,String> stockSmryMap;

    public WorkOrderSetFieldsWrapper(
            List<WorkOrder> lstNewWorkOrders,
            Map<Id,WorkOrder> mapOldWorkOrders)
    {
        this.workOrderLocationMap = new Map<Id, Survey_Location__c>();
        this.workOrderMap = new Map<Id, WorkOrder>();
        this.orderMap = new Map<Id, Order>();
        this.accountMap = new Map<Id, Account>();
        this.wrkOrdDispMap = new Map<Id, WorkOrder>();
        this.mpWrkOrdDelivery = new Map<Id, WorkOrder>();
        this.mpProdIdToName = new Map<String,String>();
        this.mpDelvSmry = new Map<Id,Map<String,Integer>>();
        this.mpNoDelvSmry = new Map<Id,Map<String,Integer>>();
        this.stockSmryMap = new Map<Id, String>();

        getWorkOrderRelatedData(lstNewWorkOrders, mapOldWorkOrders);
    }

    private void getWorkOrderRelatedData(
            List<WorkOrder> lstNewWorkOrders,
            Map<Id,WorkOrder> mapOldWorkOrders)
    {
        for (WorkOrder wo : lstNewWorkOrders) {
            WorkOrder oldWorkOrder = mapOldWorkOrders == null ? new WorkOrder() : mapOldWorkOrders.get(wo.Id);

            //Stamp completion time
            if ((wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c
                    || wo.Status == QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c)
                    && oldWorkOrder.Status != QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c)
            {
                wo.Completed_Date__c = System.today();
                List<String> dayEndTime = QueryUtils.fieldServiceSettings.Working_Hour_End_Time__c.split('\\:');

                if (!dayEndTime.isEmpty()) {
                    Integer dayEndMinute = dayEndTime.size() < 2 ? 00 : Integer.valueOf(dayEndTime.get(1));
                    Time dayEndTimeValue = Time.newInstance(Integer.valueOf(dayEndTime.get(0)), dayEndMinute, 00, 00);

                    if (dayEndTimeValue != null) {
                        Time currentTime = Datetime.now().time();
                        wo.Completed_Date__c = currentTime < dayEndTimeValue ? System.today().addDays(-1) : wo.Completed_Date__c;
                    }
                }
            }

            //Begin:Shashi:8-6-2019:Stock summary:Stores a list of work orders in dispatched status
            if (mapOldWorkOrders != null
                    && wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Dispatched_Status__c
                    && wo.Type__c != QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c)
            {
                wrkOrdDispMap.put(wo.Id,wo);
            }
            //End

            //Begin:Shashi:8-26-2019:Generate Delivery service report
            if (mapOldWorkOrders != null
                    && wo.Type__c == QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c
                    && (wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Dispatched_Status__c
                        || wo.Status == QueryUtils.fieldServiceSettings.Service_Appointment_Arrived_Status__c
                        || wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c))
            {
                mpWrkOrdDelivery.put(wo.Id,wo);
            }
            //End

            //Identify if order query is required
            if (wo.Address == null && String.isNotBlank(wo.Order__c)) {
                orderMap.put(wo.Order__c, null);
            }

            //Identify if account query is required
            if (String.isNotBlank(wo.AccountId)
                    && (wo.Address == null
                        || String.isBlank(wo.Site_Survey__c)
                        || String.isNotBlank(wo.Line_of_Business__c)))
            {
                accountMap.put(wo.AccountId, null);
            }

            if (mapOldWorkOrders != null && wo.New_Location__c && wo.New_Location__c != oldWorkOrder.New_Location__c) {
                Boolean hasError = false;

                if (String.isBlank(wo.Location_Name__c)) {
                    hasError = true;
                    wo.Location_Name__c.addError(Label.Error_Value_Required);
                }

                if (String.isBlank(wo.Building__c)) {
                    hasError = true;
                    wo.Building__c.addError(Label.Error_Value_Required);
                }

                if (!hasError) {
                    Survey_Location__c newLocation = new Survey_Location__c(
                            Site_Survey__c = wo.Site_Survey__c,
                            Name = wo.Location_Name__c,
                            Location_Type__c = wo.Location_Type__c,
                            Building__c = wo.Building__c,
                            Floor__c = wo.Floor__c,
                            Location_SubType__c = wo.Location_SubType__c,
                            Notes__c=wo.Location_Notes__c
                    );

                    workOrderLocationMap.put(wo.Id, newLocation);
                    workOrderMap.put(wo.Id, wo);
                    wo.New_Location__c = false;
                    wo.Location_Name__c = '';
                    wo.Building__c = '';
                    wo.Floor__c = '';
                }
            }
        }

        insert workOrderLocationMap.values();

        getRelatedOrders();
        getRelatedAccounts();
    }

    private void getRelatedOrders() {
        orderMap = new Map<Id,Order>([
                SELECT Id, Shipping_Suite_Number__c, ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode,
                        ShippingCountry
                FROM Order
                WHERE Id IN :orderMap.keySet()
        ]);
    }

    private void getRelatedAccounts() {
        accountMap = new Map<Id,Account>([
                SELECT Id, Shipping_Suite_Number__c, ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode,
                        ShippingCountry, Site_Survey__c, Site_Survey__r.Notes__c, Account.OperatingHoursId,
                        Account.Hygiene_OperatingHoursId__c, Account.Life_Safety_OperatingHoursId__c,
                        Account.Chemical_OperatingHoursId__c, Account.Pest_Control_OperatingHoursId__c,
                        Account.Detailing_Reporting__c
                FROM Account WHERE Id IN :accountMap.keySet()
        ]);
    }

    //Shashi:8-26-2019:Generate Delivery service report
    public void generateDeliveryServiceReports() {
        if (mpWrkOrdDelivery.size() > 0) {
            List<AggregateResult> grpResD = [
                    SELECT WorkOrderId, Product2.ProductCode PCode, Product2.Name PName, Product2.French_Product_Name__c PFName, WorkOrder.ServiceReportLanguage SRLang,
                    Status, SUM(Quantity) Qty
                    FROM WorkOrderLineItem
                    WHERE WorkOrderId IN :mpWrkOrdDelivery.keySet()
                    GROUP BY WorkOrderId, Product2.ProductCode, Product2.Name, Product2.French_Product_Name__c, WorkOrder.ServiceReportLanguage, Status
                    ORDER BY WorkOrderId
            ];

            for (AggregateResult ar : grpResD) {
                String wId = String.valueOf(ar.get('WorkOrderId'));
                String PCode = String.valueOf(ar.get('PCode'));
                String sStatus = String.valueOf(ar.get('Status'));
                Integer Qty = Integer.valueOf(ar.get('Qty'));

                if (!mpProdIdToName.containsKey(PCode)) {
                    if (ar.get('SRLang') == 'fr') {
                        mpProdIdToName.put(PCode, String.valueOf(ar.get('PFName')));
                    }
                    else {
                        mpProdIdToName.put(PCode, String.valueOf(ar.get('PName')));
                    }
                }

                Map<String, Integer> mProdIdToQty = new Map<String, Integer>();
                Map<Id, Map<String, Integer>> mmProdSummary = new Map<Id, Map<String, Integer>>();
                Integer q = Qty;

                if (sStatus == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c) {
                    mmProdSummary = mpNoDelvSmry;
                } else {
                    mmProdSummary = mpDelvSmry;
                }

                if (mmProdSummary.containsKey(wId)) {
                    mProdIdToQty = mmProdSummary.get(wId);

                    if (mProdIdToQty.containsKey(PCode)) {
                        q = mProdIdToQty.get(PCode);
                        q = q + Qty;
                    }

                    mProdIdToQty.put(PCode, q);
                }

                else {
                    mProdIdToQty.put(PCode, q);
                    mmProdSummary.put(wId, mProdIdToQty);
                }
            }
        }
    }

    //Shashi:8-6-2019:Stock Summary:Collect summarized results
    public void collectSummarizedResults() {
        if (wrkOrdDispMap.size() > 0) {
            List<AggregateResult> grpRes = [
                    SELECT WorkOrderId,Product2Id, Product2.Name PName, Product2.French_Product_Name__c PFName, Related_Product__c, Related_Product__r.Name RName, WorkOrder.ServiceReportLanguage SRLang, 
                            SUM(Quantity) Qty
                    FROM WorkOrderLineItem
                    WHERE WorkOrderId IN :wrkOrdDispMap.keySet()
                    GROUP BY WorkOrderId, Product2Id, Product2.Name, Product2.French_Product_Name__c, Related_Product__c, Related_Product__r.Name, WorkOrder.ServiceReportLanguage 
                    ORDER BY WorkOrderId
            ];

            for (AggregateResult ar : grpRes) {
                String dString = '', wId = '';
                if (ar.get('SRLang') == 'fr') {
                    dString += String.valueOf(ar.get('PFName'));
                } 
                else {
                    dString += String.valueOf(ar.get('PName'));
                } 

                if (ar.get('RName') != null) {
                    dString += ' => ' + String.valueOf(ar.get('RName'));
                }

                Integer qty = Integer.valueOf(ar.get('Qty'));
                dString = qty + ' x ' + dString + '\n\n';
                wId = String.valueOf(ar.get('WorkOrderId'));

                if (stockSmryMap.containsKey(wId)) {
                    String apnd = stockSmryMap.get(wId);
                    apnd += dString;
                    stockSmryMap.put(wId, apnd);
                } else {
                    stockSmryMap.put(wId, dString);
                }
            }
        }
    }
}