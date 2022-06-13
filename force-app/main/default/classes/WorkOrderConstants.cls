/**
 * @FileName: WorkOrderConstants
 * @Description: Constants for Work Order related functionality
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/6/2020         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class WorkOrderConstants {
    public static final Map<Id, WorkType> WORK_TYPE_RECORDS = new Map<Id, WorkType>([
            SELECT Id, ServiceReportTemplateId
            FROM WorkType
    ]);

    public static final Map<String, String> WORK_TYPE_MAP = new Map<String, String>{
            QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c => QueryUtils.fieldServiceSettings.Delivery_Work_Type__c,
            QueryUtils.fieldServiceSettings.Hygiene_LOB__c + '.true' => QueryUtils.fieldServiceSettings.Hygiene_Work_Type_Detailed__c,
            QueryUtils.fieldServiceSettings.Chemical_LOB__c + '.true' => QueryUtils.fieldServiceSettings.Chemical_Work_Type_Detailed__c,
            QueryUtils.fieldServiceSettings.Pest_LOB__c + '.true' => QueryUtils.fieldServiceSettings.Pest_Control_Work_Type_Detailed__c,
            QueryUtils.fieldServiceSettings.Life_Safety_LOB__c + '.true' => QueryUtils.fieldServiceSettings.Life_Safety_Work_Type_Detailed__c,
            QueryUtils.fieldServiceSettings.Hygiene_LOB__c + '.false' => QueryUtils.fieldServiceSettings.Hygiene_Work_Type_Non_Detailed__c,
            QueryUtils.fieldServiceSettings.Chemical_LOB__c + '.false' => QueryUtils.fieldServiceSettings.Chemical_Work_Type_Non_Detailed__c,
            QueryUtils.fieldServiceSettings.Pest_LOB__c + '.false' => QueryUtils.fieldServiceSettings.Pest_Control_Work_Type_Non_Detailed__c,
            QueryUtils.fieldServiceSettings.Life_Safety_LOB__c + '.false' => QueryUtils.fieldServiceSettings.Life_Safety_Work_Type_Non_Detailed__c
    };

    public static final Map<String,String> ORDER_AND_ACCOUNT_TO_WORK_ORDER_FIELD_MAPPING = new Map<String,String>{
            'Shipping_Suite_Number__c' => 'Suite_Number__c',
            'ShippingStreet' => 'Street',
            'ShippingCity' => 'City',
            'ShippingState' => 'State',
            'ShippingPostalCode' => 'PostalCode',
            'ShippingCountry' => 'Country'
    };
}