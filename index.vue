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

  module.exports = {
    name: 'form-validator',

    data: function() {
      return {
        errors: {},
        firstInvalidName: ''
      };
    },

    props: {
      // form submitter to replace the default submit
      submitHandler: {
        type: Function
      },

      // callback when the form validation failed
      invalidHandler: {
        type: Function
      },

      // validation rules
      rules: {
        type: Object,
      },

      // messages when validation failed
      messages: {
        type: Object,
      },

      // class added to error message & invalid field
      errorClass: {
        type: String,
        default: 'u-input-error'
      },

      // class added to valid field(error message is hidden by default)
      validFieldClass: {
        type: String,
        default: 'u-input-ok'
      },

      // where to place the error message: before, after
      errorPlacement: {
        type: String,
        default: 'after'
      },

      // highlight invalid field
      highlight: {
        type: Function,
        default: function(field) {
          field.classList.add(this.errorClass);
        }
      },

      // unhighlight valid field
      unhighlight: {
        type: Function,
        default: function(field) {
          field.classList.remove(this.errorClass);
          field.classList.add(this.validFieldClass);
        }
      }
    },

    methods: {
      onsubmit: function(evt) {
        var fm = this.$refs.fm;
        var me = this;

        this.firstInvalidName = '';
        _.forOwn(this.rules, this.validateField.bind(this));

        if (this.firstInvalidName) {
          fm[this.firstInvalidName].focus();
          evt.preventDefault();

          if (this.invalidHandler) {
            this.invalidHandler(fm);
          }

          return;
        }

        if (this.submitHandler) {
          this.submitHandler(fm);
          evt.preventDefault();
          return;
        }

        // follow default submit
      },

      tryValidate: function(evt) {
        var name  = evt.target.name;

        // no need to validate it
        if (!this.rules[name]) return;

        // all fields are valid, validate it on submit
        if (!this.firstInvalidName) return;

        // focus it if invalid
        if (!this.validateField(this.rules[name], name)) {
          evt.target.focus();
        }
      },

      validateField: function(rule, name) {
        var fm = this.$refs.fm;
        var errCmp = this.errors[name];
        var me = this;
        var valid = true;

        _.forOwn(rule, function(args, methodName) {
          if (!_.isArray(args)) {
            args = [args];
          }

          if (methods[methodName].apply(fm[name], args)) {
            return;
          }

          valid = false;
          errCmp.show(me.messages[name][methodName]);
          me.highlight(fm[name]);

          if (!me.firstInvalidName) {
            me.firstInvalidName = name;
          }
        });

        if (valid) {
          errCmp.hide();
          me.unhighlight(fm[name]);
        }

        return valid;
      }
    },

    mounted: function() {
      var fm = this.$refs.fm;
      var me = this;

      _.forOwn(this.rules, function(rule, name) {
        var field = fm[name];
        var mp = window.document.createElement('span');

        if (me.errorPlacement == 'after') {
          field.parentNode.appendChild(mp);
        } else {
          field.parentNode.insertBefore(mp, field);
        }

        me.errors[name] = new Vue({
          el: mp,
          render: function(h) {
            return h(ErrMsg, {
              props: {
                name: name,
                errorClass: me.errorClass
              }
            });
          }
        }).$children[0];
      });
    }
  };
</script>

<style lang='sass'>
  .u-input-error {
    color: #f00;
  }

  .u-input-ok {
    border-color: #0f0;
  }
</style>
