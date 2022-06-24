trigger ManageRelatedContactFields on Contact (after insert, after update) {
    Map<Id, User> userMap = new Map<Id, User>();
    
    for (Contact c : Trigger.new) {
        userMap.put(c.Id, new User(
            ContactId = c.Id,
            Title = c.Title,
            Phone = c.Phone,
            Fax = c.Fax,
            MobilePhone = c.MobilePhone,
            Street = c.MailingStreet,
            City = c.MailingCity,
            State = c.MailingState,
            PostalCode = c.MailingPostalCode,
            Country = c.MailingCountry,
            Email_Opt_Out__c = c.HasOptedOutOfEmail,
            Do_Not_Call__c = c.DoNotCall,
            Customer_Satisfaction_eSurveys__c = c.Customer_Satisfaction_eSurveys__c,
            Customer_Opinion_eSurveys__c = c.Customer_Opinion_eSurveys__c,
            Customer_eNewsletters__c = c.Customer_eNewsletters__c,
            Promotional_Offer_Emails__c = c.Promotional_Offer_Emails__c,
            Promotional_Mailings__c = c.Promotional_Mailings__c
        ));
    }
    
    if (!userMap.isEmpty()) {
        for (User u : [SELECT Id, ContactId, Title, Phone, Fax, MobilePhone, Street, City, State, PostalCode, Country, Email_Opt_Out__c, Do_Not_Call__c, Customer_Satisfaction_eSurveys__c, Customer_Opinion_eSurveys__c, Customer_eNewsletters__c, Promotional_Offer_Emails__c, Promotional_Mailings__c FROM User WHERE contactId IN :userMap.keyset()]) {
            User trgUsr = userMap.get(u.ContactId);
            trgUsr.Id = u.Id;
            
            if (
                trgUsr.Title == u.Title &&
                trgUsr.Phone == u.Phone &&
                trgUsr.Fax == u.Fax &&
                trgUsr.MobilePhone == u.MobilePhone &&
                trgUsr.Street == u.Street &&
                trgUsr.City == u.City &&
                trgUsr.State == u.State &&
                trgUsr.PostalCode == u.PostalCode &&
                trgUsr.Country == u.Country &&
                trgUsr.Email_Opt_Out__c == u.Email_Opt_Out__c && 
                trgUsr.Do_Not_Call__c == u.Do_Not_Call__c && 
                trgUsr.Customer_Satisfaction_eSurveys__c == u.Customer_Satisfaction_eSurveys__c &&
                trgUsr.Customer_Opinion_eSurveys__c == u.Customer_Opinion_eSurveys__c && 
                trgUsr.Customer_eNewsletters__c == u.Customer_eNewsletters__c && 
                trgUsr.Promotional_Offer_Emails__c == u.Promotional_Offer_Emails__c && 
                trgUsr.Promotional_Mailings__c == u.Promotional_Mailings__c
            ) {
                userMap.remove(u.ContactId);
            }
        }
    }
    
    if (!userMap.isEmpty()) {
        System.debug('Users from ManageRelatedContactfieldsTrigger' + userMap.values());
        Database.update(userMap.values(), false);
    }
}