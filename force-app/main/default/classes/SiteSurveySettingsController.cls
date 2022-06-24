public class SiteSurveySettingsController {
    public static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    public static final String DELIMITER = ',';
    
    public class MainRecord {
        @AuraEnabled
        public Site_Survey__c siteSurvey { get; set; }
        @AuraEnabled
        public List<String>  signatureRequiredFieldOpts {get;set;}
        @AuraEnabled
        public Order order { get; set; }
        @AuraEnabled
        public Opportunity opportunity { get; set; }
        @AuraEnabled
        public Boolean isOpportunity { get; set; }
        @AuraEnabled
        public Boolean hasAccessToSkillTab {get;set;}
        @AuraEnabled
        public Integer locationsPerPage {get;set;}
        @AuraEnabled
        public FieldSecurity fieldSecurity {get;set;}
        
        public MainRecord() {}
        
        public MainRecord(Site_Survey__c siteSurvey) {
            this.siteSurvey = siteSurvey;
            this.hasAccessToSkillTab = false;
            this.fieldSecurity = new FieldSecurity();
        }
    }
    
    public class FieldSecurity {
        @AuraEnabled
        public Boolean canEditHygieneMinLines { get; set; }
        @AuraEnabled
        public Boolean canEditChemicalMinLines { get; set; }
        @AuraEnabled
        public Boolean canEditHygieneDuration { get; set; }
        @AuraEnabled
        public Boolean canEditChemicalDuration { get; set; }
        @AuraEnabled
        public Boolean canEditPestMinLines { get; set; }
        @AuraEnabled
        public Boolean canEditPestDuration { get; set; }
        @AuraEnabled
        public Boolean canEditSkillLevel { get; set; }
        @AuraEnabled
        public Boolean canEditNotes { get; set; }
    }
    
    public class PickList {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public Boolean isChosen { get; set; }
        @AuraEnabled
        public String recordId { get; set; }
       
        public PickList() {}
        
        public PickList(String label) {
            this.label = label;
        }
        public PickList(String label, Boolean isChosen) {
            this.label = label;
            this.isChosen = isChosen;
        }
    }
    
    public class ColumnRecord {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String name { get; set; }
        
        public ColumnRecord(String label, String name) {
            this.label = label;
            this.name = name;
        }
    }
    
    public class SkillRecord {
        @AuraEnabled
        public String skillName {get; set;}
        
        @AuraEnabled
        public String skillLabel {get; set;}
        
        @AuraEnabled
        public Decimal skillLevel {get; set;}
        
        @AuraEnabled
        public Decimal defaultSkillLevel {get; set;}
        
        @AuraEnabled
        public String skillId {get; set;}
        
        @AuraEnabled
        public Boolean skillExists {get; set;}
        
        @AuraEnabled
        public String recordId {get; set;}
        
        @AuraEnabled
        public String externalId {get; set;}
        
        @AuraEnabled
        public Set<PickList> lineOfBusinesses {get; set;}
        
        public SkillRecord () {
            lineOfBusinesses = new Set<PickList>();
            defaultSkillLevel = dataSets.Default_Skill_Level__c==null || dataSets.Default_Skill_Level__c < 1 ? 1.0 : dataSets.Default_Skill_Level__c;
        }
        
        public SkillRecord (String skillName, String skillLabel, Boolean skillExists) {
            this.skillName = skillName;
            this.skillLabel = skillLabel;
            this.skillExists = skillExists;
            lineOfBusinesses = new Set<PickList>();
            defaultSkillLevel = dataSets.Default_Skill_Level__c==null || dataSets.Default_Skill_Level__c < 1 ? 1.0 : dataSets.Default_Skill_Level__c;
        }
        
        public SkillRecord (String skillName, String skillLabel, Decimal skillLevel, String skillId, String recordId) {
            this.skillName = skillName;
            this.skillLabel = skillLabel;
            this.skillLevel = skillLevel;
            this.skillId = skillId;
            this.recordId = recordId;
            this.skillExists = recordId==null ? FALSE : TRUE;
            lineOfBusinesses = new Set<PickList>();
            defaultSkillLevel = dataSets.Default_Skill_Level__c==null || dataSets.Default_Skill_Level__c < 1 ? 1.0 : dataSets.Default_Skill_Level__c;
        }
    }
    
    @AuraEnabled
    public static MainRecord getSiteSurveyId(String recordId, List<String> queryParams) {
        MainRecord returnRecord = new MainRecord();
        Id record = String.valueOf(recordId);
        String sObjName = record.getSObjectType().getDescribe().getName();
        Id siteSurveyId ;
        Site_Survey__c siteSurvey ;        
        Account acc;
        Boolean createSiteSurvey = false;
        System.debug(' queryParams ');
        System.debug(queryParams);
        try{
            queryParams.add(' Id = \'' + recordId + '\''); 
            if(sObjName.equalsIgnoreCase('Opportunity')){
                Opportunity opp = Database.query(String.format('SELECT {0}, Name FROM Opportunity WHERE {1}', queryParams));
                returnRecord.opportunity = opp;
                returnRecord.order = new Order();
                returnRecord.isOpportunity = TRUE;
                System.debug(opp);
                if(opp.Site_Survey__c != null && opp.Site_Survey__c == opp.Account.Site_Survey__c) {
                    siteSurveyId = opp.Site_Survey__c; 
                }else if(opp.Account.Site_Survey__c == null){
                    createSiteSurvey = true;
                    System.debug(' creating ' + opp.Account.Site_Survey__c);
                    siteSurveyId = createSiteSurvey(opp.AccountId, opp, null);
                }else {
                    opp.Site_Survey__c = opp.Account.Site_Survey__c;
                    siteSurveyId = opp.Site_Survey__c; 
                    update opp;
                }          
                
            } else if(sObjName.equalsIgnoreCase('Order')){
                Order o = Database.query(String.format('SELECT {0}, OrderNumber FROM Order WHERE {1}', queryParams));
                returnRecord.order = o;
                returnRecord.opportunity = new Opportunity();
                returnRecord.isOpportunity = FALSE;
                if(o.Site_Survey__c != null && o.Site_Survey__c == o.Account.Site_Survey__c) {
                    siteSurveyId = o.Site_Survey__c; 
                }else if(o.Account.Site_Survey__c == null){
                    createSiteSurvey = true;
                    System.debug(' creating ' + o.Account.Site_Survey__c);
                    siteSurveyId = createSiteSurvey(o.AccountId, null, o);
                }else {
                    o.Site_Survey__c = o.Account.Site_Survey__c;
                    siteSurveyId = o.Site_Survey__c; 
                    update o;
                }    
            }
            
            if(siteSurveyId != null) {  
                siteSurvey = [SELECT Security_Sign_in_out__c,Key_Card_Required__c,Escort_Required__c,
                              Meet_with_Contact_Prior_to_Work__c,Remove_Equipment_from_Vehicle__c,
                              Reload_Van__c,Health_Safety_Orientation_Required__c,
                              Pest_Duration_Calculation__c, Number_of_Rooms__c, Notes__c,
                              Female_Skillset_Required__c, Name, Work_Order_Calculation_Adjustment__c, 
                              Chem_WorkOrder_Calculation_Adjustment__c, Min_Hygiene_Work_Order_Lines__c, Min_Chemical_Work_Order_Lines__c, 
                              Account__c, Account__r.Name, Account__r.AccPac_Account__c, Account__r.ShippingAddress, Account__r.Shipping_Address__c,
                              Pest_WorkOrder_Calculation_Adjustment__c, Min_Pest_Work_Order_Lines__c, Signature_Required_For__c
                              FROM Site_Survey__c WHERE id= :siteSurveyId];
                system.debug('site survey id ' + siteSurvey );
                
                returnRecord.siteSurvey = siteSurvey;
                
                // Retrieve picklist options for 'Signature Required For' field
                List<Schema.PicklistEntry> picklistVals = SObjectType.Site_Survey__c.fields.getMap().get('Signature_Required_For__c').getDescribe().getPickListValues();
                List<String> picklistOpts = new List<String>();
                for (Schema.PicklistEntry entry : picklistVals) {
                	picklistOpts.add(entry.getValue());
            	}
            	returnRecord.signatureRequiredFieldOpts = picklistOpts;
            	
                returnRecord.locationsPerPage = Integer.valueOf(dataSets.LocationsPerPage__c);
                
                if(dataSets.Permission_Set_Skill_Requirement_Tab__c!=null && dataSets.Custom_Permission_for_Skill_Tab__c!=null) {
                    List<PermissionSetAssignment> assignmentRecord = [SELECT Id, AssigneeId, PermissionSetId FROM PermissionSetAssignment 
                                                        WHERE PermissionSetId = :dataSets.Permission_Set_Skill_Requirement_Tab__c AND AssigneeId = :UserInfo.getUserId() LIMIT 1];  
                    if(!assignmentRecord.isEmpty()) {
                        List<SetupEntityAccess> entityRecord = [SELECT Id, ParentId, SetupEntityType, SetupEntityId FROM SetupEntityAccess WHERE SetupEntityType='CustomPermission'
                                                          AND ParentId =:dataSets.Permission_Set_Skill_Requirement_Tab__c AND SetupEntityId = :dataSets.Custom_Permission_for_Skill_Tab__c LIMIT 1 ];
                        
                        returnRecord.hasAccessToSkillTab = !entityRecord.isEmpty();
                    }
                }
                
            }
            returnRecord.fieldSecurity = SiteSurveySettingsController.fetchSecurity();
            return returnRecord;
            
        }catch(Exception e){
            System.debug(e.getLineNumber() + '-' + e.getMessage());   
            return null;
        }
    }
    
    private static FieldSecurity fetchSecurity() {
        FieldSecurity securityRecord = new FieldSecurity();
        Map<DescribeSObjectResult, Set<String>> objectFieldMap = new Map<DescribeSObjectResult, Set<String>>{
            SObjectType.Site_Survey__c => new Set<String>{'Min_Hygiene_Work_Order_Lines__c', 'Min_Chemical_Work_Order_Lines__c', 'Work_Order_Calculation_Adjustment__c', 
                'Chem_WorkOrder_Calculation_Adjustment__c', 'Pest_WorkOrder_Calculation_Adjustment__c', 'Min_Pest_Work_Order_Lines__c', 'Notes__c'},
                    SObjectType.SiteSurvey_RequiredSkills__c => new Set<String>{'Skill_Level__c'}
        };
            
            for(DescribeSObjectResult objectKey : objectFieldMap.keySet()) {
                List<String> fields = new List<String>(objectFieldMap.get(objectKey));
                Map<String, SobjectField> fieldMap = objectKey.fields.getMap();
                
                System.debug('>>Field Map: ' + fieldMap);
                
                for(String field: fields) {
                    if(field=='Min_Hygiene_Work_Order_Lines__c') {
                        securityRecord.canEditHygieneMinLines = fieldMap.get(field).getDescribe().isUpdateable();
                    } else if(field=='Min_Chemical_Work_Order_Lines__c') {
                        securityRecord.canEditChemicalMinLines = fieldMap.get(field).getDescribe().isUpdateable();
                    } else if(field=='Work_Order_Calculation_Adjustment__c') {
                        securityRecord.canEditHygieneDuration = fieldMap.get(field).getDescribe().isUpdateable();
                    } else if(field=='Chem_WorkOrder_Calculation_Adjustment__c') {
                        securityRecord.canEditChemicalDuration = fieldMap.get(field).getDescribe().isUpdateable();
                    } else if(field=='Pest_WorkOrder_Calculation_Adjustment__c') {
                        securityRecord.canEditPestDuration = fieldMap.get(field).getDescribe().isUpdateable();
                    } else if(field=='Min_Pest_Work_Order_Lines__c') {
                        securityRecord.canEditPestMinLines = fieldMap.get(field).getDescribe().isUpdateable();
                    } else if(field=='Notes__c') {
                        securityRecord.canEditNotes = fieldMap.get(field).getDescribe().isUpdateable();
                    } else if (field=='Skill_Level__c') {
                        securityRecord.canEditSkillLevel = fieldMap.get(field).getDescribe().isUpdateable();
                    }
                }
            }
        
        System.debug('Security Record');
        System.debug(securityRecord);
        return securityRecord;
    }
   
   @AuraEnabled
    public static Site_Survey__c saveSiteSurvey(Site_Survey__c record) {       
        try{
            update record;
            return record;
        }catch(Exception e){
            throw e;
        }  
    }
    
    /* Aleena for the new Skill Table */
    
    @AuraEnabled
    public static List<ColumnRecord> getColumns(List<String> columnAPINames) {
        List<ColumnRecord> columns = new List<ColumnRecord>();
        for (String s : columnAPINames) {
            List<String> ss = s.split('\\.');
            columns.add(new ColumnRecord(
                Schema.getGlobalDescribe().get(ss[0]).getDescribe().fields.getMap().get(ss[1]).getDescribe().getLabel(), 
                ss[1])
                    );
        }
        System.debug(columns);
        return columns;
    }
    
    @AuraEnabled
    public static List<SiteSurveySettingsController.PickList> getlob() {
        List<String> t = new List<String>();
        List<SiteSurveySettingsController.PickList> p = new List<SiteSurveySettingsController.PickList>(); 
        for(Schema.PicklistEntry v : Schema.SiteSurvey_RequiredSkills__c.Line_of_Business__c.getDescribe().getPicklistValues()){
            PickList record = new PickList(v.getValue(), false); 
            p.add(record);
        } 
        return p;
    }
    
    @AuraEnabled
    public static SkillRecord upsertSkill(String record, String siteSurveyId) {
        System.debug(' Upsert Apex ');
        System.debug(record);
        System.debug(siteSurveyId);
        Set<String> lob = new Set<String>();
        Decimal defaultSkillLevel = dataSets.Default_Skill_Level__c ==null ?  1.0 : dataSets.Default_Skill_Level__c ;
        try {
            SkillRecord testSkill = (SkillRecord)JSON.Deserialize(record, SkillRecord.class);
            System.debug(testSkill);
            if(testSkill != null) {
                if(testSkill.lineOfBusinesses!=null) {
                    for(Picklist pl : testSkill.lineOfBusinesses) {
                        if(pl.isChosen) {
                            lob.add(pl.label);
                        } 
                    }
                }
                SiteSurvey_RequiredSkills__c newSkill = new SiteSurvey_RequiredSkills__c
                    (
                        Site_Survey__c=siteSurveyId, 
                        Skill_Level__c=testSkill.skillLevel==null || testSkill.skillLevel < 1 ? defaultSkillLevel : testSkill.skillLevel, 
                        Skill_Name__c=testSkill.skillName, 
                        Name=testSkill.skillLabel, 
                        Skill_Record_Id__c=testSkill.skillId, 
                        EID__c = siteSurveyId +'.' + testSkill.skillId, 
                        Line_of_Business__c = lob.isEmpty() ? '' : String.join(new List<String>(lob), ';')
                    );
                if(String.isNotBlank(testSkill.recordId)) {
                    System.debug('Record id From TestSkill: ' + testSkill.recordId);
                    newSkill.Id = testSkill.recordId;
                } 
                
                System.debug(newSkill);
                upsert newSkill EID__c;
                
                if(newSkill.Skill_Record_Id__c==dataSets.Site_Survey_Female_Skill_ID__c) {
                    Site_Survey__c ss = new Site_Survey__c(Id=siteSurveyId);
                    if(lob.contains(dataSets.Hygiene_LOB__c)) {
                        ss.Female_Skillset_Required__c=TRUE;
                    } else {
                        ss.Female_Skillset_Required__c=FALSE;
                    }
                    update ss;
                }
                
                testSkill.recordId = newSkill.Id;
                testSkill.externalId = newSkill.EID__c;
                testSkill.skillLevel = newSkill.Skill_Level__c;
                return testSkill;
            }
            return null;
        } catch(Exception e) {
            System.debug(e.getLineNumber() + ' -- ' +e.getMessage());
            return null;
        }
    }

	@AuraEnabled
    public static void deleteSkill(String externalId, String siteSurveyId) {
        System.debug(' Delete Apex ');
        System.debug(externalId);
        try {
            SiteSurvey_RequiredSkills__c deleteSkill = [SELECT Id, Skill_Record_Id__c FROM SiteSurvey_RequiredSkills__c WHERE EID__c=:externalId];
            delete deleteSkill;
            //return initSkills(siteSurveyId);
            if(deleteSkill.Skill_Record_Id__c==dataSets.Site_Survey_Female_Skill_ID__c) {
                Site_Survey__c ss = new Site_Survey__c(Id=siteSurveyId, Female_Skillset_Required__c=FALSE);
                update ss;
            }
        } catch(Exception e) {
            System.debug(e.getLineNumber() + ' -- ' +e.getMessage());
            //return null;
        }
    }
    
    @AuraEnabled
    public static List<SkillRecord> initSkills(String siteSurveyId) {
        
        try {
            Set<Id> existingSkillIds = new Set<Id>();
            List<SkillRecord> skillRecords = new List<SkillRecord>();
            List<SiteSurvey_RequiredSkills__c> siteSurveySkills = [SELECT Id, Name, Site_Survey__c, Skill_Level__c, Skill_Record_Id__c, Skill_Name__c, Line_of_Business__c, EID__c 
                                                                   FROM SiteSurvey_RequiredSkills__c WHERE Site_Survey__c =:siteSurveyId];
            List<SiteSurveySettingsController.PickList> p = getlob();
            String s = dataSets.Site_Survey_Skills_Prefix__c + '_%';
            
            for(SiteSurvey_RequiredSkills__c sr : siteSurveySkills) {
                If(!Test.isRunningTest()) {
                    existingSkillIds.add(sr.Skill_Record_Id__c); 
                    //fetching Skill records require seealldata,trying to overcome that by not executing this section in test class
                }
                SkillRecord newRecord = new SkillRecord(sr.Name, sr.Name, sr.Skill_Level__c, sr.Skill_Record_Id__c, sr.Id);
                newRecord.externalId = sr.EID__c;
                if(String.isNotBlank(sr.Line_of_Business__c)){
                    Set<String> lob = new Set<String>(sr.Line_of_Business__c.split('\\;'));
                    for(Picklist pl : p) {
                        PickList newPL = new Picklist(pl.label, FALSE);
                        if(lob.contains(pl.label)){
                            newPL.isChosen = TRUE;
                            newPL.recordId = sr.Id;
                        } 
                        newRecord.lineOfBusinesses.add(newPL);
                    }
                } else {
                    for(Picklist pl : p) {
                        PickList newPL = new Picklist(pl.label, FALSE);
                        System.debug('>> pl : ' + pl);
                        newRecord.lineOfBusinesses.add(newPL);
                    }
                }
                skillRecords.add(newRecord);
            }
            List<Skill> allSkills  = [SELECT Id, MasterLabel, DeveloperName FROM Skill WHERE DeveloperName LIKE :s AND Id NOT IN :existingSkillIds];
            System.debug(allSkills);
            
            for(Skill sk : allSkills) {
                System.debug('>> sk : ' + sk);
                SkillRecord newRecord = new SkillRecord(sk.MasterLabel, sk.MasterLabel, FALSE);
                newRecord.skillId = sk.Id;
                newRecord.externalId = siteSurveyId + '.' + sk.Id;
                System.debug('>> new : ' + newRecord);
                for(Picklist pl : p) {
                    PickList newPL = new Picklist(pl.label, FALSE);
                    System.debug('>> pl : ' + pl);
                    newRecord.lineOfBusinesses.add(newPL);
                }
                skillRecords.add(newRecord);
            }
            System.debug(skillRecords);
            return skillRecords;
        } catch(Exception e) {
            System.debug('>>Line Number ' + e.getLineNumber() + ' Message ' + e.getMessage());
            return null;
        }
    }
    
    public static Id createSiteSurvey(Id acctId, Opportunity opp, Order o) {
        try {
            List<Site_Survey__c> siteSurveyWithAccount = new List<Site_Survey__c>();
            List<Site_Survey__c> deleteAdditionalWithAccount = new List<Site_Survey__c>();
            Site_Survey__c ss;
            
            siteSurveyWithAccount = [SELECT Id, Account__c, CreatedDate FROM Site_Survey__c WHERE Account__c=:acctId ORDER BY CreatedDate DESC LIMIT 1];
            
            if(!siteSurveyWithAccount.isEmpty()) {
                ss = siteSurveyWithAccount[0];
                deleteAdditionalWithAccount = [SELECT Id, Account__c, CreatedDate FROM Site_Survey__c WHERE Account__c=:acctId AND Id !=:ss.Id];
                
                if(!deleteAdditionalWithAccount.isEmpty()) {
                    System.debug('Deleting extra Site Surveys '); 
                    System.debug(deleteAdditionalWithAccount);
                    delete deleteAdditionalWithAccount;
                }
            } else {
                ss = new Site_Survey__c(
                    Account__c=acctId, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                );
                insert ss;
            }
            
            Account acct = [SELECT Site_Survey__c FROM Account WHERE Id=:acctId];
            acct.Site_Survey__c = ss.Id; 
            update acct;
            
            if(opp != null) {
                opp.Site_Survey__c = ss.Id;  
                update opp;
            }
            
            if(o != null) {
                o.Site_Survey__c = ss.Id; 
                update o;
            }
            
            System.debug(acct);
            System.debug(opp);
            System.debug(o);
            
            return ss.Id;
            
        } catch(Exception e) {
            System.debug(e);
            return null;
        }
    }
}