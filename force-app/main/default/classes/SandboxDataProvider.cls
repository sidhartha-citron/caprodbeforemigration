/**
 * @FileName: SandboxDataProvider
 * @Description: Executable class selected to run when refreshing a sandbox 
 * @Author: Irfan Tarique
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification 
 *  
 *-----------------------------------------------------------  
 **/
global class SandboxDataProvider implements SandboxPostCopy {
    global SandboxDataProvider() {}
    global class TestException extends Exception {}
	global void runApexClass(SandboxContext context){ SandboxDataCreatorScript.runAll();}
}