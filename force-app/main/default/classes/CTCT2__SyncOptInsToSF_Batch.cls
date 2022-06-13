/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class SyncOptInsToSF_Batch implements Database.AllowsCallouts, Database.Batchable<CTCT2.SyncProcess_Iterable.Helper>, Database.Stateful, System.Schedulable {
    global CTCT2.CTCTRestApi.Credentials credentials;
    global Id historyId;
    global Integer iteration;
    global String nextURL;
    global Integer NumContactsOptBackInsFromCTCT;
    global Integer NumLeadsOptBackInsFromCTCT;
    global CTCT2__Settings__c settings;
    global SyncOptInsToSF_Batch(CTCT2__Settings__c settings, Id historyId) {

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
