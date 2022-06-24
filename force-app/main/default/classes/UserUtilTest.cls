@isTest
private class UserUtilTest{
    
    static testmethod void TEST_OWNER_TRANSFER_ON_USER_DEACTIVATION(){

         Id caseRecordType = Label.Ticket_RT_Invoice_Information;
         Id orderRecordType = Label.Order_RT_Regular_Order;
         Id ServiceAptRecordType = Label.SA_RT_Generic_Service_Appointment;
         Date Today = System.Today();
         
         User[] testUsers = TestingUtils.createUsers(2, new Profile[] {new Profile(Id = Label.Profile_Sales_Manager), new Profile(Id = Label.Profile_Sales_Manager)}, new UserRole[] {new UserRole(Id = Label.CEO_Role)},True);
         System.runAs(new User(Id=UserInfo.getUserId())) {
         insert testUsers;
         }
         System.runAs(new User(Id=UserInfo.getUserId())) {
         testUsers[1].ManagerId = testUsers[0].Id;
         update testUsers[1];
         }
         
         //Account[] testAccounts = TestingUtils.createAccounts(3, TestingUtils.rType);
         //insert testAccounts;
         TestDataFactory.crtBillToAcctContact(3, 0); 
         Account[] testAccounts = TestDataFactory.accounts;
         
         testAccounts[0].OwnerId = testUsers[1].Id;
         testAccounts[1].OwnerId = testUsers[1].Id;
         testAccounts[2].OwnerId = testUsers[1].Id;
         update testAccounts;
         
         Contact[] testContacts = TestingUtils.createContacts(3,testAccounts);
         insert testContacts;
         
         testContacts[0].OwnerId = testUsers[1].Id;
         testContacts[1].OwnerId = testUsers[1].Id;
         testContacts[2].OwnerId = testUsers[1].Id;
         update testContacts;
        
         Order[] testOrders = TestingUtils.createOrder(3,orderRecordType,testAccounts,System.Today());
         insert testOrders;
         
         testOrders[0].OwnerId = testUsers[1].Id;
         testOrders[1].OwnerId = testUsers[1].Id;
         testOrders[2].OwnerId = testUsers[1].Id;
         update testOrders;
         
        /* ServiceAppointment[] testServiceAppointments = TestingUtils.createServiceAppointment(1,ServiceAptRecordType,System.Today()+2,System.Today());
         insert testServiceAppointments;
         
         testServiceAppointments[0].OwnerId = testUsers[1].Id;
         update testServiceAppointments;*/
         
         Test.startTest();
            
            
            User user = [Select Id,IsActive from User where id =: testUsers[1].Id];
            user.IsActive = false;
            System.runAs(new User(Id=UserInfo.getUserId())) {
            update user;
            }
            
         Test.stopTest();
         Order o = [Select Id,OwnerId from Order where id =: testOrders[0].Id];
         Account acc = [Select Id,OwnerId from Account where id =: testAccounts[0].Id];
         //Case cas = [Select Id,OwnerId from Case where id =: testCases[0].Id];
         Contact con = [Select Id,OwnerId from Contact where id =: testContacts[0].Id];
         
         system.assertEquals(o.OwnerId,Label.User_Temporary_Owner);
         system.assertEquals(acc.OwnerId,Label.User_Alison_Mahoney);
         //system.assertEquals(cas.OwnerId,Label.User_Temporary_Owner);
         system.assertEquals(con.OwnerId,Label.User_Alison_Mahoney);
         
    }
}