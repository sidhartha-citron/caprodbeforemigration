<template>
    <div class="layer-wrapper-wizard">
        <common @changed="onSObjectChange" :validator="$v" :layer.sync="$data"></common>

        <!-- radius and units -->
        <fieldset class="slds-form--compound">
            <div class="slds-form-element__group">
                <div class="slds-form-element__row">
                    <div class="slds-form-element slds-size--1-of-4">
                        <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_Radius }}</label>
                        <ma-input
                            v-model="radius"
                            @input="$v.radius.$touch"
                            :isInvalid="$v.radius.$error"
                            :placeholder="Labels.MA_Radius"
                        ></ma-input>
                        <div v-show="$v.radius.$dirty && !$v.radius.required" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
                        <div v-show="!$v.radius.decimal" class="slds-form-element__error">{{ Labels.MA_Please_Enter_Decimal }}</div>
                    </div>
                    <div class="slds-form-element slds-size--1-of-4">
                        <label class="slds-form-element__label empty-label" for="input-02"></label>
                        <div class="slds-form-element__control">
                            <ma-select
                                :options="units"
                                :inModal="true"
                                :selected.sync="unit"
                                :isInvalid="$v.unit.$error"
                                :default="unit"
                            ></ma-select>
                            <div v-show="$v.$dirty && !$v.unit.required" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
                        </div>
                    </div>
                    <numMarkers :validator="$v" :layer.sync="$data"></numMarkers>
                </div>
            </div>
        </fieldset>

        <div>
            <fieldset class="slds-form--compound">
                <h2 class="slds-text-heading--small" id="selectLayerTitle">{{ Labels.MA_Query_Filters }}</h2>
                <queryFilter
                    v-for="(queryFilter, index) in queryFilterComponents"
                    :filterFields="metadata.filterFields"
                    :key="queryFilter.id"
                    :ref="queryFilter.id"
                    :init="queryFilter.init"
                    @remove="removeFilter(index)"
                ></queryFilter>
                <button @click="addFilter" class="slds-button slds-button--neutral" :disabled="disableAddFilterBtn">{{ Labels.MA_Add_Filter }}</button>
            </fieldset>
        </div>

        <sort :layer.sync="$data"></sort>
        <tooltips :layer.sync="$data"></tooltips>
    </div>
</template>

<script>
    var Vue = require('vue').default,
        validators = require('validators'),
        BaseLayer = require('./base.vue');

    module.exports = {
        extends: BaseLayer,
        data: function() {
            return {
                Labels: window.MASystem.Labels
            }
        },
        computed: {
            units: function() {
                return [
                    { key: 'mi', value: this.Labels.Routes_Miles },
                    { key: 'km', value: this.Labels.Routes_Kilometers }
                ];
            }
        },
        created: function() {
            this.type = this.$store.state.data.layer.types.NEARBY;
        },
        validations: function() {
            var base = {
                center: {
                    lat: {},
                    lng: {}
                },
                radius: {
                    required: validators.required,
                    decimal: require('ma-lib/vue/validators/decimal')
                }
            };

            if (this.isStaticCenter) {
                base.center = {
                    lat: {
                        required: validators.required,
                        latitude: require('ma-lib/vue/validators/latitude')
                    },
                    lng: {
                        required: validators.required,
                        longitude: require('ma-lib/vue/validators/longitude')
                    }
                };
            }

            return base;
        }
    }
</script>

<style>
    .slds-form-element__row {
        align-items: flex-start !important;
    }
</style>