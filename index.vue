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
      // default submit handler when validation passed
      // will be called with this bind to the validator
      submitHandler: {
        type: Function,
        default: function (validator) {
          validator.getForm().submit();
        }
      },

      // default handler when validation failed: default do nothing
      invalidHandler: {
        type: Function,
        default: function (validator) {}
      },

      // error message css class
      errorMsgClass: {
        type: String,
        default: 'u-msg-error'
      },

      // error field css class: same as message by default
      errorFieldClass: {
        type: String,
        default: 'u-msg-error'
      },

      // valid field css class
      validFieldClass: {
        type: String,
        default: 'u-field-ok'
      },

      // if perform validation only on submit
      validateOnlyOnSubmit: {
        type: Boolean,
        default: false
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

    mounted: function() {
      this._setupRules();
    },

    methods: {
      // get the form element
      getForm() {
        return this.$refs.fm;
      },

      /**
       * get a form field element
       * @param name {String} field name
       * @return {Element}
       */
      getFieldEle(name) {
        return this.getForm()[name];
      },
      
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

      /**
       * get all current error messages
       * @return {Object} { [field name] => [error message] }
       */
      getErrorMsgMap: function() {
        let invalidErrors = _.pickBy(this.errors, function(err) {
          return !err.isValid();
        });

        return _.mapValues(invalidErrors, function(err) {
          return err.message;
        });
      },

      /**
       * manually show error messages
       * @param errors {Object} { [field name] => [error message] }
       * @return undefined
       */
      showErrors: function(errors) {
        _.forOwn(errors, (msg, name) => this.errors[name].show(msg));
      },

      /**
       * msg: 'abc{0}cde{1}', args: [3,4] => 'abc3cde4'
       */
      formatMsg: function(msg, args) {
        if (!_.isArray(args)) args = [args];
        return msg.replace(/\{(\d)\}/g, (match, i) => args[i]);
      },

      /**
       * validate all fields but not submit the form
       */
      validateAllFields() {
        _.keys(this.rules).forEach(name => this.validateField(name));
      },

      /**
       * validate a single field and show error message if failed
       * @param name {String} field name
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
              this._updateFieldStatus.bind(this));
          } else if (!methods[methodName].call(this, fieldValue, args)) {
            this._updateFieldStatus(
              name,
              false,
              this.formatMsg(this.messages[name][methodName], args)
            );
            return false; // stop on first failed rule
          } else {
            this._updateFieldStatus(name, true, '');
          }
        });
      },

      // form submit handler
      _onsubmit: function(e) {
        this.submitting = true;
        this.firstInvalidName = '';
        _.keys(this.rules).forEach(name => this.fieldValidateds[name] = false);
        this.validateAllFields();
      },

      // try to validate single field when value change or lose focus
      _tryValidate: function(evt) {
        if (this.validateOnlyOnSubmit) return;
        
        let name = evt.target.name;

        // no need to validate it
        if (!this.rules[name]) return;

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
      _updateFieldStatus: function(name, valid, msg) {
        let fieldEle = this.getFieldEle(name);
        let errCmp = this.errors[name];

        if (valid) {
          errCmp.hide();
          this._unhightlightField(fieldEle);
          this.$emit('validfield', name);
        } else {
          errCmp.show(msg);
          this._hightlightField(fieldEle);
          this.$emit('invalidfield', name, msg);

          if (!this.firstInvalidName && this.submitting) {
            this.firstInvalidName = name;
          }
        }

        // we click submit, check that all fields are validated
        // and submit the form if all fields are valid or cancel
        // if any field is invalid
        if (this.submitting) {
          this.fieldValidateds[name] = true;

          if (_.every(_.values(this.fieldValidateds), Boolean)) {
            this.submitting = false;

            if (this.firstInvalidName) {
              this._focusFirstInvalidField();
              this.$emit('invalidform', this.getErrorMsgMap());
              this.invalidHandler.call(null, this);
            } else {
              this.$emit('validform');
              this.submitHandler.call(null, this);
            }
          }
        }
      },

      /**
       * focus the first invalid field after submit
       */
      _focusFirstInvalidField() {
        let field = this.getFieldEle(this.firstInvalidName);

        if (!(field instanceof Element)) {
          field = field[0];
        }

        if (field.focus) {
          field.focus();
        }
      },

      /**
       * setup all rules
       */
      _setupRules: function() {
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
    }
  };
</script>
