# introduction
vue-auto-validator is a flexible and simple vue component for form validation, which is heavy inpired 
by [jquery-validation](https://jqueryvalidation.org/). It provides some pre-defined validation methods 
and you can add custom ones. With these validation methods, you set up rules and related messages 
when validation fails

# get started

## install
`npm install vue-auto-validator --save`

## usage
javascript:
```javascript
import FormValidator from 'vue-auto-validator'
import Vue from 'vue'

new Vue({
  el: '#form-wrapper',

  data: {
    // validation rules
    rules: {
      name: 'required',
      email: {
        required: true,
        email: true
      }
    },

    // related error messages
    messages: {
      name: 'name should not be empty',
      email: {
        required: 'email should not be empty',
        email: 'invalid email'
      }
    }
  },

  components: { FormValidator }
});

```
For html, just use `form-validator` instead of `form`:
```html
<div id='form-wrapper'>
  <form-validator action='/path/to/url' v-bind='$data'>
    <div>
      <label for='name'/> name:
      <input type='text' name='name' id='name'/>
    </div>
    <div>
      <label for='email'/> email:
      <input type='text' name='email' id='email'/>
    </div>
    <div>
      <input type='submit' value='submit'/>
    </div>
  </form-validator>
</div>
```
That's all!

# component detail

## props

- **rules**

Set the rules for all the fields you need to validate. A rule defines applying which validation 
methods to a single field, the format is:
```
{
  'field-name1: {
    'method-name1': params1,
    'method-name2': params2,
    ...
  }
}
```
e.g.
```javascript
{
  password: {
    required: true,
    minLength: 6,
  }
}
```

- **messages**

Error messages when validation fail. The format structure is the same as `rules`:
```
'field-name1: {
    'method-name1': message1,
    'method-name2': message2,
    ...
  }
```
e.g.
```javascript
{
  password: {
    required: 'password is required',
    minLength: 'password length must be at least {0}' // {0} will be replaced by 6
  }
}
```

- **submitHandler**

The form's submit event handler, the default action is just submit the form. The function will take 
the validator vue instance as the only argument:

```javascript
function submitHandler(validator) {
  // default action
  validator.getForm().submit();
}
```

You can provide your own handler override the default one.

- **invalidHandler**

The callback called when validation failed on submit. By default it do nothing! The function format
is same as `submitHandler`

- **errorMsgClass**

css class of the error message element which wrapped by a `span` appended after the field. The default 
value is `u-msg-error`

- **errorFieldClass**

css class of the failed field. The default value is `u-msg-error`

- **validFieldClass**

css class of the successful field. The default value is `u-field-ok`

- **validateOnlyOnSubmit**

Whether perform the validation only when submitting the form, by default false

## predefined validation methods

1. `required(true)`
2. `minLength(min-string-length)`
3. `maxLength(max-string-length)`
4. `min(min-integer-value)`
5. `max(max-integer-value)`
6. `email(true)`
7. `equalTo(other-field-name)`
8. `remote(url)` result returned from server should be of form: `{ valid: true/false, message: error message if invalid }`

## add custom validation methods:

Apart from the predefined validation methods, you can add your own by `FormValidator#addValidationMethod`:

```javascript
import FormValidator from 'vue-auto-validator'
FormValidator.addValidationMethod('method-name', (value, args) => {
  // value: field value, may be a string or array of string
  // args: may be a single value or array of values as needed
  // return: true when validation passed or false
})
```
e.g.
```javascript
FormValidator.addValidationMethod('between', function(value, [min, max]) {
  value = parseInt(value);
  return min <= value && value <= max;
});   
```

## public methods
- **getForm**

Get the form dom element

- **getFieldEle(name)**

Get the form element by field's name attr

- **getFieldValue(name)**

Get field's value by its name. The value may be a single string or array of strings

- **getErrorMsgMap**

Get all the form's current error messages as `{ name: msg, ... }`

- **showErrors(errors)**

explicitly display errors. argument `errors` is a map from field name to error message like: 
`{ name: msg, ... }`

- **formatMsg(msg, args)**

Utility function to format error message according to args as follows:
```
msg: 'abc{0}cde{1}', 
args: [3,4] 
return: 'abc3cde4'
```

- **validateAllFields**

Validate all the form's fields and show error messages if some failes, usage:

```javascript
validator.validateAllFields().then(() => {
  // all fields' validation passed
}).catch(err => {
  // some field's validation failed
  console.log(err.message);
})
```

- **validateField(name)**

Validate a single field and show error messages if it failes, usage:

```javascript
validator.validateField(name).then(() => {
  // validation passed
}).catch(err => {
  // validation failed
  console.log(err.message);
})
```

## events emitted

- **this.$emit('invalidfield', name, message)**

emitted when a field's validation failed

- **this.$emit('invalidform', errorMsgMap)**

emitted when the form's validation failed on submit. `errorMsgMap` is all errors map from field 
name to message

- **this.$emit('validfield', name)**

emitted when a field's validation passed

- **this.$emit('validform')**

emitted when the form's validation passed on submit
