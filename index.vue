<template>
  <form @submit.prevent='_onsubmit'
    @focusout='_tryValidate'
    @change='_tryValidate'
    @input='_tryValidate' ref='fm'>
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
        firstInvalidName: '', // first invalid field name on submit
        fieldValidateds: {},  // record the fields which are already validated on submit
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
      // { field name => [error message] }
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

      // get the form element
      getForm() {
        return this.$refs.fm;
      },
      
      /**
       * get a form field element
       * 
       * @param fieldName {String} field name
       * @return {Element}
       */ 
      getFieldEle(fieldName) {
        return this.getForm()[fieldName];
      },

      // msg: 'abc{0}cde{1}', args: [3,4] => 'abc3cde4'
      formatMsg: function(msg, args) {
        if (!_.isArray(args)) args = [args];
        return msg.replace(/\{(\d)\}/g, (match, i) => args[i]);
      },

      // form submit handler
      _onsubmit: function(e) {
        this.submitting = true;
        this.firstInvalidName = '';

        _.keys(this.rules).forEach(fieldName => this.fieldValidateds[fieldName] = false);
        _.keys(this.rules).forEach(fieldName => this.validateField(fieldName));
      },

      // try to validate single field when value change or lose focus
      _tryValidate: function(evt) {
        let fieldName  = evt.target.name;

        // no need to validate it
        if (!this.rules[fieldName]) return;

        // all fields are valid, validate it on submit
        if (!this.firstInvalidName) return;

        this.validateField(fieldName);
      },

      /**
       * highlight invalid field
       */
      _hightlightField(field) {
        if (field instanceof Element) {
          field = [field];
        }

        _.forEach(field, f => {
          f.classList.remove(this.validFieldClass);
          f.classList.add(this.errorFieldClass);
        })
      },

      /**
       * unhighlight invalid field
       */
      _unhightlightField(field) {
        if (field instanceof Element) {
          field = [field];
        }

        _.forEach(field, f => {
          f.classList.remove(this.errorFieldClass);
          f.classList.add(this.validFieldClass);
        })
      },

      /**
       * update field state according to the validation result
       * @param fieldName {String}  field name
       * @param valid     {Boolean} if it is valid
       * @param msg       {String}  error message if invalid
       */
      updateFieldStatus: function(fieldName, valid, msg) {
        let fieldEle = this.getFieldEle(fieldName);
        let errCmp = this.errors[fieldName];

        if (valid) {
          errCmp.hide();
          this._unhightlightField(fieldEle);
          this.$emit('validfield', fieldName);
        } else {
          errCmp.show(msg);
          this._hightlightField(fieldEle);
          
          if (!this.firstInvalidName) {
            this.firstInvalidName = fieldName;
          }
          
          this.$emit('invalidfield', fieldName, msg);
        }

        // we click submit, check that all fields are validated
        // and submit the form if all fields are valid or cancel
        // if any field is invalid
        if (this.submitting) {
          this.fieldValidateds[fieldName] = true;

          if (_.every(_.values(this.fieldValidateds), Boolean)) {
            this.submitting = false;

            if (this.firstInvalidName) {
              this.getFieldEle([this.firstInvalidName]).focus();
              this.invalidHandler.call(null, this);
              this.$emit('invalidform', this.errorMsgMap());
            } else {
              this.$emit('validform');
              this.submitHandler.call(null, this);
            }
          }
        }
      },

      /**
       * validate a single field and show error message if failed
       * @param fieldName
       */
      validateField: function(fieldName) {
        let fieldEle = this.getFieldEle(fieldName);

        _.forOwn(this.rules[fieldName], (args, methodName) => {
          if (methodName === 'remote') {
            methods[methodName].call(this, fieldEle, args, this.updateFieldStatus.bind(this));
          } else if (!methods[methodName].call(this, fieldEle, args)) {
            this.updateFieldStatus(
              fieldName, 
              false, 
              this.formatMsg(this.messages[fieldName][methodName], args)
            );
            return false; // stop on first failed rule
          } else {
            this.updateFieldStatus(fieldName, true, '');
          }
        });
      },

      /**
       * setup all rules
       */
      setupRules: function() {
        _.forOwn(this.rules, (rule, fieldName) => {
          this.errors[fieldName] = new ErrMsgCtor({
            propsData: {
              name: fieldName,
              errorClass: this.errorMsgClass
            }
          }).$mount();

          let errRoot = this.errors[fieldName].$el;
          let field = this.getFieldEle(fieldName);

          // put the error message after both of label(if any) & field
          if (!(field instanceof Element)) {
            field = _.last(field);
          }

          if (field.nextElementSibling && field.nextElementSibling.htmlFor === field.id) {
            // label after field
            field.parentNode.insertBefore(errRoot, field.nextElementSibling.nextElementSibling);
          } else if (field.previousElementSibling && field.previousElementSibling.htmlFor === field.id) {
            // label before field
            field.parentNode.insertBefore(errRoot, field.nextElementSibling);
          } else if (field.parentNode.htmlFor === field.id) {
            // label wraps field
            let label = field.parentNode;
            label.parentNode.insertBefore(errRoot, label.nextElementSibling);
          } else {
            // no label
            field.parentNode.insertBefore(errRoot, field.nextElementSibling);
          }
        })
      }
    },

    mounted: function() {
      this.setupRules();
    }
  };
</script>
