trigger UpdateSkillsFromSiteSurvey on Site_Survey__c (after insert, after update) {
    
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    Map<Id, Site_Survey__c> siteSurveys = new Map<Id, Site_Survey__c>();
    Map<Id, SiteSurvey_RequiredSkills__c> siteSurveySkills = new Map<Id, SiteSurvey_RequiredSkills__c>();
    
    List<SiteSurvey_RequiredSkills__c> upsertSkills = new List<SiteSurvey_RequiredSkills__c>();
    List<SiteSurvey_RequiredSkills__c> deleteSkills = new List<SiteSurvey_RequiredSkills__c>();
    
    for(Site_Survey__c ss : Trigger.new) {
        Site_Survey__c oldRec = Trigger.IsInsert ? new Site_Survey__c() : Trigger.oldMap.get(ss.Id);//mended by Drew
        if(oldRec.Female_Skillset_Required__c!=ss.Female_Skillset_Required__c) {
            siteSurveys.put(ss.Id, ss);
        }
    }
    
    if(dataSets.Site_Survey_Female_Skill_ID__c!=null) {
        List<Skill> femaleSkills = new List<Skill>([SELECT Id, MasterLabel, DeveloperName FROM Skill WHERE Id= :dataSets.Site_Survey_Female_Skill_ID__c]);
        
        for(SiteSurvey_RequiredSkills__c sr : [SELECT Id, Site_Survey__c, EID__c, Line_of_Business__c FROM SiteSurvey_RequiredSkills__c WHERE Site_Survey__c IN :siteSurveys.keySet() 
                                               AND Skill_Record_Id__c= :dataSets.Site_Survey_Female_Skill_ID__c]) 
        {
            siteSurveySkills.put(sr.Site_Survey__c, sr);
            
        }
        
        for(Site_Survey__c ss : siteSurveys.values()) {
            SiteSurvey_RequiredSkills__c sr = siteSurveySkills.get(ss.Id);
            
            if(ss.Female_Skillset_Required__c) {
                if(sr==null && !femaleSkills.isEmpty()) {
                    Skill femaleSkill = femaleSkills.get(0);
                    upsertSkills.add(new SiteSurvey_RequiredSkills__c (
                        Site_Survey__c=ss.Id, 
                        Skill_Level__c=dataSets.Default_Skill_Level__c==null || dataSets.Default_Skill_Level__c < 1 ? 1.0 : dataSets.Default_Skill_Level__c,
                        Skill_Name__c=femaleSkill.MasterLabel, 
                        Name=femaleSkill.MasterLabel, 
                        Skill_Record_Id__c=femaleSkill.Id, 
                        EID__c = ss.Id +'.' + femaleSkill.Id, 
                        Line_of_Business__c = dataSets.Hygiene_LOB__c
                    ));
                } else if(sr!=null) {
                    Set<String> lobValues = new Set<String>(sr.Line_of_Business__c.split('\\;'));
                    lobValues.add(dataSets.Hygiene_LOB__c);
                    sr.Line_of_Business__c =  String.join(new List<String>(lobValues), ';');
                    upsertSkills.add(sr);
                }
                
            } else if (!ss.Female_Skillset_Required__c && sr!=null) {
                if(sr.Line_of_Business__c!=null) {
                    Set<String> lobValues = new Set<String>(sr.Line_of_Business__c.split('\\;'));
                    if(!lobValues.isEmpty()) {
                        if(lobValues.size()==1 && lobValues.contains(dataSets.Hygiene_LOB__c)) {
                            deleteSkills.add(sr);
                        } else {
                            lobValues.remove(dataSets.Hygiene_LOB__c);
                            sr.Line_of_Business__c =  String.join(new List<String>(lobValues), ';');
                            upsertSkills.add(sr);
                        }
                    }
                } else {
                    deleteSkills.add(sr);
                } 
            } 
        }
        
        upsert upsertSkills EID__c; 
        
        delete deleteSkills;
    }
    
}