/**
 * @description
 *
 * Created by timothychiang on 2020-05-29.
 *
 */
@IsTest
public with sharing class AccountServiceTest {

	@TestSetup static void setup(){
		TestDataFactory.crtCPQSettings();
		TestDataFactory.crtFieldSettings();
		//TestDataFactory.crtFieldServiceSetting();

		//TestDataFactory.crtProdWithPE(4);
		TestDataFactory.crtAcctContact(1, 1);
	}

	@IsTest
	static void testAccountGetAccountById() {

		Account account = [SELECT Id FROM Account];
		Account serviceAccount = AccountService.getAccountById(account.Id);

		System.assertEquals(account.Id, serviceAccount.Id);

	}

	@IsTest
	static void testAccountUpdate() {

		Account account = [SELECT Id FROM Account];
		account.Name = 'test update';
		List<Account> accounts = new List<Account>();
		accounts.add(account);

		Database.SaveResult[] results = AccountService.updateAccounts(accounts, true);

		System.assertEquals(true, results[0].isSuccess());

	}
}