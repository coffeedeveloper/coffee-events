(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('Events', ['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.Events = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var _eid = 1;
  var handles = {};

  var eid = function eid(ele) {
    return ele._eid || (ele._eid = _eid++);
  };

  var convert = function convert(ele, type, selector, callback, fn) {
    var _eid = eid(ele);

    var fid = eid(fn);

    if (handles[_eid]) {
      if (!handles[_eid].events[type]) handles[_eid].events[type] = {};
      handles[_eid].events[type][fid] = {
        sel: selector,
        eid: fid,
        fn: fn,
        cb: callback
      };
    } else {
      handles[_eid] = {
        eid: _eid,
        ele: ele,
        events: _defineProperty({}, type, _defineProperty({}, fid, {
          sel: selector,
          eid: fid,
          fn: fn,
          cb: callback
        }))
      };
    }

    return handles[_eid].events[type][fid].cb;
  };

  var findHandle = function findHandle(ele, type, callback) {
    var _eid = eid(ele);

    var handle = handles[_eid];
    if (!handle) return [];

    if (type === undefined && callback === undefined) {
      var r = [];

      for (var e in handle.events) {
        for (var f in handle.events[e]) {
          r.push(handle.events[e][f].cb);
        }
      }

      return r;
    }

    if (type != undefined && callback === undefined) {
      if (!handle.events[type]) return [];
      var r = [];

      for (var f in handle.events[type]) {
        r.push(handle.events[type][f].cb);
      }

      return r;
    }

    if (type != undefined && callback != undefined) {
      var fid = eid(callback);
      return [handle.events[type][fid].cb];
    }

    return [];
  };

  var each = function each(items, cb) {
    var i = 0;
    var len = items.length;

    for (; i < len; i++) {
      var r = cb(items[i], i);
      if (r === false) break;
    }
  };

  var isMatch = function isMatch(parent, ele, selector) {
    var match = ele.matches || ele.matchesSelector || ele.webkitMatchesSelecotr || ele.mozMatchesSelector || ele.msMatchesSelector;
    if (match) return match.call(ele, selector);
    var items = parent.querySelectorAll(selector);
    var r = false;
    each(items, function (item, index) {
      if (item == ele) {
        r = true;
        return false;
      }
    });
    return r;
  };

  var on = function on(ele, type, selector, callback, isOne) {
    if (typeof ele === 'string') ele = document.querySelectorAll(ele);

    if (typeof selector === 'function' && callback === undefined) {
      callback = selector;
      selector = '';
    }

    var handle = function handle(e) {
      var target = e.target;

      if (selector) {
        if (isMatch(ele, target, selector)) callback.call(target, e);
      } else {
        callback.call(ele, e);
      }

      if (isOne) {
        off(ele, e.type, callback);
      }
    };

    type.split(/\s+/).forEach(function (t) {
      if (ele.length) {
        each(ele, function (item) {
          var fn = convert(item, type, selector, handle, callback);
          item.addEventListener(t, fn, false);
        });
      } else {
        var fn = convert(ele, type, selector, handle, callback);
        ele.addEventListener(t, fn, false);
      }
    });
    return ele;
  };

  var off = function off(ele, type, handle) {
    if (typeof ele === 'string') ele = document.querySelectorAll(ele);
    each(ele, function (item) {
      type.split(/\s+/).forEach(function (t) {
        var r = findHandle(item, type, handle);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = r[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var f = _step.value;
            item.removeEventListener(t, f, false);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      });
    });
  };

  var once = function once(ele, type, selector, callback) {
    on(ele, type, selector, callback, true);
  };

  var support = function support() {
    var arr = [document.addEventListener, document.removeEventListener, document.querySelectorAll, Array.prototype.filter, Array.prototype.forEach];

    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === undefined) console.warn('your browser didn\'t support this method:', arr[i]);
    }
  };

  support();
  exports.on = on;
  exports.off = off;
  exports.once = once;
  exports.support = support;
});
