trigger SetCaseOwner on Case (after insert) {
	 // Assign new cases to appropriate queue (ignore email-to-case cases)
    if (Trigger.isInsert) {
        CaseAssigner.assign(Trigger.new);	
    } 
}