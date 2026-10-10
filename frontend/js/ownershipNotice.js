(() => {
  const dialog = document.getElementById('ownershipNoticeDialog');
  if (!(dialog instanceof HTMLDialogElement)) return;

  const closeButtons = dialog.querySelectorAll('[data-ownership-close]');
  let previouslyFocusedElement = null;

  const closeNotice = () => {
    if (dialog.open) dialog.close();
  };

  closeButtons.forEach((button) => button.addEventListener('click', closeNotice));

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeNotice();
  });

  dialog.addEventListener('close', () => {
    if (previouslyFocusedElement instanceof HTMLElement && previouslyFocusedElement.isConnected) {
      previouslyFocusedElement.focus({ preventScroll: true });
    }
    previouslyFocusedElement = null;
  });

  window.addEventListener('keydown', (event) => {
    const isF2 = event.code === 'F2' || event.key === 'F2';
    if (!isF2 || event.repeat || event.isComposing) return;
    event.preventDefault();
    event.stopPropagation();

    if (dialog.open) return;

    previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    dialog.showModal();
    dialog.querySelector('[data-ownership-close][autofocus]')?.focus({ preventScroll: true });
  }, { capture: true });
})();
