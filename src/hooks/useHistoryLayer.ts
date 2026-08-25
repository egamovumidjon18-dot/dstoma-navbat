import { useEffect, useRef } from 'react';

// Makes an overlay behave like a page for the browser's Back button.
//
// The app has no router: every modal, patient card and inner viewer lived
// entirely in React state under a single URL, so pressing Back from six levels
// deep left the app altogether. Escape did nothing either — it was handled in
// exactly two places, neither of them a modal.
//
// This gives any open/close pair the behaviour people already expect:
//
//   useHistoryLayer(isOpen, onClose, 'new-booking');
//
// While open, one history entry belongs to this layer. Back pops it and calls
// onClose instead of leaving the app. Escape does the same. And closing via an
// X button also unwinds the history entry, so the two never drift apart —
// which is the part that goes wrong if you only listen for popstate.

const STATE_KEY = '__dstoma_layer';

// Layers are stacked so nested overlays (a viewer inside a modal) unwind in
// the order they were opened. Module-level because the stack is global to the
// document, not to any one component.
const stack: string[] = [];

export function useHistoryLayer(isOpen: boolean, onClose: () => void, key: string) {
  // Kept in refs so the popstate/keydown listeners never need re-binding, and
  // never capture a stale onClose.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // True when this layer is the one that pushed the current history entry, so
  // a close initiated from the UI knows whether it must call history.back().
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const id = `${key}_${Date.now().toString(36)}`;
    stack.push(id);
    pushedRef.current = true;
    window.history.pushState({ [STATE_KEY]: id }, '');

    const closeFromUser = () => {
      // Only the topmost layer responds, so Escape inside a viewer that sits
      // on top of a modal closes the viewer, not both.
      if (stack[stack.length - 1] !== id) return;
      onCloseRef.current();
    };

    const onPop = () => {
      // Every open layer receives every popstate, so without this a single Back
      // would close the whole stack at once — closing a viewer would also close
      // the modal underneath it. One Back, one layer.
      if (stack[stack.length - 1] !== id) return;
      stack.pop();
      // The entry is already gone from history — don't push or pop again here,
      // just bring the UI in line with it.
      pushedRef.current = false;
      onCloseRef.current();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (stack[stack.length - 1] !== id) return;
      e.stopPropagation();
      closeFromUser();
    };

    window.addEventListener('popstate', onPop);
    document.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey);

      const idx = stack.indexOf(id);
      if (idx !== -1) stack.splice(idx, 1);

      // Closed by the UI (X, backdrop, save) rather than by Back: consume the
      // history entry we added, otherwise Back would later "close" an overlay
      // that is no longer on screen and appear to do nothing.
      if (pushedRef.current) {
        pushedRef.current = false;
        if (window.history.state?.[STATE_KEY] === id) window.history.back();
      }
    };
  }, [isOpen, key]);
}

export default useHistoryLayer;
