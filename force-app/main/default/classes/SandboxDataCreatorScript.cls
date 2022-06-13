/**
 * @FileName: SandboxDataCreatorScript
 * @Description: Inserts operating hours, service territories, service resource, service territory member, configuration, account, contact, service branch and FSA. 
 * @Author: Irfan Tarique
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification 
 *  
 *-----------------------------------------------------------  
 **/
public class SandboxDataCreatorScript {
    /**
    * Variables
    **/
    static list<ServiceTerritory> st_q3 = new list<ServiceTerritory>();
    static List<CPQ_Service_Branches__c> listSrvBranch = new List<CPQ_Service_Branches__c>([select id from CPQ_Service_Branches__c]); 
    static List<FSA_Service_Territory_Mapping__c> listFsa = new List<FSA_Service_Territory_Mapping__c>();
    
    
    /**
    * Run All: Creates all datasets
    **/
    static public void runAll(){ 
        System.debug('SandboxDataCreatorScript|crtOperatingHours|Start');
        SandboxDataCreatorScript.crtOperatingHours();
        System.debug('SandboxDataCreatorScript|crtOperatingHours|END');
        
        System.debug('SandboxDataCreatorScript|crtServiceTerritories|Start');
        SandboxDataCreatorScript.crtServiceTerritories();
        System.debug('SandboxDataCreatorScript|crtServiceTerritories|END');
        
        
        System.debug('SandboxDataCreatorScript|crtServiceResource|Start');
        SandboxDataCreatorScript.crtServiceResource();
        System.debug('SandboxDataCreatorScript|crtServiceResource|END');
        
        
        System.debug('SandboxDataCreatorScript|crtServiceTerritoryMember|Start');
        SandboxDataCreatorScript.crtServiceTerritoryMember();
        System.debug('SandboxDataCreatorScript|crtServiceTerritoryMember|END');
        
        
        System.debug('SandboxDataCreatorScript|crtConfiguration|Start');
        SandboxDataCreatorScript.crtConfiguration();
        System.debug('SandboxDataCreatorScript|crtConfiguration|END');
        
        
        System.debug('SandboxDataCreatorScript|crtAccount|Start');
        SandboxDataCreatorScript.crtAccount();
        System.debug('SandboxDataCreatorScript|crtAccount|END');
        
        
        System.debug('SandboxDataCreatorScript|crtContact|Start');
        SandboxDataCreatorScript.crtContact();
        System.debug('SandboxDataCreatorScript|crtContact|END');
        
        System.debug('SandboxDataCreatorScript|crtServiceBranch|Start');
        SandboxDataCreatorScript.crtServiceBranch();
        System.debug('SandboxDataCreatorScript|crtServiceBranch|END');
        
        System.debug('SandboxDataCreatorScript|crtFSA|Start');
        SandboxDataCreatorScript.crtFSA();
        System.debug('SandboxDataCreatorScript|crtFSA|END');
        
    }
    
    /**
    * crtOperatingHours: Creates operating hours 
    **/
    static public void crtOperatingHours(){ 
        list<OperatingHours> oh_q = new list<OperatingHours>([select id from OperatingHours]);
        
        if(oh_q.size() < 1){
            list<OperatingHours> opHours = new List<OperatingHours>();
            
            operatingHours territoryHours = new OperatingHours(
                Name = '9am- 5am Territory Operating Hours',
                Operating_Hours_Type__c='Territory Operating Hours',
                TimeZone='America/New_York'
            );
            
            opHours.add(territoryHours);
            
            OperatingHours oh = new OperatingHours(
                Name='9am- 5am Account Operating Hours',
                Operating_Hours_Type__c='Account Operating Hours',
                TimeZone='America/New_York'
            );
            
            opHours.add(oh);
            
            OperatingHours employeeHours = new OperatingHours(
                Name='9am- 5am Employee Operating Hours',
                Operating_Hours_Type__c='Employee Operating Hours',
                TimeZone='America/New_York'
            );
            
            opHours.add(employeeHours);
            
            
            insert opHours;    
        }
        
    }
    
