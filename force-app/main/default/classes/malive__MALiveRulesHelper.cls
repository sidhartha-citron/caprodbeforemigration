/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class MALiveRulesHelper {
    global MALiveRulesHelper() {

    }
    @InvocableMethod(label='New Rule Creator' description='Accepts a RuleData object of parameters and creates a new rule.')
    global static void CreateNewRule(List<malive.MALiveRulesHelper.RuleData> ruleDataList) {

    }
global class RuleData {
    @InvocableVariable(label='Device Id' description='Device Id including device vendor.' required=true)
    global String deviceId;
    @InvocableVariable(label='Email Of Contact' description='An email address of the point of contact to send any messages regarding issues or failures of the rule.' required=true)
    global String email;
    @InvocableVariable(label='Error Field Name' description='A field on the custom record where any related error data can be saved when the process fails to create the rule.' required=false)
    global String errorFieldName;
    @InvocableVariable(label='Latitude' description='Latitude of the object that this rule applies.' required=true)
    global Decimal latitude;
    @InvocableVariable(label='Longitude' description='Longitude of the object that this rule applies.' required=true)
    global Decimal longitude;
    @InvocableVariable(label='metadata' description='Any custom data that the user would like to save regarding this rule.' required=false)
    global String metadata;
    @InvocableVariable(label='Rule Description' description='A simple description field.' required=false)
    global String ruleDescription;
    @InvocableVariable(label='Rule Id Field Name' description='A field on the custom record where the rule id can be saved upon successful creation.' required=false)
    global String ruleIdFieldName;
    @InvocableVariable(label='Rule Name' description='Rule name' required=true)
    global String ruleName;
    @InvocableVariable(label='Rule Persists' description='Does this rule continue to persist, or will become inactive after first triggered' required=true)
    global Boolean rulePersists;
    @InvocableVariable(label='Rule Type' description='The type of rule being created. Options for rule type are "enters | exits | entersexits" AND "radius | drivedistance | drivetime" separated by a space. Example: "entersexits radius."' required=true)
    global String ruleType;
    @InvocableVariable(label='sObject Record Id' description='A standard or custom object record Id to update whenever rule creation succeeds or fails.' required=false)
    global String sObjectRecordId;
    @InvocableVariable(label='Travel Distance' description='Travel distance if this is a drivedistance or radius rule type.' required=false)
    global Decimal travelDistance;
    @InvocableVariable(label='Travel Time' description='Travel time if this is a drivetime rule type.' required=false)
    global Decimal travelTime;
    global RuleData() {

    }
}
global class RuleResponse {
    @InvocableVariable(label='Message' description='' required=false)
    global String message;
    @InvocableVariable(label='Rule Id' description='' required=false)
    global String rule;
    @InvocableVariable(label='Success' description='' required=true)
    global Boolean success;
    global RuleResponse(Boolean success, String rule, String message) {

    }
}
}
