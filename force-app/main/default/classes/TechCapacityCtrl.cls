/**
 * @FileName: TechCapacityCtrl
 * @Description: Controller methods for fixed routing tech capacity lightning components
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/18/2019      Created
 *-----------------------------------------------------------  
 */
public with sharing class TechCapacityCtrl {

    @AuraEnabled
    public static String getTechnician(String technicianId) {
        try {
            return TechCapacityCtrlHelper.getTechnician(technicianId);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getServicePlans(String criteria) {
        try {
            return TechCapacityCtrlHelper.getServicePlans(criteria);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}