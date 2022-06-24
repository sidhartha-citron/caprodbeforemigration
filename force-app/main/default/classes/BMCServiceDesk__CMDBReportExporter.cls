/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global abstract class CMDBReportExporter {
    global CMDBReportExporter() {

    }
    global abstract void Export(Map<String,Map<String,SObject>> param0, List<String> param1, List<String> param2, Map<String,List<String>> param3, Boolean param4);
    global abstract Blob getBlob();
    global abstract String getContentType();
    global virtual String getText() {
        return null;
    }
    global abstract String getType();
global class CSV extends BMCServiceDesk.CMDBReportExporter {
    global CSV() {

    }
    global override void Export(Map<String,Map<String,SObject>> pData, List<String> pInstanceIds, List<String> pParentClassNames, Map<String,List<String>> pMapAttributeDefinitionForClass, Boolean processHeader) {

    }
    global override Blob getBlob() {
        return null;
    }
    global override String getContentType() {
        return null;
    }
    global override String getText() {
        return null;
    }
    global override String getType() {
        return null;
    }
}
global virtual class PDF extends BMCServiceDesk.CMDBReportExporter {
    global PDF() {

    }
    global override void Export(Map<String,Map<String,SObject>> pData, List<String> pInstanceIds, List<String> pParentClassNames, Map<String,List<String>> pMapAttributeDefinitionForClass, Boolean processHeader) {

    }
    global override Blob getBlob() {
        return null;
    }
    global override String getContentType() {
        return null;
    }
    global override String getType() {
        return null;
    }
}
}
