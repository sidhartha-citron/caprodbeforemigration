public class QuoteTemplateActions {
    Quote rec { get; private set; }
    Quote_Settings__c qSettings { get; private set; }
    
    public QuoteTemplateActions(ApexPages.StandardController controller) {
        qSettings = Quote_Settings__c.getOrgDefaults();
        if (qSettings == null) {
            qSettings = new Quote_Settings__c();
        }
        rec = [SELECT Id, 
                Opportunity_Line_of_Business__c, Language_Preference__c, AccountId, Account_Name__c, Account_Owner_ID__c, Account_Credit_Status__c, Account.Credit_Check__c, Account.Name, Account.Credit_Limit__c, Account.Credit_Check_Case__c, Contact_Email_Address__c, Quote_With_Annual_Totals__c, DocuSign_Subject__c, Contact_ID__c, Maximum_Line_Item_Discount__c, Total_Monthly_Revenue__c, HasChemicalEquipment__c, Approval_Status__c 
              FROM Quote 
              WHERE Id = :controller.getRecord().Id];
    }

    public PageReference SelectTemplateRedirect() {
        if (validateQuote()) {
            String formattedDate = System.now().format('YYYY-MM-DD');
            String fileName = rec.Account_Name__c + '%20-%20' + rec.Opportunity_Line_of_Business__c + '%20Proposal%20-%20' + formattedDate;
            return new PageReference('/apex/APXTConga4__Conga_Composer?id=' + rec.Id + '&DefaultPDF=1&TemplateGroup=' + rec.Language_Preference__c + '&OFN=' + fileName);
        } else {
            return null;
        }
    }
    
    public PageReference AutoPdfRedirect() {
        if (validateQuote()) {
            String templateId = this.generateTemplateIdString();
            if (templateId == null) {
                rec.addError('Unable to select templates.  Please contact a system administrator.');
                return null;
            }
            
            return new PageReference('/apex/APXTConga4__Conga_Composer?id=' + rec.Id + '&FP0=1&DefaultPDF=1&DS7=5&TemplateId=' + templateId);
        } else {
            return null;
        }
    }
    
    public PageReference SendDocusignRedirect() {
        if (validateQuote()) {
            String templateId = this.generateTemplateIdString();
            System.debug('ValidateQuote: ' + templateId);
            if (templateId == null) {
                rec.addError('Unable to select templates.  Please contact a system administrator.');
                return null;
            }
            // sandbox return new PageReference('/apex/APXTConga4__Conga_Composer?id=' + rec.Id + '&TemplateId=' + templateId + '&FP0=1&DefaultPDF=1&DS7=5&APDF=0&DocuSignEmailSubject=' + EncodingUtil.urlEncode(rec.DocuSign_Subject__c,'UTF-8') + '&DocuSignVisible=1&DocuSignR1ID=' + rec.Contact_ID__c + '&DocuSignR1Type=Signer&DocuSignR1Role=Signer+1&DocuSignR1RoutingOrder=2&DocuSignR2ID=' + rec.Account_Owner_ID__c + '&DocuSignR2Type=Signer&DocuSignR2Role=Signer+2&DocuSignR2RoutingOrder=1' + (!qSettings.Demo__c ? '&DocuSignEndpoint=Demo' : EncodingUtil.urlEncode('','UTF-8')));
            return new PageReference('/apex/APXTConga4__Conga_Composer?id=' + rec.Id + '&TemplateId=' + templateId + '&FP0=1&DefaultPDF=1&DS7=17&APDF=0&DocuSignEmailSubject=' + EncodingUtil.urlEncode(rec.DocuSign_Subject__c,'UTF-8') + '&DocuSignVisible=1&DocuSignR1ID=' + rec.Contact_ID__c + '&DocuSignR1Type=Signer&DocuSignR1Role=Signer+1&DocuSignR1RoutingOrder=2&DocuSignR2ID=' + rec.Account_Owner_ID__c + '&DocuSignR2Type=Signer&DocuSignR2Role=Signer+2&DocuSignR2RoutingOrder=1'); 
        } else {
            return null;
        }
    }
    
    private Boolean validateQuote() {
        if (rec != null && qSettings.Check_Contact_Email__c && rec.Contact_Email_Address__c == null) {
            rec.addError('Quote cannot be generated. Contact record does not have an email address.');
            return false;
        } else if (rec != null && qSettings.Check_Account_Credit_Status__c && rec.Account_Credit_Status__c) {
            rec.addError('Quote cannot be generated.  Please check the Account Credit Status.');
            return false;
        } else if (rec != null && qSettings.Check_Approval_Status__c && (rec.Maximum_Line_Item_Discount__c >= 30 && !rec.Approval_Status__c.equalsIgnoreCase('Approved'))) {
            rec.addError('Quote cannot be generated. Please get Manager Approval for the Discounts.');
            return false;
        } 
        return true;
    }
    
    private String generateTemplateIdString() {
        String formattedDate = System.now().format('YYYY-MM-dd');
        String templateId = (rec.Language_Preference__c=='French' ? (rec.Quote_With_Annual_Totals__c ? qSettings.F_Services_Template__c : qSettings.F_Products_Template__c) : (rec.Quote_With_Annual_Totals__c ? qSettings.E_Services_Template__c : qSettings.E_Products_Template__c));
        String fileName = rec.Account_Name__c + ' - ' + rec.Opportunity_Line_of_Business__c + ' Proposal - ' + formattedDate;
        String retVal = '[' + fileName + ']' + templateId;
        
        //Credit Form logic - Commented out because not part of deployment
        //retVal += createCreditCheckCase();
        retVal = retVal.replaceAll('\\s','%20');
        System.debug('generated Template Id String: ' + retVal);
        return retVal;
    }
    
    private String createCreditCheckCase() {
        System.debug('running credit check logic');
        System.debug('credit threshold: ' + qSettings.Credit_Check_Threshold__c);
        System.debug('quote monthly revenue: ' + rec.Total_Monthly_Revenue__c);
        System.debug('quote chem equipment: ' + rec.HasChemicalEquipment__c);
        
        if (
            (qSettings.Credit_Check_Threshold__c != null && rec.Total_Monthly_Revenue__c > qSettings.Credit_Check_Threshold__c) ||
            rec.HasChemicalEquipment__c
        ) {
            System.debug('credit form required');
            String creditFormId = (rec.Language_Preference__c=='French' ? qSettings.F_Credit_Form_Template__c : qSettings.E_Credit_Form_Template__c);
            String creditFileName = (rec.Language_Preference__c=='French' ? 'Formulaire Ouverture de compte' : 'Credit Application Form');

            //If a credit check case already exists, don't create another
            System.debug('Account credit state: ' + rec.Account.Credit_Check__c);
            System.debug('Existing credit case: ' + rec.Account.Credit_Check_Case__c);
            if (rec.Account.Credit_Check_Case__c == null && rec.Account.Credit_Check__c == 'Not Checked') {
                Case c = new Case(
                    RecordTypeId = qSettings.Default_Credit_Check_Record_Type_Id__c,
                    OwnerId = qSettings.Default_Credit_Check_Case_Owner__c,
                    Subject = 'Credit Check: ' + rec.Account.Name + ' [' + System.now().format('YYYY-MM-dd') + ']',
                    Status = 'New',
                    Origin = 'Email',
                    AccountId = rec.AccountId,
                    Credit_Limit__c = rec.Account.Credit_Limit__c
                );
                System.debug('creating case: ' + c);
                insert c;
                
                Account acc = new Account(
                    Id = rec.AccountId,
                    Credit_Check_Case__c = c.Id,
                    Credit_Check__c = 'In Progress'
                );
                System.debug('updating account: ' + acc);
                update acc;
            }
            return ',[' + creditFileName + ']' + creditFormId;
        }
        System.debug('credit form not required');
        return '';
    }
}