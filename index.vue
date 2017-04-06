<template>
  <form @submit='onsubmit'
    @focusout='onfocusout'
    @change='onchange'
    @input='oninput' ref='fm'>
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
        default: 'o-input-ok'
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
        }
      },

      // unhighlight valid field
      unhighlight: {
        type: Function,
        default: function(field) {
        }
      }
    },

    methods: {
      onsubmit: function(evt) {
        var fm = this.$refs.fm;
        var me = this;
          evt.preventDefault();

        this.validate();

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

      onfocusout: function(evt) {
      },

      onchange: function(evt) {
      },

      oninput: function(evt) {
      },

      validate: function() {
        var fm = this.$refs.fm;
        var me = this;

        this.firstInvalidName = '';

        _.forOwn(this.rules, function(rule, name) {
          _.forOwn(rule, function(args, methodName) {
            if (!_.isArray(args)) {
              args = [args];
            }

            var errCmp = me.errors[name];

            if (methods[methodName].apply(fm[name], args)) {
              errCmp.hide();
              me.highlight(fm[name]);
            } else {
              errCmp.show(me.messages[name][methodName]);
              me.unhighlight(fm[name]);

              if (!me.firstInvalidName) {
                me.firstInvalidName = name;
              }
            }
          });
        });

        return this.firstInvalidName != '';
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
</style>
