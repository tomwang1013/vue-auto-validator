// global default props
module.exports = {
  errorClass: 'u-input-error',
  validFieldClass: 'u-input-ok',
  errorPlacement: 'after_label',

  focusInvalidOnSubmit: true,

  submitHandler: function(evt, fm) {},
  invalidHandler: function(evt, fm) {},

  highlight: function(field) {
    field.classList.add(this.getProp('errorClass'));
  },

  unhighlight: function(field) {
    field.classList.remove(this.getProp('errorClass'));
    field.classList.add(this.getProp('validFieldClass'));
  }
};
