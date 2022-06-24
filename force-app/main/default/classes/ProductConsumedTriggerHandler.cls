/**
 * @FileName: ProductConsumedTriggerHandler
 * @Description: Handler for Product Consumed trigger
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Unknown           Unknown         Created
 * Graeme Ward       2/19/2020       Refactored to meet Citron development standards
 *                                   No logic changes
 *-----------------------------------------------------------
 */
public class ProductConsumedTriggerHandler extends TriggerHandler {
    private List<ProductConsumed> productConsumedList;
    private List<ProductConsumed> oldList;
    private Map<Id, ProductConsumed> productConsumedMap;
    private Map<Id, ProductConsumed> oldMap;

    public ProductConsumedTriggerHandler(){
        this.setMaxLoopCount(6);

        this.productConsumedList = (List<ProductConsumed>) Trigger.new;
        this.oldList = (List<ProductConsumed>) Trigger.old;
        this.productConsumedMap = (Map<Id, ProductConsumed>) Trigger.newMap;
        this.oldMap = (Map<Id, ProductConsumed>) Trigger.oldMap;
    }

    protected override void beforeInsert() {
        System.debug('ProductConsumedTriggerHandler|beforeInsert|setProductConsumedFields|BEGIN');
        setProductConsumedFields();
        setUnitPrice();
        System.debug('ProductConsumedTriggerHandler|beforeInsert|setProductConsumedFields|END');
    }

    protected override void beforeUpdate() {
        System.debug('ProductConsumedTriggerHandler|beforeUpdate|setProductConsumedFields|BEGIN');
        setProductConsumedFields();
        System.debug('ProductConsumedTriggerHandler|beforeUpdate|setProductConsumedFields|END');
    }

    /*
     * @Name        setBillable
     * @Description Check ProductConsumed item type for error and set billable field value
     * @Author      Graeme Ward
     * @Params      N/A
     * @Return      void
     */
    private void setProductConsumedFields() {
        Set<Id> pricebookIds = ApexUtils.getIdsFromField((List<SObject>) productConsumedList, 'PricebookEntryId');
        Set<Id> workOrderLineItemIds = ApexUtils.getIdsFromField((List<SObject>) productConsumedList, 'WorkOrderLineItemId');

        Map<Id, PricebookEntry> pricebookEntryMap = new Map<Id, PricebookEntry>([
                SELECT Id, Product2.Always_Billable__c, Product2.Family, Product2.Item_Type__c
                FROM PricebookEntry
                WHERE Id IN :pricebookIds
        ]);

        Map<Id, WorkOrderLineItem> workOrderLineItemMap = new Map<Id, WorkOrderLineItem>([
                SELECT AssetId, Asset.Asset_Ownership__c
                FROM WorkOrderLineItem
                WHERE Id IN :workOrderLineItemIds
        ]);

        for(ProductConsumed productConsumed : productConsumedList) {
            PricebookEntry pEntry = pricebookEntryMap.get(productConsumed.PricebookEntryId);

            if(pEntry!=null && pEntry.Product2.Always_Billable__c) {
                productConsumed.Billable__c = pEntry.Product2.Always_Billable__c; 
            }
            
            if(pEntry == null) continue;

            if(pEntry.Product2.Item_Type__c == QueryUtils.fieldServiceSettings.Item_Type_of_Services__c) {
                productConsumed.addError(Label.Product_Consumed_Service_Error);
            }
            //2021-02-22 Darcy: Ice Cube logic removed 
            /*
            else {
                if(pEntry.Product2.Family == QueryUtils.fieldServiceSettings.Hygiene_LOB__c) {
                    productConsumed.Billable__c = pEntry.Product2.Always_Billable__c;
                }
                else if(pEntry.Product2.Family == QueryUtils.fieldServiceSettings.Chemical_LOB__c) {
                    WorkOrderLineItem woli = workOrderLineItemMap.get(productConsumed.WorkOrderLineItemId);

                    if(woli != null && String.isNotBlank(woli.AssetId)) {
                        if(woli.Asset.Asset_Ownership__c == 'Citron' || String.isBlank(woli.Asset.Asset_Ownership__c)) {
                            productConsumed.Billable__c = false;
                        }
                        else if(woli.Asset.Asset_Ownership__c == 'Customer') {
                            productConsumed.Billable__c = true;
                        }
                    }
                    else {
                        productConsumed.Billable__c = false;
                    }
                }
            }
            */
        }
    }

