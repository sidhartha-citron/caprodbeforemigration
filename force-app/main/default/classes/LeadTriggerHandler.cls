/**
 * @FileName: LeadTriggerHandler
 * @Description: Consolidated Trigger Handler Class 
 * @Author: Irfan Tarique
 * @ModificationLog:
 *-------------------------------------------------------------------------------------------------------------------------
 * Author            	Date            Modification 			Description
 *-------------------------------------------------------------------------------------------------------------------------
 *Irfan Tarique 		May 14th,2020	assignWebLeadOwner  	Assign lead owners based on matching FSA - Sales Territory
 *-------------------------------------------------------------------------------------------------------------------------
 **/

public class LeadTriggerHandler extends TriggerHandler {
    
    /** TRIGGER EVENTS **/
    protected override void beforeInsert(){
        assignWebLeadOwner();
    }
    protected override void beforeUpdate(){
        assignWebLeadOwner();
    }
    protected override void afterInsert(){}
    protected override void afterUpdate(){}
    protected override void beforeDelete(){}   
    
    
	/**Variables**/
    Private List<Lead> listNew;
    Private List<Lead> listOld;

    Private Map<Id, Lead> mapNew;
    Private Map<Id, Lead> mapOld;
    
    Sales_Setting__mdt[] salesSettings; 
    
    public leadTriggerHandler(){
        listNew = Trigger.new;
        listOld = Trigger.old;
        mapNew = (map<Id, Lead>)Trigger.newMap;
        mapOld = (map<Id, Lead>)Trigger.oldMap;
       	salesSettings = [SELECT id, label, Lead_Assignment_Queue_ID__c FROM Sales_Setting__mdt];
    }
    
    private void assignWebLeadOwner(){
       List<Lead> leadFSA = new List<lead>();
    
       for(Lead newLead: listNew){
            if(newLead.FSA_Lead_Assignment__c){ 
            	leadFSA.add(newLead);
            }
        }
        
        if(!leadFSA.isEmpty()){
            List<FSA_Service_Territory_Mapping__c> FSA = New List<FSA_Service_Territory_Mapping__c>
                ([SELECT id, name, FSA__c, Sales_Territory__c, Sales_Territory__r.Assigned_Sales_Representative__c 
                  FROM FSA_Service_Territory_Mapping__c 
                  WHERE Sales_Territory__r.Assigned_Sales_Representative__r.IsActive = TRUE AND Sales_Territory__r.Active__c = TRUE]);
            
            Map<String, Id> salesTerritoryRepFSA = New Map<String, Id>();   
                
            For(FSA_Service_Territory_Mapping__c pCode : FSA){  
            	salesTerritoryRepFSA.put(pCode.FSA__c, pCode.Sales_Territory__r.Assigned_Sales_Representative__c);
            }

            for(Lead l : leadFSA){ 
                String postalCode = Null;
                
                if(l.PostalCode != Null){postalCode = l.PostalCode.substring(0,3).toUppercase();}
  				l.FSA_Lead_Assignment__c = false;
                
                if(salesTerritoryRepFSA.containskey(postalCode)){
                    //Assign to Sales Territory Rep
                    l.OwnerId = salesTerritoryRepFSA.get(postalCode);
                }
                else{
                    //Assign to a queue
                    l.OwnerId = salesSettings[0].Lead_Assignment_Queue_ID__c;
                }
            }
        }
    }
}