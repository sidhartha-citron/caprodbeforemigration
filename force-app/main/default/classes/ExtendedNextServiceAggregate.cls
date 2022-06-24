/**
 * Wrapper class used by MyServicesExtended controller
 * 
 * @author Ahsan Butt
*/
public class ExtendedNextServiceAggregate {
	@AuraEnabled
    public Date startDate;
    @AuraEnabled
    public Date endDate;
    @AuraEnabled
    public Integer num;
    @AuraEnabled
    public Id workOrderId;
}