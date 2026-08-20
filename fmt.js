const { dbSerialize } = require("./db");

const WHITESPACE_REGEX = /\s+/g;
const MD_REGEX = /#/g;

/**
 * @param {string} value 
 */
function sanitizeWhitespace(value) {
  return value.replaceAll(WHITESPACE_REGEX, ' ');
}
module.exports.sanitizeWhitespace = sanitizeWhitespace;


function sanitizeMarkdown(value) {
  return value.replaceAll(MD_REGEX, ' ');
}
module.exports.sanitizeMarkdown = sanitizeMarkdown;

/**
 * @param {string} value 
 * @param {number} maxLength 
 */
function maxLength(value, maxLength) {
  if (value.length > maxLength) {
    value = value.substring(0, maxLength);
    value += ' […]';
  }
  return value;
}
module.exports.maxLength = maxLength;

/**
 * Wraps the given value in a code block. Might return a single or multi line code block dependong on usage.
 * @param {any} value The value to wrap in code. If it is not a string it will be serialized.
 * @param {{maxLength?: number, language?: string, forceLine?: "single" | "multi"}?} opts Additional options for formatting.
 * @returns {string} The formatted string.
 */
function wrapInCode(value, opts = null) {
  let lang = opts?.language;
  if (value === undefined) {
    value = 'undefined';
  } else if (typeof value !== 'string') {
    value = dbSerialize(value);
    if (!lang) {
      lang = 'json';
    }
  }
  value = maxLength(value, opts?.maxLength ?? 1500);
  if (opts?.forceLine !== "single" && (opts?.forceLine === "multi" || value.includes('\n'))) {
    return '```' + (lang ?? '') + '\n' + value + '\n```';
  } else {
    return '`' + value + '`';
  }
}
module.exports.wrapInCode = wrapInCode;

/**
 * 
 * @param {import("./channel").ChannelInfo} value The channel info
 * @param {{excludeParent?: boolean}} opts Additional options for formatting.
 * @returns {string} The formatted string.
 */
function channelInfoToString(value, opts = {}) {
  if (!opts.excludeParent) {
    opts.excludeParent = false;
  }
  if (!value) {
    return 'None';
  }
  if (value.parent && !opts.excludeParent) {
    return `<#${value.id}> (${value.name}) in ${channelInfoToString(value.parent)}`;
  }
  return `<#${value.id}> (${value.name})`;
}
module.exports.channelInfoToString = channelInfoToString;

function booleanToString(value, yesIsBad = false, yesStr = 'Yes', noStr = 'No') {
  return value ? (yesIsBad ? (':red_circle: ' + yesStr) : (':green_circle: ' + yesStr)) : (yesIsBad ? (':green_circle: ' + noStr) : (':red_circle: No' + noStr));
}
module.exports.booleanToString = booleanToString;

/**
 * @param {string} ms 
 */
function msToString(ms) {
  if (ms < 0) ms = -ms;
  const dayMs = 86400000;
  const time = {
    week: Math.floor(ms / (dayMs * 7)),
    day: Math.floor(ms / dayMs) % 7,
    hour: Math.floor(ms / 3600000) % 24,
    minute: Math.floor(ms / 60000) % 60,
    second: Math.floor(ms / 1000) % 60,
    millisecond: Math.floor(ms) % 1000
  };
  return Object.entries(time)
    .filter(val => val[1] !== 0)
    .map(([key, val]) => `${val} ${key}${val !== 1 ? 's' : ''}`)
    .join(', ');
}
module.exports.msToString = msToString;

/**
 * 
 * @param {any[] | false | null | undefined | string} list 
 * @param {string} emptyStr 
 * @returns {string}
 */
function stringList(list, emptyStr = 'None', joinStr = ', ') {
  if (!list) {
    return emptyStr;
  }
  if (typeof list === 'string') {
    return list;
  }
  const filtered = list.filter(e => typeof e === 'string' && e.length > 0);
  if (filtered.length === 0) {
    return emptyStr;
  }
  return filtered.join(joinStr);
}
module.exports.stringList = stringList;

function ratioToString(value, total, digits = 2) {
  if (value === 0 || total === 0) {
    return (0).toFixed(digits) + '%';
  }
  return ((value / total) * 100).toFixed(digits) + '%';
}
module.exports.ratioToString = ratioToString;

const COLOR = {
  RESET: '\x1b[0m',
  DIM: "\x1b[2m",
  FG_MAGENTA: "\x1b[35m"
}
module.exports.COLOR = COLOR;
