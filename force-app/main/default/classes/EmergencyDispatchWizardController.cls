/**
* Name: EmergencyDispatchWizardController
* Author: PwC
* Date Created: January 2, 2019
* Purpose: To initialize the beginning of the Emergency Dispatch Wizard
*/
public with sharing class EmergencyDispatchWizardController {
    private static Emergency_Dispatch_Wizard_Setttings__c edwSettings = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
    private static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    /**
     * Initializaes the Emergency Dispatch Wizard app
     * 
     * @param mode  The mode of the Emergency Dispatch Wizard to initialize the Path component accordingly
     */
    @AuraEnabled
    public static EDW_ViewModels.MainViewModel initializeEmergencyDispatchWizard(String mode) {
        EDW_ViewModels.MainViewModel initModel = new EDW_ViewModels.MainViewModel();
        initModel.mode = mode;
        initModel.paths = EDW_UtilityClass.initializePaths(initModel.mode);
        return initModel;
    }
    
    /**
     * Validates the related record to ensure the Emergency Dispatch Wizard can be launched
     * 
     * @param recordId  The Id of the record that initialized the Emergency Dispatch Wizard
     */
    @AuraEnabled
    public static String isAccessValid(Id recordId) {
        String recordIdPrefix = String.valueOf(recordId).left(3);
        Integer numberOfDaysToCutOffAccess = Integer.valueOf(edwSettings.Number_of_Days_to_Limit_Access__c);
        
        EDW_ViewModels.AccessValidationResponse validation = new EDW_ViewModels.AccessValidationResponse();
        
        validation.objectType = String.valueOf(recordId.getSObjectType());
        
        if (recordIdPrefix == EDW_UtilityClass.ACCOUNT_PREFIX || recordIdPrefix == EDW_UtilityClass.CASE_PREFIX) {
            //immediately valid as it's for a new Order
            validation.response = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, null, null);
        } else if (recordIdPrefix == EDW_UtilityClass.CASE_PREFIX) {
            
        } else if (recordIdPrefix == EDW_UtilityClass.ORDER_PREFIX) {
            Boolean hasSpecialAccess = EDW_UtilityClass.checkIfUserHasAssignedPermissionSet(UserInfo.getUserId(), edwSettings.Access_EDW_Outside_Cutoff_Time_PS_Id__c);
            
            for (Order o : [SELECT Id, EffectiveDate, Line_of_Businesses__c, Emergency__c, Order_Cancelled__c FROM Order WHERE Id = :recordId]) {            
                Integer numberOfDaysUntilCutOffAccess = EDW_UtilityClass.calculatedNumberOfBusinessDays(o.EffectiveDate, numberOfDaysToCutOffAccess);
                
                if (o.Order_Cancelled__c) {
                    validation.response = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Order_Already_Cancelled_Error_Message, o);
                } else if (o.Line_of_Businesses__c != dataSets.Pest_LOB__c || !o.Emergency__c) {
                    validation.response = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Order_Must_be_Pest_Emergency_Error_Message, o);
                } else if ((numberOfDaysUntilCutOffAccess <= 0 && !hasSpecialAccess) || System.today() > o.EffectiveDate) {
                    //cut off user
                    validation.response = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.Order_Cannot_be_Updated_Error_Message, o);
                } else {
            		validation.response = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, null, o);
                }
            }
            
        }
        
        return System.JSON.serialize(validation);
    }
}