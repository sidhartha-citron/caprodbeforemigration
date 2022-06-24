<template>
    <div class="layer-wrapper-wizard">
        <common @changed="onSObjectChange" :validator="$v" :layer.sync="$data"></common>

        <fieldset class="slds-form--compound">
            <div class="slds-form-element__group">
                <div class="slds-form-element__row">
                    <div class="slds-form-element slds-size--1-of-2">
                        <legend class="slds-form-element__legend slds-form-element__label">{{ Labels.MA_Map_Center }}</legend>
                        <div class="slds-form-element__control">
                            <div class="slds-radio--button-group">
                                <span @click="blur" class="slds-button slds-radio--button">
                                    <label class="slds-radio--button__label" :class="{ 'blue': center.type == 'field' }">
                                        <input type="radio" id="fieldCenter" value="field" v-model="center.type" />
                                        <span class="slds-radio--faux">{{ Labels.MA_This_Record }}</span>
                                    </label>
                                </span>

                                <span @click="blur" class="slds-button slds-radio--button">
                                    <label class="slds-radio--button__label" :class="{ 'blue': center.type == 'static' }">
                                        <input type="radio" id="staticCenter" value="static" v-model="center.type" />
                                        <span class="slds-radio--faux">{{ Labels.MA_Static_Lat_Lng }}</span>
                                    </label>
                                </span>
                            </div>
                        </div>
                    </div>
                    <zoom :validator="$v" :layer.sync="$data"></zoom>
                </div>
            </div>
        </fieldset>

        <fieldset v-if="isStaticCenter" class="slds-form--compound">
            <div class="slds-form-element__group">
                <div class="slds-form-element__row">
                    <staticLatLng :validator="$v" :layer.sync="$data"></staticLatLng>
                </div>
            </div>
        </fieldset>

        <tooltips :layer.sync="$data"></tooltips>
    </div>
</template>

<script>
    var Vue = require('vue').default,
        validators = require('validators'),
        BaseLayer = require('./base.vue');

    module.exports = {
        extends: BaseLayer,
        created: function() {
            this.type = this.$store.state.data.layer.types.THIS;
            this.center.type = 'field';
        },
        computed: {
            isStaticCenter: function() {
                return this.center.type === 'static';
            }
        },
        data: function() {
            return {
                Labels: window.MASystem.Labels
            }
        },
        validations: function() {
            if (this.isStaticCenter) {
                return {
                    center: {
                        lat: {
                            required: validators.required,
                            latitude: require('ma-lib/vue/validators/latitude')
                        },
                        lng: {
                            required: validators.required,
                            longitude: require('ma-lib/vue/validators/longitude')
                        }
                    }
                };
            } else {
                return {
                    center: {
                        lat: {},
                        lng: {}
                    }
                };
            }
        },
        methods: {
            aggregateData: function() {
                return this.$data;
            }
        }
    }
</script>

<style scoped>
    .blue {
        background-color: #0070d2 !important;
    }
</style>