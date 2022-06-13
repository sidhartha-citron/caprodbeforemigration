/**
 * Created by timothychiang on 2020-03-25.
 */

/**
 * @description Service class to retrieve custom setting or custom metadata
 */
public with sharing class CustomSettingsService {
	private static Map<String, Service_Setting__mdt> serviceSettingMap;
	private static Map<String, Frequency__c> frequencyMap;

	/**
	 * @description helper method to support the singleton pattern for getting service settings
	 */
	private static void createServiceSettingsMap(){
		if (serviceSettingMap == null){
			serviceSettingMap = new Map<String, Service_Setting__mdt>();
			List<Service_Setting__mdt> serviceSettingList = (List<Service_Setting__mdt>) [SELECT MasterLabel, isActive__c FROM Service_Setting__mdt];
			for(Service_Setting__mdt ss: serviceSettingList){
				serviceSettingMap.put(ss.MasterLabel, ss);
			}
		}
	}

	/**
	 * @description gets determination if service is active in custom metadata
	 *
	 * @param serviceName - name to check against
	 *
	 * @return service status
	 */
	public static Boolean getServiceSettingActive(String serviceName){
		createServiceSettingsMap();

		if(serviceSettingMap.containsKey(serviceName)){
			return serviceSettingMap.get(serviceName).isActive__c;
		} else {
			return true;
		}
	}

	/**
	 * @description gets line of business that can have core list price requests
	 *
	 * @return list of business that can have core list price requests
	 */
	public static List<String> getCoreListPriceRequestLobs(){
		List<LOB_in_CoreList_Price__mdt> lobList = (List<LOB_in_CoreList_Price__mdt>) [SELECT MasterLabel FROM LOB_in_CoreList_Price__mdt];

		List<String> finalLobList = new List<String>();
		for(LOB_in_CoreList_Price__mdt lob: lobList){
			finalLobList.add(lob.MasterLabel);
		}

		return finalLobList;
	}

	/**
	 * @description gets cpq settings
	 *
	 * @return org default for cpq settings
	 */
	public static CPQ_Settings__c getCpqSettings(){
		return CPQ_Settings__c.getOrgDefaults();
	}

	/**
	 * @description gets the frequency table in map form
	 *
	 * @return frequency table in map form
	 */
	public static Map<String, Frequency__c> getFrequencyMap(){
		if(frequencyMap == null){
			frequencyMap = Frequency__c.getAll();
		}

		return frequencyMap;
	}
}