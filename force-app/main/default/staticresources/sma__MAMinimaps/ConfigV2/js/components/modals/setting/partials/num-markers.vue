<template>
    <div class="slds-form-element slds-size--1-of-2">
        <label class="slds-form-element__label" for="input-02">{{ Labels.MA_Num_of_Markers }}</label>
        <div class="slds-form-element__control">
            <ma-select
                :options="options"
                :inModal="true"
                :selected.sync="layer.numMarkers"
                :isInvalid="validator.numMarkers.$error"
                :default="layer.numMarkers"
            ></ma-select>
            <div v-show="validator.$dirty && !validator.numMarkers.required" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
        </div>
    </div>
</template>

<script>
    module.exports = {
        props: {
            layer: {
                type: Object,
                required: true
            },
            validator: {
                type: Object,
                required: true
            }
        },
        data: function() {
            return {
                options: [
                    { key: 5, value: "5" },
                    { key: 10, value: "10" },
                    { key: 15, value: "15" },
                    { key: 20, value: "20" },
                    { key: 25, value: "25" },
                    { key: 30, value: "30" },
                    { key: 35, value: "35" },
                    { key: 40, value: "40" },
                    { key: 45, value: "45" },
                    { key: 50, value: "50" }
                ],
                Labels: window.MASystem.Labels
            }
        }
    };
</script>