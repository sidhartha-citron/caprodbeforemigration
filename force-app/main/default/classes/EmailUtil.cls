/*Utility class to hold functionality related to email

@Author: Aieleeta*/

/**
* Modified Nov 4th 2019  - Irfan Tarique
* Change log: Email Template Modified
* */

public class EmailUtil{
    
    public static void SendEmailToManagerInvoke(List<User> users ,Map<Id,User> oldMapUser){
        List<Id> listUserIds = new List<Id>();
        for(User u : [Select IsActive from user where id in : users]){
            if(u.IsActive == false && oldMapUser.get(u.Id).IsActive == true){
                listUserIds.add(u.Id);
            }
        }
        if(!listUserIds.isEmpty()){
            SendEmailToManagerFuture(listUserIds);
        }
    }
    
    @future
    public static void SendEmailToManagerFuture(List<Id> userIds){
        Map<Id,Id> mapUserToManager = new Map<Id,Id>();
        Map<Id,Map<Id,List<Case>>> mapManagerToUserCase = new Map<Id,Map<Id,List<Case>>>();
        Map<Id,Map<Id,Integer>> mapManagerToCaseCount = new Map<Id,Map<Id,Integer>>();
        List<Messaging.SingleEmailMessage> emailList = new List<Messaging.SingleEmailMessage>();
        Map<Id,string> mapManagerDetails = new Map<Id,string>();
        Map<Id,User> mapUserToDetails = new Map<Id,User>();
        
        for(User u : [Select Id,ManagerId,IsActive from User where id in : userIds]){
            if(u.IsActive == false){
                mapUserToManager.put(u.Id,u.ManagerId);
            }
        }
        System.debug('++User Inactive++');
        for(Case cas : [Select Id,OwnerId,status,IsClosed from Case where OwnerId in: mapUserToManager.keySet() AND IsClosed = false]){
            if(mapManagerToUserCase.containsKey(mapUserToManager.get(cas.OwnerId))){
                if(mapManagerToUserCase.get(mapUserToManager.get(cas.OwnerId)).containsKey(cas.OwnerId)){
                    mapManagerToUserCase.get(mapUserToManager.get(cas.OwnerId)).get(cas.OwnerId).add(cas);
                }else{
                    mapManagerToUserCase.get(mapUserToManager.get(cas.OwnerId)).put(cas.OwnerId,new List<Case>{cas});
                }
            }else{
                mapManagerToUserCase.put(mapUserToManager.get(cas.OwnerId),new Map<Id,List<Case>>{cas.OwnerId => new List<Case>{cas}});
            }
        } 
        System.debug('++Is There a Case Already++' + mapUserToManager.keySet());
        for(User u : [Select Id,ManagerId,Manager.email,Name from User where id in :  mapUserToManager.keySet()]){
            mapUserToDetails.put(u.Id, u);
            if(mapManagerToUserCase.get(u.ManagerId) != null){
                if(mapManagerToUserCase.get(u.ManagerId).get(u.Id).size() > 0){
                    Integer countOfTickets = mapManagerToUserCase.get(u.ManagerId).get(u.Id).size();
                    mapManagerToCaseCount.put(u.ManagerId,new Map<Id,Integer>{u.Id => countOfTickets});
                    mapManagerDetails.put(u.ManagerId,u.Manager.email);
                    
                }
                
                Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                mail.setToAddresses(new List<String> {mapManagerDetails.get(u.ManagerId)});
                mail.setSubject(mapUserToDetails.get(u.Id).Name + ' has been deactivated in Salesforce.');
                mail.setHtmlBody (mapUserToDetails.get(u.Id).Name + ' is deactivated in Salesforce and the user has'+ ' ' + mapManagerToCaseCount.get(u.ManagerId).get(u.Id) + ' ' + 'open tickets. ' + 
                                  'Please follow the below report to reassign the tickets.' + '<br/>' + 'https://citronhygiene.lightning.force.com/lightning/r/Report/00Of1000004Q29LEAS/view?queryScope=userFolders');
                emailList.add(mail);
            }
        }
        if (!emailList.IsEmpty()) {
            System.debug('++Deactived User Email..Sent++');
            Messaging.sendEmail(emailList);
        }
    }
}