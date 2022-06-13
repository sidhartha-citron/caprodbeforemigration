/**
 * @FileName: ActivityInfestationTrigger
 * @Description: Trigger on Activity Infestation
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/16/2020       Created
 *-----------------------------------------------------------  
 */
trigger ActivityInfestationTrigger on Activity_Infestation__c (before insert, before update) {
    new ActivityInfestationTriggerHandler().run();
}