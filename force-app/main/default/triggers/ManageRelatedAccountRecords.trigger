trigger ManageRelatedAccountRecords on Account (after update) {

    Set<Id> accSet = new Set<Id>();
    for (Account a : Trigger.new) {
        if (a.Detailing_Reporting__c != Trigger.oldMap.get(a.ID).Detailing_Reporting__c) {
            accSet.add(a.Id);
        }
    }
    
    //CitronUtilities.syncCommunityUserProfiles(accSet);
}