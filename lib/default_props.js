// global default props
module.exports = {
  errorClass: 'u-input-error',
  validFieldClass: 'u-input-ok',
  errorPlacement: 'after_label',

  focusInvalidOnSubmit: true,

  submitHandler: function(validator, fm) { fm.submit(); },
  invalidHandler: function(validator, fm) {},

  highlight: function(validator, field) {
    field.classList.add(validator.getProp('errorClass'));
  },

  unhighlight: function(validator, field) {
    field.classList.remove(validator.getProp('errorClass'));
    field.classList.add(validator.getProp('validFieldClass'));
  }
};
