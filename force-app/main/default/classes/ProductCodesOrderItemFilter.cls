/**
 * Filters out Order Items with un-wanted product codes.
 * 
 * @author Ahsan Butt
 */
public class ProductCodesOrderItemFilter implements IOrderItemFilter {
    
    public List<String> getFields() {
        return new List<String>{'Product2.ExternalID__c'};
    }
    
    public Boolean filter(OrderItem oi) {
        if (OrderMerger.ORDER_ITEM_FILTER_PRODUCT_CODES == null || OrderMerger.ORDER_ITEM_FILTER_PRODUCT_CODES.size() == 0) return true;
        
        for (String productCode : OrderMerger.ORDER_ITEM_FILTER_PRODUCT_CODES) {
        	if (productCode.startsWithIgnoreCase(oi.Product2.ExternalID__c))  return false;   
        }
        
        return true;
    }
}