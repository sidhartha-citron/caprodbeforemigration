<template>
    <div class="slds-form-element__row slds-grid_vertical-align-center">
        <div class="slds-form-element slds-size--1-of-4">
        <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_Field }}</label>
            <div class="slds-form-element__control">
                <ma-select
                    :options="filterFields"
                    :inModal="true"
                    :isInvalid="$v.name.$error"
                    :selected.sync="name"
                    keyString="api"
                    @changed="onFieldChange"
                    valueString="label"
                ></ma-select>
                <div v-show="$v.$dirty && !$v.name.required" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
            </div>
        </div>

        <div class="slds-form-element slds-size--1-of-4">
            <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_OPERATOR }}</label>
            <div class="slds-form-element__control">
                <ma-select
                    :options="operators"
                    :inModal="true"
                    :isInvalid="$v.operator.$error"
                    :selected.sync="operator"
                ></ma-select>
                <div v-show="$v.$dirty && !$v.operator.required" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
            </div>
        </div>

        <div class="slds-form-element slds-size--1-of-3">
            <label class="slds-form-element__label"><abbr class="slds-required" title="required">*</abbr> {{ Labels.MA_Value }}</label>
            <ma-select
                v-if="type == 'picklist'"
                :options="picklistValues"
                :inModal="true"
                :isInvalid="$v.value.$error"
                :selected.sync="value"
                keyString="value"
                valueString="label"
            ></ma-select>

            <datepicker 
                v-if="type == 'datetime'"
                :value="value"
                :format="User.dateFormat"
                placeholder="- select a date -"
                :input-class="{'slds-input-invalid': $v.value.$error}"
                @input="setDateValue"
            ></datepicker>

            <ma-input
                v-else
                v-model="value"
                @input="$v.value.$touch"
                :isInvalid="$v.value.$error"
                :placeholder="Labels.MA_Enter_a_Value"
            ></ma-input>

            <div v-show="$v.$dirty && !$v.value.required" class="slds-form-element__error">{{ Labels.MA_This_Field_Is_Required }}</div>
        </div>

        <button @click="remove" class="slds-m-left_x-small slds-m-top_medium slds-button slds-button__icon slds-button__icon_large ma-icon ma-icon-close" title="Remove">
            <!-- <img :src="this.$store.state.data.baseUrl + '/img/close.svg'"> -->
            <span class="slds-assistive-text">{{ Labels.MA_Remove }}</span>
        </button>
    </div>
</template>

<script>    
    var validators = require('validators'),
        Vue = require('vue').default,
        bus = require('ma-lib/vue/bus'),
        _operators = {};

    _operators['email'] = _operators['string'] = [
        { key: 'equals', value: window.MASystem.Labels.MA_Equals },
        { key: 'not equal to', value: window.MASystem.Labels.MA_Not_Equal },
        { key: 'starts with', value: window.MASystem.Labels.MA_Starts_With },
        { key: 'contains', value: window.MASystem.Labels.MA_Contains },
        { key: 'does not contain', value: window.MASystem.Labels.MA_Does_Not_Contain }
    ];

    _operators['double'] = _operators['integer'] = _operators['currency'] = _operators['int'] = [
        { key: 'equals', value: window.MASystem.Labels.MA_Equals },
        { key: 'not equal to', value: window.MASystem.Labels.MA_Not_Equal },
        { key: 'greater than', value: window.MASystem.Labels.MA_Greater_Than },
        { key: 'greater than or equal to', value: window.MASystem.Labels.MA_Greater_Than_Equal },
        { key: 'less than', value: window.MASystem.Labels.MA_Less_Than },
        { key: 'less than or equal to', value: window.MASystem.Labels.MA_Less_Than_Equal }
    ];

    _operators['picklist'] = [
        { key: 'equals', value: window.MASystem.Labels.MA_Equals },
        { key: 'not equal to', value: window.MASystem.Labels.MA_Not_Equal }
    ];

    _operators['datetime'] = [
        { key: 'equals', value: window.MASystem.Labels.MA_Equals },
        { key: 'not equal to', value: window.MASystem.Labels.MA_Not_Equal },
        { key: 'greater than', value: window.MASystem.Labels.MA_Greater_Than },
        { key: 'less than', value: window.MASystem.Labels.MA_Less_Than },
    ];

    module.exports = {
        props: {
            filterFields: {
                type: Array,
                required: true
            },
            init: {
                type: Object,
                default: function() { return {} }
            }
        },
        data: function() {
            return {
                name: '',
                operator: '',
                value: '',
                type: '',
                User: window.MASystem.User,
                Labels: window.MASystem.Labels
            }
        },
        created: function() {
            Object.assign(this.$data, this.init);
        },
        computed: {
            activeFieldInfo: function() {
                if (!this.name) return '';

                return this.getActiveFieldInfo(this.name);
            },
            operators: function() {
                return _operators[this.type] || [];
            },
            picklistValues: function() {
                return this.activeFieldInfo.picklistValues || [];
            }
        },
        watch: {
            activeFieldInfo: function() {
                this.type = this.activeFieldInfo.type;
            }
        },
        validations: {
            name: {
                required: validators.required
            },
            operator: {
                required: validators.required
            },
            value: {
                required: validators.required
            }
        },
        methods: {
            onFieldChange: function() {
                this.operator = '';
                this.value = '';
                this.$v.$reset();
            },
            getActiveFieldInfo: function(name) {
                for (var idx in this.filterFields) {
                    if (this.filterFields[idx].api === name) {
                        return this.filterFields[idx].additional;
                    }
                }

                bus.$emit('set-error', 'Could not find an operator set to match the field you selected. Please select a different field or remove the filter.');
                return {};
            },
            remove: function() {
                this.$emit('remove', this);
            },
            setDateValue: function(date) {
                if (date) {
                    this.value = date.toISOString();
                }
            }
        }
    };
</script>

<style>
    .vdp-datepicker input {
        background-color: rgb(255, 255, 255);
        border: 1px solid rgb(221, 219, 218);
        border-radius: .25rem;
        width: 100%;
        transition: border .1s linear,background-color .1s linear;
        display: inline-block;
        padding: 0 1rem 0 .75rem;
        line-height: 1.875rem;
        min-height: calc(1.875rem + (1px * 2));
    }

    .vdp-datepicker input::placeholder {
        padding: 0;
        color: #16325c;
        opacity: 0.9;
    }

    .vdp-datepicker__calendar .cell.selected {
        background: #0070d2;
        color: #fff;
    }
</style>