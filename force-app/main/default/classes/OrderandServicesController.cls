/**
 * Controller Class for OrderandServices lightning component
 *
 * @author Citron - Tim Chiang
 * @date 2019
 *
 **/
public with sharing class OrderandServicesController {

    /**
    * Result wrapper class for this controller
    *
    * @author Citron - Tim Chiang
    * @date 2019
    *
    **/
    public class ViewData {
        public Map<Id, Room> roomMap;
        public Set<String> setOfRooms;
        public Set<String> setOfServices;
        @AuraEnabled public list<String> listOfRooms;
        @AuraEnabled public list<String> listOfServices;
        @AuraEnabled public List<Room> roomList;
        @AuraEnabled public Id currentUserContact;
        @AuraEnabled public Map<String, Decimal> frequencyWeightingMap;
        @AuraEnabled public Map<String, Decimal> serviceWeightingMap;
        @AuraEnabled public Map<String, Decimal> familyWeightingMap;

        public ViewData(){
            this.roomMap = new Map<Id, Room>();

            User user = [SELECT Id, ContactId FROM User WHERE Id=: UserInfo.getUserId() LIMIT 1];
            this.currentUserContact = user.ContactId;

            List<Value_Weighting__mdt> frequencyWeightingList = [SELECT Label, Type__c, Value__c FROM Value_Weighting__mdt WHERE Type__c='Frequency'];
            frequencyWeightingMap = new Map<String, Decimal>();

            for(Value_Weighting__mdt vw: frequencyWeightingList){
                frequencyWeightingMap.put(vw.Label, vw.Value__c);
            }

            List<Value_Weighting__mdt> serviceWeightingList = [SELECT Label, Type__c, Value__c FROM Value_Weighting__mdt WHERE Type__c='Service'];
            serviceWeightingMap = new Map<String, Decimal>();

            for(Value_Weighting__mdt vw: serviceWeightingList){
                serviceWeightingMap.put(vw.Label, vw.Value__c);
            }

            List<Value_Weighting__mdt> familyWeightingList = [SELECT Label, Type__c, Value__c FROM Value_Weighting__mdt WHERE Type__c='Family'];
            familyWeightingMap = new Map<String, Decimal>();

            for(Value_Weighting__mdt vw: familyWeightingList){
                familyWeightingMap.put(vw.Label, vw.Value__c);
            }



            setOfRooms = new Set<String>();
            setOfServices = new Set<String>();
            listOfRooms = new list<String>();
            listOfServices = new list<String>();
        }

        public void addSummaryLine(summaryLine summaryLine){
            if(!this.roomMap.containsKey(summaryLine.surveyLocation)){
                this.roomMap.put(summaryLine.surveyLocation, new Room(summaryLine));
            } else {
                this.roomMap.get(summaryLine.surveyLocation).addSummaryLine(summaryLine);
            }

            this.setOfRooms.add(summaryLine.surveyLocation);
            this.setOfServices.add(summaryLine.itemType);
        }

        public void convertAuraFriendly(){
            this.roomList = this.roomMap.values();
            this.listOfRooms.addAll(this.setOfRooms);
            this.listOfServices.addAll(this.setOfServices);

            for(Room room: this.roomList){
                room.convertAuraFriendly();
            }
        }         
    }

    /**
    * Room class to organize and handle Room related details
    *
    * @author Citron - Tim Chiang
    * @date 2019
    *
    **/
    public class Room {
        @AuraEnabled public String locationId;
        @AuraEnabled public String locationName;
        @AuraEnabled public List<Service> services;
        public Map<String, Service> serviceMap;

        public Room(SummaryLine summaryLine){
            this.locationId = summaryLine.surveyLocation;
            this.locationName = summaryLine.surveyLocationName;
            this.serviceMap = new Map<String, Service>();
            this.serviceMap.put(summaryLine.itemType, new Service(summaryLine));
        }

        public void addSummaryLine(SummaryLine summaryLine){
            if(this.serviceMap.containsKey(summaryLine.itemType)){
                this.serviceMap.get(summaryLine.itemType).AddSummaryLine(summaryLine);
            } else {
                this.serviceMap.put(summaryLine.itemType, new Service(summaryLine));
            }
        }

        public void convertAuraFriendly(){
            this.services = this.serviceMap.values();

            for(Service service: this.services){
                service.convertAuraFriendly();
            }
        } 
    }

    public class Service {
        @AuraEnabled public String serviceName;
        @AuraEnabled public List<Family> families;
        public Map<String, Family> familyMap;

        public Service(SummaryLine summaryLine){
            this.serviceName = summaryLine.itemType;
            this.familyMap = new Map<String, Family>();
            this.familyMap.put(summaryLine.productFamily, new Family(summaryLine));
        }

        public void AddSummaryLine(SummaryLine summaryLine){
            if(this.familyMap.containsKey(summaryLine.productFamily)){
                this.familyMap.get(summaryLine.productFamily).AddSummaryLine(summaryLine);
            } else {
                this.familyMap.put(summaryLine.productFamily, new Family(summaryLine));
            }
        }

        public void convertAuraFriendly(){
            this.families = this.familyMap.values();
        }        

    }

    public class Family {
        @AuraEnabled public String familyName;
        @AuraEnabled public List<SummaryLine> lineItems;

        public Family(SummaryLine summaryLine){
            this.familyName = summaryLine.productFamily;
            this.lineItems = new List<SummaryLine>();
            this.lineItems.add(summaryLine);
        }

        public void AddSummaryLine(SummaryLine summaryLine){
            this.lineItems.add(summaryLine);
        }
    }


    /**
    * Summary Line Class used as a line item
    *
    * @author Citron - Tim Chiang
    * @date 2019
    *
    **/
    public class SummaryLine {
        @AuraEnabled public String pEntry;
        @AuraEnabled public String itemType;
        @AuraEnabled public String productName;
        @AuraEnabled public String frequency;
        @AuraEnabled public String newFrequency;
        @AuraEnabled public Integer quantity;
        @AuraEnabled public Integer newQuantity;
        @AuraEnabled public String surveyLocation;
        @AuraEnabled public String surveyLocationName;
        @AuraEnabled public String productFamily;
        @AuraEnabled public String notes;
        @AuraEnabled public Boolean doNotAllowEdit;
        @AuraEnabled public List<String> allowableFreq;

        public SummaryLine(OrderItem aggOi){  
            this.productName = aggOi.Product2.Invoice_English_Description__c;
            this.quantity = (aggOi.Quantity != null) ? Integer.valueOf(aggOi.Quantity): 0; 
            this.newQuantity = this.quantity; 
            this.itemType = aggOi.Product2.Item_Type__c;   
            this.pEntry = aggOi.PricebookEntryId;   
            this.frequency = (aggOi.Frequency__c != null) ? aggOi.Frequency__c: ''; 
            this.newFrequency = this.frequency;
            this.productFamily = aggOi.Product2.Family;
            this.surveyLocation = aggOi.Survey_Location__c; 
            this.surveyLocationName = aggOi.Survey_Location__r.Name;
            this.doNotAllowEdit = aggOi.Product2.Not_Editable_in_Community__c;
            if(String.isNotEmpty(aggOi.Product2.Allowable_Frequencies__c)){
                this.allowableFreq = aggOi.Product2.Allowable_Frequencies__c.split(';');
            } else {
                this.allowableFreq = new List<String>();
            }
            
        }
    }

    @AuraEnabled
    public static Case saveTicket(Case newCase) {
        try{
            insert newCase;
        } catch(Exception e){
            throw new AuraHandledException('Error please contact your administrator. ' + e.getMessage());
        }
        
        return newCase; 
    }


    /**
     * main call to retrieve product summary
     *
     * @param   accountId       target account to get summary for
     * @return                  wrapper class containing service summary
     **/
    @AuraEnabled
    public static ViewData loadViewData(Id accountId) { 
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();

        // Create the rooms, services and summary lines based on aggregate data
        ViewData returnData = new ViewData();

        Map<String, OrderItem> sumOrderItemMap = new Map<String, OrderItem>();

        for(OrderItem oi: [SELECT Id,
                                    PricebookEntryId, 
                                    Product2.Name,
                                    Product2.Item_Type__c, 
                                    Product2.Family,
                                    Product2.Allowable_Frequencies__c,
                                    Product2.Invoice_English_Description__c,
                                    Product2.Not_Editable_in_Community__c,
                                    Survey_Location__c,
                                    Survey_Location__r.Name,
                                    Frequency__c, 
                                    Quantity
                            FROM OrderItem 
                            WHERE Order.AccountId=:accountId AND 
                                    Order.Status=:fssetting.Order_Active_Stage__c AND 
                                    IsActive__c = true
                        ]){
            
            String key = oi.PricebookEntryId + '-' + oi.Survey_Location__c + '-' + oi.Frequency__c;

            if(sumOrderItemMap.containsKey(key)){
                sumOrderItemMap.get(key).Quantity += oi.Quantity;
            } else {
                sumOrderItemMap.put(key, oi);
            }
        }

        for(OrderItem aggOi: sumOrderItemMap.values()){
            returnData.addSummaryLine(new SummaryLine(aggOi));
        }

        returnData.convertAuraFriendly();

        return returnData;        
    }
}