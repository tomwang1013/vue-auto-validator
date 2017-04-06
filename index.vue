<template>
  <form @submit='onsubmit' @focusout='onfocusout' @change='onchange' @input='oninput' ref='fm'>
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
        default: 'u-input-error'
      },

      validClass: {
        type: String,
        default: 'o-input-ok'
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
        evt.preventDefault();
        var fm = this.$refs.fm;
        var me = this;
        var lastInvalidName = '';

        _.forOwn(this.rules, function(rule, name) {
          _.forOwn(rule, function(args, methodName) {
            if (!_.isArray(args)) {
              args = [args];
            }

            var errCmp = me.errors[name].$children[0];

            if (methods[methodName].apply(fm[name], args)) {
              errCmp.hide();
            } else {
              errCmp.show(me.messages[name][methodName]);
              lastInvalidName = name;
            }
          });
        })

        if (lastInvalidName) {
          fm[lastInvalidName].focus();
          evt.preventDefault();
          return;
        }

        if (this.submitHandler) {
          this.submitHandler(fm);
          evt.preventDefault();
          return;
        }

        // follow default submit
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
