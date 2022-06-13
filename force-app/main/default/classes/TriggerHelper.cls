//leverage this class in triggers to help control the flow
public class TriggerHelper {
	public static Boolean hasRun = false;
    public static Boolean isCompletionTrigger = false;
    public static Boolean isWorkOrderLocationFutureCalled = false;
    public static Boolean hasBeenSynced = false;
    public static Boolean hasOrderItemPricingBeenSet = false;//used in OrderItemUtilityClass
    public static Boolean isServiceAppointmentBeingCancelled = false;
    public static Boolean checkIfInsert = false;
}