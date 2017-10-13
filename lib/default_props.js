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
  submitHandler: function(validator, fm) { fm.submit(); },

  // default submit handler when validation failed
  invalidHandler: function(validator, fm) {},

  // config default props globally
  setDefaultProps: function(options) {
    Object.keys(options).forEach(k => this[k] = options[k]);
  }
};
