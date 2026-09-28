/* =====================================================================
   MAIN — small page helpers
   ===================================================================== */

(function () {
    "use strict";

    /* ---------- Footer year stays current ---------- */
    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    /* ---------- Highlight the nav link for the section in view ---------- */
    const links = document.querySelectorAll(".nav-link");
    const sections = Array.from(links)
        .map(function (link) {
            return document.querySelector(link.getAttribute("href"));
        })
        .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) {
        return;
    }

    function setActive(id) {
        links.forEach(function (link) {
            if (link.getAttribute("href") === "#" + id) {
                link.setAttribute("aria-current", "true");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    /* A section counts as "current" when it crosses the upper-middle of the screen */
    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setActive(entry.target.id);
                }
            });
        },
        { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach(function (section) {
        observer.observe(section);
    });
})();
