const MARQUEE_WAIT = 1500;
const MARQUEE_MOVE = 500;

function listen(target, name, callback, options) {
  target?.addEventListener(name, callback, options);
  return () => target?.removeEventListener?.(name, callback, options);
}

function initSteppedMarquee(motionPolicy) {
  const root = document.querySelector("#brandMarquee");
  const track = root?.querySelector(".marquee-track");
  const original = track?.querySelector(".marquee-group");
  if (!root || !track || !original) return () => {};

  const cleanup = [];
  let offsets = [];
  let period = 0;
  let index = 0;
  let target = 0;
  let phase = "wait";
  let remaining = MARQUEE_WAIT;
  let started = 0;
  let timer = 0;
  let frame = 0;
  let hover = false;
  let focus = false;
  let paused = true;
  let needsMeasure = true;
  let destroyed = false;

  const shouldPause = () => motionPolicy.matches || document.hidden || hover || focus
    || root.classList.contains("is-paused") || offsets.length < 2 || period <= 0;
  const translate = (distance) => { track.style.transform = `translate3d(${-distance}px, 0, 0)`; };

  function freezeTransition() {
    const transform = getComputedStyle(track).transform;
    const values = transform.match(/matrix(?:3d)?\(([^)]+)\)/)?.[1].split(",").map(Number);
    const position = values ? -(values.length === 16 ? values[12] : values[4]) : (offsets[index] || 0);
    track.style.transition = "none";
    translate(Number.isFinite(position) ? position : offsets[index] || 0);
  }

  function runPhase() {
    if (destroyed || paused || shouldPause()) return;
    started = performance.now();
    if (phase === "move") {
      // Commit a paused/loop position before starting the next transition.
      void track.offsetWidth;
      track.style.transition = `transform ${remaining}ms cubic-bezier(.22,.61,.36,1)`;
      translate(target);
    }
    timer = window.setTimeout(() => {
      timer = 0;
      if (phase === "wait") {
        phase = "move";
        remaining = MARQUEE_MOVE;
        target = index + 1 < offsets.length ? offsets[index + 1] : period;
      } else {
        index = (index + 1) % offsets.length;
        if (index === 0) {
          track.style.transition = "none";
          translate(0);
        }
        phase = "wait";
        remaining = MARQUEE_WAIT;
      }
      reconcile();
      if (!paused) runPhase();
    }, Math.max(1, remaining));
  }

  function reconcile() {
    const nextPaused = shouldPause();
    if (nextPaused === paused) return;
    paused = nextPaused;
    if (paused) {
      if (timer) {
        remaining = Math.max(1, remaining - (performance.now() - started));
        window.clearTimeout(timer);
        timer = 0;
        if (phase === "move") freezeTransition();
      }
    } else runPhase();
  }

  function measure() {
    frame = 0;
    if (destroyed || document.hidden) return;
    needsMeasure = false;
    window.clearTimeout(timer);
    timer = 0;
    paused = true;
    track.style.transition = "none";
    translate(0);
    const groupBounds = original.getBoundingClientRect();
    const groups = [...track.children].filter((element) => element.classList.contains("marquee-group"));
    period = groups[1] ? groups[1].getBoundingClientRect().left - groupBounds.left
      : groupBounds.width + (parseFloat(getComputedStyle(track).columnGap) || 0);
    const labels = [...original.children].filter((element) => element.tagName === "SPAN");
    const firstLabelLeft = labels[0]?.getBoundingClientRect().left || groupBounds.left;
    offsets = labels.map((element) => element.getBoundingClientRect().left - firstLabelLeft);
    // Keep enough identical copies to cover wide viewports throughout the last step.
    const desiredGroups = period > 0 ? Math.max(2, Math.ceil(root.clientWidth / period) + 1) : 2;
    while (groups.length < desiredGroups) {
      const clone = original.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      clone.dataset.marqueeClone = "true";
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
      track.append(clone);
      groups.push(clone);
    }
    while (groups.length > desiredGroups && groups.at(-1).dataset.marqueeClone === "true") groups.pop().remove();
    index = offsets.length ? index % offsets.length : 0;
    if (motionPolicy.matches) index = 0;
    translate(offsets[index] || 0);
    phase = "wait";
    remaining = MARQUEE_WAIT;
    reconcile();
  }

  function scheduleMeasure() {
    if (destroyed) return;
    needsMeasure = true;
    if (!frame && !document.hidden) frame = requestAnimationFrame(measure);
  }

  cleanup.push(listen(root, "pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hover = true;
    reconcile();
  }));
  cleanup.push(listen(root, "pointerleave", () => { hover = false; reconcile(); }));
  cleanup.push(listen(root, "focusin", () => { focus = true; reconcile(); }));
  cleanup.push(listen(root, "focusout", () => queueMicrotask(() => {
    focus = root.contains(document.activeElement);
    reconcile();
  })));
  cleanup.push(listen(document, "visibilitychange", () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    if (!document.hidden && needsMeasure) scheduleMeasure();
    else reconcile();
  }));
  cleanup.push(listen(window, "resize", scheduleMeasure, { passive: true }));
  cleanup.push(listen(motionPolicy, "change", scheduleMeasure));
  const classObserver = new MutationObserver(reconcile);
  classObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
  document.fonts?.ready.then(() => { if (!destroyed) scheduleMeasure(); });
  scheduleMeasure();

  return () => {
    destroyed = true;
    cleanup.forEach((remove) => remove());
    classObserver.disconnect();
    window.clearTimeout(timer);
    cancelAnimationFrame(frame);
    track.querySelectorAll('[data-marquee-clone="true"]').forEach((element) => element.remove());
    track.style.removeProperty("transition");
    track.style.removeProperty("transform");
  };
}