    /*
     * @Name        setUnitPrice
     * @Description set the unit price for product consumed records
     * @Author      Graeme Ward
     * @Params      N/A
     * @Return      void
     */
    private void setUnitPrice() {
        ProductConsumedData pcData = new ProductConsumedData(productConsumedList);

        Map<String,Decimal> unitPriceMap = getUnitPrice(pcData.productCodes, pcData.accountIds, pcData.pricebookIds);

        setUnitPrice(unitPriceMap, pcData.uidsByProductConsumedId, pcData.pricebookEntries);
    }

    /*
     * @Name        setUnitPrice
     * @Description write the unit price to product consumed records
     * @Author      Graeme Ward
     * @Params      unitPriceMap: unit price by unique identifer (account or pricebook id + ':' + product code)
     *              uidsByProductConsumeId: ordered list of unique identifiers for which to retrieve unit price
     *              productConsumedRelatedData: product consumed records with related data
     * @Return      void
     */
    private void setUnitPrice(Map<String,Decimal> unitPriceMap, Map<Id, List<String>> uidsByProductConsumedId, Map<Id, PricebookEntry> pricebookEntries) {
        // assign the unit price to product consumed records
        for (ProductConsumed pc : productConsumedList) {
            PricebookEntry pbe = pricebookEntries.get(pc.PricebookEntryId);

            if (pbe == null) continue;

            List<String> uids = uidsByProductConsumedId.get(pc.Id);

            Decimal price;

            for (String uid : uids) {
                price = unitPriceMap.get(uid);
                if (price != null) break;
            }

            if (price == null) continue;

            pc.UnitPrice = price;

            // unit of measure conversion
            if (pbe.Product2.Unit_of_Measure_Consumed__c != pbe.Product2.Unit__c
                    && pbe.Product2.Unit_of_Measure_Conversion__c != null)
            {
                pc.UnitPrice = pc.UnitPrice / pbe.Product2.Unit_of_Measure_Conversion__c;
            }
        }
    }

    /*
     * @Name        getUnitPrice
     * @Description get unit price for specified products by accounts and pricebooks
     * @Author      Graeme Ward
     * @Params      productCodes: products to get unit price for
     *              accountIds: accounts for which to check unit price for specified products
     *              pricebookIds: pricebooks for which to check unit price for specified products
     * @Return      Map<String,Decimal>: unit price by unique identifier (account or pricebook id + ':' + product code)
     */
    private Map<String,Decimal> getUnitPrice(Set<String> productCodes, Set<Id> accountIds, Set<Id> pricebookIds) {
        // UID is the account or pricebook id + ':' + product code
        Map<String,Decimal> unitPriceByUID = new Map<String,Decimal>();

        // query contract price records by account ids and product codes
        List<CPQ2_ContractPrice__c> contractPrices = [
                SELECT Id, CPQ2_Price__c, CPQ2_Product__r.ProductCode, CPQ2_Contract__r.AccountId
                FROM CPQ2_ContractPrice__c
                WHERE CPQ2_Contract__r.AccountId IN :accountIds
                AND CPQ2_Product__r.ProductCode IN :productCodes
                AND CPQ2_Active__c = TRUE
                AND CPQ2_Contract__r.Status = 'Activated'
        ];

        // map contract prices by unique identifiers
        for (CPQ2_ContractPrice__c cp : contractPrices) {
            unitPriceByUID.put(cp.CPQ2_Contract__r.AccountId + ':' + cp.CPQ2_Product__r.ProductCode, cp.CPQ2_Price__c);
        }

        // query pricebook entries by work order pricebooks and default pricebook
        List<PricebookEntry> pricebookEntries = [
                SELECT Id, UnitPrice, ProductCode, Pricebook2Id
                FROM PricebookEntry
                WHERE Pricebook2Id IN :pricebookIds
                AND ProductCode IN :productCodes
                AND IsActive = TRUE
        ];

        // map pricebook prices by unique identifiers
        for (PricebookEntry pbe : pricebookEntries) {
            unitPriceByUID.put(pbe.Pricebook2Id + ':' + pbe.ProductCode, pbe.UnitPrice);
        }

        return unitPriceByUID;
    }

