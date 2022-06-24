/**
 * Filters out Order Items with un-wanted frequencies.
 * 
 * @author Ahsan Butt
 */
public class FrequencyOrderItemFilter implements IOrderItemFilter {
    private static String FREQUENCY_FIXED_WEEKLY = '';
    private static String FREQUENCY_ONE_TIME = '';
    
    static {
        Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
        FREQUENCY_FIXED_WEEKLY = custSetting.Fixed_Weekly_Service_Frequency_Value__c;
        FREQUENCY_ONE_TIME = custSetting.Non_Recurring_Frequency_Value__c;
    }
    
    public List<String> getFields() {
        return new List<String>{'Frequency__c'};
    }
    
    public Boolean filter(OrderItem oi) {
        //return oi.Frequency__c != FREQUENCY_FIXED_WEEKLY && oi.Frequency__c != FREQUENCY_ONE_TIME;
        return oi.Frequency__c != FREQUENCY_FIXED_WEEKLY;
    }
}