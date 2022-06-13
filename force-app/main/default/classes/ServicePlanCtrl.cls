/**
 * @FileName: ServicePlanCtrl
 * @Description: Controller methods for fixed routing service plan components
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/22/2019      Created
 *-----------------------------------------------------------  
 */
public with sharing class ServicePlanCtrl {

    @AuraEnabled
    public static String checkPermissions() {
        try {
            return ServicePlanCtrlHelper.checkPermissions();
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getAccountData(String accountId) {
        try {
            return ServicePlanCtrlHelper.getAccountData(accountId);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getServicePlan() {
        try {
            return ServicePlanCtrlHelper.getServicePlan();
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getOrderItems(String criteriaJSON) {
        try {
            return ServicePlanCtrlHelper.getOrderItems(criteriaJSON);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String checkForDuplicateServicePlans(String criteriaJSON) {
        try {
            return ServicePlanCtrlHelper.checkForDuplicateServicePlans(criteriaJSON);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void upsertServicePlan(String criteriaJSON) {
        //try {
            ServicePlanCtrlHelper.upsertServicePlan(criteriaJSON);
//        } catch(Exception e) {
//            throw new AuraHandledException(e.getMessage());
//        }
    }

    @AuraEnabled
    public static void assignOrderItems(String criteriaJSON) {
        try {
            ServicePlanCtrlHelper.assignOrderItems(criteriaJSON);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}