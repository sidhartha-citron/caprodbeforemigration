public class StandingOrderLineItem{
   
    public static void setActive() {
       
        for (Standing_Order_Line_Item__c[] solis:[SELECT Active__c from Standing_Order_Line_Item__c WHERE Upsert_Date__c > LAST_WEEK AND Active__c = FALSE LIMIT 10000])
        {
            for (Standing_Order_Line_Item__c s:solis){
               s.Active__c = TRUE;
            }
            Update(solis);
        }
        
    }
    
    public static void setInActive() {
       
        for (Standing_Order_Line_Item__c[] solis:[SELECT Active__c from Standing_Order_Line_Item__c WHERE (Upsert_Date__c <= LAST_WEEK or Upsert_Date__c = null) AND Active__c = TRUE LIMIT 10000])
        {
            for (Standing_Order_Line_Item__c s:solis){
               s.Active__c = FALSE;
            }
            Update(solis);
        }
        
    }

}