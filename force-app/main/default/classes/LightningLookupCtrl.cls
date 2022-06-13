/**
 * @FileName: LightningLookupCtrl
 * @Description: Controller for custom lightning lookup component
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/14/2019         Created
 *-----------------------------------------------------------  
 */
public with sharing class LightningLookupCtrl {

    @AuraEnabled
    public static String executeSearch(String criteriaJSON) {
        try {
            return LightningLookupCtrlHelper.executeSearch(criteriaJSON);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}