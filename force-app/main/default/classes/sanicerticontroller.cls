/*
 * Version		Date			Developer		Comments	
 * 1.0			15/09/2021		Sidhartha		Code Created
 * 
*/
public class sanicerticontroller {
    public Integer day{get;set;}
    public Integer month{get;set;}
    public String address{get;set;}
    public Integer year{get;set;}
    public String accName{get;set;}
    //public List<WorkOrderLineItem> lstwoOLI{get;set;}
    public WorkOrderLineItem woOLI{get;set;}
    //public List<String> datewrap{get;set;}
    public Id record_Id;
    public static Boolean isSaniplus{get;set;}
    public static Boolean isSaniguard{get;set;}
    public static Boolean isSanidefense{get;set;}
    public static String lang{get;set;}
    
    public Id getrecord_Id() {
        return this.record_Id;
    }
    public void setrecord_Id(String argId){

    }
    public sanicerticontroller() {

        system.debug(ApexPages.currentPage().getParameters().get('Id'));
        woOLI = [SELECT Id, WorkOrder.ServiceReportLanguage, WorkOrder.Contact.French__c, WorkOrder.Completed_Date__c, Product2.ProductCode, WorkOrderId, WorkOrder.AccountId, WorkOrder.Account.Name, WorkOrder.Account.ShippingCountry, WorkOrder.Account.ShippingState, 
                 WorkOrder.Account.ShippingStreet, WorkOrder.Account.ShippingPostalCode, WorkOrder.LastModifiedDate 
                 FROM WorkOrderLineItem WHERE Id =: ApexPages.currentPage().getParameters().get('Id')];
        system.debug(woOLI);
        if(woOLI.WorkOrder.ServiceReportLanguage != null) {
            lang =  woOLI.WorkOrder.ServiceReportLanguage == 'fr' ? 'fr' : 'en';   
        }
        
        accName = woOLI.WorkOrder.Account.Name;
        address = woOLI.WorkOrder.Account.ShippingStreet + ' ' + woOLI.WorkOrder.Account.ShippingPostalCode;
        day = woOLI.WorkOrder.Completed_Date__c.Day();
        
        month = woOLI.WorkOrder.Completed_Date__c.month();
            //String.valueof(DateTime.newInstance(woOLI.WorkOrder.Completed_Date__c.year(), woOLI.WorkOrder.Completed_Date__c.month(), woOLI.WorkOrder.Completed_Date__c.day()).format('MMMM'));
        year = woOLI.WorkOrder.Completed_Date__c.Year();
        if(woOLI.Product2.ProductCode == '1-44-21') {
            isSaniplus = true;
        }
        if(woOLI.Product2.ProductCode == '1-44-22') {
            isSaniguard = true;
        }
        if(woOLI.Product2.ProductCode == '1-44-25') {
            isSanidefense = true;
        }
    }
}