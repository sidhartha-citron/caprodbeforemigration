/**
 * @FileName: TestUtilsObjectDefaults
 * @Description: Field defaults for constructing test data by object type
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/1/2019         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class TestUtilsObjectDefaults {

    // Use the FieldDefaults interface to set up values you want to default in for all objects.
    public interface FieldDefaults {
        Map<String, Object> getFieldDefaults();
    }

    // Fields that must be incremented (ie. unique) when creating lists of sobjects
    public static Map<String, List<String>> incrementFieldMap = new Map<String, List<String>> {
            'Account' => new List<String>{'Name', 'AccPac_Account__c', 'Invoicing_Email_Address__c'},
            'Contact' => new List<String>{'LastName', 'Email'},
            'Case' => new List<String>{'Subject'},
            'User' => new List<String>{'LastName'},
            'OperatingHours' => new List<String>{'Name'},
            'ServiceTerritory' => new List<String>{'Name'},
            'Survey_Location__c' => new List<String>{'Name'},
            'Product2' => new List<String>{'Name', 'ExternalId__c'},
            'Work_Order_Priority_Weights__c' => new List<String>{'Name'}
    };

    /*
     * ===============================
     * STANDARD OBJECT DEFAULT CLASSES
     * ===============================
     */

    public class AccountDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString(),
                    'RecordTypeId' => Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Customer_Bill_To').getRecordTypeId(),
                    'Phone' => ApexUtils.generateRandomPhoneNumber(),
                    'AccPac_Account__c' => ApexUtils.generateRandomInteger(6) + '-',
                    'A_P_Contact_Name__c' => ApexUtils.generateRandomString(),
                    'Credit_Check__c' => 'Completed',
                    'Industry' => 'Institutions',
                    'Industry_Code_Accpac__c' => '000-00 UNKNOWN',
                    'Invoice_Preference__c' => 'Email',
                    'Invoicing_Email_Address__c' => ApexUtils.generateRandomEmail(),
                    'LEED_Customer__c' => 'No',
                    'On_Hold__c' => false,
                    'Inactive__c' => false,
                    'Type' => 'Customer',
                    'Billing_Suite_Number__c' => String.valueOf(ApexUtils.generateRandomInteger(1)),
                    'BillingStreet' => ApexUtils.generateRandomString(),
                    'BillingCity' => ApexUtils.generateRandomString(),
                    'BillingState' => ApexUtils.generateRandomString(2),
                    'BillingPostalCode' => 'A1A1A1',
                    'BillingCountry' => ApexUtils.generateRandomString(),
                    'Shipping_Suite_Number__c' => String.valueOf(ApexUtils.generateRandomInteger(1)),
                    'ShippingStreet' => ApexUtils.generateRandomString(),
                    'ShippingCity' => ApexUtils.generateRandomString(),
                    'ShippingState' => ApexUtils.generateRandomString(2),
                    'ShippingPostalCode' => 'A1A1A1',
                    'ShippingCountry' => ApexUtils.generateRandomString(),