    /**
    * crtServiceTerritories: Creates Service Territories 
    **/    
    static public void crtServiceTerritories(){ 
        list<ServiceTerritory> st_q = new list<ServiceTerritory>([select id from ServiceTerritory]);
        
        //Service Territories
        list<OperatingHours> oh_q2 = new list<OperatingHours>([select id from OperatingHours]);
        if(st_q.size() < 1 && oh_q2.size() > 0){
            ServiceTerritory st_Parent = new ServiceTerritory(
                Name = 'Parent Service Territory',
                OperatingHoursId = oh_q2[0].id,
                isActive = true,
                Include_In_Integration__c = true,
                street = '555 Alden Rd',
                city = 'Markham',
                state = 'ON',
                PostalCode = 'L3R 3L5',
                Country = 'Canada',
                Description = 'Test Service Territory'
            );
            
            insert st_Parent;
            
            ServiceTerritory st_Child = new ServiceTerritory(
                Name = 'Child Service Territory',
                ParentTerritoryId = st_Parent.id,
                OperatingHoursId = oh_q2[0].id,
                isActive = true,
                Include_In_Integration__c = true,
                street = '555 Alden Rd',
                city = 'Markham',
                state = 'ON',
                PostalCode = 'L3R 3L5',
                Country = 'Canada',
                Description = 'Test Service Territory'
            );
            
            insert st_Child;
        }
    }
    
    /**
    * crtServiceResource: Creates Service Resource 
    **/
    
    static public void crtServiceResource(){
        //Service Resource
        List<User> usr_id = new List<User>([select id from user where name = 'Multires Test Tech' limit 1]);
        List<ServiceResource> Sr_q = new list<ServiceResource>([select id from ServiceResource where name = 'TestResource' limit 1]);
        
        if(Sr_q.size() < 1){
            ServiceResource  sr =  new ServiceResource(
                Name='TestResource',
                RelatedRecordId= usr_id[0].id,
                ResourceType= 'T',
                Region__c = 'Markham',
                isActive=TRUE
            );
            
            insert sr;
        }
    }
    
    /**
    * crtServiceTerritoryMember: Creates Service Territory Member 
    **/
    static public void crtServiceTerritoryMember(){
        //Service Territory Member
        list<ServiceTerritoryMember> stm_q = new list<ServiceTerritoryMember>([select id from ServiceTerritoryMember]);
        list<ServiceResource> Sr_q2 = new list<ServiceResource>([select id from ServiceResource where name = 'TestResource' limit 1]);
        list<ServiceTerritory> st_q2 = new list<ServiceTerritory>([select id from ServiceTerritory]);
        
        if(stm_q.size() < 1){
            ServiceTerritoryMember stm = new ServiceTerritoryMember(
                ServiceResourceId = Sr_q2[0].id,
                ServiceTerritoryId = st_q2[0].id,
                EffectiveStartDate = System.Today(),
                EffectiveEndDate = System.today() + 30
            );
            
            insert stm;
        }
    }
    
