trigger SetSiteSurveyRequiredSkillFields on SiteSurvey_RequiredSkills__c (before insert, before update) {
    for(SiteSurvey_RequiredSkills__c sr : Trigger.new) {
        sr.EID__c = sr.Site_Survey__c + '.' + sr.Skill_Record_Id__c; 
    }
}