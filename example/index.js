import Vue from 'vue'
import Validator from '../index.vue'

Vue.component('validator', Validator);
new Vue({
  el: '#app',
  data: {
    rules: {
      email: {
        required: true,
        email: true
      },
      password: 'required'
    },

    messages: {
      email: {
        required: 'email is required!',
        email: 'invalid email format'
      },
      password: 'password is required'
    },

    errorPlacement: 'after-field'
  }
});