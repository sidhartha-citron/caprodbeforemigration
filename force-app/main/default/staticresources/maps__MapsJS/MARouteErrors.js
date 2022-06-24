var GlobalMessages = {
    NA: MASystem.Labels.MA_Oh_Error,
    TRAFFIC: { // custom message only used by the core frontend (not MAIO)
        ROUTE: MASystem.Labels.MA_50_STOPS_MAY_BE_USED_IN_A_ROUTE_THAT_INCLUDES_TRAFFIC,
        TIME_BASED_ROUTE: MASystem.Labels.MA_50_STOPS_MAY_BE_USED_IN_A_ROUTE_THAT_INCLUDES_TRAFFIC,
        SCHEDULE: 'Please limit your schedule to 50 events or less. You can also turn off traffic to use more events.'
    },
    NO_ERROR_FOUND: { // used when no error match is found based on maio's response
        ROUTE: MASystem.Labels.MA_Unable_Build_Route,
        TIME_BASED_ROUTE: MASystem.Labels.MA_Unable_Build_Route,
        SCHEDULE: MASystem.Labels.MA_Unable_Build_Sched
    },
    'Bad Request': {
        SCHEDULE: 'No route found for these events.'
    },
    82001: {
        ROUTE: MASystem.Labels.MA_120_STOPS_MAY_BE_USED,
        TIME_BASED_ROUTE: MASystem.Labels.MA_120_STOPS_MAY_BE_USED,
        SCHEDULE: MASystem.Labels.MA_150_STOPS_MAY_BE_USED
    },
    82002: {
        ROUTE: MASystem.Labels.MA_Please_Add_Two_Stops,
        TIME_BASED_ROUTE: MASystem.Labels.MA_Please_Add_Two_Stops,
        SCHEDULE: MASystem.Labels.MA_Please_Add_Two_Events
    },
    82003: {
        ROUTE: 'Your Transportation Mode does not support this many stops. Please change your Transportation Mode or use less stops.',
        TIME_BASED_ROUTE: 'Your Transportation Mode does not support this many stops. Please change your Transportation Mode or use less stops.',
        SCHEDULE: 'Your Transportation Mode does not support this many events. Please change your Transportation Mode or use less events.'
    },
    82004: {
        ROUTE: 'Woah there, time traveler... Please ensure your start time is before your end time.',
        TIME_BASED_ROUTE: 'Woah there, time traveler... Please ensure your start time is before your end time.',
        SCHEDULE: 'Woah there, time traveler... Please ensure your start time is before your end time.'
    },
    82005: {
        TIME_BASED_ROUTE: 'You have a stop that begins before your start time. Please ensure your stops occur after your start time.',
        SCHEDULE: 'You have an event that begins before your start time. Please ensure your events occur after your start time.'
    },
    82006: {
        TIME_BASED_ROUTE: 'You have a stop that begins after your end time. Please ensure your events occur before your end time.',
        SCHEDULE: 'You have an event that begins after your end time. Please ensure your events occur before your end time.'
    },
    82007: {
        TIME_BASED_ROUTE: 'You have overlapping stops. Please edit your stop times and try again.',
        SCHEDULE: 'You have overlapping events. Please edit your event times and try again.'
    },
    82008: {
        TIME_BASED_ROUTE: 'You have a stop that finishes after your route\'s end time. Please edit your route end time or the offending stop.',
        SCHEDULE: 'You have an event that finishes after your schedule\'s end time. Please edit your schedule end time or the offending event.'
    },
    82009: {
        TIME_BASED_ROUTE: 'You have a stop that overlaps a restricted time. Please edit the restricted time or offending stop.',
        SCHEDULE: 'You have an event that overlaps a restricted time. Please edit the restricted time or offending event.'
    },
    82010: {
        TIME_BASED_ROUTE: 'You have a stop that is outside your route start and end time. Edit your route start, end, or the offending stop.',
        SCHEDULE: 'You have an event that is outside your schedule start and end time. Edit your schedule start, end, or the offending event.'
    },
    82011: {
        ROUTE: MASystem.Labels.MA_Please_Add_Two_Stops,
        TIME_BASED_ROUTE: MASystem.Labels.MA_Please_Add_Two_Stops,
        SCHEDULE: MASystem.Labels.MA_Please_Add_Two_Events
    },
    82012: {
        TIME_BASED_ROUTE: 'Please limit your route to 120 stops or less.'
    },
    82013: {
        TIME_BASED_ROUTE: 'You have a stop that begins before your start time. Please ensure your stops occur after your start time.'
    },
    82014: {
        TIME_BASED_ROUTE: 'You have a stop that you will arrive late to. Edit the stop so that it\'s possible to reach on time.',
        SCHEDULE: 'You have an event that you will arrive late to. Edit the event so that it\'s possible to reach on time.'
    },
    82015: {
        ROUTE: 'You have a stop that you will arrive late to. Edit the stop so that it\'s possible to reach on time.',
        // TIME_BASED_ROUTE: 'Unable to build route. You can\'t get to some of your stops in time. Please ensure there are no overlapping stops.',
        SCHEDULE: 'Unable to build schedule. You can\'t get to some of your scheduled events in time. Please ensure there are no overlapping events.'
    },
    82017: {
        ROUTE: MASystem.Labels.MA_LIMIT_ASIA_25_STOPS,
        TIME_BASED_ROUTE: MASystem.Labels.MA_LIMIT_ASIA_25_STOPS
    },
    82700: {
        SCHEDULE: 'Please limit your route to 700 stops or less. This includes your start and end location.'
    }
};

var WaypointMessages = {
    82005: {
        TIME_BASED_ROUTE: MASystem.Labels.MA_Stop_Before_Start,
        SCHEDULE: MASystem.Labels.MA_Stop_Before_Start_Sched
    },
    82006: {
        TIME_BASED_ROUTE: MASystem.Labels.MA_Stop_After_End,
        SCHEDULE: MASystem.Labels.MA_Stop_After_End_Sched
    },
    82007: {
        TIME_BASED_ROUTE: MASystem.Labels.MA_Overlap_Stop,
        SCHEDULE: MASystem.Labels.MA_Overlap_Event
    },
    82008: {
        TIME_BASED_ROUTE: MASystem.Labels.MA_Finish_After_End,
        SCHEDULE: MASystem.Labels.MA_Finish_After_End_Sched
    },
    82009: {
        TIME_BASED_ROUTE: 'This stop overlaps with a restricted time.',
        SCHEDULE: 'This event overlaps with a restricted time.'
    },
    82010: {
        TIME_BASED_ROUTE: 'This stop is outside your route start or end time.',
        SCHEDULE: 'This event is outside your schedule start or end time.'
    },
    82013: {
        TIME_BASED_ROUTE: 'This stop begins before the route\'s start time'
    },
    82014: {
        TIME_BASED_ROUTE: 'You will be late for this stop.',
        SCHEDULE: 'You will be late for this event'
    },
    82015: {
        ROUTE: 'You will be late for this stop.',
        SCHEDULE: 'You will be late for this event'
    }
};

function getWaypointErrorMessage(errorCode, type) {
    type = type || '';
    errorCode = errorCode || '';
    var error = WaypointMessages[errorCode] || {};
    var msg = error[type] || GlobalMessages['NA'];
    return msg;
}
function getGlobalErrorMessage(errorCode, type) {
    type = type || '';
    errorCode = errorCode || '';
    var error = GlobalMessages[errorCode] || {};
    var msg = error[type] || GlobalMessages['NA'];
    return msg;
}