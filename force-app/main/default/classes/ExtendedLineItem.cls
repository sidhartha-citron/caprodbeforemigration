/**
 * Wrapper class used by MyServicesExtended controller
 * 
 * @author Ahsan Butt
*/
public class ExtendedLineItem implements Comparable {
    @AuraEnabled
    public String ProductName;       
    @AuraEnabled
    public String Quantity; 
    @AuraEnabled
    public String ItemType;
    @AuraEnabled
    public String ServicePricePerUnit;  
    @AuraEnabled
    public String RelatedProduct;
    @AuraEnabled
    public String RelatedProductId;
    @AuraEnabled
    public String ProductId;
    @AuraEnabled
    public String OrderItemId;
    @AuraEnabled
    public String OrderId;
    @AuraEnabled
    public String OrderNumber;
    @AuraEnabled
    public String Frequency;
    @AuraEnabled
    public String ServiceAndPurchasePrice;
    @AuraEnabled
    public String PricebookEntryId;
    @AuraEnabled
    public Boolean displayFreq;
    @AuraEnabled
    public List<ExtendedPriceAggregate> priceAggregates;
    @AuraEnabled
    public List<ExtendedLastServiceAggregate> lastServiceAggregates;
    @AuraEnabled
    public List<ExtendedCannotCompleteAggregate> cannotCompleteAggregates;
    @AuraEnabled
    public List<ExtendedNextServiceAggregate> nextServiceAggregates;
    @AuraEnabled
    public Boolean isFixedWeekly;
    @AuraEnabled
    public List<ExtendedServiceFreqAggregate> ServiceFrequencyAggregates;
    @AuraEnabled
    public String ServiceFrequency;
    
    // Sorts by last service date descending
    public Integer compareTo(Object compareTo) {
        	
        ExtendedLineItem other = (ExtendedLineItem) compareTo;
        
        Boolean emptyAggregates = lastServiceAggregates == null || lastServiceAggregates.size() == 0;
        Boolean otherEmptyAggregates = other.lastServiceAggregates == null || other.lastServiceAggregates.size() == 0;
        
        if (emptyAggregates && otherEmptyAggregates) {
            return 0;
        } else if (emptyAggregates) {
            return 1;
        } else if (otherEmptyAggregates) {
            return -1;
        }
        
        // Sort last service aggregates themselves (should return date descending)
        lastServiceAggregates.sort();
        other.lastServiceAggregates.sort();
        
        if (lastServiceAggregates.get(0).theDate < other.lastServiceAggregates.get(0).theDate) {
        	return 1;
        } else if (lastServiceAggregates.get(0).theDate > other.lastServiceAggregates.get(0).theDate) {
            return -1;
        }
        
        return 0;      
	}


}