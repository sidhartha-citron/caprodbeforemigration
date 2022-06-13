<?xml version="1.0" encoding="UTF-8"?>
<Workflow xmlns="http://soap.sforce.com/2006/04/metadata">
    <alerts>
        <fullName>BMCServiceDesk__Notifies_the_Owner_on_Status_Change</fullName>
        <description>Notifies the Owner on Status Change</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__ReleaseStatusNotification</template>
    </alerts>
    <alerts>
        <fullName>BMCServiceDesk__Notify_owner_on_release_status_change</fullName>
        <description>Notify owner on release status change</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <recipients>
            <field>BMCServiceDesk__FKReleaseCoordinator__c</field>
            <type>userLookup</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__Notify_owner_on_release_status_change</template>
    </alerts>
    <alerts>
        <fullName>BMCServiceDesk__Notify_owner_when_the_status_is_marked_as_failed</fullName>
        <description>Notify owner when the status is marked as failed</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__Release_is_marked_as_Failed</template>
    </alerts>
    <alerts>
        <fullName>BMCServiceDesk__Notify_release_owner_when_each_linked_task_is_closed</fullName>
        <description>Notify release owner when each linked task is closed</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__Linked_task_for_a_release_is_closed</template>
    </alerts>
    <alerts>
        <fullName>BMCServiceDesk__Notify_release_owner_when_final_task_linked_to_release_is_closed</fullName>
        <description>Notify release owner when final task linked to release is closed</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__All_tasks_closed_for_release</template>
    </alerts>
    <alerts>
        <fullName>BMCServiceDesk__Notify_the_owner_on_new_release_creation</fullName>
        <description>Notify the owner on new release creation</description>
        <protected>false</protected>
        <recipients>
            <type>owner</type>
        </recipients>
        <recipients>
            <field>BMCServiceDesk__FKReleaseCoordinator__c</field>
            <type>userLookup</type>
        </recipients>
        <senderType>CurrentUser</senderType>
        <template>BMCServiceDesk__SDE_Emails/BMCServiceDesk__Notify_owner_on_new_release_creation</template>
    </alerts>
    <rules>
        <fullName>BMCServiceDesk__Notify release owner when each linked task is closed</fullName>
        <actions>
            <name>BMCServiceDesk__Notify_release_owner_when_each_linked_task_is_closed</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <description>Notify release owner when each linked task is closed</description>
        <formula>AND( ISCHANGED( BMCServiceDesk__Task_Closed_Controller__c), NOT(ISBLANK( BMCServiceDesk__Task_Closed_Controller__c) ) )</formula>
        <triggerType>onAllChanges</triggerType>
    </rules>
    <rules>
        <fullName>BMCServiceDesk__Notify release owner when final task linked to release is closed</fullName>
        <actions>
            <name>BMCServiceDesk__Notify_release_owner_when_final_task_linked_to_release_is_closed</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <description>Notify release owner when final task linked to release is closed</description>
        <formula>AND( BMCServiceDesk__State__c, NOT( BMCServiceDesk__Inactive__c ) , IF(BMCServiceDesk__AllTaskCloseController__c,  ISCHANGED(BMCServiceDesk__AllTaskCloseController__c) , false) )</formula>
        <triggerType>onAllChanges</triggerType>
    </rules>
    <rules>
        <fullName>BMCServiceDesk__Notify the Owner when a Release is marked as Failed</fullName>
        <actions>
            <name>BMCServiceDesk__Notify_owner_when_the_status_is_marked_as_failed</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <criteriaItems>
            <field>BMCServiceDesk__Release__c.BMCServiceDesk__Release_Failed__c</field>
            <operation>equals</operation>
            <value>True</value>
        </criteriaItems>
        <description>Notify the Owner when a Release is marked as Failed</description>
        <triggerType>onCreateOrTriggeringUpdate</triggerType>
    </rules>
    <rules>
        <fullName>BMCServiceDesk__Notify the owner on new release creation</fullName>
        <actions>
            <name>BMCServiceDesk__Notify_the_owner_on_new_release_creation</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <description>Notify owner on new release creation</description>
        <formula>(BMCServiceDesk__State__c = True)  ||  (BMCServiceDesk__State__c = False)</formula>
        <triggerType>onCreateOnly</triggerType>
    </rules>
    <rules>
        <fullName>BMCServiceDesk__Notify the owner on release status change</fullName>
        <actions>
            <name>BMCServiceDesk__Notify_owner_on_release_status_change</name>
            <type>Alert</type>
        </actions>
        <active>false</active>
        <description>Notify owner on release status change</description>
        <formula>ISCHANGED( BMCServiceDesk__FKStatus__c )</formula>
        <triggerType>onAllChanges</triggerType>
    </rules>
</Workflow>
