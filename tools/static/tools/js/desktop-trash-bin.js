/**

 * Cestino homepage — desktop (angolo contenitore); mobile fixed basso sinistra (home-trash.js).

 */

(function () {

    if (!document.body.classList.contains("homepage")) return;



    function isDesktop() {

        return window.matchMedia && window.matchMedia("(min-width: 769px)").matches;

    }



    function getMainAnchor() {

        return document.querySelector(

            ".site-main .container, .site-main .faq-container, .site-main .static-container"

        );

    }



    function getOnboardingSlot() {

        return document.getElementById("gadly-trash-onboarding-slot");

    }



    function attachTrash() {

        var trash = document.getElementById("desktop-trash-bin");

        if (!trash) return;

        if (isDesktop()) {

            var anchor = getMainAnchor();

            if (anchor && trash.parentElement !== anchor) {

                anchor.appendChild(trash);

            }

            trash.classList.remove("desktop-trash-bin--mobile-fixed");

        } else if (trash.parentElement !== document.body) {

            document.body.appendChild(trash);

            trash.classList.add("desktop-trash-bin--mobile-fixed");

        }

    }



    function mountOnboardingInContainer() {

        if (!isDesktop()) return;

        var slot = getOnboardingSlot();

        var anchor = getMainAnchor();

        if (!slot || !anchor || slot.parentElement === anchor) return;

        anchor.appendChild(slot);

    }



    function shouldShowDesktopOnboarding() {

        return (

            document.documentElement.classList.contains("gadly-home-trash-onboarding-active") &&

            !document.documentElement.classList.contains("gadly-home-trash-onboarding-dismissed")

        );

    }



    function dispatchOnboardingMounted() {

        try {

            document.dispatchEvent(new CustomEvent("gadly-trash-onboarding-mounted"));

        } catch (e) {

            if (typeof document.createEvent === "function") {

                var ev = document.createEvent("Event");

                ev.initEvent("gadly-trash-onboarding-mounted", true, true);

                document.dispatchEvent(ev);

            }

        }

    }



    function syncOnboardingVisible() {

        if (!isDesktop() || !shouldShowDesktopOnboarding()) return;



        var slot = getOnboardingSlot();

        var panel = document.getElementById("home-trash-onboarding");

        if (!slot || !panel) return;



        mountOnboardingInContainer();



        document.documentElement.classList.add("gadly-trash-onboarding-show");

        document.documentElement.classList.add("gadly-trash-onboarding-paint-ready");

        slot.removeAttribute("aria-hidden");

        panel.classList.add("home-trash-onboarding--visible");

        panel.removeAttribute("hidden");

        panel.removeAttribute("aria-hidden");



        if (slot.dataset.gadlyOnboardingMounted !== "1") {

            slot.dataset.gadlyOnboardingMounted = "1";

            dispatchOnboardingMounted();

        }



        var bin = document.getElementById("desktop-trash-bin");

        if (bin && !bin.classList.contains("desktop-trash-bin--hint")) {

            bin.classList.add("desktop-trash-bin--hint");

        }

    }



    function init() {

        attachTrash();

        mountOnboardingInContainer();

        syncOnboardingVisible();



        if (window.matchMedia) {

            var mq = window.matchMedia("(min-width: 769px)");

            var onMqChange = function () {

                attachTrash();

                mountOnboardingInContainer();

                syncOnboardingVisible();

            };

            if (typeof mq.addEventListener === "function") {

                mq.addEventListener("change", onMqChange);

            } else if (typeof mq.addListener === "function") {

                mq.addListener(onMqChange);

            }

        }

        window.addEventListener("resize", attachTrash);

    }



    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();