    /**
    * crtConfiguration: Creates Configuration 
    **/
    public static void crtConfiguration(){
        List<Configuration__c> congfig = new List<Configuration__c>();
        
        congfig.add(new Configuration__c(Name = '15-05-18 17:06', ControllingFieldName__c = 'Location_Type__c', DependantFieldName__c = 'Location_SubType__c'));
        congfig.add(new Configuration__c(Name = '12-02-18 11:38', ControllingFieldName__c = 'Location_Type__c', DependantFieldName__c = 'Location_SubType__c'));
        congfig.add(new Configuration__c(Name = '15-05-18 17:06', ControllingFieldName__c = 'Type', DependantFieldName__c = 'Location_SubType__c'));
        congfig.add(new Configuration__c(Name = '15-05-18 17:06', ControllingFieldName__c = 'Location_Type__c', DependantFieldName__c = 'Location_SubType__c'));
        
        insert congfig;
    }
    
    
    /**
    * crtAccount: Creates Account 
    **/
    static public void crtAccount(){
        //Account
        List<Account> acc_q = new list<Account>([select id from Account where name = 'TestAccount']); 
        //for(ServiceTerritory stTemp :[select id from ServiceTerritory where name = 'Child Service Territory' limit 1]){}
        st_q3.add([select id from ServiceTerritory where name = 'Child Service Territory' limit 1]);
        
        if(acc_q.size() < 1){
            Account Acct = new Account(
                Name='TestAccount',
                AccPac_Account__c='1234',
                A_P_Contact_Name__c='TestContactName',
                Credit_Check__c='Completed',
                Industry='Institutions',
                Industry_Code_Accpac__c='000-00 UNKNOWN',
                Invoice_Preference__c='Email',
                Invoicing_Email_Address__c='Test@test.com',
                LEED_Customer__c='No',
                On_Hold__c=FALSE,
                Type='Customer',
                Phone='123456789',
                Billing_Suite_Number__c='1',
                BillingStreet='Street',
                BillingCity = 'Toronto',
                BillingState = 'ON',
                BillingPostalCode = 'L3R3L5',
                BillingCountry = 'CA',
                Shipping_Suite_Number__c = '1',
                ShippingStreet = 'Street',
                ShippingCity = 'Toronto',
                ShippingState = 'ON',
                ShippingPostalCode = 'L3R3L5',
                ShippingCountry = 'CA',
                Service_Territory__c = st_q3[0].id,
                //OperatingHoursId = oh.id,
                Lead_Source__c ='Call In'
            );
            
            Insert Acct;
        }
        
    }
    
    /**
    * crtAccount: Creates Contact 
    **/
    static public void crtContact(){
        
        List<Account> acc_q2 = new list<Account>([select id from Account where name = 'TestAccount' limit 1]);
        List<Contact> c_q = new List<Contact>([select id from contact where firstName = 'TestFirstName' limit 1]);
        
        if(c_q.size() < 1){
            Contact c = new contact(
                FirstName = 'TestFirstName',
                LastName = 'TestLastName',
                Email = 'testUser@UserCommunity.com',
                AccountId = acc_q2[0].Id,
                Title = 'title',
                Phone = '123678',
                Fax = '123458',
                MobilePhone = '6471111234',
                Customer_Satisfaction_eSurveys__c = FALSE,
                Customer_Opinion_eSurveys__c = TRUE,
                Customer_eNewsletters__c = FALSE,
                Promotional_Offer_Emails__c = TRUE,
                Promotional_Mailings__c = FALSE
            );
            
            insert c;
        }
    }    
    
    /**
     * Create Service Branch Record
     **/
    static public void crtServiceBranch(){
        
        if(listSrvBranch.size()>0){return;}
        DateTime myDateTime = DateTime.now();
        
        listSrvBranch.add(new CPQ_Service_Branches__c(
            CPQ_Average_Cost_Minute__c = 0.69,
            CPQ_Average_Drive_Stem_Cost__c = 17.4,
            CPQ_Direct_Cost_of_Revenue__c = 1,
            CPQ_External_Id__c = 'Toronto' + String.valueOf(myDateTime.getTime())
        ));
        insert listSrvBranch;
    }
    
    static public void crtFSA(){
        
        listFsa = [Select Id,FSA__c,Province__c,CPQ_Service_Branch__c,CPQ_Service_Zone__c FROM FSA_Service_Territory_Mapping__c WHERE FSA__c = 'L3R'];
        if(listFsa.size()>0){return;}
        listFsa.add(new FSA_Service_Territory_Mapping__c( 
            FSA__C = 'L3R', 
            Name = 'ZZZ', 
            Province__c = 'Ontario',
            CPQ_Service_Branch__c = listSrvBranch[0].Id,
            CPQ_Service_Zone__c = '1'
        ));
        insert listFsa;
        
    }
    
}