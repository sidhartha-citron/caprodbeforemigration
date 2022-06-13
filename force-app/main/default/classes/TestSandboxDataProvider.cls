/**
 * @FileName: TestSandboxDataProvider
 * @Description: Test class for SandboxDataProvider. 
 * @Author: Irfan Tarique
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification 
 *  
 *-----------------------------------------------------------  
 **/
@isTest
public class TestSandboxDataProvider {

    @isTest
    public static void testPostCopy(){
        /*
         * Start Test 
         */
        Test.startTest();
        Test.testSandboxPostCopyScript(
            new SandboxDataProvider(), UserInfo.getOrganizationId(),
                UserInfo.getOrganizationId(), UserInfo.getOrganizationName());
        
        Test.stopTest();
        /*
         * Stop Test 
         */
    }
}