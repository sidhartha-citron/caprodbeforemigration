public class TestingUtils {
    
    public static Id rType = Label.RT_AccountRecordType;
    
    public static Account[] createAccounts(Integer n,Id recordType) {
        Account[] accounts = new Account[0];
        for(Integer i =0; i< n ;i++){
            Account temp = new Account(Name='TEST_ACCOUNT'+i,Lead_Source__c='Blitz Day',Phone='12345678'+i,BillingCountry='CA',
                                       BillingState='ON',BillingCity='Toronto');
            if (recordType != null) { temp.RecordTypeId = recordType; }
            accounts.add(temp);
        }
        return accounts;
    }
    
    public static Contact[] createContacts(Integer n,Account[] accList){
        Contact[] contacts = new Contact[0];
        for(Integer i = 0; i<n; i ++){
            Contact con = new Contact(lastname = 'Test_Contact'+i, AccountId = accList[i].Id, Status__c='Active');
            contacts.add(con);
        }
        return contacts;
    }
    
    public static Case[] createCase(Integer n,Id recordType){
        Case[] cases = new Case[0];
        for(Integer i=0; i<n;i++){
            Case cas = new Case(Status = 'New',Origin = 'Phone',RecordTypeId = recordType);
            cases.add(cas);
        }
        return cases;
    }
    
    public static Order[] createOrder(Integer n,Id recordType, Account[] accList, Date startDate){
        Order[] orders = new Order[0];
        for(Integer i=0; i<n;i++){
            Order order = new Order(Status = 'Draft',EffectiveDate = startDate,AccountId = accList[i].Id,RecordTypeId = recordType );
            orders.add(order);
        }
        return orders;
    }
    
    public static ServiceAppointment[] createServiceAppointment(Integer n,Id recordType,Datetime DueDate, Datetime EarliestStartTime){
        ServiceAppointment[] ServiceAppointments = new ServiceAppointment[0];
        for(Integer i=0; i<n;i++){
            ServiceAppointment sa = new ServiceAppointment(Status = 'New',RecordTypeId = recordType, DueDate = DueDate, EarliestStartTime = EarliestStartTime);
            ServiceAppointments.add(sa);
        }
        return ServiceAppointments;
    }
    
    /*public static Order[] createOrderitemLocation(Integer n,Id recordType, Id AccId, Date startDate){
        Order[] orders = new Order[0];
        for(Integer i=0; i<n;i++){
            Order order = new Order(Status = 'Draft',EffectiveDate = startDate,AccountId = AccId );
            orders.add(case);
        }
        return orders;
    }*/
    
    public static WorkOrder[] createWorkOrder(Integer n,Id recordType){
        WorkOrder[] workOrders = new WorkOrder[0];
        for(Integer i=0; i<n;i++){
            WorkOrder wo = new WorkOrder();
            workOrders.add(wo);
        }
        return workOrders;
    }
    
     public static User[] createUsers(Integer n, Profile[] profileId, UserRole[] roleId, Boolean isActive) {
        User[] users = new User[0];
        for (Integer i = 0; i < n; i++) {
            users.add(new User(Alias = '123' + i, Email = 'test123@noemail.com' + i,
                               EmailEncodingKey = 'UTF-8', LastName = 'Testing' + i, LanguageLocaleKey = 'en_US',
                               LocaleSidkey = 'en_US', Profileid = profileId[i].Id, Userroleid = roleId[0].Id,
                               Country = 'United States', Timezonesidkey = 'America/New_York',
                               Username = 'rm-123@noemail.com' + i, IsActive = isActive, Employee_Number__c = '1234'+i,
                               EmployeeNumber = '123'+i,CommunityNickname = 'test456'+i));
        }
        return users;
    }
    
    public static ServiceResource[] createServiceResource(Integer n, User[] userList){
        ServiceResource[] serviceResourceArray = new ServiceResource[0];
        for(Integer i = 0; i < n; i++){
            serviceResourceArray.add(new ServiceResource(Name = 'test' + i, RelatedRecordId = userList[i].id, ResourceType= 'Technician',
                                                          Region__c = 'Markham', IsActive = true));
        }
        return serviceResourceArray;
    }
    
    
    public static ServiceTerritoryMember[] createServiceTerritoyMembers(Integer n, ServiceResource[] srArray, ServiceTerritory st, OperatingHours oh){
        ServiceTerritoryMember[] serviceTerritoryMemberArray = new ServiceTerritoryMember[0];
        for(Integer i = 0; i < n ; i ++){
            serviceTerritoryMemberArray.add(new ServiceTerritoryMember(ServiceResourceId = srArray[i].Id, ServiceTerritoryId = st.Id,OperatingHoursId = oh.Id,
                                                                        Starting_Location__c = 'Warehouse', TerritoryType = 'Primary', EffectiveStartDate = System.Today()));
        }
        return serviceTerritoryMemberArray;
    }
    
}