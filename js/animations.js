/* =====================================================================
   ANIMATIONS — scroll reveal
   ---------------------------------------------------------------------
   Adds .is-visible to each .reveal element the first time it scrolls
   into view. The fade itself is defined in css/animations.css and only
   runs when the visitor hasn't asked for reduced motion.
   ===================================================================== */

(function () {
    "use strict";

    const items = document.querySelectorAll(".reveal");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* No observer support or reduced motion: show everything immediately */
    if (reduceMotion || !("IntersectionObserver" in window)) {
        items.forEach(function (item) {
            item.classList.add("is-visible");
        });
        return;
    }

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target); /* animate once only */
                }
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (item) {
        observer.observe(item);
    });
})();
