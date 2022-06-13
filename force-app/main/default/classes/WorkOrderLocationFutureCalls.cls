public class WorkOrderLocationFutureCalls {
	@future
    public static void updateServiceOrder(Map<Id, Decimal> serviceOrders) {
        if (!serviceOrders.isEmpty()) {
            List<Survey_Location__c> locsToUpdate = new List<Survey_Location__c>();
            for (Id loc : serviceOrders.keySet()) {
                locsToUpdate.add(new Survey_Location__c(Id=loc, Service_Order__c=serviceOrders.get(loc)));
            }
            
            if (!locsToUpdate.isEmpty()) {
            	update locsToUpdate;
            }
        }
    }
}