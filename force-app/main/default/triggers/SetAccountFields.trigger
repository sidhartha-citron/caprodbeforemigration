trigger SetAccountFields on Account (before insert, before update) {
    
    Map<Id, OperatingHours> operatingHours = new Map<Id, OperatingHours>();
    
    Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
    Map<String,Province_Time_Zones_Operating_Hours__c> timeZoneMap = Province_Time_Zones_Operating_Hours__c.getAll();
    String loggedInUserProfileId = UserInfo.getProfileId();
    
    Set<Id> creditCheckFieldAccessible = new Set<Id>{custSetting.System_Administrator_Profile_Id__c, custSetting.Integration_User_Profile__c};
    Set<Id> addressInvoiceFieldsOHAccessible = new Set<Id>{custSetting.System_Administrator_Profile_Id__c, custSetting.Integration_User_Profile__c, custSetting.Customer_Service_Profile_Id__c};
    
    for (Account a : Trigger.new) {
        Account oldRec = (Trigger.isInsert ? new Account() : Trigger.oldMap.get(a.Id));
        
        if (a.Credit_Check__c == 'Not Required' && oldRec.Credit_Check__c != 'Not Required' && !creditCheckFieldAccessible.contains(loggedInUserProfileId)) {
            a.Credit_Check__c.addError('You do not have permission to set this value.');
        }
        
        if(a.OperatingHoursId!=null){
            operatingHours.put(a.OperatingHoursId, null);
        }
        if(a.Chemical_Operating_Hours__c!=null){
            operatingHours.put(a.Chemical_Operating_Hours__c, null);
        }
        if(a.Hygiene_Operating_Hours__c!=null){
            operatingHours.put(a.Hygiene_Operating_Hours__c, null);
        }
        if(a.Life_Safety_Operating_Hours__c!=null){
            operatingHours.put(a.Life_Safety_Operating_Hours__c, null);
        }
        if(a.Pest_Control_Operating_Hours__c!=null){
            operatingHours.put(a.Pest_Control_Operating_Hours__c, null);
        }
        
        if(Trigger.isUpdate) {
            System.debug('Update Account: ' + a.AccPac_Account__c);
            System.debug('Update Account: ' + a.Invoice_Frequency__c);
            System.debug('Update Account: ' + oldRec.Invoice_Frequency__c);
            System.debug('Update Account: ' + addressInvoiceFieldsOHAccessible);
            System.debug('Update Account: ' + loggedInUserProfileId);
            
            if(!addressInvoiceFieldsOHAccessible.contains(loggedInUserProfileId) && a.AccPac_Account__c!=null){
                
                /* @author Ahsan Butt 11/5/2018 (this logic will be handled in config)
                if(a.Invoice_Frequency__c!=oldRec.Invoice_Frequency__c) {
                    a.Invoice_Frequency__c.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to modify Invoice Frequency');
                }
                
                Boolean shippingAddressChanged = a.Shipping_Suite_Number__c!=oldRec.Shipping_Suite_Number__c || a.ShippingStreet!=oldRec.ShippingStreet || a.ShippingCity!=oldRec.ShippingCity
                    || a.ShippingState!=oldRec.ShippingState || a.ShippingPostalCode!=oldRec.ShippingPostalCode || a.ShippingCountry!=oldRec.ShippingCountry;
                
                System.debug('**Shipping Address Changed** ' + shippingAddressChanged);
                
                if(shippingAddressChanged){
                    a.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to change Shipping Address Fields');
                }
                
                Boolean billingAddressChanged = a.Billing_Suite_Number__c!=oldRec.Billing_Suite_Number__c || a.BillingStreet!=oldRec.BillingStreet || a.BillingCity!=oldRec.BillingCity
                    || a.BillingState!=oldRec.BillingState || a.BillingPostalCode!=oldRec.BillingPostalCode || a.BillingCountry!=oldRec.BillingCountry;
                
                System.debug('**Billing Address Changed** ' + billingAddressChanged);
                
                if(billingAddressChanged){
                    a.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to change Billing Address Fields');
                }
                
                if(a.OperatingHoursId!=oldRec.OperatingHoursId) {
                    a.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to change Standard Operating Hours');
                }
                
                if(a.Hygiene_Operating_Hours__c!=oldRec.Hygiene_Operating_Hours__c) {
                    a.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to change Hygiene Operating Hours');
                }
                
                if(a.Chemical_Operating_Hours__c!=oldRec.Chemical_Operating_Hours__c) {
                    a.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to change Chemical Operating Hours');
                }
                
                if(a.Pest_Control_Operating_Hours__c!=oldRec.Pest_Control_Operating_Hours__c) {
                    a.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to change Pest Control Operating Hours');
                }
                
                if(a.Life_Safety_Operating_Hours__c!=oldRec.Life_Safety_Operating_Hours__c) {
                    a.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to change Life Safety Operating Hours');
                }
                
                if(a.Service_Territory__c!=oldRec.Service_Territory__c) {
                    a.addError('Please submit a case to Customer Success using the "Ticket-Account Information Change" quick action to change Service Territory');
                }*/
            }
        }
    }
    operatingHours.remove(null);
    operatingHours = new Map<Id, OperatingHours>([SELECT Id, Operating_Hours_Type__c, TimeZone FROM OperatingHours WHERE Id IN:operatingHours.keySet()]);
    
    if(!operatingHours.isEmpty()){
        for(Account a : Trigger.new) {
            Account oldRec = (Trigger.isInsert ? new Account() : Trigger.oldMap.get(a.Id));
            
            OperatingHours oh = operatingHours.get(a.OperatingHoursId);
            OperatingHours hygieneOh = operatingHours.get(a.Hygiene_Operating_Hours__c);
            OperatingHours chemicalOh = operatingHours.get(a.Chemical_Operating_Hours__c);
            OperatingHours lifeSafetyOh = operatingHours.get(a.Life_Safety_Operating_Hours__c);
            OperatingHours pestControlOh = operatingHours.get(a.Pest_Control_Operating_Hours__c);
            
            if(oh!=null){
                if(oh.Operating_Hours_Type__c!=custSetting.Operating_Hours_Type_Account__c){
                    a.OperatingHoursId.addError('Please make sure you only add Operating Hours of Type Account Operating Hours to an Account');
                }
                
                if(a.ShippingCountry == null || a.ShippingCity == null || a.ShippingState == null || a.ShippingStreet == null || a.ShippingPostalCode == null) {
                    a.OperatingHoursId.addError('Please complete Shipping Country, Shipping State, Shipping City and Shipping Street fields for this Account before adding/changing Operating Hours');
                }
                
                if(String.isNotBlank(a.ShippingState)) {
                    Province_Time_Zones_Operating_Hours__c timeZone = timeZoneMap.get(a.ShippingState);
                    if(timeZone!=null) {
                        String timeZoneForProvince = timeZoneMap.get(a.ShippingState).TimeZone__c;
                        if(oh!=null && String.isNotBlank(timeZoneForProvince) && !oh.TimeZone.equalsIgnoreCase(timeZoneForProvince)) {
                            a.OperatingHoursId.addError('Operating Hours TimeZone should match with Province Time Zone; Province: ' + a.ShippingState + ' TimeZone: ' + timeZoneForProvince);
                        }
                    }
                }
            }
            
            if(hygieneOh!=null){
                if(hygieneOh.Operating_Hours_Type__c!=custSetting.Operating_Hours_Type_Account__c){
                    a.Hygiene_Operating_Hours__c.addError('Please make sure you only add Operating Hours of Type Account Operating Hours to an Account');
                }
                
                if(a.ShippingCountry == null || a.ShippingCity == null || a.ShippingState == null || a.ShippingStreet == null || a.ShippingPostalCode == null) {
                    a.Hygiene_Operating_Hours__c.addError('Please complete Shipping Country, Shipping State, Shipping City and Shipping Street fields for this Account before adding/changing Operating Hours');
                }
                
                if(String.isNotBlank(a.ShippingState)) {
                    Province_Time_Zones_Operating_Hours__c timeZone = timeZoneMap.get(a.ShippingState);
                    if(timeZone!=null) {
                        String timeZoneForProvince = timeZoneMap.get(a.ShippingState).TimeZone__c;
                        if(hygieneOh!=null && String.isNotBlank(timeZoneForProvince) && !hygieneOh.TimeZone.equalsIgnoreCase(timeZoneForProvince)) {
                            a.Hygiene_Operating_Hours__c.addError('Hygiene Operating Hours TimeZone should match with Province Time Zone; Province: ' + a.ShippingState + ' TimeZone: ' + timeZoneForProvince);
                        }
                    }
                }
            }
            
            if(chemicalOh!=null){
                if(chemicalOh.Operating_Hours_Type__c!=custSetting.Operating_Hours_Type_Account__c){
                    a.Chemical_Operating_Hours__c.addError('Please make sure you only add Operating Hours of Type Account Operating Hours to an Account');
                }
                
                if(a.ShippingCountry == null || a.ShippingCity == null || a.ShippingState == null || a.ShippingStreet == null || a.ShippingPostalCode == null) {
                    a.Chemical_Operating_Hours__c.addError('Please complete Shipping Country, Shipping State, Shipping City and Shipping Street fields for this Account before adding/changing Operating Hours');
                }
                
                if(String.isNotBlank(a.ShippingState)) {
                    Province_Time_Zones_Operating_Hours__c timeZone = timeZoneMap.get(a.ShippingState);
                    if(timeZone!=null) {
                        String timeZoneForProvince = timeZoneMap.get(a.ShippingState).TimeZone__c;
                        if(chemicalOh!=null && String.isNotBlank(timeZoneForProvince) && !chemicalOh.TimeZone.equalsIgnoreCase(timeZoneForProvince)) {
                            a.Chemical_Operating_Hours__c.addError('Chemical Operating Hours TimeZone should match with Province Time Zone; Province: ' + a.ShippingState + ' TimeZone: ' + timeZoneForProvince);
                        }
                    }
                }
            }
            
            if(lifeSafetyOh!=null){
                if(lifeSafetyOh.Operating_Hours_Type__c!=custSetting.Operating_Hours_Type_Account__c){
                    a.Life_Safety_Operating_Hours__c.addError('Please make sure you only add Operating Hours of Type Account Operating Hours to an Account');
                }
                
                if(a.ShippingCountry == null || a.ShippingCity == null || a.ShippingState == null || a.ShippingStreet == null || a.ShippingPostalCode == null) {
                    a.Life_Safety_Operating_Hours__c.addError('Please complete Shipping Country, Shipping State, Shipping City and Shipping Street fields for this Account before adding/changing Operating Hours');
                }
                
                if(String.isNotBlank(a.ShippingState)) {
                    Province_Time_Zones_Operating_Hours__c timeZone = timeZoneMap.get(a.ShippingState);
                    if(timeZone!=null) {
                        String timeZoneForProvince = timeZoneMap.get(a.ShippingState).TimeZone__c;
                        if(lifeSafetyOh!=null && String.isNotBlank(timeZoneForProvince) && !lifeSafetyOh.TimeZone.equalsIgnoreCase(timeZoneForProvince)) {
                            a.Life_Safety_Operating_Hours__c.addError('Life Safety Operating Hours TimeZone should match with Province Time Zone; Province: ' + a.ShippingState + ' TimeZone: ' + timeZoneForProvince);
                        }
                    }
                }
            }
            
            if(pestControlOh!=null){
                if(pestControlOh.Operating_Hours_Type__c!=custSetting.Operating_Hours_Type_Account__c){
                    a.Pest_Control_Operating_Hours__c.addError('Please make sure you only add Operating Hours of Type Account Operating Hours to an Account');
                }
                
                if(a.ShippingCountry == null || a.ShippingCity == null || a.ShippingState == null || a.ShippingStreet == null || a.ShippingPostalCode == null) {
                    a.Pest_Control_Operating_Hours__c.addError('Please complete Shipping Country, Shipping State, Shipping City and Shipping Street fields for this Account before adding/changing Operating Hours');
                }
                
                if(String.isNotBlank(a.ShippingState)) {
                    Province_Time_Zones_Operating_Hours__c timeZone = timeZoneMap.get(a.ShippingState);
                    if(timeZone!=null) {
                        String timeZoneForProvince = timeZoneMap.get(a.ShippingState).TimeZone__c;
                        if(pestControlOh!=null && String.isNotBlank(timeZoneForProvince) && !pestControlOh.TimeZone.equalsIgnoreCase(timeZoneForProvince)) {
                            a.Pest_Control_Operating_Hours__c.addError('Pest Control Operating Hours TimeZone should match with Province Time Zone; Province: ' + a.ShippingState + ' TimeZone: ' + timeZoneForProvince);
                        }
                    }
                }
            }
        }
    }
}