/**
 * Controller for Mass Edit Order lightning component.
 * @author Ahsan Butt
 */
public with sharing  class MassEditOrderController {

    @AuraEnabled
    public static List<Id> getOLIs(String orderId) {
        List<OrderItem> orderItems = [SELECT Id FROM OrderItem WHERE OrderId = :orderId];

        List<Id> ids = new List<Id>();

        for (OrderItem oi : orderItems) {
            ids.add(oi.Id);
        }

        return ids;
    }
}