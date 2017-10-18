import Vue from 'vue'
import Validator from '../index.vue'

Validator.addValidationMethod('between', (value, [min, max]) => {
  value = parseInt(value);

  return min <= value && value <= max;
});

Vue.component('validator', Validator);
new Vue({
  el: '#app',
  data: {
    rules: {
      email: {
        required: true,
        email: true,
        remote: 'remote_url'
      },
      password: {
        required: true,
        minLength: 3,
        maxLength: 6
      },
      passwordConfirm: {
        equalTo: 'password'
      },
      gender: {
        required: true
      },
      age: {
        /*min: 18,
        max: 100*/
        between: [18, 100]
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
        email: 'invalid email format',
        remote: 'ajax validation failed'
      },
      password: {
        required: 'password is required',
        minLength: 'password min length: {0}',
        maxLength: 'password max length: {0}'
      },
      passwordConfirm: {
        equalTo: 'must be equal to password'
      },
      gender: {
        required: 'gender is required!'
      },
      age: {
        /*min: 'age must be greater or equal to {0}',
        max: 'age must be less or equal to {0}'*/
        between: 'age must be in [{0}, {1}]'
      },
      choice: {
        required: 'choice is required!'
      },
      has_kids: {
        required: 'has_kids is required!'
      }
    }
  }
});