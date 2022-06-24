/**
 * @description
 *
 * Created by Sanchivan Sivadasan on 2020-11-23.
 *
 */
public with sharing class CPQ2_ContractTriggerHandler extends TriggerHandler {
    private List<Contract> listNew;
	private List<Contract> listOld;
	private Map<Id,Contract> mapNew;
	private Map<Id,Contract> mapOld;

	public CPQ2_ContractTriggerHandler(){
		this.setMaxLoopCount(40);
		listNew = Trigger.new;
		listOld = Trigger.old;
		mapNew = (Map<Id,Contract>)Trigger.newMap;
		mapOld = (Map<Id,Contract>)Trigger.oldMap;
    }
    
    protected override void beforeInsert(){
        limitOnePerAccount();
    }
    
    protected override void beforeUpdate(){
    }
    
    /**
     * CPQCN-322 : Shashi 12/4/2020 : One contract per account allowed
     **/
    private void limitOnePerAccount(){
        Map<Id,Integer> mpContractCount = new Map<Id,Integer>();
        List<Id> accountList = new List<Id>();
        for(Contract c:listNew){
            if(c.AccountId!=null) { accountList.add(c.AccountId); }
        }
        List<Contract> contractList = [SELECT ID,AccountId FROM Contract WHERE AccountId IN: accountList];
        for(Contract c:contractList){
            Integer count = 1;
            if(mpContractCount.containsKey(c.AccountId)){
                count = mpContractCount.get(c.AccountId);
                mpContractCount.put(c.AccountId,++count);
            } else {
                mpContractCount.put(c.AccountId,count);
            }
        }
        for(Contract c:listNew){
            if(mpContractCount.containsKey(c.AccountId)){
                c.addError('Only one contract allowed per account');
            } 
        }
    }
}