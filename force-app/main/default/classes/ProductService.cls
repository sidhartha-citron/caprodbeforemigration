/**
 * @description Service class to handle SOQL and DML for the Product SObject and related SObjects
 */
public with sharing class ProductService {

    private static Map<Id, Product2> product2Map;

    /**
     * @description wrapper class to house product details
     */
    public class ProductWrapper {
        @AuraEnabled public PricebookEntry priceBookEntry;
        @AuraEnabled public ProductItem productItem;
        @AuraEnabled public ContractService.ContractPricingSummary contractPriceSummary;
        @AuraEnabled public Map<String, OrderService.OrderProductFrequencyDetails> orderFrequencyMap;

        /**
		 * @description defined constructor
		 *
		 * @param priceBookEntry - pricebook entry referencing product
		 * @param productItem - product item used for quantity available
		 * @param contractPriceSummary - summary of product's contract price
		 * @param orderFrequencyMap - existing orders
		 */
        public ProductWrapper(PricebookEntry priceBookEntry,
                            ProductItem productItem,
                            ContractService.ContractPricingSummary contractPriceSummary,
                            Map<String, OrderService.OrderProductFrequencyDetails> orderFrequencyMap) {
            this.priceBookEntry = priceBookEntry;
            this.productItem = productItem;
            this.contractPriceSummary = contractPriceSummary;
            this.orderFrequencyMap = orderFrequencyMap;
        }
    }

    /**
     * @description get product filtered by price model
     *
     * @param model - target price model
     *
     * @return list of products under defined price model
     */
    public static List<Product2> getProduct2FilteredByModel(String model){
        return [SELECT Id,
                        Name,
                        CPQ_Duration_In_Minutes__c,
                        CPQ_Price_Model__c,
                        CPQ_Cost__c,
                        CPQ_Capital_Cost__c,
                        CPQ_Amortization__c
                FROM Product2
                WHERE CPQ_Price_Model__c =: model
        ];
    }

    /**
     * @description get map of products based on price model
     *
     * @param model - target price model
     *
     * @return map of products under target price model
     */
    public static Map<Id, Product2> getProduct2MapByIdsFilteredByModel(String model){
        if(product2Map == null){
            product2Map = new Map<Id, Product2>();
            product2Map.putAll(getProduct2FilteredByModel(model));
        }

        return product2Map;
    }

    /**
     * @description get product by names and filter
     *
     * @param value - string to fuzzy search
     * @param priceBook - price book to filter on
     * @param typeFilter - type to filter on
     * @param categoryFilter - category to filter on
     * @param lobFilter - line of business to filter on
     *
     * @return list of products that was sosl'd
     */
    public static List<Product2> soslProductByNameAndFilters(String value, String priceBook, String typeFilter, String categoryFilter, String lobFilter) {

        List<String> whereConditions = new List<String>();
        if(String.isNotEmpty(typeFilter) && typeFilter !='All'){
            whereConditions.add('Item_Type__c = \'' + typeFilter + '\'');
        }
        if(String.isNotEmpty(categoryFilter) && categoryFilter !='All'){
            whereConditions.add('Product_Category__c = \'' + categoryFilter + '\'');
        }
        if(String.isNotEmpty(lobFilter) && lobFilter !='All'){
            whereConditions.add('Family = \'' + lobFilter + '\'');
        }

        String whereClause = '';
        if(!whereConditions.isEmpty()){
            whereClause = ' WHERE ' + String.join( whereConditions, ' AND ' );
        }
        
        String searchQuery = 'FIND \'*' + string.escapeSingleQuotes(value) + '*\' IN ALL FIELDS RETURNING Product2(Id' + whereClause + ') WITH PricebookId = \'' + priceBook + '\'';
        System.debug('Sanchivan searchQuery: ' + searchQuery);
        List<List <SObject>> searchList = Search.query(searchQuery);
        return ((List<Product2>)searchList[0]);
    }

    /**
     * @description get pricebook entry map based on Ids
     *
     * @param targetIds - target price book entry Ids
     *
     * @return Map of Pricebook entry Id-->pricebook entry
     */
    public static Map<Id, PricebookEntry> getPriceBookEntryMapByIds(Set<Id> targetIds){
        Map<Id, PricebookEntry> returnMap = new Map<Id, PricebookEntry>(
        [
            SELECT Id,
                Product2Id,
                Product2.ProductCode,
                Product2.Family,
                UnitPrice,
                CPQ2_Installation_Unit_Price__c,
                CPQ2_Removal_Price__c,
                CPQ2_Replacement_Price__c,
                CPQ2_Total_Cost__c,
                CPQ2_Margin_Threshold__c,
                CPQ2_Margin_Threshold_2__c,
                Product2.Name,
                Product2.Item_Type__c,
                Product2.Product_Image_URL__c,
                Product2.Allowable_Frequencies__c,
                Product2.CPQ_Price_Model__c,
                Product2.CPQ2_Enable_Additional_Pest_Fields__c,
                Product2.Unit__c,
                Product2.Category_Description__c,
                Product2.VMI_Product__c,
                Product2.GL_Title__c
            FROM PricebookEntry
            WHERE Id IN:targetIds
        ]);

        return returnMap;
    }

    /**
     * @description get price book entry by product Ids and pricebook Id
     *
     * @param targetIds - target product ids
     * @param priceBook - target pricebook id
     *
     * @return Map pricebook entry Id-->pricebook entry
     */
    public static Map<Id, PricebookEntry> getPricebookEntryByIdsAndPriceBook(Set<Id> targetIds, String priceBook) {
        return new Map<Id, PricebookEntry>([
            SELECT Id,
                Product2Id,
                Product2.ProductCode,
                Product2.Family,
                UnitPrice,
                CPQ2_Installation_Unit_Price__c,
                CPQ2_Removal_Price__c,
                CPQ2_Replacement_Price__c,
                CPQ2_Total_Cost__c,
                CPQ2_Margin_Threshold__c,
                CPQ2_Margin_Threshold_2__c,
                Product2.Name,
                Product2.Item_Type__c,
                Product2.Product_Image_URL__c,
                Product2.Allowable_Frequencies__c,
                Product2.CPQ_Price_Model__c,
                Product2.CPQ2_Enable_Additional_Pest_Fields__c,
                Product2.Unit__c,
                Product2.Category_Description__c,
                Product2.VMI_Product__c,
                Product2.GL_Title__c
            FROM PricebookEntry
            WHERE Product2Id IN:targetIds AND
                Pricebook2Id = :priceBook
            ]);
    }

    /**
     * @description get map of products by Id
     *
     * @param targetIds - target products to query
     *
     * @return map of products
     */
    public static Map<Id, Product2> getProduct2MapByIds(Set<Id> targetIds) {
        return new Map<Id, Product2>([
            SELECT Id,
                    Name,
                    Item_Type__c,
                    Never_Generate_Work_Order__c,
                    Is_Inventory_Item__c,
                    Product_Image_URL__c,
                    Allowable_Frequencies__c,
                    CPQ_Price_Model__c,
                    CPQ2_Enable_Additional_Pest_Fields__c,
                    Unit__c,
                    Category_Description__c,
                    VMI_Product__c,
                    GL_Title__c
            FROM Product2
            WHERE Id IN:targetIds
        ]);
    }


    /**
     * @description get product quantity by product Ids and location Id
     *
     * @param targetIds - target products
     * @param locationId - target location
     *
     * @return list of product items containing quantity available
     */
    // public static List<ProductItem> getProductQuantitiesByProductIdsAndLocationId(Set<Id> targetIds, Id locationId){
    //     return [SELECT Id, 
    //                     Product2Id,
    //                     Quantity_Available__c
    //                 FROM ProductItem
    //                 WHERE Product2Id IN: targetIds AND
    //                     LocationId =: locationId];
    // }

    /**
     * @description get combined product information (product, pricebook entry, core list pricing and existing services)
     *
     * @param productIds - target products
     * @param priceBook - target price book
     * @param accountId - target account
     *
     * @return list of combined product detail housed in wrappers based on target given.
     */
    public static List<ProductWrapper> getProductInformationByIds(Set<Id> productIds, String priceBook, String accountId,  String recordId){
        return getProductInformationByIds(productIds, priceBook, accountId, recordId, true);
    }

    /**
     * @description  get combined product information (product, pricebook entry, core list pricing and existing services)
     *
     * @param productIds - target products
     * @param priceBook  - target price book
     * @param accountId - target 
     * @param recordId - the record Id of either the Opportunity or Order record which this call was made from
     * @param getEnrichedProductInfo - determines if contract pricing and existing orders is required
     *
     * @return list of combined product detail housed in wrappers based on target given.
     */
    public static List<ProductWrapper> getProductInformationByIds(Set<Id> productIds, String priceBook, String accountId, String recordId, Boolean getEnrichedProductInfo){
        List<PricebookEntry> listPbe = ProductService.getPricebookEntryByIdsAndPriceBook(productIds, priceBook).values();
        Map<Id, PricebookEntry> mapProdToPbe = new Map<Id, PricebookEntry>();
        for(PricebookEntry pbe: listPbe){
            mapProdToPbe.put(pbe.Product2Id, pbe);
        }

        String type = Id.valueOf(recordId).getSObjectType().getDescribe().getName();

        //List<ProductItem> listPi;

        // if(type == CPQ2_Util.SOBJECT_NAME_OPP){
        //     Account account = AccountService.getAccountById(accountId);
        //     listPi = ProductService.getProductQuantitiesByProductIdsAndLocationId(productIds, account.Default_Warehouse_Location__c);            
        // }
        // else if(type == CPQ2_Util.SOBJECT_NAME_ORDER) {
        //     Order order = OrderService.getOrderById(recordId);
        //     listPi = ProductService.getProductQuantitiesByProductIdsAndLocationId(productIds, order.Warehouse_Location__c);
        // }

        //Map<Id, ProductItem> mapProdToPi = new Map<Id, ProductItem>();
        //for(ProductItem pi: listPi){
        //    mapProdToPi.put(pi.Product2Id, pi);
        //}

        Map<Id, ContractService.ContractPricingSummary> mapProdToContractPricing;
        Map<Id, Map<String, OrderService.OrderProductFrequencyDetails>> mapKeyToOrderLineItem;

        if(getEnrichedProductInfo){
            mapProdToContractPricing = ContractService.getContractPricing(accountId);
            mapKeyToOrderLineItem = OrderService.getExistingServicesMapByAccountIdAndProducts(accountId, productIds);
        }

        List<ProductWrapper> listPbeReturn = new List<ProductWrapper>();

        for(Id prodId: productIds){
            if(mapProdToPbe.containsKey(prodId)){
                PricebookEntry pbe = mapProdToPbe.get(prodId);
                ProductItem pi;
                ContractService.ContractPricingSummary cps;
                Map<String, OrderService.OrderProductFrequencyDetails> orderFrequencyMap;

                //if(mapProdToPi.containsKey(prodId)){
                //    pi = mapProdToPi.get(prodId);
                //}

                if(getEnrichedProductInfo) {
                    if (mapProdToContractPricing.containsKey(prodId)) {
                        cps = mapProdToContractPricing.get(prodId);
                    }

                    if (mapKeyToOrderLineItem.containsKey(prodId)) {
                        orderFrequencyMap = mapKeyToOrderLineItem.get(prodId);
                    }
                }

                listPbeReturn.add(new ProductWrapper(pbe,pi,cps,orderFrequencyMap));
            }
        }

        return listPbeReturn;        
    }

}