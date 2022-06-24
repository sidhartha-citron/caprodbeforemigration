public class StandingOrderUtilityClass {
    static final String CUSTOM_PERMISSION = 'CustomPermission';
    static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    public static Boolean isPriceOverrideAllowed() {
        Boolean isPermitted = [SELECT count() FROM PermissionSetAssignment WHERE PermissionSetId = :dataSets.Standing_Order_Override_Permission_Id__c AND AssigneeId = :UserInfo.getUserId()] > 0;
        
        if (isPermitted) {
        	return [SELECT count() FROM SetupEntityAccess WHERE SetupEntityType = :CUSTOM_PERMISSION AND ParentId =:dataSets.Standing_Order_Override_Permission_Id__c AND SetupEntityId = :dataSets.Standing_Order_Custom_Permission_Id__c] > 0;
        }
        System.debug('is permitted >>> ' + isPermitted);
        return false;
    }
}