public with sharing class EDW_SelectCustomerController {
    
    @AuraEnabled
    public static EDW_ViewModels.MainViewModel initializeSelectCustomer(String recordId) {
        EDW_ViewModels.MainViewModel initModel = new EDW_ViewModels.MainViewModel();
        
        initModel.isCommunity = EDW_UtilityClass.isCommunity();
        
        if (!initModel.isCommunity) {
            if (String.isBlank(recordId)) {
                return initModel;
            } else if (recordId.left(3) == EDW_UtilityClass.ACCOUNT_PREFIX) {
                initModel.account = [SELECT Id, Name, Site_Survey__c, Site_Survey__r.Name, AccPac_Account__c, PO_Required_for_Orders__c, PO_Required_on_Line_Item__c, Is_Multi_Res__c, OperatingHoursId, Pest_Control_OperatingHoursId__c FROM Account WHERE Id = :recordId];
            } else if (recordId.left(3) == EDW_UtilityClass.CASE_PREFIX) {
                initModel.ticket = [SELECT Id, CaseNumber, AccountId, Account.Name, Account.Site_Survey__c, Account.Site_Survey__r.Name, Account.PO_Required_on_Line_Item__c, Account.AccPac_Account__c, Account.PO_Required_for_Orders__c, Account.OperatingHoursId, Account.Pest_Control_OperatingHoursId__c, Contact.FirstName, Contact.LastName, ContactId, Account.Is_Multi_Res__c, Status, Order__c FROM Case WHERE Id = :recordId];
                initModel.account = new Account(Id=initModel.ticket.AccountId, Name=initModel.ticket.Account.Name, Site_Survey__c=initModel.ticket.Account.Site_Survey__c, PO_Required_for_Orders__c=initModel.ticket.Account.PO_Required_for_Orders__c, PO_Required_on_Line_Item__c=initModel.ticket.Account.PO_Required_on_Line_Item__c, AccPac_Account__c=initModel.ticket.Account.AccPac_Account__c, Is_Multi_Res__c=initModel.ticket.Account.Is_Multi_Res__c);
                initModel.contact = initModel.ticket.ContactId == null 
                    ? null 
                    : new Contact(Id=initModel.ticket.ContactId, FirstName=initModel.ticket.Contact.FirstName, LastName=initModel.ticket.Contact.LastName);
            }
            
            initModel.recordId = recordId;
        } else {
            //TODO configure how you want to handle initialization of EDW_SelectCustomerComponent in a community
        }
        return initModel;
    }
}