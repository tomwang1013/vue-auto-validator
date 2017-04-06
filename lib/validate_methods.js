/*
 * define all validation methods
 */

function getFieldValue(field) {
  return field.value;
}

module.exports = {
  required: function() {
    return getFieldValue(this);
  },

  minLength: function(len) {
    if (!getFieldValue(this)) return true;
    else return getFieldValue(this).length >= len;
  },

  maxLength: function(len) {
    if (!getFieldValue(this)) return true;
    else return getFieldValue(this).length <= len;
  },

  min: function(val) {
    if (!getFieldValue(this)) return true;
    else return parseInt(getFieldValue(this)) >= val;
  },

  max: function(val) {
    if (!getFieldValue(this)) return true;
    else return parseInt(getFieldValue(this)) <= val;
  }
};
