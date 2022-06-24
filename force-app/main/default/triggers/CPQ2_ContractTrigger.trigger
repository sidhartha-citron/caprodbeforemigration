/**
 * @description
 *
 * Created by Sanchivan Sivadasan on 2020-11-23.
 *
 */
trigger CPQ2_ContractTrigger on Contract (before insert, before update) {
    new CPQ2_ContractTriggerHandler().run();
}