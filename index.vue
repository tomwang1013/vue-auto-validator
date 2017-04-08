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
        firstInvalidName: ''
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
        var fm = this.$refs.fm;
        var me = this;

        this.firstInvalidName = '';
        _.forOwn(this.rules, function(rule, name) {
          me.validateField(rule, name);
        });

        if (this.firstInvalidName) {
          evt.preventDefault();

          if (this.getProp('focusInvalidOnSubmit')) {
            fm[this.firstInvalidName].focus();
          }

          this.getProp('invalidHandler').call(this, evt, fm);
          this.$emit('invalidform', this.errorMsgMap());

          return;
        }

        this.getProp('submitHandler').call(this, evt, fm);

        // follow default submit
      },

      tryValidate: function(evt) {
        var name  = evt.target.name;

        // no need to validate it
        if (!this.rules[name]) return;

        // all fields are valid, validate it on submit
        if (!this.firstInvalidName) return;

        this.validateField(this.rules[name], name);
      },

      validateField: function(rule, name) {
        var fm = this.$refs.fm;
        var errCmp = this.errors[name];
        var me = this;
        var valid = true;
        var msg = '';

        // boolean rule, rule is methodName, like:
        // name: 'required'
        if (_.isString(rule)) {
          if (!methods[rule](fm[name])) {
            valid = false;
            msg = me.messages[name];
          }
        } else {
          _.forOwn(rule, function(args, methodName) {
            if (!methods[methodName](fm[name], args)) {
              valid = false;
              msg = me.formatMsg(me.messages[name][methodName], args);

              // stop on first failed rule
              return false;
            }
          });
        }

        if (valid) {
          errCmp.hide();
          me.getProp('unhighlight').call(me, fm[name]);
        } else {
          errCmp.show(msg);
          me.getProp('highlight').call(me, fm[name]);

          if (!me.firstInvalidName) {
            me.firstInvalidName = name;
          }

          me.$emit('invalidfield', name, errCmp.message);
        }

        return valid;
      }
    },

    mounted: function() {
      var fm = this.$refs.fm;
      var me = this;

      _.forOwn(this.rules, function(rule, name) {
        var field = fm[name];
        var label = fm.querySelector("label[for='" + field.id + "']");
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
  };
</script>
