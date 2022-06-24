/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class MALiveGetClosestRecordInvocable {
    global MALiveGetClosestRecordInvocable() {

    }
    @InvocableMethod(label='Get Closet Record for a Given Stop Record')
    global static List<malive.MALiveGetClosestRecordInvocable.getClosestRecordResponse> getClosestRecord(List<malive.MALiveGetClosestRecordInvocable.getClosestRecordRequest> requestList) {
        return null;
    }
global class getClosestRecordRequest {
    @Deprecated
    @InvocableVariable(label='Distance Unit' description='mi or km' required=false)
    global String distanceUnits;
    @InvocableVariable(label='GeoLocation API Name' required=true)
    global String latLongGeoFieldApiName;
    @Deprecated
    @InvocableVariable(label='Max Distance' required=false)
    global Decimal minDistanceFromRecord;
    @InvocableVariable(label='Object API Name' required=true)
    global String queryObjApiName;
    @InvocableVariable(label='Summary Event Record Id' required=true)
    global Id sumEventId;
    global getClosestRecordRequest() {

    }
}
global class getClosestRecordResponse {
    @InvocableVariable(label='Distance in Kilometers' required=false)
    global Decimal distanceKM;
    @InvocableVariable(label='Distance in Miles' required=false)
    global Decimal distanceMiles;
    @Deprecated
    @InvocableVariable(label='Error Message' required=false)
    global String errorMsg;
    @InvocableVariable(label='Record Id (Null if no records are found)' required=false)
    global Id objId;
    global getClosestRecordResponse() {

    }
}
}
