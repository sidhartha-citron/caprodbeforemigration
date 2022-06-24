/**
 * @description controller class for the search product LWC component
 */
public with sharing class CPQ2_SearchProductController {

    /**
     * @description method to perform backend search of products
     *
     * @param value - fuzzy search string for the SOSL query
     * @param priceBook - price book to search from
     * @param typeFilter - product type
     * @param categoryFilter - category
     * @param lobFilter -line of business
     * @param accountId - target account to search against (used for determining quantity available)
     * @param recordId - the record Id of either the Opportunity or Order record which this call was made from
     *
     * @return list of product results (in wrappers)
     */
    @AuraEnabled(cacheable=false)
    public static List<ProductService.ProductWrapper> getResults(String value, 
                                                    String priceBook, 
                                                    String typeFilter, 
                                                    String categoryFilter, 
                                                    String lobFilter, 
                                                    String accountId,
                                                    String recordId) {

        List<Product2> prodList = ProductService.soslProductByNameAndFilters(value, priceBook, typeFilter, categoryFilter, lobFilter);
        System.debug('Sanchivan prodList: ' + prodList);
        Set<Id> prodIdSet = (new Map<Id,SObject>(prodList)).keySet().clone();
        return ProductService.getProductInformationByIds(prodIdSet, priceBook,accountId, recordId);
    }
}