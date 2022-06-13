trigger ManageRelatedUserFields on User (after insert, after update) {
    Map<Id, Contact> contactMap = new Map<Id, Contact>();
    
    for (User u : Trigger.new) {
        if (u.ContactId != null) {
            contactMap.put(u.ContactId, new Contact(
                Id = u.ContactId,
                Title = u.Title,
                Phone = u.Phone,
                Fax = u.Fax,
                MobilePhone = u.MobilePhone,
                MailingStreet = u.Street,
                MailingCity = u.City,
                MailingState = u.State,
                MailingPostalCode = u.PostalCode,
                MailingCountry = u.Country,
                HasOptedOutOfEmail = u.Email_Opt_Out__c,
                DoNotCall = u.Do_Not_Call__c,
                Customer_Satisfaction_eSurveys__c = u.Customer_Satisfaction_eSurveys__c,
                Customer_Opinion_eSurveys__c = u.Customer_Opinion_eSurveys__c,
                Customer_eNewsletters__c = u.Customer_eNewsletters__c,
                Promotional_Offer_Emails__c = u.Promotional_Offer_Emails__c,
                Promotional_Mailings__c = u.Promotional_Mailings__c
            ));
        }
    }
    
    if (!contactMap.isEmpty()) {
        for (Contact c : [SELECT Id, Title, Phone, Fax, MobilePhone, MailingStreet, MailingCity, MailingState, MailingPostalCode, MailingCountry, HasOptedOutOfEmail, DoNotCall, Customer_Satisfaction_eSurveys__c, Customer_Opinion_eSurveys__c, Customer_eNewsletters__c, Promotional_Offer_Emails__c, Promotional_Mailings__c FROM Contact WHERE Id IN :contactMap.keyset()]) {
            Contact trgCon = contactMap.get(c.Id);
            
            if (
                trgCon.Title == c.Title &&
                trgCon.Phone == c.Phone &&
                trgCon.Fax == c.Fax &&
                trgCon.MobilePhone == c.MobilePhone &&
                trgCon.MailingStreet == c.MailingStreet &&
                trgCon.MailingCity == c.MailingCity &&
                trgCon.MailingState == c.MailingState &&
                trgCon.MailingPostalCode == c.MailingPostalCode &&
                trgCon.MailingCountry == c.MailingCountry &&
                trgCon.HasOptedOutOfEmail == c.HasOptedOutOfEmail && 
                trgCon.DoNotCall == c.DoNotCall && 
                trgCon.Customer_Satisfaction_eSurveys__c == c.Customer_Satisfaction_eSurveys__c &&
                trgCon.Customer_Opinion_eSurveys__c == c.Customer_Opinion_eSurveys__c && 
                trgCon.Customer_eNewsletters__c == c.Customer_eNewsletters__c && 
                trgCon.Promotional_Offer_Emails__c == c.Promotional_Offer_Emails__c && 
                trgCon.Promotional_Mailings__c == c.Promotional_Mailings__c
            ) {
                contactMap.remove(c.Id);
            }
        }
    }
    
    if (!contactMap.isEmpty()) {
        Database.update(contactMap.values(), false);
    }
}