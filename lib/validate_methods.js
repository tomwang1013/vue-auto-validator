/*
 * define all validation methods
 */

// get form control's value
// TODO for radio & checkbox, field could be array
function getFieldValue(field) {
  return field.value;
}

module.exports = {
  required: function(field) {
    return getFieldValue(field);
  },

  minLength: function(field, minLen) {
    var val = getFieldValue(field);

    if (!val) return true;
    else return val.length >= minLen;
  },

  maxLength: function(field, maxLen) {
    var val = getFieldValue(field);

    if (!val) return true;
    else return val.length <= maxLen;
  },

  min: function(field, minV) {
    var val = getFieldValue(field);

    if (!val) return true;
    else return parseInt(val) >= minV;
  },

  max: function(field, maxV) {
    var val = getFieldValue(field);

    if (!val) return true;
    else return parseInt(val) <= maxV;
  },

  remote: function(field, options) {
  }
};
