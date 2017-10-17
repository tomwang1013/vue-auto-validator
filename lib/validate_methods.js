let axios = require('axios');

let emailValidFormat = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;


/*
 * define all validation methods
 */

/**
 * get form control's value
 *
 * @param field {Element} dom element to get value
 * @return element's value
 */
function getFieldValue(field) {
  return field.value;
}

module.exports = {
  required: function(field) {
    return getFieldValue(field);
  },

  minLength: function(field, minLen) {
    let val = getFieldValue(field);

    if (!val) return true;
    else return val.length >= minLen;
  },

  maxLength: function(field, maxLen) {
    let val = getFieldValue(field);

    if (!val) return true;
    else return val.length <= maxLen;
  },

  min: function(field, minV) {
    let val = getFieldValue(field);

    if (!val) return true;
    else return parseInt(val) >= minV;
  },

  max: function(field, maxV) {
    let val = getFieldValue(field);

    if (!val) return true;
    else return parseInt(val) <= maxV;
  },

  email: function(field) {
    let val = getFieldValue(field);

    if (!val) return true;
    else return emailValidFormat.test(val);
  },

  equalTo: function(field, otherFieldName) {
    let val = getFieldValue(field);
    let otherFieldValue = getFieldValue(field.form[otherFieldName]);

    return val === otherFieldValue;
  },

  /**
   * ajax validation
   * @param field     {Element}   field dom element
   * @param url       {String}    remote validation url
   * @param callback  {Function}  callback when validation finished
   */
  remote: function(field, url, callback) {
    let param = {};
    let me = this;

    param[field.name] = getFieldValue(field);

    axios.get(url, { params: param }).then(function(response) {
      let data = response.data;
      callback(field.name, data.valid, data.message || me.messages[field.name]['remote']);
    });
  },

  addValidationMethod: function(methodName, fn) {
    this[methodName] = fn;
  },
};
