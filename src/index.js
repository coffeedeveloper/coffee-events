let _eid = 1;
let handles = {};

const eid = ele => {
  return ele._eid || (ele._eid = _eid++);
};

const convert = (ele, type, selector, callback, fn) => {
  let _eid = eid(ele);
  let fid = eid(fn);

  if (handles[_eid]) {
    if (!handles[_eid].events[type]) handles[_eid].events[type] = {}
    handles[_eid].events[type][fid] = {
      sel: selector,
      eid: fid,
      fn: fn,
      cb: callback
    };
  } else {
    handles[_eid] = {
      eid: _eid,
      ele,
      events: {
        [type]: {
          [fid]: {
            sel: selector,
            eid: fid,
            fn: fn,
            cb: callback
          }
        },
      }
    };
  }

  return handles[_eid].events[type][fid].cb;
}

const findHandle = (ele, type, callback) => {
  let _eid = eid(ele);
  let handle = handles[_eid];
  if (!handle) return [];

  //all events
  if (type === undefined && callback === undefined) {
    let r = [];
    for (let e in handle.events) {
      for (let f in handle.events[e]) {
        r.push(handle.events[e][f].cb);
      }
    }
    return r;
  }

  //special type events
  if (type != undefined && callback === undefined) {
    if (!handle.events[type]) return [];
    let r = [];
    for (let f in handle.events[type])
      r.push(handle.events[type][f].cb);
    return r;
  }

  if (type != undefined && callback != undefined) {
    let fid = eid(callback);
    return [handle.events[type][fid].cb];
  }

  return [];
}

const each = (items, cb) => {
  let i = 0;
  let len = items.length;
  for (; i < len; i++) {
    let r = cb(items[i], i);
    if (r === false) break;
  }
}

const isMatch = (parent, ele, selector) => {
  const matches = ele.matches
                || ele.matchesSelector
                || ele.webkitMatchesSelecotr
                || ele.mozMatchesSelector
                || ele.msMatchesSelector;

  let match = null
  let r = false;
  if (matches) {
    if (matches.call(ele, selector)) {
      r = true;
      match = ele
    } else if (ele === parent) {
      r = false;
    } else {
      let p = ele.parentNode;
      do {
        if (matches.call(p, selector)) {
          r = true
          match = p
        }
        p = p.parentNode
      } while (p !== parent && r === false);
    }
    return {
      r,
      match,
    }
  }

  const items = parent.querySelectorAll(selector);

  each(items, (item, index) => {
    if (item === ele) {
      r = true;
      match = item
      return false;
    }
  });

  return {
    r,
    match,
  };
};

const createEventTarget = (e, ext) => {
  const event = {}
  event.originalEvent = e

  for (let p in e) {
    event[p] = e[p]
  }

  for (let p in ext) {
    event[p] = ext[p]
  }

  return event
}

const on = (ele, type, selector, callback, isOne) => {
  if (typeof ele === 'string') ele = document.querySelectorAll(ele);

  if (typeof selector === 'function' && callback === undefined) {
    callback = selector;
    selector = '';
  }

  const handle = function(e) {
    let target = e.target;

    if (selector) {
      if (ele.length) {
        each(ele, (item) => {
          const {
            r,
            match,
          } = isMatch(item, target, selector)
          if (r) {
            let event = e
            if (target !== match) {
              event = createEventTarget(e, {
                currentTarget: match,
                liveFired: ele,
              })
            }
            callback.call(target, event);
          }
        })
      } else {
        const {
          r,
          match,
        } = isMatch(ele, target, selector)
        if (r) {
          if (target !== match) {
            event = createEventTarget(e, {
              currentTarget: match,
              liveFired: ele,
            })
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

  type.split(/\s+/).forEach(t => {
    if (ele.length) {
      each(ele, (item) => {
        let fn = convert(item, type, selector, handle, callback);
        item.addEventListener(t, fn, false);
      });
    } else {
      let fn = convert(ele, type, selector, handle, callback);
      ele.addEventListener(t, fn, false);
    }
  });

  return ele;
};

const off = (ele, type, handle) => {
  if (typeof ele === 'string') ele = document.querySelectorAll(ele);

  each(ele, function(item) {
    type.split(/\s+/).forEach(t=> {
      let r = findHandle(item, type, handle);

      for (let f of r) {
        item.removeEventListener(t, f, false);
      }
    });
  });
};

const once = (ele, type, selector, callback) => {
  on(ele, type, selector, callback, true);
};

const support = () => {
  let arr = [
    document.addEventListener,
    document.removeEventListener,
    document.querySelectorAll,
    Array.prototype.filter,
    Array.prototype.forEach,
  ];

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === undefined) console.warn('your browser didn\'t support this method:', arr[i]);
  }
};

support();

export default {
  on,
  off,
  once,
  support,
};
