/* =====================================================================
   CONTACT FORM — delivered to Gmail
   ---------------------------------------------------------------------
   Visitors fill in the styled form; this script checks their input and
   emails it to you. Pressing "Reply" in Gmail answers the visitor.

   1. EmailJS (https://www.emailjs.com) — main route. The email's look
      (subject, body, sender name, reply-to) is set by the EmailJS
      template, which uses {{name}}, {{email}}, {{subject}}, {{message}}.
   2. Web3Forms (https://web3forms.com) — backup. Used automatically if
      EmailJS fails (e.g. the free 200/month limit is used up), and by
      the browser directly when JavaScript is off. Its access key is the
      hidden "access_key" input in index.html.
   3. If neither is set up, the visitor's email app opens instead.

   All of these keys are designed to be public; they can only send
   email to your own inbox.
   ===================================================================== */

(function () {
    "use strict";

    /* ---------- EmailJS settings (from the EmailJS dashboard) ---------- */
    const EMAILJS = {
        serviceId: "service_uhvcqaa",   /* Email Services */
        templateId: "template_6nvfbrx", /* Email Templates */
        publicKey: "uTAuWJOZTVF40TqhP", /* Account -> General */
    };

    const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
    const FALLBACK_EMAIL = "paulamana28@gmail.com";

    /* Friendly error text for each field */
    const MESSAGES = {
        name: { missing: "Please enter your name." },
        email: {
            missing: "Please enter your email address.",
            invalid: "Please enter a valid email address, like name@example.com.",
        },
        subject: { missing: "Please add a subject." },
        message: {
            missing: "Please write a message.",
            tooShort: "Please write at least 10 characters.",
        },
    };

    const form = document.getElementById("contact-form");
    if (!form) {
        return;
    }

    const fields = Array.from(form.querySelectorAll("input[required], textarea[required]"));
    const accessKeyInput = form.querySelector('input[name="access_key"]');
    const honeypot = form.querySelector('input[name="botcheck"]');
    const submitButton = form.querySelector(".form-submit");
    const submitLabel = submitButton.querySelector(".btn-label");
    const status = form.querySelector(".form-status");

    /* JavaScript handles validation from here on, with clearer messages */
    form.noValidate = true;

    function getAccessKey() {
        return accessKeyInput ? accessKeyInput.value.trim() : "";
    }

    function isEmailJSConfigured() {
        return Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);
    }

    /* ---------- Validation ---------- */

    /* Returns an error message, or "" when the field is fine */
    function getError(field) {
        const value = field.value.trim();
        const text = MESSAGES[field.name];

        if (value === "") {
            return text.missing;
        }
        if (field.type === "email" && field.validity.typeMismatch) {
            return text.invalid;
        }
        if (field.minLength > 0 && value.length < field.minLength) {
            return text.tooShort;
        }
        return "";
    }

    function showFieldError(field, message) {
        const errorEl = document.getElementById(field.id + "-error");
        if (message) {
            field.setAttribute("aria-invalid", "true");
            errorEl.textContent = message;
            errorEl.hidden = false;
        } else {
            field.removeAttribute("aria-invalid");
            errorEl.textContent = "";
            errorEl.hidden = true;
        }
    }

    function validateField(field) {
        const message = getError(field);
        showFieldError(field, message);
        return message === "";
    }

    /* Validates every field; returns the first invalid one (or null) */
    function validateAll() {
        let firstInvalid = null;
        fields.forEach(function (field) {
            if (!validateField(field) && !firstInvalid) {
                firstInvalid = field;
            }
        });
        return firstInvalid;
    }

    fields.forEach(function (field) {
        /* Check a field once the visitor leaves it (not while they're still typing) */
        field.addEventListener("blur", function () {
            if (field.value.trim() !== "") {
                validateField(field);
            }
        });
        /* Clear the error as soon as the problem is fixed */
        field.addEventListener("input", function () {
            if (field.getAttribute("aria-invalid") === "true") {
                validateField(field);
            }
        });
    });

    /* ---------- Status message & loading state ---------- */

    /* Shows a message; optionally ends it with a link to the email address */
    function showStatus(type, message, withEmailLink) {
        status.textContent = message;
        if (withEmailLink) {
            const link = document.createElement("a");
            link.href = "mailto:" + FALLBACK_EMAIL;
            link.textContent = FALLBACK_EMAIL;
            status.append(" ", link, ".");
        }
        status.setAttribute("data-type", type);
        status.hidden = false;
    }

    function hideStatus() {
        status.hidden = true;
        status.textContent = "";
    }

    function setLoading(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.classList.toggle("is-loading", isLoading);
        submitLabel.textContent = isLoading ? "Sending..." : "Send Message";
    }

    /* ---------- Sending ---------- */

    function getValues() {
        const values = {};
        fields.forEach(function (field) {
            values[field.name] = field.value.trim();
        });
        return values; /* { name, email, subject, message } */
    }

    /* Main route: EmailJS. Resolves on success, throws otherwise.
       The template decides how the email looks; it receives
       {{name}}, {{email}}, {{subject}} and {{message}}. */
    async function sendWithEmailJS(values) {
        const response = await fetch(EMAILJS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                service_id: EMAILJS.serviceId,
                template_id: EMAILJS.templateId,
                user_id: EMAILJS.publicKey,
                template_params: values,
            }),
        });

        /* EmailJS answers 200 "OK" on success, or an error message as plain text */
        if (!response.ok) {
            const reason = await response.text().catch(function () {
                return "";
            });
            throw new Error("EmailJS " + response.status + ": " + reason);
        }
    }

    /* Backup route: Web3Forms. Resolves on success, throws otherwise.
       Shaped to read like a normal email in Gmail:
         sender name -> the visitor's name   (from_name)
         subject     -> the visitor's subject (subject)
         Reply       -> goes to the visitor   (Web3Forms uses "email" as reply-to)
       The name isn't repeated in the body since it's already the sender. */
    async function sendToWeb3Forms(values) {
        const response = await fetch(form.action, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                access_key: getAccessKey(),
                from_name: values.name,
                subject: values.subject,
                email: values.email,
                message: values.message,
            }),
        });

        let result = {};
        try {
            result = await response.json();
        } catch (error) {
            /* Non-JSON reply: handled by the check below */
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Request failed with status " + response.status);
        }
    }

    /* Tries EmailJS first, then Web3Forms. Throws only if both fail. */
    async function sendMessage(values) {
        if (isEmailJSConfigured()) {
            try {
                await sendWithEmailJS(values);
                return;
            } catch (error) {
                console.warn("Contact form: EmailJS failed, sending with Web3Forms instead.", error);
            }
        }
        await sendToWeb3Forms(values);
    }

    /* Fallback: open the visitor's email app with everything filled in */
    function openEmailApp(values) {
        const body = values.message + "\n\n- " + values.name + " (" + values.email + ")";
        window.location.href =
            "mailto:" + FALLBACK_EMAIL +
            "?subject=" + encodeURIComponent(values.subject) +
            "&body=" + encodeURIComponent(body);
    }

    function resetForm() {
        form.reset();
        fields.forEach(function (field) {
            showFieldError(field, "");
        });
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        hideStatus();

        const firstInvalid = validateAll();
        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        const values = getValues();
        const firstName = values.name.split(" ")[0];

        /* Bot filled the hidden field: pretend it worked, send nothing */
        if (honeypot && honeypot.value !== "") {
            resetForm();
            showStatus("success", "Thanks! Your message has been sent.");
            return;
        }

        if (!isEmailJSConfigured() && !getAccessKey()) {
            openEmailApp(values);
            showStatus(
                "info",
                "Your email app should open with your message ready to send. If it doesn't, email me at",
                true
            );
            return;
        }

        setLoading(true);
        try {
            await sendMessage(values);
            resetForm();
            showStatus(
                "success",
                "Thanks, " + firstName + "! Your message has been sent. I'll get back to you soon."
            );
        } catch (error) {
            console.error("Contact form:", error);
            showStatus(
                "error",
                "Sorry, your message couldn't be sent. Please try again, or email me at",
                true
            );
        } finally {
            setLoading(false);
        }
    });
})();
