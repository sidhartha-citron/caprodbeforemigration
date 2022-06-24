/**
 * Assigns cases to the appropriate queue.
 * 
 * @author Ahsan Butt
 */
public class CaseAssigner {
	private static Field_Service_Settings__c fssettings = Field_Service_Settings__c.getOrgDefaults();
    private static Id internalDataReviewRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Data Review').getRecordTypeId();
    private static Id generalInquiryTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('General Inquiry (Tech)').getRecordTypeId();
    private static Id generalInquiryRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('General Inquiry').getRecordTypeId();
    private static Id invoiceInformationRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
    private static Id technicianServiceRequestRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Technician Service Request').getRecordTypeId();
    private static Id technicianServiceRequestTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Technician Service Request (Tech)').getRecordTypeId(); 
    private static Id orderNewServiceRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Order New Service').getRecordTypeId(); 
    private static Id orderNewServiceTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Order New Service (Tech)').getRecordTypeId(); 
    private static Id siteContactRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Site Contact').getRecordTypeId(); 
    private static Id internalDataReviewTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Data Review (Tech)').getRecordTypeId(); 
    private static Id emergencyRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId(); 
    private static Id internalAppSupportRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Internal Application Support').getRecordTypeId(); 
    private static Id customersCancellationRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Customers Cancellation').getRecordTypeId(); 
    private static Id creditCheckRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Credit Check').getRecordTypeId(); 
    private static Id changeCurrServiceRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Change Current Services').getRecordTypeId(); 
    private static Id changeCurrServiceTechRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Change Current Services (Tech)').getRecordTypeId(); 
    private static Id coreListPriceChangeRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Core List Pricing Change Request').getRecordTypeId(); 
    
    private static String PROFILE_PEST = 'Pest';
    private static String PROFILE_CHEMICAL = 'Chemical';
    private static String PROFILE_HYGIENE = 'Hygiene';
    private static String PROFILE_CS = 'Customer Service';
   
    
    private static String CANCELLATION_TYPE_SALES = 'Sales';
    private static String CANCELLATION_TYPE_FINANCE = 'Finance';
    
    private static String OWNER_ALISON = 'Alison M';
    
