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
      password: {
        required: true
      },
      gender: {
        required: true
      },
      choice: {
        required: true
      },
      has_kids: {
        required: true
      }
    },

    messages: {
      email: {
        required: 'email is required!',
        email: 'invalid email format'
      },
      password: {
        required: 'password is required'
      },
      gender: {
        required: 'gender is required!'
      },
      choice: {
        required: 'choice is required!'
      },
      has_kids: {
        required: 'has_kids is required!'
      }
    },

    errorPlacement: 'after-field'
  }
});