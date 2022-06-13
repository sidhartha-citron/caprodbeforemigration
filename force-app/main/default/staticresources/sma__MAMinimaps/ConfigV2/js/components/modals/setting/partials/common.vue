<template>
    <div>
        <div class="slds-page-header">
            <fieldset class="slds-form--compound">
                <div class="slds-form-element__group">
                    <div class="slds-form-element__row">
                        <button class="accordion slds-button slds-button--icon slds-m-right--x-small mm-layer-toggle" aria-controls="tree0-node1" title="Toggle">
                            <!-- TODO: Convert to ma-icon -->
                            <svg class="slds-button__icon slds-button__icon--large" xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"><path fill="#16325c" d="m17.9 4.4l20.7 20.5c0.6 0.6 0.6 1.6 0 2.2l-20.7 20.5c-0.6 0.6-1.6 0.6-2.2 0l-2.2-2.2c-0.6-0.6-0.6-1.6 0-2.2l16.3-16.1c0.6-0.6 0.6-1.6 0-2.2l-16.2-16.1c-0.6-0.6-0.6-1.6 0-2.2l2.2-2.2c0.6-0.5 1.5-0.5 2.1 0z"/></svg>
                            <span class="slds-assistive-text">{{ Labels.MA_Toggle }}</span>
                        </button>

                        <div class="slds-form-element">
                            <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_Layer_Label }}</label>
                            <div class="slds-form-element__control">
                                <ma-input
                                    v-model="layer.name"
                                    @input="validator.name.$touch"
                                    :isInvalid="validator.name.$error"
                                    :placeholder="Labels.MA_Name_Layer"
                                ></ma-input>
                                <div v-show="validator.$dirty && !validator.name.required" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
                                <div v-show="!validator.name.maxLength" class="slds-form-element__error">{{ Labels.MA_Max_Length_50 }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>

        <fieldset class="slds-form--compound">
            <div class="slds-form-element__group">
                <div class="slds-form-element__row">
                    <div class="slds-form-element slds-size--1-of-2">
                        <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_OBJECT }}</label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="metadata.sobjects"
                                :inModal="true"
                                :isInvalid="validator.sobject.$error"
                                :selected.sync="layer.sobject"
                                keyString="api"
                                valueString="label"
                                @changed="sobjectChanged"
                            ></ma-select>
                            <div v-show="validator.$dirty && !validator.sobject.required" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
                        </div>
                    </div>

                    <markerLegend :marker.sync="layer.marker"></markerLegend>
                </div>
            </div>
        </fieldset>

        <fieldset class="slds-form--compound">
            <div class="slds-form-element__group">
                <div class="slds-form-element__row">
                    <div class="slds-form-element slds-size--1-of-2">
                        <legend class="slds-form-element__legend slds-form-element__label">{{ Labels.MA_Plot_By }}</legend>
                        <div class="slds-form-element__control">
                            <div class="slds-radio--button-group">
                                <span @click="blur" class="slds-button slds-radio--button">
                                    <label class="slds-radio--button__label" :class="{ 'blue': isGeoFieldTypeLocation }">
                                        <input type="radio" id="locationFieldType" value="location" v-model="layer.geoFieldType" />
                                        <span class="slds-radio--faux">{{ Labels.MA_Location_Field }}</span>
                                    </label>
                                </span>

                                <span @click="blur" class="slds-button slds-radio--button">
                                    <label class="slds-radio--button__label" :class="{ 'blue': isGeoFieldTypeNumber }">
                                        <input type="radio" id="numberFieldType" value="number" v-model="layer.geoFieldType" />
                                        <span class="slds-radio--faux">{{ Labels.MA_Number_Field }}</span>
                                    </label>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="slds-form-element slds-size--1-of-2">
                        <legend class="slds-form-element__legend slds-form-element__label">{{ Labels.MA_Plot_By }} ({{ Labels.MA_Verified }})</legend>
                        <div class="slds-form-element__control">
                            <div class="slds-radio--button-group">
                                <span @click="blur" class="slds-button slds-radio--button">
                                    <label class="slds-radio--button__label" :class="{ 'blue': isVerifiedGeoFieldTypeLocation }">
                                        <input type="radio" id="locationFieldType" value="location" v-model="layer.verifiedGeoFieldType" />
                                        <span class="slds-radio--faux">{{ Labels.MA_Location_Field }}</span>
                                    </label>
                                </span>

                                <span @click="blur" class="slds-button slds-radio--button">
                                    <label class="slds-radio--button__label" :class="{ 'blue': isVerifiedGeoFieldTypeNumber }">
                                        <input type="radio" id="numberFieldType" value="number" v-model="layer.verifiedGeoFieldType" />
                                        <span class="slds-radio--faux">{{ Labels.MA_Number_Field }}</span>
                                    </label>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </fieldset>

        <fieldset class="slds-form--compound">
            <div class="slds-form-element__group">
                <div class="slds-form-element__row">
                    <div v-if="isGeoFieldTypeLocation" class="slds-form-element slds-size--1-of-2">
                        <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_Location_Field }}</label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="layer.metadata.locationFields"
                                :inModal="true"
                                :isInvalid="validator.locationField.$error"
                                :selected.sync="layer.locationField"
                                keyString="api"
                                valueString="label"
                            ></ma-select>
                            <div v-show="validator.$dirty && validator.locationField.$error" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
                        </div>
                    </div>

                    <div v-if="isGeoFieldTypeNumber" class="slds-form-element slds-size--1-of-4">
                        <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_Latitude_Field }}</label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="layer.metadata.doubleFields"
                                :inModal="true"
                                :isInvalid="validator.latField.$error"
                                :selected.sync="layer.latField"
                                keyString="api"
                                valueString="label"
                            ></ma-select>
                            <div v-show="validator.$dirty && validator.latField.$error" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
                        </div>
                    </div>

                    <div v-if="isGeoFieldTypeNumber" class="slds-form-element slds-size--1-of-4">
                        <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_Longitude_Field }}</label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="layer.metadata.doubleFields"
                                :inModal="true"
                                :isInvalid="validator.lngField.$error"
                                :selected.sync="layer.lngField"
                                keyString="api"
                                valueString="label"
                            ></ma-select>
                            <div v-show="validator.$dirty && validator.lngField.$error" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
                        </div>
                    </div>

                    <div v-if="isVerifiedGeoFieldTypeLocation" class="slds-form-element slds-size--1-of-2">
                        <label class="slds-form-element__label">{{ Labels.MA_Verified_Location_Field }}</label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="layer.metadata.locationFields"
                                :inModal="true"
                                :selected.sync="layer.verifiedLocationField"
                                keyString="api"
                                valueString="label"
                            ></ma-select>
                        </div>
                    </div>

                    <div v-if="isVerifiedGeoFieldTypeNumber" class="slds-form-element slds-size--1-of-4">
                        <label class="slds-form-element__label">{{ Labels.MA_Verified_Latitude_Field }}</label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="layer.metadata.doubleFields"
                                :inModal="true"
                                :selected.sync="layer.verifiedLatField"
                                keyString="api"
                                valueString="label"
                            ></ma-select>
                        </div>
                    </div>

                    <div v-if="isVerifiedGeoFieldTypeNumber" class="slds-form-element slds-size--1-of-4">
                        <label class="slds-form-element__label">{{ Labels.MA_Verified_Longitude_Field }}</label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="layer.metadata.doubleFields"
                                :inModal="true"
                                :selected.sync="layer.verifiedLngField"
                                keyString="api"
                                valueString="label"
                            ></ma-select>
                        </div>
                    </div>
                </div>
            </div>
        </fieldset>
    </div>
