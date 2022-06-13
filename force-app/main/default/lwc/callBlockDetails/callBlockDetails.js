import { LightningElement, api, track, wire } from 'lwc';
import TASK_OBJECT from '@salesforce/schema/Task';
import CALLDISPOSITION_FIELD from '@salesforce/schema/Task.Call_Block_Disposition__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import saveRecords from '@salesforce/apex/CallBlockController.saveRecords';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import LEAD_DISQUALIFYREASON from '@salesforce/schema/Lead.Disqualified_Reason__c';
import createevent from '@salesforce/apex/CreateEventController.createEventAndUpdate';
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import evtsubject from '@salesforce/label/c.EventSubject';
import evtduration from '@salesforce/label/c.EventDuration';
import getActivityTimeline from '@salesforce/apex/ActivityTimelineController.getActivityTimeline';
import internalnotes from '@salesforce/label/c.Call_Block_Internal_Notes';
import inviteeMessage from '@salesforce/label/c.Event_Invite_Message';
import userSign from '@salesforce/apex/CreateEventController.getUserSignature';
import createCallBlockTask from '@salesforce/apex/CallBlockController.createCallBlockTask';
import FORM_FACTOR from '@salesforce/client/formFactor';


export default class CallBlockDetails extends NavigationMixin(LightningElement) {
    label = {
        evtsubject,
        evtduration,
        internalnotes,
        inviteeMessage
    };
    @api rowdetails;
    controllingPicklist = [];
    dependentPicklist;
    @track finalDependentVal = [];
    @track selectedControlling;
    showpicklist = false;
    dependentDisabled = true;
    showdependent = false;
    followUpDueDate;
    //@track rowdetails
    @track showmodal
    isLoaded = false;
    _currentPageReference;
    isLead;
    isfollowup = false;
    @track editSubject = false;
    @track strSubj;
    @track userSign;
    blntoCallblock = false;
    @wire(CurrentPageReference)
    currentPageReference(result) {
        this._currentPageReference = JSON.parse(JSON.stringify(result)).attributes.attributes;
        if (this._currentPageReference) {
            this.showmodal = this._currentPageReference.c__showmodal;
            this.rowdetails = this._currentPageReference.c__rowdetails;
            if (this.rowdetails.obj === 'Lead') {
                this.isLead = true
            } else {
                this.isLead = false
            }
            var date = new Date();
            date.setDate(date.getDate());
            var coeff = 1000 * 60 * 30;
            var rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
        }
    }



    sideCollapsed = true;
    lsize = 12;
    rsizeclass;
    rsize = 12;
    lsizeclass;

    get Mainhideclass() {
        if (this.sideCollapsed) {
            return '';
        } else {
            return 'slds-hide'
        }
    }

    get activityHideclass() {
        if (this.sideCollapsed) {
            return 'slds-hide';
        } else {
            return ''
        }
    }
    get vsize() {
        if (this.sideCollapsed) {
            return 12
            // this.rsizeclass = '';
            // this.lsizeclass = 'slds-hide'
        } else {
            return 8
            // this.rsizeclass = 'slds-hide';
            // this.lsizeclass = ''
        }
    }
    get buttonlabel() {
        if (this.sideCollapsed) {
            return 'Activity History'
        } else {
            return 'Edit Task'
        }
    }
    get headerlabel() {
        if (this.sideCollapsed) {

            return this.rowdetails.companyname
        } else {
            return 'Activity History'
        }
    }

