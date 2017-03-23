<template>
  <form @submit='onsubmit' @focusout='onfocusout' @change='onchange' @input='oninput' ref='fm'>
    <slot>all fields here</slot>
  </form>
</template>

<script>
  var _ = require('lodash');
  var Vue = require('vue');
  var methods = require('./lib/validate_methods.js');
  var ErrMsg = require('./lib/validate_methods.js');

  module.exports = {
    name: 'form-validator',

    data: function() {
      return {
        errors: {}
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

      errorClass: {
        type: String,
        default: 'o-error-field'
      },

      validClass: {
        type: String,
        default: 'o-valid-field'
      },

      // where to place the error message: before, after
      errorPlacement: {
        type: String,
        default: 'after'
      },

      // let user control the error display totally
      showErrors: {
        type: Function
      }
    },

    methods: {
      onsubmit: function(evt) {
        var fm = this.$refs.fm;
        var me = this;
        var lastInvalidName = '';

        _.forOwn(this.rules, function(rule, name) {
          _forOwn(rule, function(methodName, args) {
            if (methods[methodName].apply(fm[name], args)) {
              me.errors[name].hide();
            } else {
              me.errors[name].show(me.messages[name][methodName]);
              lastInvalidName = name;
            }
          });
        })

        if (lastInvalidName) {
          fm[lastInvalidName].focus();
          e.preventDefault();
          return;
        }

        if (this.submitHandler) {
          this.submitHandler(fm);
          e.preventDefault();
          return;
        }

        fm.submit();
      },

      onfocusout: function(evt) {
      },

      onchange: function(evt) {
      },

      oninput: function(evt) {
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
            return h(ErrMsg, { props: { errorClass: me.errorClass } });
          }
        });
      });
    }
  };
</script>

<style lang='sass'>
</style>
