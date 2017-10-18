/*
 * define all default validation methods
 * user can add their own too
 */

import axios from 'axios';
import _ from 'lodash'

const emailValidFormat = /^[\w.-]+@\w+(\.\w+)?$/;

export default {
  required: function(value) {
    return !!value;
  },

  email: function(value) {
    if (!value) return true;
    else return emailValidFormat.test(value);
  },

  minLength: function(value, minLen) {
    if (!value) return true;
    else return value.length >= minLen;
  },

  maxLength: function(value, maxLen) {
    if (!value) return true;
    else return value.length <= maxLen;
  },

  min: function(value, minV) {
    if (!value) return true;
    else return parseInt(value) >= minV;
  },

  max: function(value, maxV) {
    if (!value) return true;
    else return parseInt(value) <= maxV;
  },

  equalTo: function(value, otherFieldName) {
    let otherFieldValue = this.getFieldValue(otherFieldName);

    if (_.isArray(value)) {
      return _.isArray(otherFieldValue) && value.every((v, i) => v === otherFieldValue[i]);
    } else {
      return value === otherFieldValue;
    }
  },

  /**
   * ajax validation
   * @param value     {String|[String]} field value
   * @param name      {String}          field name
   * @param url       {String}          remote validation url
   * @param callback  {Function}        callback when validation finished
   */
  remote: function(value, name, url, callback) {
    axios.get(url, { params: { [name]: value } }).then(({ data }) => {
      callback(
        name,
        data.valid, // if validation passed
        data.message || this.messages[name]['remote']  // error message if failed
      );
    });
  },

  addValidationMethod: function(methodName, fn) {
    this[methodName] = fn;
  },
};
