import axios from 'axios';

const emailValidFormat = /^[\w.-]+@\w+(\.\w+)?$/;

/*
 * define all validation methods
 */

/**
 * get form control's value
 * @param field {Element|[Element]} dom element to get value
 * @return {String|[String]} element's value
 */
function getFieldValue(field) {
  if (field instanceof Element) {
    return field.value;
  }

  // radio or checkbox
  if (field instanceof RadioNodeList) {
    let values = _.filter(field, f => f.checked).map(f => f.value);

    if (values.length === 1) return values[0];
    else if (values.length > 1) return values;
    else return ''
  }

  return '';
}

export default {
  required: function(field) {
    return getFieldValue(field);
  },

  email: function(field) {
    let val = getFieldValue(field);

    if (!val) return true;
    else return emailValidFormat.test(val);
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

    axios.get(url, { params: param }).then(function({ data }) {
      callback(field.name, data.valid, data.message || me.messages[field.name]['remote']);
    });
  },

  addValidationMethod: function(methodName, fn) {
    this[methodName] = fn;
  },
};
