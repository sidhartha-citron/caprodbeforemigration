/**
 * @FileName: GenerateWorkOrdersCtrl
 * @Description: Controller methods for the Generate Work Orders lightning component
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/1/2020        Created
 *-----------------------------------------------------------  
 */
public with sharing class GenerateWorkOrdersCtrl {

    @AuraEnabled
    public static String setContent(String recordId) {
        return GenerateWorkOrdersHelper.setContent(recordId);
    }

    @AuraEnabled
    public static void generateWorkOrders(String recordId) {
        GenerateWorkOrdersHelper.generateWorkOrders(recordId);
    }
}