    public class ProductConsumedData {
        public List<ProductConsumed> productConsumedList;
        public Map<Id,WorkOrder> workOrders;
        public Map<Id,PricebookEntry> priceBookEntries;
        public Set<String> productCodes;
        public Set<Id> accountIds;
        public Set<Id> pricebookIds;
        public Map<Id,List<String>> uidsByProductConsumedId;

        public ProductConsumedData(List<ProductConsumed> productConsumedList) {
            this.productConsumedList = productConsumedList;

            getRelatedData();
            getUIDs();
        }

        private void getRelatedData() {
            Set<Id> workOrderIds = new Set<Id>();
            Set<Id> pricebookEntryIds = new Set<Id>();

            for (ProductConsumed pc : this.productConsumedList) {
                if (String.isNotBlank(pc.WorkOrderId)) {
                    workOrderIds.add(pc.WorkOrderId);
                }

                if (String.isNotBlank(pc.PricebookEntryId)) {
                    pricebookEntryIds.add(pc.PricebookEntryId);
                }
            }

            this.workOrders = new Map<Id,WorkOrder>([
                    SELECT Id, AccountId, Account.ParentId, Pricebook2Id
                    FROM WorkOrder
                    WHERE Id IN :workOrderIds
            ]);

            this.priceBookEntries = new Map<Id,PricebookEntry>([
                    SELECT Id, ProductCode, Product2.Unit_of_Measure_Consumed__c, Product2.Unit__c,
                            Product2.Unit_of_Measure_Conversion__c
                    FROM PricebookEntry
                    WHERE Id IN :pricebookEntryIds
            ]);
        }

        private void getUIDs() {
            this.productCodes = new Set<String>();
            this.accountIds = new Set<Id>();
            this.pricebookIds = new Set<Id>();
            this.uidsByProductConsumedId = new Map<Id,List<String>>();

            for(ProductConsumed pc : this.productConsumedList) {
                PricebookEntry pbe = this.pricebookEntries.get(pc.PricebookEntryId);

                if (pbe == null) continue;

                List<String> uids = new List<String>();
                WorkOrder wo = this.workOrders.get(pc.WorkOrderId);

                this.productCodes.add(pbe.ProductCode);

                if (wo != null) {
                    if (String.isNotBlank(wo.AccountId)) {
                        this.accountIds.add(wo.AccountId);
                        uids.add(wo.AccountId + ':' + pbe.ProductCode);

                        if (String.isNotBlank(wo.Account.ParentId)) {
                            accountIds.add(wo.Account.ParentId);
                            uids.add(wo.Account.ParentId + ':' + pbe.ProductCode);
                        }
                    }

                    if (String.isNotBlank(wo.Pricebook2Id)) {
                        this.pricebookIds.add(wo.Pricebook2Id);
                        uids.add(wo.Pricebook2Id + ':' + pbe.ProductCode);
                    }
                }

                uids.add(QueryUtils.fieldServiceSettings.Default_Order_Price_Book_ID__c + ':' + pbe.ProductCode);

                this.uidsByProductConsumedId.put(pc.Id, uids);
            }
        }
    }
}