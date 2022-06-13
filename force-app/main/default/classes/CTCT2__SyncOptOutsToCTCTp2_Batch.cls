/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class SyncOptOutsToCTCTp2_Batch implements Database.AllowsCallouts, Database.Batchable<CTCT2.SyncProcess_Iterable.Helper>, Database.Stateful, System.Schedulable {
    global Boolean blnDoContacts;
    global CTCT2.CTCTRestApi.Credentials credentials;
    global Id historyId;
    global Integer iteration;
    global List<CTCT2.SyncProcess_Iterable.Helper> lstHelpers;
    global String nextURL;
    global Integer NumContactsOptOutsFromSF;
    global Integer NumLeadsOptOutsFromSF;
    global CTCT2__Settings__c settings;
    global CTCT2.SyncProcess_Iterable theIterable;
    global SyncOptOutsToCTCTp2_Batch(CTCT2__Settings__c settings, Id historyId) {

    }
    global void ExecuteBatch() {

    }
    global void execute(System.SchedulableContext sc) {

    }
    global void execute(Database.BatchableContext bc, List<CTCT2.SyncProcess_Iterable.Helper> lstHelpers) {

    }
    global void finish(Database.BatchableContext bc) {

    }
    global System.Iterable start(Database.BatchableContext bc) {
        return null;
    }
}
