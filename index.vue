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
  import es6p from 'es6-promise'

  const Promise = es6p.Promise;
  const ErrMsgCtor = Vue.extend(ErrMsg);

  export default {
    name: 'form-validator',

    data: function() {
      return {
        errors: {},           // field name => error message comp
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
        return Promise.all(_.keys(this.rules).map(name => this.validateField(name)));
      },

      /**
       * validate a single field and show error message if failed
       * @param name {String} field name
       * @return {Promise} resolve if passed, else reject
       */
      validateField: function(name) {
        let value = this.getFieldValue(name);

        let validations = _.entries(this.rules[name]).map(([methodName, args]) => {
          let method = methods[methodName];

          return new Promise((resolve, reject) => {
            if (methodName === 'remote') {
              method.call(this, value, name, args).then(({valid, message}) => {
                if (valid) resolve();
                else reject(new Error(message));
              });
            } else {
              if (method.call(this, value, args)) resolve();
              else reject(new Error(this.formatMsg(this.messages[name][methodName], args)));
            }
          });
        });

        return Promise.all(validations).then(() => {
          this._updateFieldStatus(name, true);
        }).catch(err => {
          this._updateFieldStatus(name, false, err.message);
          throw err;
        });
      },

      // form submit handler
      _onsubmit: function(e) {
        this.validateAllFields().then(() => {
          this.$emit('validform');
          this.submitHandler.call(null, this);
        }).catch(() => {
          this.$emit('invalidform', this.getErrorMsgMap());
          this.invalidHandler.call(null, this);
        });
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
        }
      },

      /**
       * focus the first invalid field after submit
       */
      _focusFirstInvalidField(firstInvalidName) {
        let field = this.getFieldEle(firstInvalidName);

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
