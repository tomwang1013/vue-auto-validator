<template>
  <span v-show='isShow' :class='errorClass'>{{message}}</span>
</template>

<script>
  module.exports = {
    name: 'fm-validation-error-msg',

    data: function() {
      return {
        isShow: false,
        message: ''
      }
    },

    props: {
      name: {
        type: String,
        required: true
      },

      errorClass: {
        type: String,
        required: true
      }
    },

    methods: {
      hide: function() {
        this.isShow = false;
      },

      show: function(message) {
        this.message = message;
        this.isShow = true;
      },

      isValid: function() {
        return !this.isShow;
      }
    }
  };
</script>
