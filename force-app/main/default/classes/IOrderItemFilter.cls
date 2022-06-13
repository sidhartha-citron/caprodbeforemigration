/**
 * Defines interface for classes that implement filtering logic for Order Items.
 * 
 * @author Ahsan Butt
 */
public interface IOrderItemFilter {
	List<String> getFields();
    Boolean filter(OrderItem oi);
}