</template>

<script>
    var bus = require('ma-lib/vue/bus'),
        RemoteAction = require('ma-lib/remote-action');

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
        components: {
            'markerLegend': require('./marker-legend.vue')
        },
        created: function() {
            this.loadSObjects();
        },
        data: function() {
            return {
                metadata: {
                    sobjects: []
                },
                Labels: window.MASystem.Labels
            }
        },
        computed: {
            isGeoFieldTypeLocation: function() {
                return this.layer.geoFieldType === 'location';
            },
            isGeoFieldTypeNumber: function() {
                return this.layer.geoFieldType === 'number';
            },
            isVerifiedGeoFieldTypeLocation: function() {
                return this.layer.verifiedGeoFieldType === 'location';
            },
            isVerifiedGeoFieldTypeNumber: function() {
                return this.layer.verifiedGeoFieldType === 'number';
            }
        },
        methods: {
            sobjectChanged: function(clickSelected) {
                this.$emit('changed', clickSelected);
            },
            blur: function(event) {
                event.target.blur();
            },
            loadSObjects: function() {
                bus.$emit('increment-callout');

                var self = this;
                new RemoteAction('sma.RemoteActions', 'getAllowableSObjects')
                    .setErrorHandler(this.handleRemoteActionError.bind(this))
                    .invoke([], function(sobjects) {
                        self.metadata.sobjects = sobjects;
                        bus.$emit('decrement-callout');
                    }
                );
            },
            handleRemoteActionError: function(result, event) {
                bus.$emit('decrement-callout');
                bus.$emit('set-error', event.message);
            }
        }
    }
</script>

<style scoped>
    .blue {
        background-color: #1b5297 !important;

        .slds-radio--faux:hover {
            background-color: transparent !important;
        }

        &:hover {
            background-color: #004487 !important;
        }
    }

    .slds-scope .slds-form--compound .slds-form-element__row {
        align-items: flex-start;
    }
</style>
