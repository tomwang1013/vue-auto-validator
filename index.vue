<template>
  <form @submit.prevent='onsubmit'
    @focusout='tryValidate'
    @change='tryValidate'
    @input='tryValidate' ref='fm'>
    <slot>all fields here</slot>
  </form>
</template>

<script>
  import Vue from 'vue'
  import _ from 'lodash'
  import ErrMsg from './lib/error_message.vue'
  import methods from './lib/validate_methods.js'
  import defaultProps from './lib/default_props.js'

  const ErrMsgCtor = Vue.extend(ErrMsg);

  export default {
    name: 'form-validator',

    data: function() {
      return {
        errors: {},           // field name => error message comp
        firstInvalidName: '', // first invalid field name

        fieldValidateds: {},
        submitting: false     // if it is submitting the form, i.e. validating
      };
    },

    props: {
      submitHandler: {
        type: Function,
        default: defaultProps.submitHandler
      },

      invalidHandler: {
        type: Function,
        default: defaultProps.invalidHandler
      },

      errorMsgClass: {
        type: String,
        default: defaultProps.errorMsgClass
      },

      errorFieldClass: {
        type: String,
        default: defaultProps.errorFieldClass
      },

      validFieldClass: {
        type: String,
        default: defaultProps.validFieldClass
      },

      errorPlacement: {
        type: String,
        default: defaultProps.errorPlacement
      },

      // validation rules
      rules: {
        type: Object,
        required: true
      },

      // messages when validation failed
      messages: {
        type: Object,
        required: true
      },
    },

    methods: {
      // { field name => error message }
      errorMsgMap: function() {
        let invalidErrors = _.pickBy(this.errors, function(err) {
          return !err.isValid();
        });

        return _.mapValues(invalidErrors, function(err) {
          return err.message;
        });
      },

      // manually set error messages
      showErrors: function(errors) {
        _.forOwn(errors, (msg, name) => this.errors[name].show(msg));
      },

      // msg: 'abc{0}cde{1}', args: [3,4] => 'abc3cde4'
      formatMsg: function(msg, args) {
        if (!_.isArray(args)) args = [args];
        return msg.replace(/\{(\d)\}/g, (match, i) => args[i]);
      },

      onsubmit: function(evt) {
        this.submitting = true;
        this.firstInvalidName = '';

        _.forOwn(this.rules, (rule, name) => {
          this.fieldValidateds[name] = false;
          this.validateField(rule, name);
        });
      },

      tryValidate: function(evt) {
        let name  = evt.target.name;

        // no need to validate it
        if (!this.rules[name]) return;

        // all fields are valid, validate it on submit
        if (!this.firstInvalidName) return;

        this.validateField(this.rules[name], name);
      },

      /**
       * update field state according to the validation result
       * @param name  {String}  field name
       * @param valid {Boolean} if it is valid
       * @param msg   {String}  error message if invalid
       */
      updateFieldStatus: function(name, valid, msg) {
        let fm = this.$refs.fm;
        let errCmp = this.errors[name];

        if (valid) {
          errCmp.hide();
          fm[name].classList.remove(this.errorFieldClass);
          fm[name].classList.add(this.validFieldClass);
        } else {
          errCmp.show(msg);
          fm[name].classList.add(this.errorFieldClass);
          
          if (!this.firstInvalidName) this.firstInvalidName = name;
          
          this.$emit('invalidfield', name, msg);
        }

        // we click submit, check that all fields are validated
        // and submit the form if all fields are valid or cancel
        // if any field is invalid
        if (this.submitting) {
          this.fieldValidateds[name] = true;

          if (_.every(_.values(this.fieldValidateds), Boolean)) {
            this.submitting = false;

            if (this.firstInvalidName) {
              fm[this.firstInvalidName].focus();
              this.invalidHandler.call(this, fm);
              this.$emit('invalidform', this.errorMsgMap());
            } else {
              this.submitHandler.call(this, fm);
            }
          }
        }
      },

      validateField: function(rule, name) {
        let fm = this.$refs.fm;

        // boolean rule, rule is methodName, like: name: 'required'
        if (_.isString(rule)) {
          this.updateFieldStatus(name, methods[rule].call(this, fm[name]), this.messages[name]);
          return;
        }

        _.forOwn(rule, (args, methodName) => {
          if (methodName === 'remote') {
            methods[methodName].call(this, fm[name], args, this.updateFieldStatus.bind(this));
          } else if (!methods[methodName].call(this, fm[name], args)) {
            this.updateFieldStatus(name, false, this.formatMsg(this.messages[name][methodName], args));
            return false; // stop on first failed rule
          } else {
            this.updateFieldStatus(name, true);
          }
        });
      },

      setupRules: function() {
        let fm = this.$refs.fm;

        _.forOwn(this.rules, (rule, name) => {
          let field = fm[name];
          let label = fm.querySelector("label[for='" + (field.id || field.name) + "']");

          this.errors[name] = new ErrMsgCtor({
            propsData: {
              name: name,
              errorClass: this.errorMsgClass
            }
          }).$mount();

          switch (this.errorPlacement) {
            case 'before-label':
              label.parentNode.insertBefore(this.errors[name].$el, label);
              break;
            case 'after-label':
              label.parentNode.insertBefore(this.errors[name].$el, label.nextElementSibling);
              break;
            case 'before-field':
              field.parentNode.insertBefore(this.errors[name].$el, field);
              break;
            case 'after-field':
              field.parentNode.insertBefore(this.errors[name].$el, field.nextElementSibling);
              break;
            default:
              console.error('invalid errorPlacement: ' + this.errorPlacement);
          }
        })
      }
    },

    mounted: function() {
      this.setupRules();
    }
  };
</script>
