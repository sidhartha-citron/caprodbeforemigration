/**
 * Wrapper class used by MyServicesExtended controller
 * 
 * @author Ahsan Butt
*/
public class ExtendedCannotCompleteAggregate {
	@AuraEnabled
    public Integer cannotComplete;
    @AuraEnabled
    public Integer total;
    @AuraEnabled
    public Id workOrderId;
}