<template>
  <form @submit='onsubmit'
    @focusout='tryValidate'
    @change='tryValidate'
    @input='tryValidate' ref='fm'>
    <slot>all fields here</slot>
  </form>
</template>

<script>
  var _ = require('lodash');
  var Vue = require('vue');

  var methods = require('./lib/validate_methods.js');
  var ErrMsg = require('./lib/error_message.vue');
  var defaultProps = require('./lib/default_props.js');

  module.exports = {
    name: 'form-validator',

    data: function() {
      return {
        errors: {},
        firstInvalidName: '',
        fieldValidateds: {},
        submitting: false
      };
    },

    setDefaultProps: function(options) {
      _.assign(defaultProps, options);
    },

    addValidationMethod: function(methodName, fn) {
      methods[methodName] = fn;
    },

    props: {
      // form submitter to replace the default submit
      submitHandler: {
        type: Function,
      },

      // callback when the form validation failed
      invalidHandler: {
        type: Function,
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

      // class added to error message & invalid field
      errorClass: {
        type: String,
      },

      // class added to valid field(error message is hidden by default)
      validFieldClass: {
        type: String,
      },

      // where to place the error message: before_label, after_label
      // before_field, after_field
      errorPlacement: {
        type: String,
      },

      // highlight invalid field
      highlight: {
        type: Function,
      },

      // unhighlight valid field
      unhighlight: {
        type: Function,
      },

      // focus the first invalid field on submit
      focusInvalidOnSubmit: {
        type: Boolean,
      },

      setupRulesOnMounted: {
        type: Boolean,
        default: true
      }
    },

    methods: {
      getProp: function(propName) {
        if (this[propName] !== undefined) return this[propName];
        else return defaultProps[propName];
      },

      errorMsgMap: function() {
        var invalidErrors = _.pickBy(this.errors, function(err) {
          return !err.isValid();
        });

        return _.mapValues(invalidErrors, function(err) {
          return err.message;
        });
      },

      // manually set error messages
      showErrors: function(errors) {
        var me = this;

        _.forOwn(errors, function(msg, name) {
          me.errors[name].show(msg);
        });
      },

      // msg: 'abc{0}cde{1}', args: [3,4] => 'abc3cde4'
      formatMsg: function(msg, args) {
        var pat = new RegExp(/{[0-9]}/g);
        var result = '';
        var oldLastIndex = 0;
        var match;

        while ((match = pat.exec(msg)) != null) {
          result += msg.slice(oldLastIndex, match.index);
          result += _.isArray(args) ? args[parseInt(match[0][1])] : args;
          oldLastIndex = pat.lastIndex;
        }

        result += msg.slice(oldLastIndex);

        return result;
      },

      onsubmit: function(evt) {
        var me = this;

        this.submitting = true;
        this.firstInvalidName = '';

        evt.preventDefault();

        _.forOwn(this.rules, function(rule, name) {
          me.fieldValidateds[name] = false;
          me.validateField(rule, name);
        });

      },

      tryValidate: function(evt) {
        var name  = evt.target.name;

        // no need to validate it
        if (!this.rules[name]) return;

        // all fields are valid, validate it on submit
        if (!this.firstInvalidName) return;

        this.validateField(this.rules[name], name);
      },

      updateErrorMsg: function(name, valid, msg) {
        var fm = this.$refs.fm;
        var errCmp = this.errors[name];

        if (valid) {
          errCmp.hide();
          this.getProp('unhighlight')(this, fm[name]);
        } else {
          errCmp.show(msg);
          this.getProp('highlight')(this, fm[name]);

          if (!this.firstInvalidName) {
            this.firstInvalidName = name;
          }

          this.$emit('invalidfield', name, msg);
        }

        if (this.submitting) {
          this.fieldValidateds[name] = true;

          if (_.every(_.values(this.fieldValidateds), Boolean)) {
            // every field validated, submitting over
            this.submitting = false;

            if (this.firstInvalidName) {
              if (this.getProp('focusInvalidOnSubmit')) {
                fm[this.firstInvalidName].focus();
              }

              this.getProp('invalidHandler')(this, fm);
              this.$emit('invalidform', this.errorMsgMap());
            } else {
              this.getProp('submitHandler')(this, fm);
            }
          }
        }
      },

      validateField: function(rule, name) {
        var fm = this.$refs.fm;
        var me = this;
        var valid = true;

        // boolean rule, rule is methodName, like: name: 'required'
        if (_.isString(rule)) {
          this.updateErrorMsg(name, methods[rule].call(this, fm[name]), me.messages[name]);
          return;
        }

        _.forOwn(rule, function(args, methodName) {
          if (methodName == 'remote') {
            methods[methodName].call(me, fm[name], args, me.updateErrorMsg.bind(me));
            return;
          }

          if (!methods[methodName].call(me, fm[name], args)) {
            msg = me.formatMsg(me.messages[name][methodName], args);
            me.updateErrorMsg(name, false, msg);

            // stop on first failed rule
            return false;
          } else {
            me.updateErrorMsg(name, true);
          }
        });
      },

      setupRules: function() {
        var fm = this.$refs.fm;
        var me = this;

        _.forOwn(this.rules, function(rule, name) {
          var field = fm[name];
          var label = fm.querySelector("label[for='" + (field.id || field.name) + "']");
          var mp = window.document.createElement('span');

          switch (me.getProp('errorPlacement')) {
            case 'before_label':
              label.parentNode.insertBefore(mp, label);
              break;
            case 'after_label':
              label.parentNode.insertBefore(mp, label.nextElementSibling);
              break;
            case 'before_field':
              field.parentNode.insertBefore(mp, field);
              break;
            case 'after_field':
              field.parentNode.insertBefore(mp, field.nextElementSibling);
              break;
            default:
              console.error('invalid errorPlacement: ' + me.getProp('errorPlacement'));
          }

          me.errors[name] = new Vue({
            el: mp,
            render: function(h) {
              return h(ErrMsg, {
                props: {
                  name: name,
                  errorClass: me.getProp('errorClass')
                }
              });
            }
          }).$children[0];
        });
      }
    },

    mounted: function() {
      if (this.setupRulesOnMounted) {
        this.setupRules();
      }
    }
  };
</script>
