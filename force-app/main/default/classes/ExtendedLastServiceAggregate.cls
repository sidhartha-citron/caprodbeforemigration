public class ExtendedLastServiceAggregate implements Comparable {
	@AuraEnabled
    public Date theDate;
    @AuraEnabled
    public Integer num;
    @AuraEnabled
    public Id workOrderId;
    
    // Sort date descending
    public Integer compareTo(Object compareTo) {
        	
        ExtendedLastServiceAggregate other = (ExtendedLastServiceAggregate) compareTo;
        
        // The return value of 0 indicates that both elements are equal.
        Integer returnValue = 0;
        
        if (theDate < other.theDate) {
            returnValue = 1;
        } else if (theDate > other.theDate) {
            returnValue = -1;
        }
        
        return returnValue;      
	}
}