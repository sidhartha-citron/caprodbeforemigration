/**
 * Filters out Order Items with blank Last_InFlight_WO_Date__c.
 * 
 * @author Ahsan Butt
 */
public class LastInflightWODateOrderItemFilter implements IOrderItemFilter {
	
    public List<String> getFields() {
        return new List<String>{'Last_InFlight_WO_Date__c'};
    }
    
    public Boolean filter(OrderItem oi) {
        return oi.Last_InFlight_WO_Date__c != null;
    }
}