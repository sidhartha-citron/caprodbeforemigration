import { LightningElement, api, track } from 'lwc';
export default class Activitylineitem extends LightningElement {
    @api item;
    @api open;
    @api isexpanded = false;
    @track timelineclass;
    @track title;
    @track isTask = false;
    @track isCall = false;
    @track isEvent = false;
    @track isEmail = false;
    @track isPriority = false;
    isRecurring = false;
    isOverdue;
    isformatteddatetime = false;
    hasAttachments = false;
    isassignedTo;
    isCurrentUser = false;
    isComplete = false;
    textTense;
    textfutureTense;
    varto;
    varHaveHas;
    varYou;
    varOther = '';
    varToEmailAddress;
    varRelatedTo;
    varRecipients;
    varRecipientsRecordName;
    @track showDetails = false;
    lnkRecordId;
    reactionIcon;
    reactionVariant;
    notes;
    connectedCallback() {
        this.lnkRecordId = '/lightning/r/' + this.item.sobjectName + '/' + this.item.recordId + '/view';
        this.varYou = this.item.recipients ? this.item.recipients[0].isCurrentUser ? 'you' : this.item.recipients[0].recordName : '';
        const tmpAndVar = this.item.recipients ? 'and' + this.item.recipients.length - 1 : '';
        if (this.item.recipients) {
            this.varRecipients = '/lightning/r/' + this.item.recipients[0].sobjectName + '/' + this.item.recipients[0].recordId + '/view';
            this.varRecipientsRecordName = this.item.recipients[0].recordName;
            if (this.item.recipients.length > 1) {
                if (this.item.recipients.length === 2) {
                    this.varOther = tmpAndVar + 'other';
                } else {
                    this.varOther = tmpAndVar + 'others';
                }
            }
        }
        this.varToEmailAddress = this.item.toEmail ? 'mailto:' + this.item.toEmail.address : '';
        this.varRelatedTo = this.item.relatedTo ? '/lightning/r/' + this.item.relatedTo.sobjectName + '/' + this.item.relatedTo.recordId + '/view' : ''
        this.isComplete = this.item.isComplete ? true : false;
        this.isassignedTo = this.item.assignedTo;
        this.isCurrentUser = this.item.assignedTo ? this.item.assignedTo.isCurrentUser : '';
        this.varHaveHas = this.isCurrentUser ? 'have' : 'has';
        this.isOverdue = this.item.isOverdue ? 'duedateBold slds-timeline__date slds-text-color_error' : 'slds-timeline__date';
        this.isformatteddatetime = this.item.activityTimelineType === 'Call' && this.item.activityTimelineType === 'Task' ? true : false;
        if (this.item.isPriority) {
            this.isPriority = true;
        }
        if (this.item.reaction) {
            // if (this.item.reaction === 'Positive') {
            //     this.reactionIcon = 'utility:smiley_and_people'
            // } else if (this.item.reaction === 'Negative') {
            //     this.reactionIcon = 'utility:smiley_and_people'
            // }
            this.reactionIcon = this.item.reaction === 'Positive' ? 'utility:smiley_and_people' : this.item.reaction === 'Negative' ? 'utility:sentiment_negative' : this.item.reaction === 'Neutral' ? 'utility:sentiment_neutral' : '';
            this.reactionVariant = this.item.reaction === 'Positive' ? 'success' : this.item.reaction === 'Negative' ? 'error' : this.item.reaction === 'Neutral' ? 'warning' : '';
        }
        this.isRecurring = this.item.isRecurring ? true : false;
        this.hasAttachments = this.item.hasAttachments ? true : false;
        if (this.item.activityTimelineType === 'Call') {
            this.timelineclass = 'slds-timeline__item_call';
            this.title = 'Toggle details for ' + this.item.subject;
            this.isCall = true;
            this.textTense = 'logged a call';
            this.textfutureTense = 'an upcoming call';
            this.varto = 'with';
            this.notes = this.item.callblockdisposition + ' | ' + this.item.detail
        } else if (this.item.activityTimelineType === 'Email') {
            this.timelineclass = 'slds-timeline__item_email';
            this.title = 'Toggle details for ' + this.item.subject;
            this.isEmail = true;
            this.textTense = 'sent an email';
            //this.varto = 'to';
            this.varto = 'Contact :';
        } else if (this.item.activityTimelineType === 'Event') {
            this.timelineclass = 'slds-timeline__item_event';
            this.title = 'Toggle details for ' + this.item.subject;
            this.isEvent = true;
            this.textTense = ' had an event';
            this.textfutureTense = 'an upcoming event';
            this.varto = 'with';
        } else {
            this.timelineclass = 'slds-timeline__item_task';
            this.title = 'Toggle details for ' + this.item.subject;
            this.isTask = true;
            this.textTense = 'had a task';
            this.textfutureTense = 'an upcoming task';
            this.varto = 'with';
        }


    }
    get itemButtonIcon() {
        return this.showDetails ? 'utility:switch' : 'utility:chevronright';
    }
    get showdisplay() {
        return this.showDetails ? 'slds-is-open' : ' ';
    }
    get itemStyle() {
        return this.showDetails ? "slds-timeline__item_expandable slds-is-open" : "slds-timeline__item_expandable";
    }
    toggleActivityDetail(e) {
        // this.expanded = !this.expanded;
        this.showDetails = !this.showDetails;
    }
    @api
    expandAllNode() {
        this.showDetails = !this.showDetails;
        // this.expanded = !this.expanded;
    }
    @api
    setExpanded(value) {
        this.showDetails = value;
    }
}