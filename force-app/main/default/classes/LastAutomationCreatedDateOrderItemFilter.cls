/**
 * Filters out Order Items with blank LastAutomationCreatedDate.
 * 
 * @author Ahsan Butt
 */
public class LastAutomationCreatedDateOrderItemFilter implements IOrderItemFilter {
	
    public List<String> getFields() {
        return new List<String>{'Last_Automation_Created_Date__c'};
    }
    
    public Boolean filter(OrderItem oi) {
        return oi.Last_Automation_Created_Date__c != null;
    }
}