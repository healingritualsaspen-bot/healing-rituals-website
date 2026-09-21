(() => {
  const forms = document.querySelectorAll('form[data-email-form]');

  forms.forEach((form) => {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-form-status]');
    const originalButton = button ? button.innerHTML : '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = 'Sending…';
      }
      if (status) {
        status.textContent = 'Securely sending your request…';
        status.classList.remove('form-error');
      }

      try {
        const payload = Object.fromEntries(new FormData(form).entries());
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(result.message || 'Your request could not be sent.');
        }

        if (status) {
          status.textContent = result.confirmationSent
            ? 'Your request was sent. Please check your email for confirmation.'
            : 'Your request was sent successfully.';
        }

        window.setTimeout(() => {
          window.location.assign(result.redirect || form.dataset.successUrl || '/thank-you.html');
        }, 700);
      } catch (error) {
        if (status) {
          status.textContent = error.message + ' You can also call or text 970-989-3333.';
          status.classList.add('form-error');
        }
        if (button) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
          button.innerHTML = originalButton;
        }
      }
    });
  });
})();