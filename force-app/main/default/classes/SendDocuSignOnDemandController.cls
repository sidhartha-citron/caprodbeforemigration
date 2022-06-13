/**
* Name: EDW_ResourcePreferenceTableController
* Author: PwC
* Date Created: Feb 21, 2019
* Purpose: To initialize the ResendPOConfirmation lightning component, and send DocuSign Envelopes on demand through Conga Composer
*/ 
public class SendDocuSignOnDemandController {
	static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    static Conga_and_DocuSign_Settings__c congaSettings = Conga_and_DocuSign_Settings__c.getOrgDefaults();
    static final String ERROR_STATUS = 'Error',
        SUCCESS_STATUS = 'Success';
    
    /**
     * Validates the data on the Order before sending the data off to build the Conga REST API endpoint. Returns a status record.
     *
     * @param orderId  The ID of the Order that launched the ResendPOConfirmation lightning component
     */
    @AuraEnabled
    public static List<AuraStatusResponse> validateDataAndSend(String orderId) {
        if (String.isBlank(orderId)) {
            System.debug('bad data');
            return null;
        }
        
        List<AuraStatusResponse> responses = new List<AuraStatusResponse>();
        Order successfulOrder = new Order();
        
        for (Order o : [SELECT Id, ShipToContactId, Is_PO_Provided_by_Customer__c, Is_PO_Provided_by_Customer_After__c, Account.PO_Required_for_Orders__c, Line_of_Businesses__c, Emergency__c FROM Order WHERE Id = :orderId]) {
            if (String.isBlank(o.ShipToContactId)) {
                responses.add(new AuraStatusResponse(false, ERROR_STATUS, Label.Resend_PO_Ship_To_Contact_Required, o));
            }
            
            if (o.Is_PO_Provided_by_Customer__c || o.Is_PO_Provided_by_Customer_After__c) {
                responses.add(new AuraStatusResponse(false, ERROR_STATUS, Label.Resend_PO_PO_Already_Retrieved, o));
            }
            
            if (String.isBlank(o.Account.PO_Required_for_Orders__c)) {
                responses.add(new AuraStatusResponse(false, ERROR_STATUS, Label.PO_Number_Not_Required, o));
            }
            
            if (!congaSettings.Activate_Resend_PO_Outside_Pest_Control__c && o.Line_of_Businesses__c != dataSets.Pest_LOB__c) {
                responses.add(new AuraStatusResponse(false, ERROR_STATUS, Label.DocuSign_Currently_for_Pest_Control_Only, o));
            }
            
            if (!congaSettings.Activate_Resend_PO_for_Non_Emergencies__c && !o.Emergency__c) {
                responses.add(new AuraStatusResponse(false, ERROR_STATUS, Label.DocuSign_Currently_for_Emergency_Orders_Only, o));
            }
            
            successfulOrder = o;
        }
        
        if (!responses.isEmpty()) {
			return responses;
        }
        
        fireEmail(new List<String> { orderId });
        
        responses.add(new AuraStatusResponse(true, SUCCESS_STATUS, null, successfulOrder));
        
        return responses;
    }
    
    /**
     * The external point to build the Conga REST API endpoint
     *
     * @param orderIds  The IDs of the Orders to have a DocuSign Envelope sent
     */
    public static void fireEmail(List<String> orderIds) {
        Map<Id, String> congaUrls = buildCongaUrlToSendDocuSign(new Set<String>(orderIds));
        
        for (String url : congaUrls.values()) {
            System.debug('hit');
        	sendCongaEmail(url);
        }
    }
    
    /**
     * Sends off the Conga / DocuSign to the Conga REST API endpoint
     *
     * @param url  The built endpoint for the Conga REST API
     */
    @future(callout=true)
    private static void sendCongaEmail(String url) {
        System.debug('entered sendCongaEmail');
        //getting session id here because triggers can't grab session ids
        String content;
        
        if (Test.isRunningTest()) {
            content = 'Start_Of_Session_Id9End_Of_Session_Id';
        } else {
        	content = Page.SessionId.getContent().toString();
        }
        
        Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length(),
            e = content.indexOf('End_Of_Session_Id');
        String passedSessionId = content.substring(s, e);
        
        HttpRequest req = new HttpRequest();
        req.setMethod('GET');
        req.setTimeout(60000);
        req.setEndpoint(url + '&SessionId=' + passedSessionId);
           
        HttpResponse response =  new Http().send(req);
    }
    
