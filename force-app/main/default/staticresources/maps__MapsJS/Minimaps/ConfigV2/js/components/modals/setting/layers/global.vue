<template>
    <div class="layer-wrapper-wizard">
        <common @changed="onSObjectChange" :validator="$v" :layer.sync="$data"></common>

        <fieldset class="slds-form--compound">
            <div class="slds-form-element__group">
                <staticLatLng :validator="$v" :layer.sync="$data">
                    <!-- This will get added to the default slot location inside the staticLatLng component -->
                    <zoom :validator="$v" :layer.sync="$data"></zoom>
                </staticLatLng>
            </div>
        </fieldset>

        <fieldset class="slds-form--compound">
            <div class="slds-form-element__group">
                <div class="slds-form-element__row">
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
                queryFilterComponents: [],
                Labels: window.MASystem.Labels
            }
        },
        created: function() {
            this.type = this.$store.state.data.layer.types.GLOBAL;
        },
        validations: {
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
        }
    }
</script>