    public static void assign(List<Case> cases) {
        List<Id> acctIds = new List<Id>();
    	List<Case> casesToAssign = new List<Case>();    
        List<Id> userIds = new List<Id>();
        
        // Get users who have specific ByPass Ticket Assignment permission set
        for (Case c : cases) {
			userIds.add(c.CreatedById);    
        }
        
        Set<Id> usersWithByPass = getUsersWithBypassPermissionSet(userIds);
        Map<Id, Group> siteSurveyQueues = new Map<Id, Group>([SELECT Id FROM Group WHERE Name like 'Site Survey%']); 
        
        for (Case c : cases) {
            // Ignore Email to Case and cases already assigned to Site Survey queues and those users with ByPass Permission Set
            if (c.SuppliedEmail == null && !siteSurveyQueues.containsKey(c.OwnerId) && !usersWithByPass.contains(c.CreatedById)) {
                casesToAssign.add(c);
                acctIds.add(c.AccountId);
            }
        }
        
        // Query for Account Owner
        Map<Id, Account> acctMap = new Map<Id, Account>([SELECT Id, Owner.Name, OwnerId FROM Account WHERE Id IN :acctIds]);

        // Query for User's Profile
        Map<Id, User> userMap = new Map<Id, User>([SELECT Id, Profile.Name FROM USER WHERE Id in :userIds]);
        // Since this logic must operate in an after trigger context (so that createdbyid is populated), must update new instance
        // of the case
        List<Case> casesToUpdate = new List<Case>();
        for (Case c : casesToAssign) {
            Case cToUpdate = new Case();
            cToUpdate.Id = c.Id;
            casesToUpdate.add(cToUpdate);
            
            System.debug(cToUpdate);
            
            if (assignCustomerService(c, cToUpdate, userMap)) {
                // done
            } else if (c.RecordTypeId == generalInquiryRecordTypeId) {
                if (assignUsingCreatedByProfile(c, cToUpdate, userMap)) {
                    // done
                } else if (c.Type == fssettings.Ticket_Type_for_New_Lead__c || c.Type == fssettings.Ticket_Type_for_Customer_Retention__c) {
                    assignUsingAcctOwner(c, cToUpdate, acctMap);
                } else {
                    cToUpdate.OwnerId = fssettings.Customer_Success_Queue__c;
                }
                
            } else if (c.RecordTypeId == generalInquiryTechRecordTypeId ) {
                if (assignUsingCreatedByProfile(c, cToUpdate, userMap)) {
                    // done
                } else if (c.Type == fssettings.Ticket_Type_for_New_Lead__c) {
                    cToUpdate.OwnerId = fssettings.Inside_Sales_Queue__c;
                } else if (c.Type == fssettings.Ticket_Type_for_Customer_Retention__c) {
                	assignUsingAcctOwner(c, cToUpdate, acctMap);
                } else {
                    cToUpdate.OwnerId = fssettings.Customer_Success_Queue__c;
                }
            } else if (c.RecordTypeId == invoiceInformationRecordTypeId) {
                if (c.IsRepairTicket__c || c.IsInstallationTicket__c) {
					cToUpdate.OwnerId = fssettings.Customer_Success_Queue__c;
                } else if(c.DocuSign_Status__c!=null){
                    //Shashi: Do not assing any owner ~ July 5, 2019
                } else {
                    cToUpdate.OwnerId = fssettings.Billing_Queue__c;
                }    
                
            } else if (c.RecordTypeId == technicianServiceRequestRecordTypeId || c.RecordTypeId == technicianServiceRequestTechRecordTypeId) {
                if (assignUsingCreatedByProfile(c, cToUpdate, userMap)) {
                    // done
                } else {
                    cToUpdate.OwnerId = fssettings.Customer_Success_Queue__c;
                }
            } else if (c.RecordTypeId == orderNewServiceRecordTypeId || c.RecordTypeId == orderNewServiceTechRecordTypeId) {
                if (c.Type == fssettings.Ticket_Type_for_Sales_Inquiry__c) {
                    assignUsingAcctOwner(c, cToUpdate, acctMap);
                    system.debug('Assign Acct Owner = ' + cToUpdate);
                } else {
                	cToUpdate.OwnerId = fssettings.CS_Orders__c;
                    system.debug('Assign CS Orders Queue');
                }
            }else if (c.RecordTypeId == internalDataReviewRecordTypeId || c.RecordTypeId == internalDataReviewTechRecordTypeId) {
                //cToUpdate.OwnerId = fssettings.CS_Data_Cleanup__c;
                //Varun : 02/26/2020 All tickets from opportunities submitted through the 3rd record type should go to ‘Site Survey Apprival:Hygiene’ Queue
                system.debug('In internal data review record type');
                cToUpdate.OwnerId = fssettings.Hygiene_Site_Survey_Approval_Queue__c;
            } else if (c.RecordTypeId == siteContactRecordTypeId) {
                //cToUpdate.OwnerId = fssettings.CS_Data_Cleanup__c;
                //All tickets from siteContactRecordTypeId go to ‘Customer succes’ Queue
                cToUpdate.OwnerId = fssettings.Customer_Success_Queue__c;
			
            } else if (c.RecordTypeId == emergencyRecordTypeId  || c.RecordTypeId == changeCurrServiceRecordTypeId ||
                       c.RecordTypeId == changeCurrServiceTechRecordTypeId) 
            {
                cToUpdate.OwnerId = c.Pest_Emergency_Order_Draft_Override__c ? fssettings.Multi_Res_Queue_Id__c : fssettings.Customer_Success_Queue__c;//21618 - modified for multi-res project [dk]
            } else if (c.RecordTypeId == internalAppSupportRecordTypeId) {
                cToUpdate.OwnerId = fssettings.App_Support_Team_Queue__c;
            } else if (c.RecordTypeId == creditCheckRecordTypeId) {
                cToUpdate.OwnerId = fssettings.Billing_Queue__c;
            } else if (c.RecordTypeId == coreListPriceChangeRecordTypeId){
                //CPQCN-322 - @Shashi 12/02/2021: Core List Pricing Change Request 
                cToUpdate.OwnerId = fssettings.Finance_Master_Data_Queue__c;
            }
            else if (c.RecordTypeId == customersCancellationRecordTypeId) {
                if (c.Cancellation_Ticket_Type__c == CANCELLATION_TYPE_SALES) {
                    assignUsingAcctOwner(c, cToUpdate, acctMap);
                } else if (c.Cancellation_Ticket_Type__c == CANCELLATION_TYPE_FINANCE) {
                	cToUpdate.OwnerId = fssettings.Finance_Master_Data_Queue__c;    
                } else {
                	cToUpdate.OwnerId = fssettings.Customer_Success_Queue__c;    
                }
            } else {
			   
                cToUpdate.OwnerId = fssettings.Customer_Success_Queue__c;
            }
        }
        if (casesToUpdate.size() > 0) {
        	update casesToUpdate;    
        }
    }
    
