document.addEventListener("DOMContentLoaded", function () {
    const page = document.getElementById("transitionPage");
    const hint = document.getElementById("transitionHint");
    const nextPage = "../vis3/";

    let readyToContinue = false;
    let leaving = false;

    requestAnimationFrame(function () {
        page.classList.add("is-visible");
    });

    window.setTimeout(function () {
        readyToContinue = true;
        hint.classList.add("is-visible");
    }, 1100);

    function goToNextPage() {
        if (!readyToContinue || leaving) return;

        leaving = true;
        page.classList.add("is-fading-out");
        hint.classList.remove("is-visible");

        window.setTimeout(function () {
            window.location.href = nextPage;
        }, 700);
    }

    document.addEventListener("click", goToNextPage);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " " || event.code === "Space") {
            event.preventDefault();
            goToNextPage();
        }
    });
});