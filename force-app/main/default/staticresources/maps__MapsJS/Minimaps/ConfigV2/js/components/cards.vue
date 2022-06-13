<template>
    <div>
        <div class="config-section-title">
            <h2>
                <span class="slds-text-heading--medium site-text-heading--callout">{{ title }}</span>
            </h2>

            <ma-tooltip class="tooltip-wrapper">
                <p slot="content">{{ info }}</p>
            </ma-tooltip>
        </div>

        <article v-if="doShowCreateCard" @click="create" class="slds-card slds-card--narrow add-new-card">
            <div class="slds-card__body">
                <svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 52 52"><path fill="#fff" d="m30 29h16.5c0.8 0 1.5-0.7 1.5-1.5v-3c0-0.8-0.7-1.5-1.5-1.5h-16.5c-0.6 0-1-0.4-1-1v-16.5c0-0.8-0.7-1.5-1.5-1.5h-3c-0.8 0-1.5 0.7-1.5 1.5v16.5c0 0.6-0.4 1-1 1h-16.5c-0.8 0-1.5 0.7-1.5 1.5v3c0 0.8 0.7 1.5 1.5 1.5h16.5c0.6 0 1 0.4 1 1v16.5c0 0.8 0.7 1.5 1.5 1.5h3c0.8 0 1.5-0.7 1.5-1.5v-16.5c0-0.6 0.4-1 1-1z"></path></svg>
                <p class="slds-text-heading--small">{{ Labels.MA_Create_New_Nearby_Map }}</p>
            </div>
        </article>

        <card v-for="setting in settings" :setting="setting" :key="setting.record.Id"></card>

        <ma-spinner v-show="isLoading"></ma-spinner>
    </div>
</template>

<script>
    var bus = require('ma-lib/vue/bus');
    module.exports = {
        props: {
            title: {
                type: String,
                required: true
            },
            info: {
                type: String,
                required: true
            },
            settings: {
                type: Array|Object,
                required: true
            },
            doShowCreateCard: {
                type: Boolean,
                default: false
            }
        },
        data: function() {
            return {
                isLoading: false,
                Labels: window.MASystem.Labels
            }
        },
        components: {
            'card': require('./card.vue'),
            'ma-tooltip': require('ma-lib/vue/components/ma-tooltip.vue')
        },
        methods: {
            create: function() {
                bus.$emit('show-setting-modal');
            }
        }
    };
</script>

<style>
    .tooltip-wrapper {
        position: relative;
        display: inline-block;
        top: -3px;
        left: 5px;
    }

    .slds-scope .slds-popover {
        position: absolute !important;
        width: 400px !important;
    }
</style>