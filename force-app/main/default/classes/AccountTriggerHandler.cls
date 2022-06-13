/**
 * AccountTriggerHandler : Single trigger to handle all account functionality
 * FD:
 * 1. Account Hierarchy management -- Aieleeta
 *   1.1 To check if an Account has at least one child and if yes, restrict it from becoming the child to another Account.
 *   1.2 To check if an Account has a parent and if yes, restrict it from becoming a parent to another Account.
 *   1.3 To check if isParent__c of an Account was previously set to true when a child is added to the Account; If not, update the field to true.
 *   1.4 To check if the deleted child account is the only child of Parent; If yes, update isParent__c of Parent Account to false.
 *
 * 2. Assign related Contact, Oppty and Activity to new Account owner if the running user is integration user-- Greg Hacic
 *
 * 3. Validate all type of Operating Hours on account
 *  3.1 Completed Shipping Address is always required to set up any type of operating hours
 *  3.2 Any Operating Hours Time zone shall match shipping address time zone
 *  3.3 Check the Type of Operating Hours is planned to be used for Account
 *  3.4 Check if user has permission to set Credit Check to 'Not Required' (TO BE HANDLED IN FINANCE RELATED METHOD)
 * 4. Sync community user profile (commented out for now, pending community deployment by PwC ???)
 * 
 * @author Shashi
 * @version 1.0 
 * @since 2016-06-11
 **/
public class AccountTriggerHandler extends TriggerHandler {
    private List<Account> listnewAccounts;
    private List<Account> listoldAccounts;
    private Map<Id,Account> mapnewAccounts;
    private Map<Id,Account> mapoldAccounts;
    
    public AccountTriggerHandler(){
        this.setMaxLoopCount(40);
        listnewAccounts = Trigger.new;
        listoldAccounts = Trigger.old;
        mapnewAccounts = (Map<Id,Account>)Trigger.newMap;
        mapoldAccounts = (Map<Id,Account>)Trigger.oldMap;
    }
    
    protected override void beforeInsert(){
        System.debug('==BEFORE INSERT==');
        //set shipping address from billing
        copyBillingAddressToShippingAddress();
        
        //FD3.1~3.3 - Validate all types of Operating Hours on account BEFORE INSERT
    	setAccountFields();

        //Set the Service Territory if not available on new account creation
        setServiceTerritoryIns();
        
        //stamp FSA based on shipping postalcode
        stampRegion();

        
    }
    
    protected override void beforeUpdate(){
        System.debug('==BEFORE UPDATE==');
        //FD1.1 - To check if an Account has at least one child and if yes, restrict it from becoming the child to another Account.
        //FD1.2 - To check if an Account has a parent and if yes, restrict it from becoming a parent to another Account.
        AccountUtil.ValidateAccountforParent(listnewAccounts,mapoldAccounts);

        //FD3.1~3.3 - Validate all types of Operating Hours on account BEFORE UPDATE
        //FD3.4 - Check if user has permission to set Credit Check to 'Not Required'
    	setAccountFields();
        
        //Set Service Territory if postalcode changed and service territory did not change
        setServiceTerritoryUpt();
        
        //stamp FSA based on shipping postalcode
        stampRegion();
    }
    
    protected override void beforeDelete(){
       //FD1.4 - To check if the deleted child account is the only child of Parent; If yes, update isParent__c of Parent Account to false.
        AccountUtil.updateIsParentOnAccount(listoldAccounts,mapoldAccounts,'delete');
    }
    
    protected override void afterInsert(){
        //FD1 - Account Hierarchy Management -- TO BE MODIFIED
        AccountUtil.ValidateAccountforParent(listnewAccounts,mapoldAccounts);
    }
    
    protected override void afterUpdate(){
        System.debug('==AFTER UPDATE==');
        //FD1 - Account Hierarchy Management -- TO BE MODIFIED
        //FD1.3 To check if isParent__c of an Account was previously set to true when a child is added to the Account; If not, update the field to true.
        AccountUtil.updateIsParentOnAccount(listnewAccounts,mapoldAccounts,'update');
        //FD2 - Assign related Contact, Oppty and Activity to new Account owner if running user is Integration user    
        reassignRelated_Conts_Opps_Activities();
        //FD4 - ManageRelatedAccountRecords trigger logic (TO BE ACTIVATED UPON COMMUNITY FEATURE DEPLOYMENT?)   
        //syncCommunityUserProfiles();
    }
    
