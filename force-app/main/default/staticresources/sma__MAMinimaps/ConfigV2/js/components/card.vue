<template>
    <article class="slds-card slds-card--narrow">
        <div class="slds-card__header">
            <header class="slds-media slds-media--center slds-has-flexi-truncate">
                <div class="slds-media__body">
                    <div class="slds-grid">
                        <div class="slds-col slds-has-flexi-truncate" style="padding-top: 7px;">
                            <h2>
                                <span class="slds-text-heading--small">{{ recordName }}</span>
                            </h2>
                        </div>

                        <div cloass="slds-col slds-no-flex slds-grid slds-align-top">
                            <div v-if="isCustom" @mouseover="showActionMenu = true" @mouseout="showActionMenu = false" class="slds-dropdown-trigger slds-dropdown-trigger--click slds-is-open">
                                <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-button_icon-x-small" aria-haspopup="true">
                                    <span class="slds-button__icon ma-icon ma-icon-down"></span>
                                    <span class="slds-assistive-text">More Options</span>
                                </button>
                                <div v-show="showActionMenu" class="slds-dropdown slds-dropdown_right slds-dropdown_actions">
                                    <ul class="slds-dropdown__list" role="menu">
                                        <li @click="copy" class="slds-dropdown__item" role="presentation">
                                            <a role="menuitem" tabindex="0">
                                                <span class="slds-truncate" title="Edit">Copy Visualforce Code</span>
                                            </a>
                                        </li>
                                        <li @click="editSetting" class="slds-dropdown__item" role="presentation">
                                            <a role="menuitem" tabindex="0">
                                                <span class="slds-truncate" title="Delete">Edit</span>
                                            </a>
                                        </li>
                                        <li @click="deleteSetting" class="slds-dropdown__item" role="presentation">
                                            <a role="menuitem" tabindex="0">
                                                <span class="slds-truncate" title="Delete">Delete</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </div>

        <div class="slds-card__body">
            <div class="slds-card__body--inner mm-card-layers">
                <div v-for="error in setting.errors" class="slds-tile">
                    <div class="title-marker-icon mm-card-layer-marker"><!-- Error Icon --></div>
                    <h3 class="slds-truncate mm-card-layer-title" style="color: red;">{{ error }}</h3>
                </div>

                <!-- Custom -->
                <div v-for="marker in layerMarkers" class="slds-tile">
                    <div class="title-marker-icon">
                        <img :id="'svgCardIcon__' + marker.type" :src="marker.imgURL" />
                    </div>
                    <h3 class="slds-truncate">{{ marker.label }}</h3>
                </div>

                <!-- Default -->
                <div v-for="layer in setting.options.layers" v-if="!isCustomMarker(layer)" class="slds-tile">
                    <div class="title-marker-icon">
                        <img :id="'svgCardIcon__' + layer.marker.type" :src="svg(layer.marker.type, layer.marker.color)" />
                    </div>
                    <h3 class="slds-truncate">{{ layer.label }}</h3>
                </div>
            </div>
        </div>

         <deleteSetting v-if="showDeleteModal" :setting="setting.record" :doShow.sync="showDeleteModal"></deleteSetting>
    </article>
</template>

<script>
    var bus = require('ma-lib/vue/bus');
    module.exports = {
        props: {
            setting: Object
        },
        components: {
            'deleteSetting': require('./modals/delete-setting.vue')
        },
        data: function() {
            return {
                showActionMenu: false,
                showDeleteModal: false,
                sitePrefix: window.MASystem.MergeFields.SitePrefix,
                orgId: window.MASystem.MergeFields.Organization_Id
            }
        },
        computed: {
            isCustom: function() {
                return this.setting.record.sma__Is_Custom__c;
            },
            recordName: function() {
                return this.setting.record.sma__Name__c;
            },
            layerMarkers: function() {
                // Populates layers that contain at least one custom marker
                var markers = [];
                if (this.setting.options.config) {
                    // Context Marker
                    var thisConfig = window.getProperty(this,'setting.options.config') || {};
                    var thisImgURL = window.getProperty(thisConfig,'context.marker.imgURL') || '';
                    if (thisImgURL != '') {
                        // Custom Marker URL
                        markers.push(
                            {
                                imgURL: this.sitePrefix+'/servlet/servlet.ImageServer?id='+thisImgURL+'&oid='+this.orgId,
                                label: this.setting.options.config.context.name,
                                type: ''
                            }
                        );
                    } else {
                        // Standard Marker URL
                        markers.push(
                            {
                                imgURL: this.svg(this.setting.options.config.context.marker.type , this.setting.options.config.context.marker.color),
                                label: this.setting.options.config.context.name,
                                type: this.setting.options.config.context.marker.type
                            }
                        );
                    }
                    // Nearby Markers
                    for (var i = 0; i < this.setting.options.config.layers.length; i++) {
                        let thisLayer = thisConfig.layers[i];
                        let layerImgURL = window.getProperty(thisLayer,'marker.imgURL') || '';
                        if (layerImgURL != '') {
                            // Custom Marker URL
                            markers.push(
                                {
                                    imgURL: this.sitePrefix+'/servlet/servlet.ImageServer?id='+layerImgURL+'&oid='+this.orgId,
                                    label: this.setting.options.config.layers[i].name,
                                    type: ''
                                }
                            );
                        } else {
                            // Standard Marker URL
                            markers.push(
                                {
                                    imgURL: this.svg(this.setting.options.config.layers[i].marker.type , this.setting.options.config.layers[i].marker.color ),
                                    label: this.setting.options.config.layers[i].name,
                                    type: this.setting.options.config.layers[i].marker.type
                                }
                            );                       
                        }
                    }
                }
                return markers;
            }
        },
        methods: {
            copy: function(event) {
                this.showActionMenu = false;
                var input = document.createElement('input');
                input.value = this.getVFCode();
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            },
            getVFCode: function() {
                return '<apex:page standardController="' + this.setting.record.sma__Object__c + '" showHeader="false" sidebar="false"><style>html, body {height: 100%;width: 100%;}.ma-iframe-wrapper {width: 100%;height: 100%;}.ma-iframe-wrapper > iframe {width: 100%;height: 100%;}</style><div class="ma-iframe-wrapper"><iframe src="{!$Page.sma__MAMiniMapLightning}?rid={!$CurrentPage.parameters.id}&mmid=' + this.setting.record.Id + '"></iframe></div></apex:page>';
            },
            editSetting: function() {
                this.showActionMenu = false;
                bus.$emit('show-setting-modal', this.setting);
            },
            deleteSetting: function() {
                this.showActionMenu = false;
                this.showDeleteModal = true;
            },
            isCustomMarker: function(layer) {
                // Check if layer contains custom marker
                if (this.setting.options.config) {
                    return true;
                } else {
                    return false;
                }
            }           
        }
    };
</script>

<style>
    .slds-notify_container {
        z-index: 1 !important;
    }

    .slds-scope h3.slds-is-open .slds-section__title-action-icon {
        transform: rotate(0);
        transform-origin: 45%
    }

    .slds-scope .slds-section__content {
        padding-top: .75rem;
        visibility: visible;
        opacity: 1;
        height: auto;
        max-height: 0;
        overflow: hidden;
        transition: max-height .2s ease-out;
        padding: 0 !important;
    }

    .ma-icon-add {
        top: 2px;
        left: -3px;
        position: relative;
    }
</style>