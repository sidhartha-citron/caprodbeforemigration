trigger SetSkillRequirementFields on SkillRequirement (before insert, before update) {
    for(SkillRequirement sr : Trigger.new) {
        sr.EID__c = sr.SkillId + '|' + sr.RelatedRecordId;
    }
}