public class StandingOrder{
   
    public static void setActive() {
       
        for (Standing_Order__c[] standingOrders:[SELECT Active__c from Standing_Order__c WHERE Upsert_Date__c > LAST_WEEK AND Active__c = FALSE LIMIT 10000])
        {
            for (Standing_Order__c s:standingOrders){
               s.Active__c = TRUE;
            }
            Update(standingOrders);
        }
        
    }
    
    public static void setInActive() {
       
        for (Standing_Order__c[] standingOrders:[SELECT Active__c from Standing_Order__c WHERE (Upsert_Date__c <= LAST_WEEK or Upsert_Date__c = null) AND Active__c = TRUE LIMIT 10000])
        {
            for (Standing_Order__c s:standingOrders){
               s.Active__c = FALSE;
            }
            Update(standingOrders);
        }
        
    }

}