    get secondHeaderlabel() {
        if (this.sideCollapsed) {
            return ''
        } else {
            return this.rowdetails.companyname + ' ' + '|'
        }
    }
    toggle(e) {
        this.sideCollapsed = !this.sideCollapsed;
    }
    isDupe = false;
    handleDupe(e) {
        this.isDupe = e.detail
    }
    closeModal() {
        const custEvent = new CustomEvent(
            'closemodal', {
            detail: false,
            tskId: this.rowdetails.taskId
        });
        this.dispatchEvent(custEvent);
    }
    selectedrow;
    dupAccId;
    handleselectedrow(e) {
        this.selectedrow = JSON.parse(JSON.stringify(e.detail));
        this.selectedrow.forEach((row) => {
            if (row !== undefined) {
                this.dupAccId = row.Id;
            } else {
                this.dupAccId = null;
            }
        });
    }
    callConvert(e) {
        const convertlead = this.template.querySelector('c-convert-lead');
        if (convertlead) {
            convertlead.convert(this.dupAccId, null);
        }
    }
    @wire(getPicklistValuesByRecordType, { objectApiName: TASK_OBJECT, recordTypeId: '012000000000000AAA' })
    fetchPicklist({ error, data }) {
        this.isLoaded = true;
        if (data && data.picklistFieldValues) {
            this.isLoaded = false;
            data.picklistFieldValues["Reaction__c"].values.forEach(optionData => {
                this.controllingPicklist.push({ label: optionData.label, value: optionData.value });
            });
            this.dependentPicklist = data.picklistFieldValues["Call_Block_Disposition__c"];
            this.showpicklist = true;
        }
    }
    dispositionselected;
    getcalldisposition(e) {
        this.dispositionselected = e.target.value
    }
    reaction;
    isleaddisqualify = false;
    showLeadDisqualify = false;
    fetchDependentValue(event) {

        this.finalDependentVal = [];
        this.showdependent = false;
        const selectedVal = event.target.value;
        if (selectedVal === 'Positive' && this.isLead) {
            this.showSaveNConvert = true;
            this.showSaveNContinue = false;
            this.showLeadDisqualify = false;
        } else if (selectedVal === 'Negative') {
            this.showSaveNContinue = true;
            this.showSaveNConvert = false;
            this.showLeadDisqualify = true;
        } else {
            this.showSaveNContinue = true;
            this.showSaveNConvert = false;
            this.showLeadDisqualify = false;
        }
        this.reaction = selectedVal;
        this.finalDependentVal.push({ label: "--None--", value: "--None--" })
        let controllerValues = this.dependentPicklist.controllerValues;
        this.dependentPicklist.values.forEach(depVal => {
            depVal.validFor.forEach(depKey => {
                if (depKey === controllerValues[selectedVal]) {
                    this.dependentDisabled = false;
                    this.showdependent = true;
                    this.finalDependentVal.push({ label: depVal.label, value: depVal.value });
                }
            });

        });

        if (selectedVal === 'Positive') {
            this.isPostive = true;
            this.isNegative = false;
            this.isNeutral = false;
            this.emailvalue = this.rowdetails.email;
            this.isfollowup = false;
            this.isNotesRequired = true;
        } else if (selectedVal === 'Negative') {
            this.isNegative = true;
            this.isPostive = false;
            this.isNeutral = false;
            this.isfollowup = false;
            this.isleaddisqualify = this.isLead ? true : false;
            this.isNotesRequired = false;
        } else if (selectedVal === 'Neutral') {
            this.isNeutral = true;
            this.isNegative = false;
            this.isPostive = false;
            this.isfollowup = true;
            this.isNotesRequired = false;
        }
        var rec = JSON.parse(JSON.stringify(this.rowdetails))
        rec.Call_Block_Disposition__c = this.value
        this.rowdetails = rec;
    }

