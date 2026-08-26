const test = require("node:test");
const assert = require("node:assert/strict");

let signup = {};

try {
  signup = require("../nisse/signup.js");
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") {
    throw error;
  }
}

test("sends a subscription to the configured Formspark endpoint as JSON", async () => {
  assert.equal(
    typeof signup.postSignup,
    "function",
    "postSignup has not been implemented yet",
  );

  const requests = [];
  const response = await signup.postSignup(
    "https://submit-form.com/Yn40oN52I",
    { email: "nisse@example.com", _honeypot: "" },
    async (url, options) => {
      requests.push({ url, options });
      return { ok: true, status: 200 };
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(requests, [
    {
      url: "https://submit-form.com/Yn40oN52I",
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: "nisse@example.com",
          _honeypot: "",
        }),
      },
    },
  ]);
});

test("rejects an unsuccessful Formspark response", async () => {
  await assert.rejects(
    signup.postSignup(
      "https://submit-form.com/Yn40oN52I",
      { email: "nisse@example.com" },
      async () => ({ ok: false, status: 503 }),
    ),
    /503/,
  );
});

test("marks the signup form busy while a subscription is sending", () => {
  assert.equal(
    typeof signup.setSignupState,
    "function",
    "setSignupState has not been implemented yet",
  );

  const form = {
    dataset: { state: "idle" },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  const button = {
    dataset: {
      defaultLabel: "Skicka serien till mig",
      loadingLabel: "Skickar…",
    },
    disabled: false,
    textContent: "Skicka serien till mig",
  };
  const status = {
    dataset: {
      successMessage: "Du är med!",
      errorMessage: "Försök igen.",
    },
    textContent: "",
  };

  signup.setSignupState(form, button, status, "submitting");

  assert.equal(form.dataset.state, "submitting");
  assert.equal(form.attributes["aria-busy"], "true");
  assert.equal(button.disabled, true);
  assert.equal(button.textContent, "Skickar…");
  assert.equal(status.textContent, "");
});

test("announces a successful subscription and restores the button", () => {
  const form = {
    dataset: { state: "submitting" },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  const button = {
    dataset: {
      defaultLabel: "Skicka serien till mig",
      loadingLabel: "Skickar…",
    },
    disabled: true,
    textContent: "Skickar…",
  };
  const status = {
    dataset: {
      successMessage: "Du är med!",
      errorMessage: "Försök igen.",
    },
    textContent: "",
  };

  signup.setSignupState(form, button, status, "success");

  assert.equal(form.dataset.state, "success");
  assert.equal(form.attributes["aria-busy"], "false");
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "Skicka serien till mig");
  assert.equal(status.textContent, "Du är med!");
});

test("announces a failed subscription and lets the visitor retry", () => {
  const form = {
    dataset: { state: "submitting" },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  const button = {
    dataset: {
      defaultLabel: "Skicka serien till mig",
      loadingLabel: "Skickar…",
    },
    disabled: true,
    textContent: "Skickar…",
  };
  const status = {
    dataset: {
      successMessage: "Du är med!",
      errorMessage: "Försök igen.",
    },
    textContent: "",
  };

  signup.setSignupState(form, button, status, "error");

  assert.equal(form.dataset.state, "error");
  assert.equal(form.attributes["aria-busy"], "false");
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "Skicka serien till mig");
  assert.equal(status.textContent, "Försök igen.");
});

test("turns a successful form submit into an inline confirmation", async () => {
  assert.equal(
    typeof signup.handleSignupSubmit,
    "function",
    "handleSignupSubmit has not been implemented yet",
  );

  let prevented = false;
  let reset = false;
  let statusFocused = false;
  const button = {
    dataset: {
      defaultLabel: "Skicka serien till mig",
      loadingLabel: "Skickar…",
    },
    disabled: false,
    textContent: "Skicka serien till mig",
  };
  const status = {
    dataset: {
      successMessage: "Du är med!",
      errorMessage: "Försök igen.",
    },
    textContent: "",
    focus() {
      statusFocused = true;
    },
  };
  const form = {
    action: "https://submit-form.com/Yn40oN52I",
    dataset: { state: "idle" },
    attributes: {},
    querySelector(selector) {
      return selector === "button[type='submit']" ? button : status;
    },
    reset() {
      reset = true;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  const event = {
    currentTarget: form,
    preventDefault() {
      prevented = true;
    },
  };
  class TestFormData {
    *entries() {
      yield ["email", "nisse@example.com"];
      yield ["_honeypot", ""];
    }
  }

  await signup.handleSignupSubmit(event, {
    FormDataClass: TestFormData,
    request: async () => ({ ok: true, status: 200 }),
  });

  assert.equal(prevented, true);
  assert.equal(reset, true);
  assert.equal(form.dataset.state, "success");
  assert.equal(status.textContent, "Du är med!");
  assert.equal(statusFocused, true);
});

test("turns a failed form submit into an inline retry message", async () => {
  let reset = false;
  const button = {
    dataset: {
      defaultLabel: "Skicka serien till mig",
      loadingLabel: "Skickar…",
    },
    disabled: false,
    textContent: "Skicka serien till mig",
  };
  const status = {
    dataset: {
      successMessage: "Du är med!",
      errorMessage: "Försök igen.",
    },
    textContent: "",
  };
  const form = {
    action: "https://submit-form.com/Yn40oN52I",
    dataset: { state: "idle" },
    attributes: {},
    querySelector(selector) {
      return selector === "button[type='submit']" ? button : status;
    },
    reset() {
      reset = true;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  class TestFormData {
    *entries() {
      yield ["email", "nisse@example.com"];
    }
  }

  await signup.handleSignupSubmit(
    {
      currentTarget: form,
      preventDefault() {},
    },
    {
      FormDataClass: TestFormData,
      request: async () => ({ ok: false, status: 503 }),
    },
  );

  assert.equal(reset, false);
  assert.equal(form.dataset.state, "error");
  assert.equal(button.disabled, false);
  assert.equal(status.textContent, "Försök igen.");
});
