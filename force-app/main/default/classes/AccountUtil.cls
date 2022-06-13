/*
Purpose : Account's utility class. Containing the methods relating to the Account object.
Author : Aieleeta
*/

public class AccountUtil{
    /*
        Purpose: To check if an Account has atleast one child and if yes, restrict it from becoming the child to another Account.
                 To check if an Account has a parent and if yes, restrict it from becoming a parent to another Account.
                 When a child is added to an Account, update the field isParent__c to true.
        Author : Aieleeta       
    */
    public static void ValidateAccountforParent(List<Account> accountList, Map<Id,Account> oldMap){
        Map<Id,List<Id>> mapAccountToChildAccounts = new Map<Id,List<Id>>();
        Set<Id> setAccountId = new Set<Id>();
        Set<Id> setParentId = new Set<Id>();
        Set<Id> setParentAndChildId = new Set<Id>();
        Map<Id,Id> mapParentToParent = new Map<Id,Id>();
        Map<Id,Boolean> MapParentIsParent = new Map<Id,Boolean>();
        
        for(Account acc : accountList){
            if(oldMap == null || acc.ParentId != oldMap.get(acc.Id).ParentId) {
                setAccountId.add(acc.Id); //Current Account
                setParentId.add(acc.ParentId); //Current Account's Parent
                setParentAndChildId.add(acc.Id);
                if(acc.ParentId != null){setParentAndChildId.add(acc.ParentId);}
            }
        }

        if(setParentAndChildId.isEmpty()){
            return;
        }

        //2021-03-01 Darcy: combined 3 queries into 1. Commented blocks were replaced by the block directly above
        List<Account> allAccounts = new List<Account>([SELECT Id, ParentId, isParent__c 
                                                       FROM Account 
                                                       WHERE Id in: setParentAndChildId OR ParentId in: setParentAndChildId]);

        for(Account acc : allAccounts){
            if(setParentId.contains(acc.Id)){
                mapParentToParent.put(acc.Id,acc.ParentId); //Current Account's Parent, Parent                
            }
        }

        //Is Current Account a Parent?
        for(Account acc : allAccounts){
            if(setAccountId.contains(acc.ParentId)){
                if(mapAccountToChildAccounts.containsKey(acc.ParentId)){
                    mapAccountToChildAccounts.get(acc.ParentId).add(acc.id);
                }else{
                    mapAccountToChildAccounts.put(acc.ParentId,new List<Id>{acc.id});
                }
            }
        }

        for(Account acc : accountList){
                if(mapAccountToChildAccounts.get(acc.Id) != null && mapAccountToChildAccounts.get(acc.id).size() > 0 && acc.ParentId != null){
                    acc.addError('This account cannot have a parent as either it has children or the parent has a parent. View the hierarchy of this account or the parent you are trying to associate for more information.” ');
                }else if(mapParentToParent.get(acc.ParentId) != null){
                    acc.addError('This account cannot have a parent as either it has children or the parent has a parent. View the hierarchy of this account or the parent you are trying to associate for more information.” ');
                }else{
                    MapParentIsParent.put(acc.ParentId,acc.isParent__c);
                }
        }

        List<Account> listAccount = new List<Account>();
        for(Account acc : allAccounts){
            if(MapParentIsParent.keySet().contains(acc.Id)){
                if(!acc.isParent__c){
                    acc.isParent__c = true;
                    listAccount.add(acc);
                }   
            }
        }
        update listAccount;
    }
    
    /*
        Purpose: If any child account is deleted or its parent Account is updated, make the isParent__c field 
                in the previous parent account to false.            
        Author : Aieleeta
    */
    public static void updateIsParentOnAccount(List<Account> accounts , Map<Id,Account> oldMap , String event){

        Set<Id> setAccountId = new Set<Id>();
        Set<Id> setParentId = new Set<Id>();
        Set<Id> setAccId = new Set<Id>();
        Map<Id,List<Id>> mapAccountToParentAccounts = new Map<Id,List<Id>>();
        List<Account> updateAccount = new List<Account>();

        for(Account acc : accounts){
            if(event == 'update' && oldMap.get(acc.id).ParentId != null && oldMap.get(acc.id).ParentId != acc.ParentId){
                setAccountId.add(acc.Id);
                setParentId.add(oldMap.get(acc.Id).ParentId);
                setAccId.add(acc.Id);
                setAccId.add(oldMap.get(acc.Id).ParentId);
            } else if(event == 'delete' && oldMap.get(acc.id).ParentId != null){
                setAccountId.add(acc.Id);
                setParentId.add(oldMap.get(acc.Id).ParentId);
                setAccId.add(acc.Id);
                setAccId.add(oldMap.get(acc.Id).ParentId);
            }
        }

        if(setAccId.isEmpty()){
            return;
        }

        List<Account> allAccounts = new List<Account>([SELECT Id, ParentId, isParent__c 
                                                       FROM Account 
                                                       WHERE Id in: setAccId OR ParentId in: setAccId]);

        for(Account acc : allAccounts){
            if(setParentId.contains(acc.ParentId)){
                if(mapAccountToParentAccounts.containsKey(acc.ParentId)){
                    mapAccountToParentAccounts.get(acc.ParentId).add(acc.id);
                }else{
                    mapAccountToParentAccounts.put(acc.ParentId,new List<Id>{acc.id});
                }
            }
        }

        for(Account acc : allAccounts){
            if(setAccountId.contains(acc.Id)){
                if(event == 'delete'){
                    if(mapAccountToParentAccounts.get(acc.ParentId).size() == 1){
                        updateAccount.add(new Account(Id = acc.ParentId , isParent__c = false));
                    }       
                }
                if(event == 'update'){
                    if((acc.ParentId == null || acc.ParentId != oldMap.get(acc.id).ParentId) && mapAccountToParentAccounts.size() == 0){
                        updateAccount.add(new Account(Id = oldMap.get(acc.id).ParentId  , isParent__c = false));
                    }
                }
            }
        }

        if(updateAccount.isEmpty() == false){
            update updateAccount;
        }
    }
}