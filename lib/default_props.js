// global default props
export default {
  // error message css class
  errorMsgClass: 'u-msg-error',

  // error field css class: same as message by default
  errorFieldClass: 'u-msg-error',

  // valid field css class
  validFieldClass: 'u-field-ok',

  // error message placement: before-label, after-label, before-field, after-field
  errorPlacement: 'after-label',

  // default submit handler when validation passed
  // will be called with this bind to the validator
  submitHandler: function(validator) {
    validator.getForm().submit();
    },

  // default submit handler when validation failed
  invalidHandler: function(validator) {
    console.log(validator.errorMsgMap());
  },

  // config default props globally
  setDefaultProps: function(options) {
    Object.keys(options).forEach(k => this[k] = options[k]);
  }
};