    @wire(getObjectInfo, { objectApiName: TASK_OBJECT })
    taskMetadata;

    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: CALLDISPOSITION_FIELD })
    calldispositionPicklist;

    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: LEAD_DISQUALIFYREASON })
    disqualifypicklist;
    @track activeSections = [];
    @track timelineGroups;
    isExpandAll = false;
    toggleLabel = 'Expand All';
    previousTasks = true;
    addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    handlefollowUpDueDate(e) {
        if (e.detail.value !== null) {
            this.followUpDueDate = e.detail.value
        } else {
            this.assignFollowupDueDate();
        }
    }

    assignFollowupDueDate() {
        let today = new Date();
        let dayno = new Date().getDay();
        switch (new Date().getDay()) {
            case 0:
                today = this.addDays(today, 2)
                break;
            case 1:
                today = this.addDays(today, 1)
                break;
            case 2:
                today = this.addDays(today, 7)
                break;
            case 3:
                today = this.addDays(today, 6)
                break;
            case 4:
                today = this.addDays(today, 5)
                break;
            case 5:
                today = this.addDays(today, 4)
                break;
            case 6:
                today = this.addDays(today, 3)
        }
        this.followUpDueDate = today.toLocaleDateString(['en-CA', 'en-US']);
    }

    connectedCallback() {
        this.assignFollowupDueDate();
        this.detectDevice = FORM_FACTOR;
        if (this.detectDevice === 'Large') {
            this.largedevice = true
            this.tablestyle = 'width:87%;margin:auto';
        }
        else {
            this.largedevice = false
            this.tablestyle = ''
        }


        if (this.rowdetails.obj === 'Lead') {
            this.isLead = true
        } else {
            this.isLead = false
        }
        userSign()
            .then(res => {
                console.log(res)
                var newLine = "\r\n";
                this.userSign = res;
                if (this.userSign !== undefined) {
                    this.inputInternalNoteValue = newLine + newLine + this.userSign;
                }
            })
            .catch(error => {
                this.error = error;
            });
        // Refresh the data on load
        if (this.rowdetails) {
            refreshApex(this.rowdetails);
        }
        this.strSubj = this.label.evtsubject;
        console.log('idtoupdate' + this.rowdetails.idtoupdate)
        getActivityTimeline({ cTaskId: this.rowdetails.taskId, recordId: this.rowdetails.idtoupdate, includeChildren: false, pageSize: this.rowLimit, pageNumber: this.pageNumber, lastActivityDate: null })
            .then(result => {
                console.log(result)
                if (result.length === 0) {
                    this.previousTasks = false;
                }
                this.timelineGroups = result.map((v, i) => ({ ...v, sectionName: `Section${i}`, isExpanded: true }));
                this.activeSections = this.timelineGroups.map((v) => v.sectionName);
                let loadLimiter = {
                    limit: 2,
                    load: 2 <= this.timelineGroups.length
                };
            })
            .catch(error => {
                this.isLoaded = false;
                this.error = error;
                this.showToast(this.error, 'Error')
            });

    }

    handleMessage(message) {
        this.isDupe = message.isDupe;
    }

    handleCancel(e) {
        var compDefinition = {
            componentDef: "c:callblockv1",
            attributes: {
            }
        };
        // Base64 encode the compDefinition JS object
        var encodedCompDef = btoa(JSON.stringify(compDefinition));
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/one/one.app#' + encodedCompDef
            }
        });
    }
    getDuration(a, b) {
        let date1 = new Date(a)
        let date2 = new Date(b)
        let difference = Math.abs(date1.valueOf() - date2.valueOf())
        const minutes = Math.floor(difference / 60) % 60
        difference -= minutes * 60;
        console.log('minutes', minutes)
        return minutes;
    }
    @track isNotesRequired = false;
    handlesave(e) {
        console.log(this.rowdetails)

        console.log(this.followupcheck)
        var task;
        var lead;
        var contact;
        var event;
        var followUpTask;
        if (this.reaction === 'Positive') {
            event = {
                'sobjectType': 'Event',
                'StartDateTime': this.datetimevalue,
                'WhoId': this.rowdetails.idtoupdate,
                'Subject': this.strSubj,
                'DurationInMinutes': parseInt(this.getDuration(this.datetimevalue, this.evtEndTime)),
                'Description': this.inputInternalNoteValue,
                //'Internal_Notes__c': this.inputInternalNoteValue,
                'Location': this.location ? this.location : this.rowdetails.address,
                //this.rowdetails.obj === 'Contact' ? this.rowdetails.mailingCity + ' ' + this.rowdetails.mailingStreet + ' ' + this.rowdetails.mailingState + ' ' + this.rowdetails.mailingCountry + ' ' + this.rowdetails.mailingPostalCode : this.rowdetails.street + ' ' + this.rowdetails.state + ' ' + this.rowdetails.postalcode + ' ' + this.rowdetails.country,
                'WhatId': this.rowdetails.accountId !== undefined ? this.rowdetails.accountId : ''
            };
        }

        if (this.reaction === 'Neutral') {
            followUpTask = {
                recId: this.rowdetails.idtoupdate,
                ActivityDate: this.followUpDueDate,
                isPriority: this.prioritycheck,
                followupcheck: this.followupcheck ? this.followupcheck : false
            }
        }
        task = {
            'sobjectType': 'Task',
            'Id': this.rowdetails.taskId,
            'Status': 'Completed',
            'Subject': this.rowdetails.sub,
            //'Internal_Notes__c': this.inputInternalNoteValue,
            'Call_Block_Disposition__c': this.value != null ? this.value : this.dispositionselected,
            'Reaction__c': this.reaction != null ? this.reaction : '',
            'Description': this.inputNoteValue
        };
        if (this.rowdetails.obj === 'Lead') {
            lead = {
                'sobjectType': 'Lead',
                'Id': this.rowdetails.idtoupdate,
                //'Add_to_Call_Block__c': this.followupcheck ? this.followupcheck : '',
                'Disqualified_Reason__c': this.disqualifyvalue != null ? this.disqualifyvalue : '',
                'Status': this.disqualifyvalue != null ? 'Disqualified' : this.rowdetails.status
            };
        }

        if (this.rowdetails.obj === 'Contact') {
            contact = {
                'sobjectType': 'Contact',
                'Id': this.rowdetails.idtoupdate,
                //'Add_to_Call_Block__c': this.followupcheck,
                'Email': this.emailvalue
            };
        }
        console.log(followUpTask)
        console.log(lead)
        console.log(task)
        console.log(contact)
        const allValid = [...this.template.querySelectorAll('lightning-combobox')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);
        const allinputValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);
        if (allValid && allinputValid) {
            this.isLoaded = true;
            saveRecords({ tsk: task, ld: lead, cont: contact, evtdetails: event })
                .then(result => {
                    if (this.reaction !== 'Neutral') {
                        this.isLoaded = false;
                        this.closeModal();
                    }
                    if (this.reaction === 'Neutral' && this.followupcheck) {
                        createCallBlockTask({ followUpTask: followUpTask })
                            .then(res => {
                                this.isLoaded = false;
                                if (this.largedevice) {
                                    this.closeModal();
                                } else {
                                    var compDefinition = {
                                        componentDef: "c:callblockv1",
                                        attributes: {
                                        }
                                    };
                                    // Base64 encode the compDefinition JS object
                                    //var encodedCompDef = btoa(JSON.stringify(compDefinition));
                                    var encodedCompDef = btoa(unescape(encodeURIComponent(JSON.stringify(compDefinition))));
                                    this[NavigationMixin.Navigate]({
                                        type: 'standard__webPage',
                                        attributes: {
                                            url: '/one/one.app#' + encodedCompDef
                                        }
                                    });
                                }
                            })
                            .catch(error => {
                                this.isLoaded = false;
                                this.error = error;
                                this.showToast(this.error, 'Update Failed')
                            });
                    } else {
                        this.isLoaded = false;
                        this.closeModal();
                    }
                })
                .catch(error => {
                    this.isLoaded = false;
                    this.error = error;
                    this.showToast(this.error, 'Update Failed')
                });
        } else {
            alert('Please update the invalid form entries and try again.');
        }
    }

    showToast(error, title) {
        const event = new ShowToastEvent({
            title: title,
            message: error.body.message,
            variant: 'error'
        });
        this.dispatchEvent(event);
    }
    value
    @track showSaveNConvert = false;
    @track showSaveNContinue = false;
    @track isPostive = false;
    @track isNegative = false;
    @track isNeutral = false;
    handleChange(e) {
        this.value = e.target.value;
        this.showSaveNContinue = true;
        if (this.value === 'Positive') {
            this.showSaveNConvert = true;
            this.isPostive = true;
            this.isNegative = false;
            this.isNeutral = false;
            this.emailvalue = this.rowdetails.Email;
        } else if (this.value === 'Negative') {
            this.showSaveNContinue = true;
            this.isNegative = true;
            this.isPostive = false;
            this.isNeutral = false;
        } else if (this.value === 'Neutral') {
            this.showSaveNContinue = true;
            this.isNeutral = true;
            this.isNegative = false;
            this.isPostive = false;
        }
        var rec = JSON.parse(JSON.stringify(this.rowdetails))
        rec.Call_Block_Disposition__c = this.value
        this.rowdetails = rec;
    }

    @track followupcheck = false;
    @track isConverting;
    handleFollowUpChange(e) {
        this.followupcheck = e.target.checked;
        console.log(this.followupcheck)
    }

    @track prioritycheck = false;
    handlePriorityChange(e) {
        this.prioritycheck = e.target.checked;
    }

    @track datetimevalue;
    getStartdatetimehandle(e) {
        var ToDate = new Date().toISOString().slice(0, 10)
        if (e.detail.value.slice(0, 10) < ToDate) {
            this.datetimevalue = ''
            const event = new ShowToastEvent({
                title: '',
                message: 'Selected date cannot be less than today',
                variant: 'error'
            });
            this.dispatchEvent(event);
            this.template.querySelector('.evtdate').value = null;
        } else {
            this.datetimevalue = e.detail.value;
            var d = new Date(this.datetimevalue);
            d.setMinutes(d.getMinutes() + 30);
            this.template.querySelector('.evtenddate').value = d.toISOString()
        }
    }
    @track evtEndTime;
    getEnddatetimehandle(e) {
        var ToDate = new Date().toISOString().slice(0, 10)
        if (e.detail.value.slice(0, 10) < ToDate) {
            this.evtEndTime = ''
            const event = new ShowToastEvent({
                title: '',
                message: 'Selected date cannot be less than today',
                variant: 'error'
            });
            this.dispatchEvent(event);
            this.template.querySelector('.evtenddate').value = null;
        } else {
            this.evtEndTime = e.detail.value;
        }
    }

    @track emailvalue;
    getemailhandle(e) {
        this.emailvalue = e.detail.value;
    }

    @track inputNoteValue;
    handleNoteChange(event) {
        this.inputNoteValue = event.target.value
    }

    @track inputInternalNoteValue;
    handleInternalNoteChange(event) {
        this.inputInternalNoteValue = event.target.value
    }

    @track disqualifyvalue;
    handledisqualifyChange(e) {
        this.disqualifyvalue = e.detail.value;
    }
    @track isLeadConvert = false;
    saveNconvert(e) {

        var event;
        var lead;
        var task;
        var flowInputVar = []
        const allValid = [...this.template.querySelectorAll('lightning-combobox')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);
        const allinputValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);
        if (allValid && allinputValid) {
            this.isLoaded = true;
            task = {
                'sobjectType': 'Task',
                'Id': this.rowdetails.taskId,
                'Status': 'Completed',
                'Subject': this.rowdetails.sub,
                //'Internal_Notes__c': this.inputInternalNoteValue,
                'Call_Block_Disposition__c': this.value != null ? this.value : this.dispositionselected,
                'Reaction__c': this.reaction != null ? this.reaction : '',
                'Description': this.inputNoteValue
            };
            lead = {
                'Id': this.rowdetails.idtoupdate,
                'Email': this.emailvalue !== null ? this.emailvalue : ''
            }

            if (this.reaction === 'Positive') {
                event = {
                    'sobjectType': 'Event',
                    'StartDateTime': this.datetimevalue,
                    'WhoId': this.rowdetails.idtoupdate,
                    //'Internal_Notes__c': this.inputInternalNoteValue,
                    'Description': this.inputInternalNoteValue,
                    'Subject': this.strSubj,
                    'Location': this.rowdetails.obj === 'Contact' ? this.rowdetails.mailingCity + ' ' + this.rowdetails.mailingStreet + ' ' + this.rowdetails.mailingState + ' ' + this.rowdetails.mailingCountry + ' ' + this.rowdetails.mailingPostalCode : this.rowdetails.street + ' ' + this.rowdetails.state + ' ' + this.rowdetails.postalcode + ' ' + this.rowdetails.country,
                    'WhatId': this.rowdetails.accountId !== undefined ? this.rowdetails.accountId : ''
                };
            }

            flowInputVar.push({
                evtCountry1: this.rowdetails.country,
                evtPostal1: this.rowdetails.postalcode,
                evtState1: this.rowdetails.state,
                evtStreet1: this.rowdetails.street,
                followUpDate1: this.datetimevalue,
                recId1: this.rowdetails.idtoupdate,
                reaction: this.reaction != null ? this.reaction : '',
                description: this.inputNoteValue,
                disposition: this.value != null ? this.value : this.dispositionselected,
                subject: this.label.evtsubject
            })

            createevent({ evtdetails: event, ld: lead, tsk: task })
                .then(result => {
                    console.log(result)
                    this.isLoaded = false;
                    this.isLeadConvert = true;

                    if (!this.largedevice) {
                        var compDefinition = {
                            componentDef: "c:convertLead",
                            attributes: {
                                c__recordId: this.rowdetails.idtoupdate,
                                c__name: this.rowdetails.companyname,
                                c__ldname: this.rowdetails.name
                            }
                        };
                        // Base64 encode the compDefinition JS object
                        var encodedCompDef = btoa(JSON.stringify(compDefinition));
                        this[NavigationMixin.Navigate]({
                            type: 'standard__webPage',
                            attributes: {
                                url: '/one/one.app#' + encodedCompDef
                            }
                        });
                    }
                })
                .catch(error => {
                    this.isLoaded = false;
                    console.log('Error Occured:- ' + error);
                    this.showToast(error, 'Update Failed')
                });
        } else {
            alert('Please update the invalid form entries and try again.');
        }

    }

    didScrolled = true;
    fetchmoredata;
    _timerId;
    showInnerSpinner = false;
    handleScroll(event) {
        clearTimeout(this._timerId);
        this.didScrolled = false;
        if (event.target.scrollTop > event.target.scrollHeight - (event.target.offsetHeight * 2)) {
            this.showInnerSpinner = true;
            this._timerId = setTimeout(() => {
                this.fetchMoreActivityTimeLine();
            }, 1000);
        }
    }
    nodata = false;
    fetchMoreActivityTimeLine() {
        const currentData = this.timelineGroups;
        let ldate = currentData[currentData.length - 1].items[currentData[currentData.length - 1].items.length - 1];
        let vDate = JSON.parse(JSON.stringify(ldate)).activityDate;
        getActivityTimeline({ recordId: this.rowdetails.idtoupdate, includeChildren: false, pageSize: this.rowLimit, pageNumber: this.pageNumber, lastActivityDate: vDate })
            .then((data) => {
                this.showInnerSpinner = false;
                this.fetchmoredata = data;
                this.didScrolled = false;
                console.log('Load data');
                if (data.length !== 0) {
                    this.timelineGroups = this.timelineGroups.concat(data);
                    console.log(this.timelineGroups);
                    console.log(this.timelineGroups.length);
                } else {
                    this.nodata = true;
                }
            }
            );
    }

    handleClick(e) {
        e.target.label = e.target.label === 'Expand All' ? 'Collapse All' : 'Expand All'
        this.isExpandAll = !this.isExpandAll;
        [...this.template.querySelectorAll('c-activitylineitem')]
            .forEach(node => node.expandAllNode());
    }

    handleSubjectEdit(e) {
        this.editSubject = true;
    }
    handleSubjectChange(e) {
        console.log(e)
        this.strSubj = e.detail.value != null ? e.detail.value : this.label.evtsubject
    }
    location;
    handleLocationChange(e) {
        this.location = e.detail.value;
    }
    gotoCallBlock(e) {
        this.blntoCallblock = e.isConverted;
    }
    hideConvertButton;
    hideButton(e) {
        this.hideConvertButton = e.detail
    }

    handleCallBlock(e) {
        const custEvent = new CustomEvent(
            'callgettask', {
            isConverted: true
        });
        this.dispatchEvent(custEvent);
    }
}