<template>
    <div class="slds-form-element__row">
        <div class="slds-form-element slds-size--1-of-4">
            <label class="slds-form-element__label" for="mm-staticLatInput">
                <abbr class="slds-required" title="required">*</abbr> Map Center Latitude
            </label>
 
            <ma-input
                v-model="layer.center.lat"
                @input="validator.center.lat.$touch"
                :isInvalid="validator.center.lat.$error"
                placeholder="Latitude"
            ></ma-input>
            <div v-show="validator.center.lat.$dirty && !validator.center.lat.required" class="slds-form-element__error">This field is required.</div>
            <div v-show="!validator.center.lat.latitude" class="slds-form-element__error">Please enter a valid latitude value.</div>
        </div>

        <div class="slds-form-element slds-size--1-of-4">
            <label class="slds-form-element__label" for="mm-center.lngInput">
                <abbr class="slds-required" title="required">*</abbr> Map Center Longitude
            </label>

            <ma-input
                v-model="layer.center.lng"
                @input="validator.center.lng.$touch"
                :isInvalid="validator.center.lng.$error"
                placeholder="Longitude"
            ></ma-input>
            <div v-show="validator.center.lng.$dirty && !validator.center.lng.required" class="slds-form-element__error">This field is required.</div>
            <div v-show="!validator.center.lng.longitude" class="slds-form-element__error">Please enter a valid longitude value.</div>
        </div>

        <!-- If we want other elements on the same row as the inputs in this component we need to add a place for default slot content to go -->
        <slot></slot>
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
        }
    };
</script>