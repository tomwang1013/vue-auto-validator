// global default props
module.exports = {
  errorClass: 'u-input-error',
  validFieldClass: 'u-input-ok',
  errorPlacement: 'after_label',

  submitHandler: function(fm) {},
  invalidHandler: function(fm) {},

  highlight: function(field) {
    field.classList.add(this.errorClass);
  },

  unhighlight: function(field) {
    field.classList.remove(this.errorClass);
    field.classList.add(this.validFieldClass);
  }
};
