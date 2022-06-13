global class scheduledStandingOrderActive implements Schedulable {
   global void execute(SchedulableContext SC) {
      StandingOrder.setInActive();
      StandingOrderLineItem.setInActive(); 
   }
}