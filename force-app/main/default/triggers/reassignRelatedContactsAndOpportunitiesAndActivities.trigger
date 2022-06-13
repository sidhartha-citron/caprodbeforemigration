/*
    Created by: Greg Hacic
    Last Update: 1 December by DCF
                    added tasks and events
                    only runs with dcf's user (upsert user)
    
*/
trigger reassignRelatedContactsAndOpportunitiesAndActivities on Account (after update) {
    Field_Service_Settings__c fss = Field_Service_Settings__c.getOrgDefaults();
    
    if (UserInfo.getUserId() == fss.Integration_User_Id__c) {
        try {
            Set<Id> accountIds = new Set<Id>(); //set for holding the Ids of all Accounts that have been assigned to new Owners
            Map<Id, String> oldOwnerIds = new Map<Id, String>(); //map for holding the old account ownerId
            Map<Id, String> newOwnerIds = new Map<Id, String>(); //map for holding the new account ownerId
            Contact[] contactUpdates = new Contact[0]; //Contact sObject to hold OwnerId updates
            Opportunity[] opportunityUpdates = new Opportunity[0]; //Opportunity sObject to hold OwnerId updates
            Task[] taskUpdates = new Task[0]; //Task sObject to hold OwnerId updates
            Event[] eventUpdates = new Event[0]; //Event sObject to hold OwnerId updates
            
            for (Account a : Trigger.new) { //for all records
                if (a.OwnerId != Trigger.oldMap.get(a.Id).OwnerId) {
                    oldOwnerIds.put(a.Id, Trigger.oldMap.get(a.Id).OwnerId); //put the old OwnerId value in a map
                    newOwnerIds.put(a.Id, a.OwnerId); //put the new OwnerId value in a map
                    accountIds.add(a.Id); //add the Account Id to the set
                }
            }
            
            if (!accountIds.isEmpty()) { //if the accountIds Set is not empty
                for (Account act : [SELECT Id, (SELECT Id, OwnerId FROM Contacts), 
                                    (SELECT Id, OwnerId FROM Opportunities WHERE IsClosed = False),
                                    (SELECT Id, OwnerId FROM Tasks WHERE IsClosed = False),
                                    (SELECT Id, OwnerId FROM Events WHERE startDateTime >= TODAY) FROM Account WHERE Id in :accountIds]) { //SOQL to get Contacts, Opportunities, Tasks and Events for updated Accounts
                    String newOwnerId = newOwnerIds.get(act.Id); //get the new OwnerId value for the account
                    String oldOwnerId = oldOwnerIds.get(act.Id); //get the old OwnerId value for the account
                    for (Contact c : act.Contacts) { //for all contacts
                        if (c.OwnerId == oldOwnerId) { //if the contact is assigned to the old account Owner
                            Contact updatedContact = new Contact(Id = c.Id, OwnerId = newOwnerId); //create a new Contact sObject
                            contactUpdates.add(updatedContact); //add the contact to our List of updates
                        }
                    }
                    for (Opportunity o : act.Opportunities) { //for all opportunities
                        System.debug('Opportunity found:' + o.OwnerId);
                        if (o.OwnerId == oldOwnerId) { //if the opportunity is assigned to the old account Owner
                            Opportunity updatedOpportunity = new Opportunity(Id = o.Id, OwnerId = newOwnerId); //create a new Opportunity sObject
                            opportunityUpdates.add(updatedOpportunity); //add the opportunity to our List of updates
                        }
                    }
                    for (Task t : act.Tasks) { //for all Tasks
                        if (t.OwnerId == oldOwnerId) { //if the Task is assigned to the old account Owner
                            Task updatedTask = new Task(Id = t.Id, OwnerId = newOwnerId); //create a new Task sObject
                            taskUpdates.add(updatedTask); //add the Task to our List of updates
                        }
                    }    
                    for (Event e : act.Events) { //for all Events
                        if (e.OwnerId == oldOwnerId) { //if the Event is assigned to the old account Owner
                            Event updatedEvent = new Event(Id = e.Id, OwnerId = newOwnerId); //create a new Event sObject
                            eventUpdates.add(updatedEvent); //add the Event to our List of updates
                        }
                    }    
                }
                update contactUpdates; //update the Contacts
                update opportunityUpdates; //update the Opportunities
                update taskUpdates; //update the Opportunities
                update eventUpdates; //update the Opportunities
            }
        } catch(Exception e) { //catch errors
            System.Debug('reassignRelatedContactsAndOpportunitiesAndActivities failure: '+e.getMessage()); //write error to the debug log
        }
    }
}