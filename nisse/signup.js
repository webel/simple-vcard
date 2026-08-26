(function exposeSignup(root, factory) {
  const signup = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = signup;
  }

  if (root) {
    root.NisseSignup = signup;
  }

  if (root && root.document) {
    const form = root.document.querySelector("[data-signup-form]");
    if (form) {
      form.addEventListener("submit", signup.handleSignupSubmit);
    }
  }
})(typeof globalThis === "object" ? globalThis : this, function createSignup() {
  async function postSignup(endpoint, fields, request = fetch) {
    const response = await request(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(fields),
    });

    if (!response.ok) {
      throw new Error(`Formspark returned HTTP ${response.status}`);
    }

    return response;
  }

  function setSignupState(form, button, status, state) {
    form.dataset.state = state;
    form.setAttribute("aria-busy", state === "submitting" ? "true" : "false");
    button.disabled = state === "submitting";
    button.textContent =
      state === "submitting"
        ? button.dataset.loadingLabel
        : button.dataset.defaultLabel;
    status.textContent =
      state === "success"
        ? status.dataset.successMessage
        : state === "error"
          ? status.dataset.errorMessage
          : "";
  }

  async function handleSignupSubmit(
    event,
    { FormDataClass = FormData, request = fetch } = {},
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    const status = form.querySelector("[data-form-status]");
    const fields = Object.fromEntries(new FormDataClass(form).entries());

    setSignupState(form, button, status, "submitting");
    try {
      await postSignup(form.action, fields, request);
      form.reset();
      setSignupState(form, button, status, "success");
      status.focus();
    } catch {
      setSignupState(form, button, status, "error");
    }
  }

  return { handleSignupSubmit, postSignup, setSignupState };
});
