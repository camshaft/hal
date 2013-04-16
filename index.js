/**
 * Module dependencies
 */
require = require("require-component")(require);

var debug = require("debug")("hal")
  , resolve = require("url").resolve
  , each = require("each");

/**
 * Expose createClient
 */
module.exports = exports = createClient;

/**
 * Expose superagent
 */
exports.superagent = require("superagent");

/**
 * Response Prototype
 */
var proto = {};

/**
 * Get a link
 *
 * @param {String} rel
 * @return {Object}
 * @public
 */
proto.link = function(rel) {
  if(!this.body || !this.body._links) throw new Error("Invalid json+hal body");
  var link = this.body._links[rel];

  if(!link || !link.href) throw new Error("Invalid json+hal link: "+link);

  return link;
};

/**
 * Get a form
 *
 * @param {String} rel
 * @return {Object}
 * @public
 */
proto.form = function(rel) {
  if(!this.body || !this.body._forms) throw new Error("Invalid json+hal body");
  var form = this.body._forms[rel];

  if(!form) throw new Error("Invalid json+hal form: "+form);

  return form;
};

/**
 * Follow a json+hal link
 *
 * @param {String} rel
 * @param {Function} done
 * @return {Request}
 * @public
 */
proto.follow = function(rel, done) {
  var link = this.link(rel);
  var href = resolve(this._request.url, link.href);
  debug("Follow "+rel+" -> GET "+href);
  return createClient(href, done);
};

/**
 * Submit a form
 *
 * @param {String} rel
 * @return {Request}
 * @public
 */
proto.submit = function(rel) {
  var form = this.form(rel)
    , method = form.method || "GET"
    , href = resolve(this._request.url, form.action || this.body._links.self.href || this._request.url);

  debug("Submit "+rel+" -> "+method+" "+href);
  // Create the request
  var request = createClient(method, href);

  // Patch the send method
  var send = request.send;
  request.send = function(data) {
    // TODO validate input fields
    return send.apply(request, arguments);
  };

  return request;
};

/**
 * Embedded resources
 *
 * @todo implement the api
 */


/**
 * Create a hal client for an href
 *
 * @param {String} method
 * @param {String} url
 * @return {Request}
 * @private
 */
function createClient (method, url) {
  // URL first
  if(!url) {
    url = method;
    method = "GET";
  }

  // Create superagent request
  var request = exports.superagent(method, url)
    , callback = request.callback;

  // Override the callback method
  request.callback = function(err, res) {
    if(res) {
      // Expose the request object to the response
      res._request = request;

      // Copy the links
      if (res.body && res.body._links) {
        var links = res.body._links;
        each(Object.keys(links), function(link) {
          res.links[link] = links[link].href;
        });
      };

      // Patch the response
      merge(res, proto);
    }

    return callback.apply(request, arguments);
  };

  return request;
}

function merge(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};
