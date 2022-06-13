<aura:application extends="force:slds">
	<aura:attribute name="orderId" type="String"/>
    
    <c:MassEditOrder recordId="{!v.orderId}"/>
</aura:application>