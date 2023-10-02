/* UCC Utils
 * provide handy util functions for working with UCCDate library
 * 
 * These are functions that are not really part of the UCCDate() object
 * but are useful for presentation, etc.
 *
 * Prajna - started 10 Cancer 13517
 * version 1.0.1
 */
 "use strict";

// constants
const VERSION = '1.0.1';

// create an alias for document.getElementById()
var Id = document.getElementById.bind(document);

//****************************** Helper Functions ****************************//

// format number with commas
function commafy(num) {
  var str = num.toString().split('.');
  if (str[0].length >= 5) {
      str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  }
  if (str[1] && str[1].length >= 5) {
      str[1] = str[1].replace(/(\d{3})/g, '$1 ');
  }
  return str.join('.');
}

// insert a text node into a span element
function Set(name, value) {
  var elm = document.getElementById(name);
  elm.innerHTML = value;
}

// check for leapyear in ISO 8601 Date()
function isoLeapYear(year) {
  return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}

