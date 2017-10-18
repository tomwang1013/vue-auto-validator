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

    addValidationMethod(methodName, fn) {
      methods.addValidationMethod(methodName, fn);
    },

    setDefaultProps: function(options) {
      defaultProps.setDefaultProps(options);
    },

    methods: {
      /**
       * get form field's value
       * @param name {String} field name
       * @return {String|[String]} element's value
       */
      getFieldValue(name) {
        let field = this.getFieldEle(name);

        if (field instanceof Element) {
          return field.value;
        }

        // radio or checkbox
        if (field instanceof RadioNodeList) {
          let values = _.filter(field, f => f.checked).map(f => f.value);

          if (values.length === 1) return values[0];
          else if (values.length > 1) return values;
          else return ''
        }

        return '';
      },

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
       * @param name {String} field name
       * @return {Element}
       */ 
      getFieldEle(name) {
        return this.getForm()[name];
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

        _.keys(this.rules).forEach(name => this.fieldValidateds[name] = false);
        _.keys(this.rules).forEach(name => this.validateField(name));
      },

      // try to validate single field when value change or lose focus
      _tryValidate: function(evt) {
        let name  = evt.target.name;

        // no need to validate it
        if (!this.rules[name]) return;

        // all fields are valid, validate it on submit
        if (!this.firstInvalidName) return;

        this.validateField(name);
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
       * @param name  {String}  field name
       * @param valid {Boolean} if it is valid
       * @param msg   {String}  error message if invalid
       */
      updateFieldStatus: function(name, valid, msg) {
        let fieldEle = this.getFieldEle(name);
        let errCmp = this.errors[name];

        if (valid) {
          errCmp.hide();
          this._unhightlightField(fieldEle);
          this.$emit('validfield', name);
        } else {
          errCmp.show(msg);
          this._hightlightField(fieldEle);
          
          if (!this.firstInvalidName) {
            this.firstInvalidName = name;
          }
          
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
       * @param name
       */
      validateField: function(name) {
        let fieldValue = this.getFieldValue(name);

        _.forOwn(this.rules[name], (args, methodName) => {
          if (methodName === 'remote') {
            methods[methodName].call(
              this,
              fieldValue,
              name,
              args, // url
              this.updateFieldStatus.bind(this));
          } else if (!methods[methodName].call(this, fieldValue, args)) {
            this.updateFieldStatus(
              name, 
              false, 
              this.formatMsg(this.messages[name][methodName], args)
            );
            return false; // stop on first failed rule
          } else {
            this.updateFieldStatus(name, true, '');
          }
        });
      },

      /**
       * setup all rules
       */
      setupRules: function() {
        _.forOwn(this.rules, (rule, name) => {
          this.errors[name] = new ErrMsgCtor({
            propsData: {
              name: name,
              errorClass: this.errorMsgClass
            }
          }).$mount();

          let errRoot = this.errors[name].$el;
          let field = this.getFieldEle(name);

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
