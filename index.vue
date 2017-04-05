<template>
</template>

<script>
  var ErrMsg = {
    template: "<span v-show='isShow' :class='errorClass'>{{message}}</span>",
    data: function() {
      return {
        isShow: false,
        message: ''
      }
    },
    props: {
      errorClass: {
        type: String,
        required: true
      }
    }
  };

  module.exports = {
    name: 'form-validator',

    data: function() {
      return {
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

    computed: {
    },

    methods: {
    },

    mounted: function() {
    }
  };
</script>

<style lang='sass'>
</style>
