<template>
    <div class="slds-form-element slds-size--1-of-2">
        <label class="slds-form-element__label" for="select-01">Map Zoom Level</label>
        <div class="slds-form-element__control">
            <ma-select
                :options="levels"
                :inModal="true"
                :selected.sync="layer.zoom"
                :isInvalid="validator.zoom.$error"
                :default="layer.zoom"
            ></ma-select>
            <div v-show="validator.$dirty && !validator.zoom.required" class="slds-form-element__error">This field is required.</div>
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
                levels: [
                    { key: 16, value: "Street" },
                    { key: 13, value: "City" },
                    { key: 10, value: "State" },
                    { key: 8,  value: "Country" },
                    { key: 3,  value: "Continent" }
                ]
            }
        }
    };
</script>