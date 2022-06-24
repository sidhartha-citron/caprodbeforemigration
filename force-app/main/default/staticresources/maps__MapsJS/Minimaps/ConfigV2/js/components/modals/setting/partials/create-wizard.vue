<template>
    <div>
        <div class="slds-grid slds-wrap slds-grid_align-space" id="selectLayerStyle">
            <div class="slds-p-horizontal--small slds-size--1-of-1">
                <h2 class="slds-text-heading--small" id="selectLayerTitle">{{ Labels.MA_What_To_See }}</h2>
            </div>
            <div class="slds-col layer-style slds-size_1-of-2">
                <div @click="selected($store.state.data.layer.types.THIS)" class="slds-box slds-box--small slds-theme--shade slds-text-align--center mm-select-type" id="thisRecordCard">
                    <div class="card-footer">{{ Labels.MA_This_Nearby }}</div>
                </div>
                <div class="select-type-overlay">
                    <p class="slds-text-heading--medium">{{ Labels.MA_Used_Rec_Page_Info }}</p>
                </div>
            </div>
            <div class="slds-col layer-style slds-size_1-of-2">
                <div @click="selected($store.state.data.layer.types.GLOBAL)" class="slds-box slds-box--small slds-theme--shade slds-text-align--center mm-select-type" id="globalCard">
                    <div class="card-footer">{{ Labels.MA_Global_Filtered }}</div>
                </div>
                <div class="select-type-overlay">
                    <p class="slds-text-heading--medium">{{ Labels.MA_Used_Home_Page_Info }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    module.exports = {
        data: function() {
            return {
                Labels: window.MASystem.Labels
            }
        },
        methods: {
            selected: function(type) {
                this.$emit('selected', type);
            }
        }
    };
</script>