    private static Set<Id> getUsersWithBypassPermissionSet(List<Id> users) {
        Set<Id> usersWithByPass = new Set<Id>();
        
        List<PermissionSetAssignment> bypassAssignments = [SELECT Assignee.Id 
                                                           FROM PermissionSetAssignment 
                                                           WHERE PermissionSet.Name = 'ByPass_Ticket_Assignment'];
        
        for (PermissionSetAssignment psa : bypassAssignments) {
       		usersWithByPass.add(psa.Assignee.Id);
        }
        
        return usersWithByPass;
    }
    
    private static boolean assignUsingAcctOwner(Case c, Case cToUpdate, Map<Id, Account> acctMap) {
        Account acct = acctMap.get(c.AccountId);
        String acctOwner = acct.Owner.Name;
        if (acctOwner.containsIgnoreCase(OWNER_ALISON)) {
            cToUpdate.OwnerId = fssettings.Inside_Sales_Queue__c;
        } else {
            cToUpdate.OwnerId = acct.OwnerId;
        }
        System.debug('Assigning using account owner');
        return true;
    }
    
    private static boolean assignUsingCreatedByProfile(Case c, Case cToUpdate, Map<Id, User> userMap) {
		String profile = userMap.containsKey(c.CreatedById) && userMap.get(c.CreatedById).Profile != null ? userMap.get(c.CreatedById).Profile.Name : '';

        if (String.isNotBlank(profile) && profile.containsIgnoreCase(PROFILE_PEST)) {
            cToUpdate.OwnerId = fssettings.CS_Pest_Queue__c;
		   
				 
        } else if (String.isNotBlank(profile) && profile.containsIgnoreCase(PROFILE_CHEMICAL)) {
            cToUpdate.OwnerId = fssettings.CS_Chemical_Queue__c;
		   
			   
        } else if (String.isNotBlank(profile) && profile.containsIgnoreCase(PROFILE_HYGIENE)) {
            cToUpdate.OwnerId = fssettings.CS_Hygiene_Queue__c;
		   
			   
        } else {
            return false;
        }
        
        return true;
    }
    
    private static boolean assignCustomerService(Case c, Case cToUpdate, Map<Id, User> userMap) {
        String profile = userMap.containsKey(c.CreatedById) && userMap.get(c.CreatedById).Profile != null ? userMap.get(c.CreatedById).Profile.Name : '';
   		//03/12/2020: Varun:  For tickets created with RT Internal Data Review tickets should be assigned to Site Survey hygiene queue and not CS
    	if (String.isNotBlank(profile) && profile.containsIgnoreCase(PROFILE_CS) && !(c.RecordTypeId == internalDataReviewRecordTypeId || c.RecordTypeId == internalDataReviewTechRecordTypeId))
        {
            cToUpdate.OwnerId = c.CreatedById;
            return true;
        }
        
        return false;
    }
}