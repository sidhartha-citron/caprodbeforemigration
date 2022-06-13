/**
 * @FileName: ServicePlanUtils
 * @Description: Utility methods for Service Plan and Fixed Routing logic
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/27/2019      Created
 *-----------------------------------------------------------  
 */
public inherited sharing class ServicePlanUtils {
    // flag to bypass order and order product trigger errors when updating active orders
    public static Boolean allowActiveOrderUpdates = false;

    /*
     * @Name        getSiteSurveyMap
     * @Description Get a map of site survey records by id that contains all of the fields required to evaluate
     *              site survey adjustments
     * @Author      Graeme Ward
     * @Params      siteSurveyIds: set of site survey ids to be queried
     * @Return      Map<Id,Site_Survey__c: map of site survey records by id
     */
    public static Map<Id,Site_Survey__c> getSiteSurveyMap(Set<Id> siteSurveyIds) {
        String siteSurveyQuery = 'SELECT Id, Pest_Duration_Calculation__c, Signature_Required_For__c, Duration_Adjustment_Time__c';

        for(List<String> fields : ServicePlanConstants.ADJUSTMENT_FIELDS.values()) {
            for(String field : fields) {
                siteSurveyQuery += ', ' + field;
            }
        }

        siteSurveyQuery += ' FROM Site_Survey__c WHERE Id IN :siteSurveyIds';

        return new Map<Id,Site_Survey__c>((List<Site_Survey__c>) Database.query(siteSurveyQuery));
    }

    /*
     * @Name        getSiteSurveyAdjustments
     * @Description Get the adjustment value for a survey compared against order item families and quantities
     * @Author      Graeme Ward
     * @Params      survey: the site survey record to be evaluated
     *              assetCountByFamily: a count of assets by product family
     * @Return      Decimal: adjustment value for the specified survey and assets
     */
    public static Decimal getSiteSurveyAdjustments(Site_Survey__c survey, Map<String,Double> assetCountByFamily) {
        Decimal adjustments = 0;

        SObject surveyObj = (SObject) survey;

        adjustments += (Decimal) surveyObj.get('Duration_Adjustment_Time__c');

        // add the adjustment values for specified product families and quantities
        for(String family : assetCountByFamily.keySet()) {
            String signatureRequired = (String) surveyObj.get('Signature_Required_For__c');

            // for each product family that requires a signature, add 5 minutes
            if(String.isNotBlank(signatureRequired) && signatureRequired.contains(family)) {
                adjustments += 5;
            }

            List<String> familyFields = ServicePlanConstants.ADJUSTMENT_FIELDS.get(family);

            if(familyFields != null) {
                if(family != QueryUtils.fieldServiceSettings.Pest_LOB__c) {
                    // all families except pest control add the work order adjustment only if the asset count reaches a certain number
                    if(surveyObj.get(familyFields[0]) != null
                            && assetCountByFamily.get(family) >= (Double) surveyObj.get(familyFields[1]))
                    {
                        adjustments += (Decimal) surveyObj.get(familyFields[0]);
                    }
                }

                if(family == QueryUtils.fieldServiceSettings.Pest_LOB__c) {
                    // pest control adds the work order adjustment regardless of the asset count
                    if(surveyObj.get(familyFields[0]) != null) {
                        adjustments += (Decimal) surveyObj.get(familyFields[0]);
                    }

                    // pest control has an additional duration adjustment
                    if(surveyObj.get('Pest_Duration_Calculation__c') != null) {
                        adjustments += (Decimal) surveyObj.get('Pest_Duration_Calculation__c');
                    }
                }
            }
        }

        return adjustments;
    }
}