    protected override void afterDelete(){
        
    }
    
    protected override void afterUndelete(){
        
    }
    
    /**
     * 
     **/
    private void reassignRelated_Conts_Opps_Activities(){
        Field_Service_Settings__c fss = Field_Service_Settings__c.getOrgDefaults();
        
        if (UserInfo.getUserId() == fss.Integration_User_Id__c){
            try {
                Set<Id> accountIds = new Set<Id>(); //set for holding the Ids of all Accounts that have been assigned to new Owners
                Map<Id, String> oldOwnerIds = new Map<Id, String>(); //map for holding the old account ownerId
                Map<Id, String> newOwnerIds = new Map<Id, String>(); //map for holding the new account ownerId
                Contact[] contactUpdates = new Contact[0]; //Contact sObject to hold OwnerId updates
                Opportunity[] opportunityUpdates = new Opportunity[0]; //Opportunity sObject to hold OwnerId updates
                Task[] taskUpdates = new Task[0]; //Task sObject to hold OwnerId updates
                Event[] eventUpdates = new Event[0]; //Event sObject to hold OwnerId updates
                
                for (Account a : listnewAccounts) { //for all records
                    if (a.OwnerId != mapoldAccounts.get(a.Id).OwnerId) {
                        oldOwnerIds.put(a.Id, mapoldAccounts.get(a.Id).OwnerId); //put the old OwnerId value in a map
                        newOwnerIds.put(a.Id, a.OwnerId); //put the new OwnerId value in a map
                        accountIds.add(a.Id); //add the Account Id to the set
                    }
                }
                
                if (!accountIds.isEmpty()) { //if the accountIds Set is not empty
                    //SOQL to get Contacts, Opportunities, Tasks and Events for updated Accounts
                    for (Account act : [SELECT Id, (SELECT Id, OwnerId FROM Contacts), 
                                        (SELECT Id, OwnerId FROM Opportunities WHERE IsClosed = False),
                                        (SELECT Id, OwnerId FROM Tasks WHERE IsClosed = False),
                                        (SELECT Id, OwnerId FROM Events WHERE startDateTime >= TODAY) FROM Account WHERE Id in :accountIds]){ 
                                            
                    	String newOwnerId = newOwnerIds.get(act.Id); //get the new OwnerId value for the account
                        String oldOwnerId = oldOwnerIds.get(act.Id); //get the old OwnerId value for the account
                                            
                        for (Contact c : act.Contacts) { //for all contacts
                        	if (c.OwnerId == oldOwnerId) { //if the contact is assigned to the old account Owner
                            	Contact updatedContact = new Contact(Id = c.Id, OwnerId = newOwnerId); //create a new Contact sObject
                                contactUpdates.add(updatedContact); //add the contact to our List of updates
                           	}
                        }
                        for (Opportunity o : act.Opportunities) { //for all opportunities
                         	System.debug('Opportunity found:' + o.OwnerId);
                            if (o.OwnerId == oldOwnerId) { //if the opportunity is assigned to the old account Owner
                            	Opportunity updatedOpportunity = new Opportunity(Id = o.Id, OwnerId = newOwnerId); //create a new Opportunity sObject
                                opportunityUpdates.add(updatedOpportunity); //add the opportunity to our List of updates
                            }
                        }
                        for (Task t : act.Tasks) { //for all Tasks
                         	if (t.OwnerId == oldOwnerId) { //if the Task is assigned to the old account Owner
                            	Task updatedTask = new Task(Id = t.Id, OwnerId = newOwnerId); //create a new Task sObject
                                taskUpdates.add(updatedTask); //add the Task to our List of updates
                            }
                        }    
                        for (Event e : act.Events) { //for all Events
                         	if (e.OwnerId == oldOwnerId) { //if the Event is assigned to the old account Owner
                            	Event updatedEvent = new Event(Id = e.Id, OwnerId = newOwnerId); //create a new Event sObject
                                eventUpdates.add(updatedEvent); //add the Event to our List of updates
                            }
                        }    
                  	}
                    update contactUpdates; //update the Contacts
                    update opportunityUpdates; //update the Opportunities
                    update taskUpdates; //update the Opportunities
                    update eventUpdates; //update the Opportunities
                }
            } catch(Exception e) { //catch errors
                System.Debug('reassignRelatedContactsAndOpportunitiesAndActivities failure: '+ e.getMessage()); //write error to the debug log
            }
        }
    }
    
