/*
 * Provides utility methods for Service Appointment signature-related
 * logic
 * 
 * @author Ahsan Butt
 */
public class ServiceAppointmentSignatureUtilities {
    private static final String TYPE_DELIVERY = 'Delivery';
    
    // Note: This string should be kept up to date with Service Appointment fields used in the IsSignaturedRequired method,
    // 		 as this method is also being called from a non-trigger context outside this class.  
    // 		 Although not ideal, this provides a modicum of safety against breaking the other calling context, if this logic
    // 		 is modified to require a different field. This was the mechanism settled on between myself and Kevin Hiscock (PwC) 1/18/2019 
    public static final String SA_REQUIRED_FIELDS_FOR_SIGNATURE_CHECK = 'Id, ParentRecordId, AccountId, Line_Of_Business__c, Type__c';
    
    public static Map<Id, Boolean> isSignatureRequired(List<ServiceAppointment> sas) {
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        system.debug('sas ' + sas);
        // Query related objs to determine if a signature was captured and whether one was required
        List<Id> saIds = new List<Id>();
        List<Id> woIds = new List<Id>();
        List<Id> acctIds = new List<Id>();

        for (ServiceAppointment sa : sas) {
            saIds.add(sa.Id);
            woIds.add(sa.ParentRecordId);
            acctIds.add(sa.AccountId);
        }
        
        Map<Id, Account> acctMap = new Map<Id, Account>([
                SELECT Id, Site_Survey__r.Signature_Required_For__c, Require_Service_Reports__c, VMI__c
                FROM Account
                WHERE Id IN :acctIds
        ]);

        Map<Id, WorkOrder> woMap = new Map<Id, WorkOrder>([
                SELECT Id,
                        (SELECT Id FROM ProductsConsumed)
                FROM WorkOrder
                WHERE Id IN :woIds
        ]);
        
        Map<Id, Boolean> isSignatureRequiredMap = new Map<Id, Boolean>();
        
		for (ServiceAppointment sa : sas) {            
            // Check all signature required conditions
            Account relatedAcct = acctMap.get(sa.AccountId);
            WorkOrder relatedWO = woMap.get(sa.ParentRecordId);
            
            // Get line of businesses that require signature (according to account)
            Set<String> lobsRequiringSignature = new Set<String>();

            if (relatedAcct != null
                    && relatedAcct.Site_Survey__c != null
                    && String.isNotBlank(relatedAcct.Site_Survey__r.Signature_Required_For__c) )
            {
                lobsRequiringSignature.addAll(relatedAcct.Site_Survey__r.Signature_Required_For__c.split(';'));
            }            
            
            Boolean isSignatureRequired = false;

            if(sa.Line_Of_Business__c == dataSets.Pest_LOB__c
                    || lobsRequiringSignature.contains(sa.Line_Of_Business__c)
                    || sa.Type__c == TYPE_DELIVERY
                    || (relatedAcct != null
                        && relatedAcct.VMI__c)
                    || (relatedWO.ProductsConsumed != null
                        && relatedWO.ProductsConsumed.size() > 0 ))
            {
                isSignatureRequired = true;
            }
            
            isSignatureRequiredMap.put(sa.Id, isSignatureRequired);
        }
        
        return isSignatureRequiredMap;
    }
    
    /* Does *not* persist changes to SA records */
   /* public static void setSignatureFields(List<ServiceAppointment> completedSAs) {
    	Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        
        // Query related objs
        List<Id> saIds = new List<Id>();
        List<Id> acctIds = new List<Id>();

        for (ServiceAppointment sa : completedSAs) {
            saIds.add(sa.Id);
            acctIds.add(sa.AccountId);
        }
        
        Map<Id, Account> acctMap = new Map<Id, Account>([
                SELECT Id, Require_Service_Reports__c
                FROM Account
                WHERE Id IN :acctIds
        ]);

        List<ServiceReport> srs = [
                SELECT Id, ParentId
                FROM ServiceReport
                WHERE ParentId IN :saIds AND IsSigned = TRUE
        ];
        
        Set<Id> signedSR = new Set<Id>();
        for (ServiceReport sr : srs) {
            signedSR.add(sr.ParentId);
        }
        
        // Check all signature required conditions
        Map<Id, Boolean> isSignatureRequiredMap = isSignatureRequired(completedSAs);
        
        for (ServiceAppointment sa : completedSAs) {
            
            sa.Customer_Signature_Captured__c = signedSR.contains(sa.Id);
            
            Account relatedAcct = acctMap.get(sa.AccountId);
            
            // Set is signature required field
            sa.Is_Signature_Required__c = isSignatureRequiredMap.get(sa.Id);
            
            // If signature is required, was not captured, and reason not given -- display error
            Boolean validReasonRequiredAndGiven = false;
            if (sa.Is_Signature_Required__c && !sa.Customer_Signature_Captured__c) {
                if (String.isBlank(sa.Signature_Not_Captured_Reason__c)) {
                	sa.Signature_Not_Captured_Reason__c.addError(Label.Signature_Required_And_Reason_Not_Given_Error_Message);    
                } else if (sa.Signature_Not_Captured_Reason__c.length() < 10) {
                    sa.Signature_Not_Captured_Reason__c.addError(Label.Signature_Required_And_Reason_Too_Short_Message); 
                } else {
                    validReasonRequiredAndGiven = true;
                }
            }
            
            // Also set auto-send and auto-gen fields
            sa.Should_Auto_Generate_Service_Report__c = !sa.ServiceReportAlreadySent__c
                                                        && ((sa.Line_Of_Business__c == dataSets.Pest_LOB__c
                                                                || sa.Line_Of_Business__c == dataSets.Hygiene_LOB__c)
                                                            || ((!sa.Is_Signature_Required__c
                                                                    || sa.Customer_Signature_Captured__c
                                                                    || validReasonRequiredAndGiven)
                                                                && (relatedAcct != null
                                                                    && relatedAcct.Require_Service_Reports__c
                                                                    && (sa.Line_Of_Business__c == dataSets.Chemical_LOB__c
                                                                        || sa.Line_Of_Business__c == dataSets.Life_Safety_LOB__c))));
            
			sa.Should_Auto_Send_Service_Report__c = !sa.ServiceReportAlreadySent__c
                                                    && (sa.Line_Of_Business__c == dataSets.Pest_LOB__c
                                                        || ((!sa.Is_Signature_Required__c
                                                                || sa.Customer_Signature_Captured__c
                                                                || validReasonRequiredAndGiven)
                                                            && (relatedAcct != null
                                                                && relatedAcct.Require_Service_Reports__c
                                                                && (sa.Line_Of_Business__c == dataSets.Hygiene_LOB__c
                                                                    || sa.Line_Of_Business__c == dataSets.Chemical_LOB__c
                                                                    || sa.Line_Of_Business__c == dataSets.Life_Safety_LOB__c))));
        }
    }*/
}