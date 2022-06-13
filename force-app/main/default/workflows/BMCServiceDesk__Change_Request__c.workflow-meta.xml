<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <alerts>
        <fullName>BMCServiceDesk__Notify_Change_Request_Owner_when_Final_Task_Linked_to_Change_Request_is_Closed</fullName>
        <description>Notify change request owner when final task linked to change request is closed</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__All_Tasks_closed_for_Change_Request</template>
    </alerts>
    <alerts>
        <fullName>BMCServiceDesk__Notify_Owner_for_the_Change_Request_scheduled_during_Blackout</fullName>
        <description>Notify Owner for the Change Request scheduled during Blackout</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__Change_Request_Scheduled_Blackout</template>
    </alerts>
    <rules>
        <fullName>BMCServiceDesk__Check for all Change Request scheduled during blackout</fullName>
        <actions>
            <name>BMCServiceDesk__Notify_Owner_for_the_Change_Request_scheduled_during_Blackout</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <description>Check for all Change Requests scheduled during blackout</description>
        <formula>AND(OR(ISNEW(),ISCHANGED(BMCServiceDesk__Scheduled_during_Blackout__c)),BMCServiceDesk__Scheduled_during_Blackout__c)</formula>
        <triggerType>onAllChanges</triggerType>
    </rules>
    <rules>
        <fullName>BMCServiceDesk__Notify change request owner when final task linked to change request is closed</fullName>
        <actions>
            <name>BMCServiceDesk__Notify_Change_Request_Owner_when_Final_Task_Linked_to_Change_Request_is_Closed</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <description>Notify change request owner when final task linked to change request is closed</description>
        <formula>AND( BMCServiceDesk__State__c,  NOT( BMCServiceDesk__Inactive__c ) , ISCHANGED(BMCServiceDesk__AllTaskCloseController__c))</formula>
        <triggerType>onAllChanges</triggerType>
    </rules>
</Workflow>
