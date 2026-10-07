// Pass this whole file as the `expression` of argent `debugger-evaluate` (DEV builds only).
// Installs `globalThis.__ts`:
//   __ts.insts[label]            TrueSheet instances, label = `${name || 'unnamed'}${JSON.stringify(detents)}`
//   __ts.take(labelPrefix?)      drain logged onPositionChange events: "ms label position realtime index"
//   __ts.set(label, prop, value) override a prop live (resets when the parent re-renders)
//   __ts.armDrag(label, prop, values) / __ts.disarmDrag()
//                                change `prop` on every onDragChange of that sheet, cycling `values`
// Re-run after every app relaunch.
/* global globalThis, performance */
(() => {
  const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const renderer = hook.renderers.get(1);
  const ts = { insts: {}, log: [], drag: null };

  // One function per instance: Hermes scopes loop `const` to the enclosing function,
  // so closures created directly in the walk loop would all share the last sheet.
  function wrap(s, label) {
    const proto = Object.getPrototypeOf(s);

    const onPositionChange = proto.onPositionChange.bind(s);
    s.onPositionChange = function (e) {
      const n = e.nativeEvent;
      ts.log.push([
        Math.round(performance.now()),
        label,
        Math.round(n.position),
        n.realtime,
        Math.round(n.index * 1000) / 1000,
      ]);
      return onPositionChange(e);
    };

    const onDragChange = proto.onDragChange.bind(s);
    s.onDragChange = function (e) {
      const drag = ts.drag;
      if (drag && drag.label === label) {
        drag.last = drag.values[drag.count++ % drag.values.length];
        renderer.overrideProps(s._reactInternals, [drag.prop], drag.last);
      }
      return onDragChange(e);
    };

    // Re-render so the wrapped handlers are the ones passed to the native view.
    s.forceUpdate();
  }

  hook.getFiberRoots(1).forEach(function (root) {
    const stack = [root.current];
    while (stack.length) {
      const fiber = stack.pop();
      const s = fiber.stateNode;
      if (s && typeof s.onPositionChange === 'function' && s.props && 'detents' in s.props) {
        const label = (s.props.name || 'unnamed') + JSON.stringify(s.props.detents);
        if (!ts.insts[label]) {
          ts.insts[label] = s;
          wrap(s, label);
        }
      }
      if (fiber.child) stack.push(fiber.child);
      if (fiber.sibling) stack.push(fiber.sibling);
    }
  });

  ts.take = function (labelPrefix) {
    const log = ts.log;
    ts.log = [];
    return log
      .filter(function (e) {
        return !labelPrefix || e[1].indexOf(labelPrefix) === 0;
      })
      .map(function (e) {
        return e.join(' ');
      });
  };

  ts.set = function (label, prop, value) {
    renderer.overrideProps(ts.insts[label]._reactInternals, [prop], value);
    return 'ok';
  };

  ts.armDrag = function (label, prop, values) {
    ts.drag = { label: label, prop: prop, values: values, count: 0, last: null };
    return 'armed';
  };

  ts.disarmDrag = function () {
    const drag = ts.drag;
    ts.drag = null;
    return drag && { changes: drag.count, last: drag.last };
  };

  globalThis.__ts = ts;
  return Object.keys(ts.insts);
})();
