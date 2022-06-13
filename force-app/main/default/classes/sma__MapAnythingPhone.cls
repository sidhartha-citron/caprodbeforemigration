/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class MapAnythingPhone {
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse Check_In(String a, String b, String c, String d, String e, String f, String g, String h, String i, String j) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse Check_Out(String a, String b, String c, String d, String e, String f, String g) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.MAFolder GetCorpMAFolder(String a) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.MAFolder GetPersonalMAFolder(String a) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.MAFolder GetRecentMAFolder(String a) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse analyzeQuery(String a, String b, String c, String d, String e, String f, String g, String h, String i, String j, String k, String l, String m, String n, String o) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse deleteRoute(String a) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse getFavInfo(String a) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse getRoute(String a) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse getRoutes(Integer a, Integer b, String c) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse getTooltips(String a, String b, String c, String d) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse saveRoute(String a, String b, String c, Integer d, Integer e, Integer f, String g, String h, String i) {
        return null;
    }
    @RemoteAction
    global static sma.MapAnythingPhone.APIResponse updateSettings(String a, String b) {
        return null;
    }
global class APIResponse {
}
global class MAFolder {
    global String Id;
    global String ParentId;
    global List<sma__MALocation__c> SubFavorites;
    global List<sma__MAFolder__c> SubFolders;
    global List<sma__MASavedQry__c> SubSavedQueries;
    global MAFolder() {

    }
}
}
