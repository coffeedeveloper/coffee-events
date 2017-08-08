(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Events = factory());
}(this, (function () { 'use strict';

var defineProperty = function (obj, key, value) {
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
};

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
      events: defineProperty({}, type, defineProperty({}, fid, {
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

  //all events
  if (type === undefined && callback === undefined) {
    var r = [];
    for (var e in handle.events) {
      for (var f in handle.events[e]) {
        r.push(handle.events[e][f].cb);
      }
    }
    return r;
  }

  //special type events
  if (type != undefined && callback === undefined) {
    if (!handle.events[type]) return [];
    var _r = [];
    for (var _f in handle.events[type]) {
      _r.push(handle.events[type][_f].cb);
    }return _r;
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
  var matches = ele.matches || ele.matchesSelector || ele.webkitMatchesSelecotr || ele.mozMatchesSelector || ele.msMatchesSelector;

  var match = null;
  var r = false;
  if (matches) {
    if (matches.call(ele, selector)) {
      r = true;
      match = ele;
    } else if (ele === parent) {
      r = false;
    } else {
      var p = ele.parentNode;
      do {
        if (matches.call(p, selector)) {
          r = true;
          match = p;
        }
        p = p.parentNode;
      } while (p !== parent && r === false);
    }
    return {
      r: r,
      match: match
    };
  }

  var items = parent.querySelectorAll(selector);

  each(items, function (item, index) {
    if (item === ele) {
      r = true;
      match = item;
      return false;
    }
  });

  return {
    r: r,
    match: match
  };
};

var createEventTarget = function createEventTarget(e, ext) {
  var event = {};
  event.originalEvent = e;

  for (var p in e) {
    event[p] = e[p];
  }

  for (var _p in ext) {
    event[_p] = ext[_p];
  }

  return event;
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
      if (ele.length) {
        each(ele, function (item) {
          var _isMatch = isMatch(item, target, selector),
              r = _isMatch.r,
              match = _isMatch.match;

          if (r) {
            var _event = e;
            if (target !== match) {
              _event = createEventTarget(e, {
                currentTarget: match,
                liveFired: ele
              });
            }
            callback.call(target, _event);
          }
        });
      } else {
        var _isMatch2 = isMatch(ele, target, selector),
            r = _isMatch2.r,
            match = _isMatch2.match;

        if (r) {
          if (target !== match) {
            event = createEventTarget(e, {
              currentTarget: match,
              liveFired: ele
            });
          }
          callback.call(target, event);
        }
      }
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

var index = {
  on: on,
  off: off,
  once: once,
  support: support
};

return index;

})));