//                    'Ship_To_Location__c' => '001',
                    'Customer_Tiers__c' => 'Platinum'
            };
        }
    }

    public class AssetDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString()
            };
        }
    }

    public class AssignedResourceDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {};
        }
    }

    public class ContactDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'FirstName' => ApexUtils.generateRandomString(),
                    'LastName' => ApexUtils.generateRandomString(),
                    'Email' => ApexUtils.generateRandomEmail()
            };
        }
    }

    public class OpportunityDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{
                    'Name' => ApexUtils.generateRandomString(),
                    'StageName' => 'Presentation',
                    'CloseDate' => System.today().addDays(30),
                    'Amount' => 0.0,
                    'Type' => 'Retention',
                    'Opportunity_Type__c' => 'Consumables',
                    'LeadSource' => 'Call In'
            };
        }
    }

    public class OpportunityContactRoleDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{};
        }
    }

    public class OpportunityLineItemDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{
                    'UnitPrice' => 1.0,
                    'Service_Price_Per_Unit__c' => 1.0,
                    'Quantity' => 1,
                    'SurveyAssetCountChecker__c' => 1
            };
        }
    }

    public class OrderDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'EffectiveDate' => Date.today(),
                    'Status' => 'Shopping Cart',
                    'Pricebook2Id' => Test.getStandardPricebookId()
            };
        }
    }

    public class OrderItemDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Frequency__c' => 'Weekly',
                    'UnitPrice' => 1.0,
                    'Service_Price_Per_Unit__c' => 1.0,
                    'Quantity' => 1,
                    'HasSurveyAssets__c' => true
            };
        }
    }

    public class OperatingHoursDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString(),
                    'Operating_Hours_Type__c' => 'Employee Operating Hours',
                    'TimeZone' => 'America/New_York'
            };
        }
    }

    public class PermissionSetAssignmentDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{};
        }
    }

    public class PricebookEntryDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Pricebook2Id' => Test.getStandardPricebookId(),
                    'UnitPrice' => 1.0,
                    'IsActive' => true
            };
        }
    }

    public class Product2Defaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString(),
                    'Allowable_Frequencies__c' => 'One-Time;Weekly;Monthly;Bi-Monthly;Quarterly;14 Days',
                    'IsActive' => true,
                    'Available_As_Related_Product__c' => true,
                    'Family' => 'Hygiene',
                    'Display_Record_In_Portal__c' => true,
                    'ExternalId__c' => '3-55-7-02-1',
                    'Item_Type__c' => 'Service'
            };
        }
    }

    public class ProductConsumedDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'QuantityConsumed' => 1
            };
        }
    }

    public class ServiceAppointmentDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'EarliestStartTime' => System.now().addDays(-1),
                    'DueDate' => System.now().addDays(7),
                    'SchedStartTime' => System.now(),
                    'SchedEndTime' => System.now().addDays(1),
                    'Status' => 'Scheduled',
                    'Duration' => 30
            };
        }
    }

    public class ServiceCrewDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString(),
                    'CrewSize' => 1
            };
        }
    }

    public class ServiceCrewMemberDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'StartDate' => System.today()
            };
        }
    }

    public class ServiceTerritoryDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString(),
                    'IsActive' => true,
                    'Street' => ApexUtils.generateRandomString(),
                    'City' => ApexUtils.generateRandomString(),
                    'State' => ApexUtils.generateRandomString(2),
                    'PostalCode' => ApexUtils.generateRandomString(6),
                    'Country' => ApexUtils.generateRandomString()
            };
        }
    }

    public class ServiceTerritoryMemberDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'TerritoryType' => 'P',
                    'EffectiveStartDate' => Date.today()
            };
        }
    }

    public class ServiceResourceDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString(),
                    'ResourceType' => 'T',
                    'IsActive' => true,
                    'Region__c' => 'London'
            };
        }
    }

    public class SetupEntityAccessDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {};
        }
    }

    public class TimeSlotDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'DayOfWeek' => 'Monday',
                    'StartTime' => Time.newInstance(07, 00, 00, 00),
                    'EndTime' => Time.newInstance(17, 00, 00, 00)
            };
        }
    }

    public class UserDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'LastName' => ApexUtils.generateRandomString(5),
                    'Alias' => ApexUtils.generateRandomString(4),
                    'Email' => ApexUtils.generateRandomEmail(),
                    'UserName' => System.now().millisecond() + '@cj.com',
                    'TimeZoneSidKey' => 'America/Los_Angeles',
                    'LocaleSidKey' => 'en_US',
                    'EmailEncodingKey' => 'ISO-8859-1',
                    'LanguageLocaleKey' => 'en_US',
                    'Employee_Number__c' => ApexUtils.generateRandomString(25)
            };
        }
    }

    public class WorkOrderDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'StartDate' => System.today(),
                    'Line_of_Business__c' => 'Hygiene'
            };
        }
    }

    public class WorkOrderLineItemDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Type_of_Service__c' => 'Service',
                    'Quantity' => 1,
                    'Line_Item_Description__c' => ApexUtils.generateRandomString()
            };
        }
    }

    /*
     * ===============================
     * CUSTOM OBJECT DEFAULT CLASSES
     * ===============================
     */

    public class Activity_InfestationDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Asset_Bar_Code__c' => ApexUtils.generateRandomString()
            };
        }
    }

    public class CPQ_Service_BranchesDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'CPQ_Average_Cost_Minute__c' => 0.69,
                    'CPQ_Average_Drive_Stem_Cost__c' => 17.4,
                    'CPQ_Direct_Cost_of_Revenue__c' => 1,
                    'CPQ_External_Id__c' => 'Toronto' + String.valueOf(Datetime.now())
            };
        }
    }

    public class ERP_OrdersDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {};
        }
    }

    public class FSA_Service_Territory_MappingDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString(),
                    'FSA__c' => 'A1A',
                    'Province__c' => 'Ontario',
                    'CPQ_Service_Zone__c' => '1'
            };
        }
    }

    public class Order_Item_LocationDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {};
        }
    }

    public class Related_Work_OrderDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {};
        }
    }

    public class RouteDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {};
        }
    }

    public class Service_PlanDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Job_Type__c' => 'Recurring Service',
                    'Line_of_Business__c' => 'Hygiene/Life Safety',
                    'Frequency__c' => 'Weekly',
                    'Effective_Date__c' => Date.today().addMonths(-1)
            };
        }
    }

    public class Schedule_TypeDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {};
        }
    }

    public class Site_SurveyDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Survey_Date__c' => System.today(),
                    'Status__c' => 'Draft'
            };
        }
    }

    public class Survey_LocationDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Name' => ApexUtils.generateRandomString(),
                    'Building__c' => ApexUtils.generateRandomString(),
                    'Floor__c' => ApexUtils.generateRandomString(),
                    'Location_Type__c' => 'Washroom',
                    'Location_SubType__c' => 'Unisex'
            };
        }
    }

    public class Survey_Asset_LocationDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Quantity__c' => 1
            };
        }
    }

    public class Work_Order_RoomDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {};
        }
    }

    /*
     * ===============================
     * CUSTOM SETTING DEFAULT CLASSES
     * ===============================
     */

    public class Emergency_Dispatch_Wizard_SetttingsDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{
                    'Activate_Emergency_Only_Cannot_Complete__c' => true,
                    'PO_Required_for_Closing_Work_Order_Error__c' => 'error message'
            };
        }
    }

    public class Field_Service_SettingsDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object> {
                    'Scanned_Out_Status__c' => 'Remove',
                    'Order_Active_Stage__c' => 'Activated',
                    'Regular_Order_Draft_Stage__c' => 'Draft',
                    'Shopping_Cart_Order_Draft_Stage__c' => 'Shopping Cart',
                    'Regular_Order_Record_Type_Id__c' => Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId(),
                    'Default_Order_Price_Book_ID__c' => Test.getStandardPricebookId(),
                    'Default_Opportunity_Price_Book_ID__c' => Test.getStandardPricebookId(),
                    'Operating_Hours_Type_Account__c' => 'Account Operating Hours',
                    'Operating_Hours_Type_Employee__c' => 'Employee Operating Hours',
                    'Status_Value_for_Install_of_a_Product__c' => 'Install',
                    'Status_Value_for_Replace_of_a_Product__c' => 'Replace',
                    'Item_Type_for_Consumables__c' =>  'Consumables',
                    'Non_Recurring_Frequency_Value__c' => 'One-Time',
                    'Pest_LOB__c' => 'Pest Control',
                    'Item_Type_of_Services__c' => 'Service',
                    'Activate_Logic_for_Services__c' => true,
                    'Activate_Threshold_Logic_For_Orders__c' => true,
                    'Consumables_Discount_Threshold__c' => 10,
                    'Equipment_Discount_Threshold__c' => 10,
                    'Cannot_Complete_Status_Value__c' => 'Cannot Complete',
                    'Working_Hour_End_Time__c' => '4:00',
                    'PO_Required_Before_Label__c' => 'PO Required Before',
                    'Work_Order_Completion_Status__c' => 'Completed',
                    'Work_Order_Cancelled_Status__c' => 'Cancelled',
                    'Work_Order_Dispatched_Status__c' => 'Dispatched',
                    'Label_for_Service_Work_Order_Type__c' => 'Service',
                    'Label_for_Delivery_Work_Type__c' => 'Delivery',
                    'Label_for_Install_Work_Order_Type__c' => 'Installation',
                    'Label_for_Replace_Work_Order_Type__c' => 'Replace',
                    'Hygiene_LOB__c' => 'Hygiene',
                    'Chemical_LOB__c' => 'Chemical',
                    'Pest_LOB__c' => 'Pest Control',
                    'Life_Safety_LOB__c' => 'Life Safety',
                    'CitronDoNotReply__c' => 'donotreply@citronhygiene.com.staging',
                    'Work_Order_New_Status__c' => 'Scheduled',
                    'Ticket_Emergency_Record_Type__c' => Case.SObjectType.getDescribe().getRecordTypeInfosByDeveloperName().get('Emergency').getRecordTypeId(),
                    'Service_Start__c' => 0,
                    'Emergency_Service_Start_Time__c' => '4:30',
                    'Emergency_Service_End_Time__c' => '4:31',
                    'Are_Service_Crews_Active__c' => true,
                    'Type_Value_for_FollowUp_WorkOrder__c' => 'Follow-Up',
                    'Multi_Res_Queue_Id__c' => QueryUtils.queuesByDeveloperName.get('Multi_Res_Pest').Id,
                    'Customer_Success_Queue__c' => QueryUtils.queuesByDeveloperName.get('Customer_Success').Id,
                    'Customer_Service_Queue__c' => QueryUtils.queuesByDeveloperName.get('Customer_Success').Id,
                    'Billing_Queue__c' => QueryUtils.queuesByDeveloperName.get('Billing_Team').Id,
                    'Billing_Team__c' => QueryUtils.queuesByDeveloperName.get('Billing_Team').Id,
                    'Invoice_Information_Case_RecordTypeId__c' => Case.SObjectType.getDescribe().getRecordTypeInfosByDeveloperName().get('Request_Invoice_Information').getRecordTypeId()
//                    'Account_Bill_To_Record_Type_Id__c' => Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Bill To').getRecordTypeId(),
//                    'Account_Ship_To_Record_Type_Id__c' => Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Ship To').getRecordTypeId(),
//                    'Account_Customer_Number__c' => '5000'
            };
        }
    }

    public class FrequencyDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{};
        }
    }

    public class Province_Time_Zones_Operating_HoursDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{
                    'Name' => 'ON',
                    'Province_Territory_Code__c' => 'ON',
                    'TimeZone__c' => 'America/New_York'
            };
        }
    }

    public class Work_Order_Cannot_Complete_LoBsDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{
                    'Name' => 'Pest Control',
                    'IsActive__c' => true
            };
        }
    }

    public class Work_Order_Priority_WeightsDefaults implements FieldDefaults {
        public Map<String, Object> getFieldDefaults() {
            return new Map<String, Object>{
                    'At_Risk__c' => 'true',
                    'Customer_Tier__c' => 'Platinum',
                    'Name' => 'Priority',
                    'Duration_1_Hour__c' => ''
            };
        }
    }
}