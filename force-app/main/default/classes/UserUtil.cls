/*Utility class related to User object

@Author : Aieleeta
*/

public class UserUtil{
   
    public static void updateRelatedRecordsInvoke(List<User> users ,Map<Id,User> oldMapUser){
        List<Id> listUserIds = new List<Id>();
        for(User u : [Select IsActive from user where id in : users]){
            if(u.IsActive == false && oldMapUser.get(u.Id).IsActive == true){
                listUserIds.add(u.Id);
            }
        }
        if(!listUserIds.isEmpty()){
            updateRelatedRecordsFuture(listUserIds);
        }
    }
    

    @future
    public static void updateRelatedRecordsFuture(List<Id> listUserIds){
        Map<Id,User> mapUser = new Map<Id,User>();
        List<Account> accountList = new List<Account>();
        List<Contact> contactList = new List<Contact>();
        List<Order> orderList = new List<Order>();
        List<WorkOrder> woList = new List<WorkOrder>();
        List<ServiceAppointment> saList = new List<ServiceAppointment>();
        List<Order_Item_Location__c> oilList = new List<Order_Item_Location__c>();
        List<ServiceResource> srList = new List<ServiceResource>();
        List<Site_Survey__c> ssList = new List<Site_Survey__c>();
        List<Case> caseList = new List<Case>();
        for(User u : [Select Id, IsActive from User where id in : listUserIds]){
            if(u.IsActive == false){
                mapUser.put(u.Id,u);
            }
        }
       for(Account acc: [Select OwnerId from Account where OwnerId in: mapUser.keySet()]){
            acc.OwnerId = Label.User_Alison_Mahoney;
            accountList.add(acc);
        }
        Database.SaveResult[] listUpdatesObjects = Database.update(accountList,false);
        
        for(Contact con: [Select OwnerId from Contact where OwnerId in: mapUser.keySet()]){
            con.OwnerId = Label.User_Alison_Mahoney;
            contactList.add(con);
        } 
        Database.SaveResult[] listUpdatesObjects2 = Database.update(contactList,false);
        
        for(Order ord : [Select Id,OwnerId from Order where OwnerId in: mapUser.keySet()]){
            ord.OwnerId = Label.User_Temporary_Owner;
            orderList.add(ord);
        }
        Database.SaveResult[] listUpdatesObjects4 = Database.update(orderList,false);
        
        for(ServiceAppointment sa : [Select Id,OwnerId from ServiceAppointment where OwnerId in : mapUser.keySet()]){
            sa.OwnerId = Label.User_Temporary_Owner;
            saList.add(sa);
        }
        Database.SaveResult[] listUpdatesObjects5 = Database.update(saList,false);
        
        for(Order_Item_Location__c oil : [Select Id,OwnerId from Order_Item_Location__c where OwnerId in : mapUser.keySet()]){
            oil.OwnerId = Label.User_Temporary_Owner;
            oilList.add(oil);
        }
        Database.SaveResult[] listUpdatesObjects6 = Database.update(oilList,false);
        
        for(ServiceResource sr : [Select Id,OwnerId from ServiceResource where OwnerId in : mapUser.keySet()]){
            sr.OwnerId = Label.User_Temporary_Owner;
            srList.add(sr);
        }
        Database.SaveResult[] listUpdatesObjects7 = Database.update(srList,false);
              
        for(Site_Survey__c ss : [Select Id,OwnerId from Site_Survey__c where OwnerId in : mapUser.keySet()]){
            ss.OwnerId = Label.User_Temporary_Owner;
            ssList.add(ss);
        }
        Database.SaveResult[] listUpdatesObjects8 = Database.update(ssList,false);
        
        
        for(WorkOrder wo : [Select Id,OwnerId from WorkOrder where OwnerId in : mapUser.keySet()]){
            wo.OwnerId = Label.User_Temporary_Owner;
            woList.add(wo);
        } 
        Database.SaveResult[] listUpdatesObjects9 = Database.update(woList,false);
        
    }  

}