    /**
     * 
     **/
    private void setAccountFields(){
        String loggedInUserProfileId = UserInfo.getProfileId();
        Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
        
        Set<Id> creditCheckFieldAccessible = new Set<Id>{custSetting.System_Administrator_Profile_Id__c, custSetting.Integration_User_Profile__c};
        Set<Id> addressInvoiceFieldsOHAccessible = new Set<Id>{custSetting.System_Administrator_Profile_Id__c, custSetting.Integration_User_Profile__c, custSetting.Customer_Service_Profile_Id__c};
                
        Map<Id, OperatingHours> operatingHours = new Map<Id, OperatingHours>();
        Map<String,Province_Time_Zones_Operating_Hours__c> timeZoneMap = Province_Time_Zones_Operating_Hours__c.getAll();
        
        for (Account a : listnewAccounts){
            Account oldRec = (Trigger.isInsert ? new Account() : mapoldAccounts.get(a.Id));
            
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
        }
        
        operatingHours.remove(null);
        operatingHours = new Map<Id, OperatingHours>([SELECT Id, Operating_Hours_Type__c, TimeZone FROM OperatingHours WHERE Id IN:operatingHours.keySet()]);
        if(!operatingHours.isEmpty()){
            for(Account a : listnewAccounts) {
                Account oldRec = (Trigger.isInsert ? new Account() : mapoldAccounts.get(a.Id));
                
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
    
    /**
     * ManageRelatedAccountRecords trigger logic (TO BE ACTIVATED UPON COMMUNITY FEATURE)
     **/
    private void syncCommunityUserProfiles(){
        Set<Id> accSet = new Set<Id>();
        for (Account acc : listnewAccounts) {
            if (acc.Detailing_Reporting__c != mapoldAccounts.get(acc.ID).Detailing_Reporting__c){
                accSet.add(acc.Id);
            }
        }
        //CitronUtilities.syncCommunityUserProfiles(accSet);
    } 
    
    /**
     * Set Service Territory as per FSA (outwards codes, the first 3 characters of postal code)
     **/
    private void setServiceTerritoryIns(){
        Set<String> setpostalcode = new Set<String>();
        Map<String,String> mpFSAToSTer = new Map<String,String>();
        //Run through the newly created accounts
        for(Account acc:listnewAccounts){
            //If no service territory is entered and a shipping postal code is available
            if(acc.Service_Territory__c==null && acc.ShippingPostalCode!=null){
                //Capture the first 3 characters of postal code
                if(acc.ShippingPostalCode.length()>3){setpostalcode.add(acc.ShippingPostalCode.subString(0,3));}
            }
        }
        
        if(setpostalcode.size()>0){
            //Find all the active service territory combinations
            List<FSA_Service_Territory_Mapping__c> lstFSATer = [SELECT Id,FSA__c, Service_Territory__c 
                                                                FROM FSA_Service_Territory_Mapping__c WHERE FSA__c in:setpostalcode 
                                                                AND Service_Territory__r.isActive=True ORDER BY Createddate ASC];
            for(FSA_Service_Territory_Mapping__c fst:lstFSATer){
                //Note: Order by CreatedDate ASC ensures that only the most recent FSA__c and is Primary
                mpFSAToSTer.put(fst.FSA__c,fst.Service_Territory__c);
            }
        }
        
        if(mpFSAToSTer.size()>0){
            //Again run through the newly created accounts
            for(Account acc:listnewAccounts){
                if(acc.Service_Territory__c==null && acc.ShippingPostalCode!=null){
                    if(acc.ShippingPostalCode.length()>3){
                        String shipzip = acc.ShippingPostalCode.subString(0,3);
                        //Set the Service territory for the account
                        acc.Service_Territory__c = mpFSAToSTer.get(shipzip.toUpperCase());               
                    }
                }
            }
        }
    }
    
   /**
     * Set Service Territory as per FSA (outwards codes, the first 3 characters of postal code)
     * If the user made the modification leave it as is
     * If the shipping postal code changes and there are no changes from user update service territory
     **/
    private void setServiceTerritoryUpt(){
        Set<String> setzip = new Set<String>();
        Map<String,String> mpFSAToSTer = new Map<String,String>();
        //Run through the newly created accounts
        for(Account newA:listnewAccounts){
            String oldzip='', newzip='';
            //If no service territory is entered and a shipping postal code is available
            Account oldA = mapoldAccounts.get(newA.Id);
            //Capture the first 3 characters of postal code
            if(oldA.ShippingPostalCode!=null && oldA.ShippingPostalCode.length()>3){
                oldzip=oldA.ShippingPostalCode.subString(0,3);
            }
            //Capture the first 3 characters of postal code
            if(newA.ShippingPostalCode!=null && newA.ShippingPostalCode.length()>3){
                newzip=newA.ShippingPostalCode.subString(0,3);
            }
            //If the zip code is different and Service Territory is same then set service territory
            if(!newzip.equals(oldzip) && oldA.Service_Territory__c==newA.Service_Territory__c){
                setzip.add(newzip);
            }
        }
        
        if(setzip.size()>0){
            //Find all the active service territory combinations
            List<FSA_Service_Territory_Mapping__c> lstFSATer = [SELECT Id,FSA__c, Service_Territory__c 
                                                                FROM FSA_Service_Territory_Mapping__c WHERE FSA__c in:setzip 
                                                                AND Service_Territory__r.isActive=True ORDER BY Createddate ASC];
            for(FSA_Service_Territory_Mapping__c fst:lstFSATer){
                //Note: Order by CreatedDate ASC ensures that only the most recent FSA__c is used and is Primary
                mpFSAToSTer.put(fst.FSA__c,fst.Service_Territory__c);
            }
        }
        
        if(mpFSAToSTer.size()>0){
            //Again run through the newly created accounts
            for(Account acc:listnewAccounts){
                if(acc.Service_Territory__c==null && acc.ShippingPostalCode!=null){
                    if(acc.ShippingPostalCode.length()>3){
                        String shipzip = acc.ShippingPostalCode.subString(0,3);
                        //Set the Service territory for the account
                        acc.Service_Territory__c = mpFSAToSTer.get(shipzip.toUpperCase());               
                    }
                }
            }
        }
    }    


   /**
     * Stamp FSA to object based on shipping address
     **/    
    private void stampRegion(){
        Set<String> postalCodePrefixSet = new Set<String>(); 
        
        for (Account a : listnewAccounts){
            
            if(!String.isEmpty(a.ShippingPostalCode)){ 
            	postalCodePrefixSet.add(a.ShippingPostalCode.toUpperCase().left(3));
            }
        }
        
        Map<String, FSA_Service_Territory_Mapping__c> fsaMap = new Map<String, FSA_Service_Territory_Mapping__c>();
        List<FSA_Service_Territory_Mapping__c > fsaList = [SELECT Id, FSA__c  FROM FSA_Service_Territory_Mapping__c WHERE FSA__c IN: postalCodePrefixSet];
        
        for(FSA_Service_Territory_Mapping__c fsa: fsaList){
            fsaMap.put(fsa.FSA__c, fsa);
        }
        
        for (Account a : listnewAccounts){
            if(!String.isEmpty(a.ShippingPostalCode)){
            	String fasKey = a.ShippingPostalCode.toUpperCase().left(3);
                if(fsaMap.containsKey(fasKey)){
                    a.FSA_Mapping__c  = fsaMap.get(fasKey).Id;
                } else {
                    a.FSA_Mapping__c = null;
                }
            } else {
                a.FSA_Mapping__c = null;
            }
        }        
    }
    
   /**
     * For accounts that are 'prospect', copy the billing address into the shipping address if the 
     * shipping address is "empty"
     **/    
    private void copyBillingAddressToShippingAddress(){
        for (Account a : listnewAccounts){
            // recordtpye = prospect
            if(a.recordTypeId == Util.getRecordTypeIdByDevName('Account', 'Account')){

                // check for "empty shipping"
                if(String.isEmpty(a.ShippingStreet) && 
                    String.isEmpty(a.ShippingCity) &&
                    String.isEmpty(a.ShippingCountry) &&
                    String.isEmpty(a.ShippingState) &&
                    String.isEmpty(a.ShippingPostalCode) &&
                    String.isEmpty(a.ShippingCountry)){

                    a.ShippingStreet = a.BillingStreet;
                    a.ShippingCity = a.BillingCity;
                    a.ShippingCountry = a.BillingCountry;
                    a.ShippingState = a.BillingState;
                    a.ShippingPostalCode = a.BillingPostalCode;
                    a.ShippingCountry = a.BillingCountry;
                }
            }
        }        
    }
}