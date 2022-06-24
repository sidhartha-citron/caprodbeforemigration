/**
 * @FileName: ServicePlanConstants
 * @Description: Constants for Service Plan related functionality
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/19/2019      Created
 *-----------------------------------------------------------  
 */
public inherited sharing class ServicePlanConstants {
    public static final String FREQUENCY_ONE_TIME = 'One-time';
    public static final String FREQUENCY_WEEKLY = 'Weekly';
    public static final String FREQUENCY_MONTHLY = 'Monthly';
    public static final String FREQUENCY_BI_MONTHLY = 'Bi-Monthly';
    public static final String FREQUENCY_QUARTERLY = 'Quarterly';
    public static final String FREQUENCY_14_DAYS = '14 Days';

    public static final Map<String,Integer> DAY_OF_WEEK_INTEGERS = new Map<String,Integer>{
            'Sunday' => 0,
            'Monday' => 1,
            'Tuesday' => 2,
            'Wednesday' => 3,
            'Thursday' => 4,
            'Friday' => 5,
            'Saturday' => 6
    };

    public static final Map<String,List<String>> ADJUSTMENT_FIELDS = new Map<String,List<String>>{
            'Hygiene' => new List<String>{'Work_Order_Calculation_Adjustment__c', 'Min_Hygiene_Work_Order_Lines__c'},
            'Chemical' => new List<String>{'Chem_WorkOrder_Calculation_Adjustment__c', 'Min_Chemical_Work_Order_Lines__c'},
            'Pest Control' => new List<String>{'Pest_WorkOrder_Calculation_Adjustment__c', 'Min_Pest_Work_Order_Lines__c'}
    };

    public static final Map<String,String> OPERATING_HOURS_FIELD_MAP = new Map<String,String>{
            'Hygiene' => 'Hygiene_Operating_Hours',
            'Chemical' => 'Chemical_Operating_Hours',
            'Pest Control' => 'Pest_Control_Operating_Hours'
    };
}