    /**
     * Builds the Conga REST API endpoint based off the data on each Order to have a DocuSign Envelope delivered
     *
     * @param orderIds  The IDs of the Orders to have a DocuSign Envelope sent
     */
    public static Map<Id, String> buildCongaUrlToSendDocuSign(Set<String> orderIds) {
        String servURL = Url.getSalesforceBaseUrl().toExternalForm()+'/services/Soap/u/29.0/'+UserInfo.getOrganizationId();
        
        Map<Id, Order> orders = new Map<Id, Order>([SELECT Id, ShipToContactId, AccountId, EffectiveDate, Account.PO_Required_for_Orders__c, Account.PO_Required_on_Line_Item__c FROM Order WHERE Id IN :orderIds]);
        Map<Id, String> orderUrlMap = new Map<Id, String>();
        
        for (Order o : orders.values()) {       
            Integer reminderInDays = o.Account.PO_Required_for_Orders__c == dataSets.PO_Required_Before_Label__c ? sendReminderIn(o.EffectiveDate) : Integer.valueOf(congaSettings.Business_Days_to_Resend_DocuSign_After__c);
            String orderItemQuery = o.Account.PO_Required_on_Line_Item__c ? '&QueryId=[ois]' + congaSettings.Multiple_PO_Numbers_Query_Id__c + '?pv0=' + o.Id : '&QueryId=[ois]' + congaSettings.Get_All_Order_Products_Conga_Query_Id__c + '?pv0=' + o.Id;
            String serviceAmountQuery = '&QueryId=[osa]' + congaSettings.Get_Service_Amount_Conga_Query_Id__c + '?pv0=' + o.Id;
            String emailTemplateId = o.Account.PO_Required_on_Line_Item__c ? congaSettings.Multiple_PO_Numbers_Template_Id__c : congaSettings.PO_Number_Request_Template_Id__c;
            //String docuSignRemindAgainIn = o.Account.PO_Required_for_Orders__c == dataSets.PO_Required_Before_Label__c ? '' : '&DocuSignRemindAgainIn=' + congaSettings.DocuSign_Reminder_Frequency__c;
            
            String formula =
                congaSettings.Conga_Root_Endpoint__c +
                '?ServerUrl=' + EncodingUtil.urlEncode(servURL, 'UTF-8') +
                '&Id=' + o.Id +
                orderItemQuery +
                serviceAmountQuery +
                '&PS0=1' +
                '&PS1=1' +
                '&DS3=1' +
                '&TemplateId=' + emailTemplateId +
                '&DS7=17' +
                '&EmailFromId=' + dataSets.Customer_Success_OWA_Id__c +
                '&EmailToId=' + o.ShipToContactId +
                '&SC0=1' +
                '&FP0=1' +
                '&APIMode=17' +
                '&DocuSignVisible=1' +
                '&DocuSignEmailSubject=' + congaSettings.PO_Number_Request_Email_Subject__c +
                '&DocuSignCustomField1=dsfs__Contact2eSignDoc01__c' +
                '&DocuSignCustomFieldValue1=' + o.ShipToContactId +
                '&DocuSignR1Type=Signer' +
                '&DocuSignR1Role=Signer+1' +
                '&DocuSignR1RoutingOrder=1' +
                '&DocuSignR1ID=' + o.ShipToContactId +
                '&DocuSignRelatedAccountId=' + o.AccountId +
                '&DocuSignEmailBody=' + congaSettings.PO_Number_Request_Email_Body__c +
                '&DocuSignSendAsUserId=' + congaSettings.DocuSign_Running_User__c + 
            	'&DocuSignSendReminders=1' +
                '&DocuSignRemindIn=' + reminderInDays +
                '&DocuSignRemindAgainIn=' + congaSettings.DocuSign_Reminder_Frequency__c +//docuSignRemindAgainIn +
                '&DocuSignEndpoint=' + congaSettings.DocuSign_Endpoint_Type__c;
            
            orderUrlMap.put(o.Id, formula);
        }
        
        return orderUrlMap;
    }
    
    /**
     * Calculates when a DocuSign Envelope should send a reminder to a Ship-To Contact
     *
     * @param theDate  The date leveraged to run the business day calculation
     */
    private static Integer sendReminderIn(Date theDate) {
        Integer index = congaSettings.Business_Days_to_Resend_DocuSign_Before__c == null ? 0 : Integer.valueOf(congaSettings.Business_Days_to_Resend_DocuSign_Before__c);
                
        while (index > 0) {
            theDate = theDate.addDays(-1);
            Integer dayOfWeek = Math.Mod(Date.newInstance(1900, 1, 7).daysBetween(theDate), 7);
            
            if (dayOfWeek != 6 && dayOfWeek != 0) {
                index--;
            }
        }
        
        return Date.today().daysBetween(theDate);
    }
}