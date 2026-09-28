/* =====================================================================
   THEME SWITCHER — light / dark mode
   ---------------------------------------------------------------------
   Order of priority:
   1. A choice the visitor made with the toggle (saved in localStorage)
   2. Their operating-system preference (prefers-color-scheme)

   The theme is written to <html data-theme="...">, which swaps the CSS
   variables defined in css/themes.css. A tiny inline script in <head>
   does the first write before the page paints, so there is no flash of
   the wrong theme. This file then wires up the button.
   ===================================================================== */

(function () {
    "use strict";

    const STORAGE_KEY = "theme";
    const root = document.documentElement;
    const toggle = document.getElementById("theme-button");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    /* localStorage can throw (private mode, blocked storage), so guard it */
    function getSavedTheme() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return value === "light" || value === "dark" ? value : null;
        } catch (error) {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            /* Storage unavailable: the choice just won't persist */
        }
    }

    function getPreferredTheme() {
        return getSavedTheme() || (systemDark.matches ? "dark" : "light");
    }

    /* Apply a theme and keep the button's accessible label in sync */
    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);

        if (toggle) {
            const next = theme === "dark" ? "light" : "dark";
            toggle.setAttribute("aria-label", "Switch to " + next + " mode");
            toggle.setAttribute("title", "Switch to " + next + " mode");
        }

        /* Mobile browser UI color */
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", theme === "dark" ? "#121212" : "#ffffff");
        }
    }

    /* Briefly enable color transitions so the switch blends instead of snapping */
    function withTransition(callback) {
        root.classList.add("theme-transition");
        callback();
        window.setTimeout(function () {
            root.classList.remove("theme-transition");
        }, 300);
    }

    /* 1. Initial theme (the inline <head> script already set it; this syncs the button) */
    applyTheme(getPreferredTheme());

    /* 2. Toggle click: flip, apply, remember */
    if (toggle) {
        toggle.addEventListener("click", function () {
            const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            withTransition(function () {
                applyTheme(next);
            });
            saveTheme(next);
        });
    }

    /* 3. Follow OS changes live, but only if the visitor hasn't picked a theme */
    systemDark.addEventListener("change", function (event) {
        if (!getSavedTheme()) {
            withTransition(function () {
                applyTheme(event.matches ? "dark" : "light");
            });
        }
    });
})();
