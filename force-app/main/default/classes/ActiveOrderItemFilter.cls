/**
 * Filters out Inactive Order Items.
 * 
 * @author Ahsan Butt
 */
public class ActiveOrderItemFilter implements IOrderItemFilter {
	
    public List<String> getFields() {
        return new List<String>{'IsActive__c'};
    }
    
    public Boolean filter(OrderItem oi) {
        return oi.IsActive__c;
    }
}