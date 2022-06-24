<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <alerts>
        <fullName>BMCServiceDesk__notifies_the_Incident_Owner_when_cr_linked_to_incident_is_closed</fullName>
        <description>Notify incident owner when change request linked to incident is closed</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__Change_Request_Closed_Template</template>
    </alerts>
    <alerts>
        <fullName>BMCServiceDesk__notifies_the_client_that_an_incident_linked_change_request</fullName>
        <description>Notifies the client that an incident of the client is linked to a change request.</description>
        <protected>false</protected>
        <recipients>
            <field>BMCServiceDesk__FKContact__c</field>
            <type>contactLookup</type>
        </recipients>
        <recipients>
            <field>BMCServiceDesk__FKClient__c</field>
            <type>userLookup</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__Incident_Change_Link_Template</template>
    </alerts>
    <rules>
        <fullName>BMCServiceDesk__Notify client when incident is linked to change request</fullName>
        <actions>
            <name>BMCServiceDesk__notifies_the_client_that_an_incident_linked_change_request</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <description>Notifies the client that an incident of the client is linked to a change request.</description>
        <formula>ISBLANK(BMCServiceDesk__FKIncident__r.BMCServiceDesk__FKRequestDetail__c)</formula>
        <triggerType>onCreateOnly</triggerType>
    </rules>
    <rules>
        <fullName>BMCServiceDesk__Notify incident owner when change request linked to incident is closed</fullName>
        <actions>
            <name>BMCServiceDesk__notifies_the_Incident_Owner_when_cr_linked_to_incident_is_closed</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <description>Notify incident owner when change request linked to incident is closed</description>
        <formula>AND(NOT(BMCServiceDesk__FKChange__r.BMCServiceDesk__State__c),ISBLANK(BMCServiceDesk__FKIncident__r.BMCServiceDesk__FKRequestDetail__c))</formula>
        <triggerType>onAllChanges</triggerType>
    </rules>
</Workflow>
