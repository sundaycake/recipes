/*
 * Baking mode
 *
 * Keeps the screen awake while a recipe is open, using the
 * Screen Wake Lock API. Falls back to a status message on
 * browsers that don't support it yet.
 */

(function () {

    "use strict";

    document
        .querySelectorAll(".recipe-baking-mode")
        .forEach(function (container) {

            const button =
                container.querySelector("[data-baking-toggle]");

            const statusEl =
                container.querySelector(".baking-mode-status");

            if (!button) {
                return;
            }

            let wakeLock = null;


            function setStatus(text) {

                if (statusEl) {
                    statusEl.textContent = text;
                }

            }


            function setActiveState(active) {

                button.classList.toggle("active", active);
                button.setAttribute(
                    "aria-pressed",
                    active ? "true" : "false"
                );

            }


            async function requestWakeLock() {

                try {

                    wakeLock =
                        await navigator.wakeLock.request("screen");

                    setActiveState(true);
                    setStatus("Screen will stay on");

                    wakeLock.addEventListener(
                        "release",
                        function () {
                            wakeLock = null;
                        }
                    );

                } catch (error) {

                    setActiveState(false);
                    setStatus(
                        "Couldn't keep the screen on \u2014 " +
                        "your browser may have blocked it."
                    );

                }

            }


            async function releaseWakeLock() {

                if (wakeLock) {
                    await wakeLock.release();
                    wakeLock = null;
                }

                setActiveState(false);
                setStatus("");

            }


            if (!("wakeLock" in navigator)) {

                button.disabled = true;
                setStatus(
                    "Your browser doesn't support keeping " +
                    "the screen on automatically."
                );

                return;

            }


            button.addEventListener("click", function () {

                if (wakeLock) {
                    releaseWakeLock();
                } else {
                    requestWakeLock();
                }

            });


            /*
             * The wake lock is released automatically when the
             * tab is hidden (e.g. switching apps). Re-request it
             * when the recipe page becomes visible again, as long
             * as baking mode is still turned on.
             */
            document.addEventListener(
                "visibilitychange",
                function () {

                    const shouldReacquire =
                        button.classList.contains("active") &&
                        !wakeLock &&
                        document.visibilityState === "visible";

                    if (shouldReacquire) {
                        requestWakeLock();
                    }

                }
            );

        });

}());
