# introduction
vue-auto-validator is a flexible and simple vue component for form validation, which is heavy inpired by [jquery-validation](https://jqueryvalidation.org/). It provides some pre-defined validation methods and you can add custom ones. With there validation methods, you set up rules and related messages, as well where to display error messages when validation fails.

# get started

## install
`npm install vue-auto-validator --save`

## usage
javascript:
```javascript
var FormValidator = require('vue-auto-validator')
var Vue = require('vue');

var fv = new Vue({
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

  components: {
    'form-validator': FormValidator
  }
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
## validation methods
1. `required(true)`
2. `minLength(min-string-length)`
3. `maxLength(max-string-length)`
4. `min(min-integer-value)`
5. `max(max-integer-value)`
6. `email(true)`
7. `equalTo(other-field-name)`
8. `remote(url)` result returned from server should be of form: `{ valid: true/false, message: error message if invalid }`

#### add custom validation methods:
```javascript
var FV = require('vue-auto-validator');

// element: form field
// args: single value or array
// return true if validation passes, false otherwise
FV.addValidationMethod('method-name', function(element, [args]) {
  // e.g.
  return element.value.length == 6; 
});   
```

## props
**rules**

a rule defines applying which validation methods to a single form field, as:
```javascript
{
  'field-name': {
    'validation-method-name': params
  }
}
```
e.g.
```javascript
{
  password: {
    minLength: 6
  }
}
```
For bool validation rule, we can omit the params:
```javascript
{
  name: 'required' // same as name: { required: true }
}
```
**messages**

one-to-one error message for rules:

```javascript
{
  name: 'name should not empty',
  password: {
    minLength: 'at least {0} chars' // {i} will be replaced by the ith param
  },
}
```

**submitHandler(form-validator, form)**

callback called when validation passes on submit. If not provided, follow default form submit behavior. It is the rignt place to ajax sutmit, like:
```javascript
submitHandler: (function(validator, form) {
  var args = $(form).serializeObject();     
  var me = this; 

  $.post(form.action, args, function(data) {
    if (data.error) {
      me.success = false;
      validator.showErrors(data.errors);
    } else {
      me.success = true;
    }
  }, 'json');
}).bind(this) // bind this if you like

```
**invalidHandler**

callback called when validation failed on submit

**errorClass**

css class name for error messages(`span` tag) and related invalid field, default: u-input-error

**validFieldClass**

css class name for valid field, default: u-input-ok

**errorPlacement**

where to place the error message, being one of the following value:
  - before_label: before the label
  - after_label: after the label
  - before_field: before the field
  - after_field: after the field
  
**highlight**

how to highlight the invalid field, default: add `errorClass` to it

**unhighlight**

how to unhighlight the valid field, default: add `validFieldClass` to it

**focusInvalidOnSubmit**

whether to focus the first invalid field when validation failed on submit

## useful public methods
**showErrors(errors)**

explicitly display errors. argument `errors` is a map from field name to error message like: `{ name: 'bad name' }`

**setupRules()**

by default, rules are setup in form-validator's `mounted` hook(controlled by `setupRulesOnMounted` prop). Sometimes it is not what you want. You can manually setup rules by calling this function(set `setupRulesOnMounted` to false)

## events emitted
**this.$emit('invalidfield', field-name, message)**

emitted when a field's validation failed

**this.$emit('invalidform', errorMsgMaps)**

emitted when the form's validation failed on submit. `errorMsgMaps` is all errors map from field name to message

## global props configure
you can set the props default values for all forms globally:
```javascript
var FV  = require('vue-auto-validator');

FV.setDefaultProps({
  // common props for all forms
})
```
