/*
 * define all default validation methods
 * user can add their own too
 */

import axios from 'axios';
import _ from 'lodash'

const emailValidFormat = /^[\w.-]+@\w+(\.\w+)?$/;

/**
 * get form field's value
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
    let otherFieldValue = getFieldValue(this.getFieldEle(otherFieldName));

    if (_.isArray(val)) {
      return _.isArray(otherFieldValue) && val.every((v, i) => v === otherFieldValue[i]);
    } else {
      return val === otherFieldValue;
    }
  },

  /**
   * ajax validation
   * @param field     {Element|[Element]}   field dom element
   * @param url       {String}    remote validation url
   * @param callback  {Function}  callback when validation finished
   */
  remote: function(field, url, callback) {
    let param = {};
    let fieldName;

    if (field instanceof Element) {
      fieldName = field.name;
    } else {
      fieldName = field[0].name;
    }

    param[fieldName] = getFieldValue(field);

    axios.get(url, { params: param }).then(({ data }) => {
      callback(fieldName, data.valid, data.message || this.messages[fieldName]['remote']);
    });

    // for test
    //setTimeout(() => callback(field.name, false, this.messages[field.name]['remote']), 1000);
  },

  addValidationMethod: function(methodName, fn) {
    this[methodName] = fn;
  },
};
