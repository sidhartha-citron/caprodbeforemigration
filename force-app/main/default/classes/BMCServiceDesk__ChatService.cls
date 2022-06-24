/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class ChatService {
    global ChatService() {

    }
    @RemoteAction
    global static BMCServiceDesk__Incident__c chatAction(String chatInstanceId, Boolean isCreateIncident) {
        return null;
    }
    @RemoteAction
    global static List<String> chatActions(List<String> linkIncidentAndChatData) {
        return null;
    }
    @RemoteAction
    global static String checkForChatInitialisation() {
        return null;
    }
    @RemoteAction
    global static String checkForChatInitialisationForClient() {
        return null;
    }
    @RemoteAction
    global static List<String> checkPreChatSetting() {
        return null;
    }
    @RemoteAction
    global static String initiateChat() {
        return null;
    }
    @RemoteAction
    global static String initiateSSChat(List<String> PreChatData) {
        return null;
    }
    @RemoteAction
    global static void makeAgentAvailable(String status) {

    }
    @RemoteAction
    global static List<String> pollMessages(Id chatInstanceId, String lastMessageSequence) {
        return null;
    }
    @RemoteAction
    global static String sendMessage(String message, String chatInstanceId) {
        return null;
    }
    @RemoteAction
    global static void setAgentAvailability(Boolean isAgentAvailable) {

    }
    @RemoteAction
    global static String unlockRecord(String recordId, String objectName) {
        return null;
    }
    @RemoteAction
    global static String unlockRecordWithName(String recordName, String objectName) {
        return null;
    }
}
