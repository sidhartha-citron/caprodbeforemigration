/**
 * Wrapper class used by MyServicesExtended controller
 * 
 * @author Ahsan Butt
*/
public class ExtendedItemMap {
    @AuraEnabled
    public String serviceType;
    @AuraEnabled
    public Map<String,List<ExtendedLineItem>> mapAggregateItems;
    @AuraEnabled
    public Contact mainSiteContact;
    @AuraEnabled
    public Map<String, Decimal> totalPriceMap;
}