function initIndependentColumns() {
  const root = document.querySelector("#products");
  if (!root || !("ResizeObserver" in window)) return () => {};
  const mobile = window.matchMedia("(max-width: 760px)");
  const cleanup = [];
  let cards = [];
  let frame = 0;
  let destroyed = false;
  let lastRootWidth = -1;
  const sizes = new WeakMap();

  function setStyle(element, property, value) {
    if (element.style[property] !== value) element.style[property] = value;
  }

  function resetLayout() {
    root.classList.remove("is-masonry");
    root.style.removeProperty("height");
    root.style.removeProperty("position");
    cards.forEach((card) => ["position", "top", "left", "width"].forEach((name) => card.style.removeProperty(name)));
  }

  function layout() {
    frame = 0;
    if (destroyed || document.hidden) return;
    if (mobile.matches || !cards.length || root.clientWidth <= 0) { resetLayout(); return; }
    root.classList.add("is-masonry");
    setStyle(root, "position", "relative");
    const computed = getComputedStyle(root);
    const columnGap = parseFloat(computed.columnGap) || 0;
    const rowGap = parseFloat(computed.rowGap) || columnGap;
    const width = (root.clientWidth - columnGap) / 2;
    // Apply every width before reading heights to avoid per-card layout thrashing.
    cards.forEach((card) => {
      setStyle(card, "position", "absolute");
      setStyle(card, "width", `${width}px`);
    });
    const heights = cards.map((card) => card.offsetHeight);
    const columns = [0, 0];
    cards.forEach((card, order) => {
      const column = order % 2;
      setStyle(card, "left", `${column * (width + columnGap)}px`);
      setStyle(card, "top", `${columns[column]}px`);
      columns[column] += heights[order] + rowGap;
    });
    setStyle(root, "height", `${Math.max(...columns) - rowGap}px`);
  }

  function scheduleLayout() {
    if (!destroyed && !frame && !document.hidden) frame = requestAnimationFrame(layout);
  }

  const resizeObserver = new ResizeObserver((entries) => {
    let changed = false;
    for (const entry of entries) {
      if (entry.target === root) {
        // Updating the container height must not trigger a feedback loop.
        if (entry.contentRect.width !== lastRootWidth) { lastRootWidth = entry.contentRect.width; changed = true; }
      } else {
        const previous = sizes.get(entry.target);
        const next = [entry.contentRect.width, entry.contentRect.height];
        if (!previous || previous[0] !== next[0] || previous[1] !== next[1]) {
          sizes.set(entry.target, next);
          changed = true;
        }
      }
    }
    if (changed) scheduleLayout();
  });

  function syncCards() {
    const next = [...root.children].filter((element) => element.classList.contains("product-card"));
    const nextSet = new Set(next);
    cards.filter((card) => !nextSet.has(card)).forEach((card) => resizeObserver.unobserve(card));
    const oldSet = new Set(cards);
    next.filter((card) => !oldSet.has(card)).forEach((card) => resizeObserver.observe(card));
    cards = next;
    scheduleLayout();
  }

  const childrenObserver = new MutationObserver(syncCards);
  childrenObserver.observe(root, { childList: true });
  resizeObserver.observe(root);
  cleanup.push(listen(window, "resize", scheduleLayout, { passive: true }));
  cleanup.push(listen(mobile, "change", scheduleLayout));
  cleanup.push(listen(document, "visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else scheduleLayout();
  }));
  syncCards();

  return () => {
    destroyed = true;
    cleanup.forEach((remove) => remove());
    childrenObserver.disconnect();
    resizeObserver.disconnect();
    cancelAnimationFrame(frame);
    resetLayout();
  };
}

export function initStorefrontEffects(motionPolicy) {
  const cleanups = [initSteppedMarquee(motionPolicy), initIndependentColumns()];
  return () => cleanups.forEach((cleanup) => cleanup());
}
