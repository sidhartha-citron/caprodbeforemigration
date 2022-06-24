/**
 * @FileName: QueryUtils
 * @Description: Class to lazy load variables that require queries
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/8/2019         Created
 *-----------------------------------------------------------  
 */
public with sharing class QueryUtils {

    /*
     * @Name        mapProfilesByName
     * @Description return all profiles mapped by name
     * @Author      Graeme Ward
     * @Return      Map<String,Profile>: map of profiles by name
     */
    public static Map<String,Profile> profileMap {get {
        if(profileMap == null) {
            List<Profile> profileList = [SELECT Id, Name FROM Profile];

            profileMap = (Map<String,Profile>) JSON.deserialize(
                    ApexUtils.convertListToMap((List<SObject>) profileList, 'Name', false),
                    Map<String,Profile>.class
            );
        }

        return profileMap;
    } set;}

    /*
     * @Name        queuesByDeveloperName
     * @Description return map of all queues by developer name
     * @Author      Graeme Ward
     * @Return      Map<String,Group>: map of queue record
     */
    public static Map<String,Group> queuesByDeveloperName {get {
        if(queuesByDeveloperName == null) {
            List<Group> queues = [SELECT Id, DeveloperName FROM Group WHERE Type = 'Queue'];

            queuesByDeveloperName = (Map<String, Group>) JSON.deserialize(
                    ApexUtils.convertListToMap((List<SObject>) queues, 'DeveloperName', false),
                    Map<String,Group>.class
            );
        }

        return queuesByDeveloperName;
    } set;}

    /*
     * @Name        yearlyFrequencies
     * @Description return map of all Frequency__c custom setting records
     * @Author      Graeme Ward
     * @Return      Map<Id,Frequency__c>: map of Frequency__c custom setting records
     */
    public static Map<String,Frequency__c> yearlyFrequencies {get {
        if(yearlyFrequencies == null) {
            yearlyFrequencies = Frequency__c.getAll();
        }

        return yearlyFrequencies;
    } set;}

    /*
     * @Name        fieldServiceSettings
     * @Description return org default Field Service Settings
     * @Author      Graeme Ward
     * @Return      Field_Service_Setting__c: org default Field Service Settings
     */
    public static Field_Service_Settings__c fieldServiceSettings {get {
        if(fieldServiceSettings == null) {
            fieldServiceSettings = Field_Service_Settings__c.getOrgDefaults();
        }

        return fieldServiceSettings;
    } set;}

    /*
     * @Name        emergencyDispatchSettings
     * @Description return org default Emergency Dispatch Wizard Settings
     * @Author      Graeme Ward
     * @Return      Emergency_Dispatch_Wizard_Setttings__c: org default Field Service Settings
     */
    public static Emergency_Dispatch_Wizard_Setttings__c emergencyDispatchSettings {get {
        if(emergencyDispatchSettings == null) {
            emergencyDispatchSettings = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
        }

        return emergencyDispatchSettings;
    } set;}

    /*
     * @Name        congaAndDocusignSettings
     * @Description return org default Conga and Docusign Settings
     * @Author      Graeme Ward
     * @Return      Conca_and_Docusign_Setttings__c: org default Field Service Settings
     */
    public static Conga_and_DocuSign_Settings__c congaAndDocusignSettings {get {
        if(congaAndDocusignSettings == null) {
            congaAndDocusignSettings = Conga_and_DocuSign_Settings__c.getOrgDefaults();
        }

        return congaAndDocusignSettings;
    } set;}
}