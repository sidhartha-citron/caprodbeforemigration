@isTest
public class TestServiceTerritoryMemberObjectFields {
    
    @TestSetup static void setup() {
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        fssetting.Home_Base_Technician_Picklist_Value__c = 'Home';
        fssetting.Warehouse_Technician_Picklist_Value__c = 'Warehouse';
        insert fssetting;
        
        OperatingHours territoryHours = new OperatingHours(
            Name='TestHoursTerritory', 
            Operating_Hours_Type__c='Territory Operating Hours', 
            TimeZone='America/New_York'
        );
        OperatingHours employeeHours = new OperatingHours(
            Name='TestHoursEmployee', 
            Operating_Hours_Type__c='Employee Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{territoryHours, employeeHours};
            
            ServiceTerritory st1 = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios1'
            
        );
        insert st1;
        ServiceTerritory st = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=territoryHours.Id, 
            Name='TerritoryForCaseTestScenarios',
            ParentTerritoryId = st1.Id
            
        );
        insert st;
        User newUser = new User(
            Alias = 'testAB', 
            Email = 'testAB@UserTechnicianForTest.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TestFirstName1',
            LastName = 'TestLastName1', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testAB@UserTechnicianForTest.com', 
            Employee_Number__c = 'testAB1234'
        );
        insert newUser;
        
        ServiceResource testResource1 = new ServiceResource(
            Name='TestResource1', 
            RelatedRecordId=newUser.Id,
            ResourceType='T', 
            isActive=TRUE
        );
        ServiceResource testResource2 = new ServiceResource(
            Name='TestResource2', 
            RelatedRecordId=UserInfo.getUserId(),
            ResourceType='T', 
            isActive=TRUE
        );
        insert new List<ServiceResource>{testResource1, testResource2};
    }
    
    static testMethod void testInsertUpdate(){
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        List<ServiceTerritoryMember> stms = new List<ServiceTerritoryMember>();
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        insert fssetting;*/
        
        ServiceTerritory testTerritory = [SELECT Id, Name FROM ServiceTerritory WHERE Name='TerritoryForCaseTestScenarios' LIMIT 1].get(0); 
        ServiceResource testResource1 = [SELECT Id, Name FROM ServiceResource WHERE Name='TestResource1' LIMIT 1].get(0);
        ServiceResource testResource2 = [SELECT Id, Name FROM ServiceResource WHERE Name='TestResource2' LIMIT 1].get(0);
        OperatingHours employeeHours = [SELECT Id, Name FROM OperatingHours WHERE Name='TestHoursEmployee' LIMIT 1].get(0);
        
        stms.add(new ServiceTerritoryMember(
            OperatingHoursId=employeeHours.Id, 
            ServiceResourceId=testResource1.Id, 
            ServiceTerritoryId=testTerritory.Id, 
            EffectiveStartDate=System.today().addDays(100),
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            TerritoryType='P', 
            Starting_Location__c=fssetting.Home_Base_Technician_Picklist_Value__c
        ));
        stms.add(new ServiceTerritoryMember(
            OperatingHoursId=employeeHours.Id, 
            ServiceResourceId=testResource2.Id, 
            ServiceTerritoryId=testTerritory.Id, 
            EffectiveStartDate=System.today().addDays(100),
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            TerritoryType='P', 
            Starting_Location__c=fssetting.Warehouse_Technician_Picklist_Value__c
        ));
        insert stms;
        
        //update stms;
        System.debug(stms);
    }
    
    static testMethod void testInsertUpdateError(){
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        /*Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Operating_Hours_Type_Employee__c = 'Employee Operating Hours';
        insert fssetting;*/
        
        ServiceTerritory testTerritory = [SELECT Id, Name FROM ServiceTerritory WHERE Name='TerritoryForCaseTestScenarios' LIMIT 1].get(0); 
        ServiceResource testResource = [SELECT Id, Name FROM ServiceResource WHERE Name='TestResource1' LIMIT 1].get(0);
        OperatingHours territoryHours = [SELECT Id, Name FROM OperatingHours WHERE Name='TestHoursTerritory' LIMIT 1].get(0);
        
        ServiceTerritoryMember stm = new ServiceTerritoryMember(
            OperatingHoursId=territoryHours.Id, 
            ServiceResourceId=testResource.Id, 
            ServiceTerritoryId=testTerritory.Id, 
            EffectiveStartDate=System.today().addDays(200),
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country',
            TerritoryType='P'
        );
        System.debug(stm);
        try {
            insert stm;
        	update testResource;
        } catch (Exception e) {
        	System.assert(e.getMessage().contains('Employee Operating Hours'), 'message=' + e.getMessage());
        }        
    }
    
}