/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class SyncOptOutsToCTCT_Batch implements Database.AllowsCallouts, Database.Batchable<SObject>, Database.Stateful, System.Schedulable {
    global Boolean blnDoContacts;
    global CTCT2.CTCTRestApi.Credentials credentials;
    global Id historyId;
    global Integer iteration;
    global Boolean loginFailed;
    global List<CTCT2.SyncProcess_Iterable.Helper> lstHelpers;
    global String nextURL;
    global Integer NumContactsOptOutsFromSF;
    global Integer NumLeadsOptOutsFromSF;
    global CTCT2__Settings__c settings;
    global SyncOptOutsToCTCT_Batch(CTCT2__Settings__c settings, Id historyId) {

    }
    global void ExecuteBatch() {

    }
    global void execute(System.SchedulableContext sc) {

    }
    global void execute(Database.BatchableContext BC, List<SObject> lstSObjects) {

    }
    global void finish(Database.BatchableContext BC) {

    }
    global Database.QueryLocator start(Database.BatchableContext BC) {
        return null;
    }
}
