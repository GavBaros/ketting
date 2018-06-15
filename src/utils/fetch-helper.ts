import * as crossFetch from 'cross-fetch';

/**
 * Creates a Fetch Request object, based on a number of settings.
 *
 * @param {string|Request} input - Url or input request object.
 * @param {object} init - A list of Fetch settings
 * @param {object} defaultInit - A list of default settings to use if they
 *                              weren't overridden by init.
 * @return {Response}
 */
function createFetchRequest(input: any, init: any, defaultInit: any): Request {

  const trueInit:any = {};

  if (init) {
    Object.assign(trueInit, defaultInit, init);
  } else {
    Object.assign(trueInit, defaultInit);
  }

  trueInit.headers = mergeHeaders([
    defaultInit.headers,
    // @ts-ignore cross-fetch definitions are broken. See https://github.com/lquixada/cross-fetch/pull/19
    input instanceof crossFetch.Request ? input.headers : null,
    init && init.headers ? init.headers : null
  ]);

    // @ts-ignore cross-fetch definitions are broken. See https://github.com/lquixada/cross-fetch/pull/19
  return new crossFetch.Request(input, trueInit);

}

type HeaderSet = any;

/**
 * Merges sets of HTTP headers.
 *
 * Each item in the array is a key->value object, a Fetch Headers object
 * or falsey.
 *
 * Any headers that appear more than once get replaced. The last occurence
 * wins.
 */
function mergeHeaders(headerSets: HeaderSet[]): any {

  var result = new crossFetch.Headers();
  for(const headerSet of headerSets) {

    if (headerSet instanceof crossFetch.Headers) {
      for(var key of headerSet.keys()) {
        result.set(key, headerSet.get(key));
      }
    } else if (headerSet) {
      // not falsey, must be a key->value object.
      for(var index in headerSet) {
        result.set(index, headerSet[key]);
      }
    }
  }

  return result;

}

module.exports = {
  createFetchRequest: createFetchRequest,
  mergeHeaders: mergeHeaders
};