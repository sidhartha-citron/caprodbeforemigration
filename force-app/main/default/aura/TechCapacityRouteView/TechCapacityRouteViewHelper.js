/**
 * @FileName: TechCapacityRouteViewHelper.js
 * @Description: Helper for TechCapacityRouteView
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/18/2019         Created
 *-----------------------------------------------------------
 */
({
    /*
     * @Name        loadCalendar
     * @Description Construct a list of day wrappers for 56 days starting from the most recent Monday
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    loadCalendar : function(component) {
        let firstDate = this.getFirstDate();
        let days = [];
        let daysOfTheWeek = component.get("v.daysOfTheWeek");

        for(let i = 0; i < 56; i++) {
            let d = this.addDays(firstDate, i);
            let dString = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

            let newDate = new Date();
            // also check day value to fix bug where today is labelled as a past-day
            let pastDay = d < newDate && d.getDate() != newDate.getDate() ? 'past-day' : '';
            let dayName = daysOfTheWeek[d.getDay()];

            days.push({
                "d" : dString,
                "num" : d.getDate(),
                "dayName" : dayName.charAt(0).toUpperCase() + dayName.slice(1),
                "month" : String(d).split(" ")[1],
                "minutes" : 0,
                "travelTime" : 0,
                "rR" : 0,
                "calls" : 0,
                "assets" : 0,
                "pastDay" : pastDay
            });
        }

        component.set("v.days", days);
    },

    /*
     * @Name        getFirstDate
     * @Description Find the most recent Monday
     * @Author      Graeme Ward
     * @Params      N/A
     * @Return      date: the found date
     */
    getFirstDate : function() {
        let d = new Date();
        return new Date(d.setDate(d.getDate() - d.getDay()));
    },

    /*
     * @Name        addDays
     * @Description Construct a new date a specified number of days from a given date
     * @Author      Graeme Ward
     * @Params      date: starting date
     *              days: number of days to add to the starting date
     * @Return      date: the new date
     */
    addDays : function(date, days) {
        const copy = new Date(Number(date));
        copy.setDate(date.getDate() + days);
        return copy;
    },

    /*
     * @Name        getServicePlans
     * @Description Adds all Service Plan information to a list of day wrappers
     * @Author      Graeme Ward
     * @Params      component
     *              event
     * @Return      void
     */
    getServicePlans : function(component, event) {
        component.set("v.spinner", true);

        let technician = event.getParam("technician");

        component.set("v.technician", technician);

        this.loadCalendar(component);

        let action = component.get("c.getServicePlans");

        let criteria = {
            "technician" : technician,
            "days" : component.get("v.days")
        };

        action.setParams({"criteria" : JSON.stringify(criteria)});

        action.setCallback(this, function(response) {
            let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.TCW_Retrieve_Route_Error"));

            if(success === true) {
                let days = JSON.parse(response.getReturnValue()).days;

                for(let day of days) {
                    day.rR = this.numberWithCommas(day.rR);
                }

                component.set("v.days", days);
            }

            component.set("v.spinner", false);
        });
        $A.enqueueAction(action);
    },

    numberWithCommas : function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /*
     * @Name        showDayDetails
     * @Description Constructs a modal component to display additional information about a selected day
     * @Author      Graeme Ward
     * @Params      component
     *              event
     * @Return      void
     */
    showDayDetails : function(component, event) {
        $A.createComponent(
            "c:TechCapacityRouteDayDetail",
            {
                "technician" : component.get("v.technician"),
                "day" : event.getParam("day")
            },
            function(dayDetailModal, status, errorMessage){
                if(status === "SUCCESS") {
                    let body = component.get("v.body");
                    body.push(dayDetailModal);
                    component.set("v.body", body);
                }
                else if(status === "INCOMPLETE") {
                    console.error($A.get("$Label.c.Error_No_Response_From_Server"));
                }
                else if(status === "ERROR") {
                    console.error("Error: " + errorMessage);
                }
            }
        );
    }
});