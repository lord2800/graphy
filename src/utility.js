export function createToast(level, message) {
    const toast = new Event('toast', { bubbles: true, composed: true });
    toast.data = { toast: { level, message } };
    return toast;
};

export function triggerEvent(target, eventName, data = null) {
    const event = new Event(eventName, { bubbles: true, composed: true });
    event.data = data;
    target.dispatchEvent(event);
};
