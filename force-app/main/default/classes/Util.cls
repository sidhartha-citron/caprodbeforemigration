public with sharing class Util {


    public static Map<String, Id> mapDevNameToId {get;set;}

    /**
     * Populates the recordType names and ids in a singleton pattern cache
     *
     **/
    private static void generateCache(){
        mapDevNameToId = new Map<String, Id>();

        List<RecordType> recTypeList = [SELECT Id, DeveloperName, SobjectType FROM RecordType];

        for(RecordType recordType: recTypeList){
            mapDevNameToId.put(recordType.developerName  + '-' + recordType.SobjectType, recordType.id);
        }

    }


    /**
     * Returns the RecordType Id based on DeveloperName
     *
     * @param   devName     RecordType Dev Name
     * @return              RecordType Id
     **/
    public static Id getRecordTypeIdByDevName(String devName, String SobjectType) {

        if (String.isEmpty(devName) || String.isEmpty(SobjectType)) {
            return null;
        }

        if(mapDevNameToId == null){
            generateCache();
        }

        String key = devName + '-' + SobjectType;

        if (!mapDevNameToId.containsKey(key)) {
            return null;
        }
        return mapDevNameToId.get(key);
    }
}