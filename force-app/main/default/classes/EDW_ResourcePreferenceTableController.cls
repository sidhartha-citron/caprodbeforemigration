/**
* Name: EDW_ResourcePreferenceTableController
* Author: PwC
* Date Created: May 8, 2019
* Purpose: To initialize the EDW_ResourcePreferenceTableComponent lightning component
*/ 
public class EDW_ResourcePreferenceTableController {
    
    /**
     * Loads all data for the EDW_ResourcePreferenceTableComponent lightning component when first initialized
     *
     * @param recordId  Controls where the  EDW_ResourcePreferenceTableComponent lightning component was called from and retrieves the related Resource Preferences accordingly
     */
    @AuraEnabled
    public static EDW_ViewModels.ResourcePreferenceViewModel getResourcePreferences(String recordId) {
        EDW_ViewModels.ResourcePreferenceViewModel model = new EDW_ViewModels.ResourcePreferenceViewModel();
        
        model.columnNames = new List<String>(EDW_UtilityClass.queryResourcePreferenceColumnNames());
        model.resourcePreferences = Database.query(QueryGenerator.queryResourcePreferences('Account__c = :recordId'));
        model.account = [SELECT Id, Name FROM Account WHERE Id = :recordId];
        
        return model;
    }
}