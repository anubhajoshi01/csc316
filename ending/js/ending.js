document.addEventListener("DOMContentLoaded", function () {
    const page = document.getElementById("endingPage");
    const hint = document.getElementById("endingHint");
    const lines = [
        document.getElementById("line1"),
        document.getElementById("line2"),
        document.getElementById("line3")
    ];
    const backButton = document.getElementById("backButton");

    const NEXT_PAGE = "../opening/index.html";

    let currentIndex = 0;
    let ready = false;
    let animating = false;
    let leaving = false;

    function showLine(index) {
        lines[index].classList.remove("is-leaving");
        lines[index].classList.add("is-visible");
    }

    function hideLine(index) {
        lines[index].classList.remove("is-visible");
        lines[index].classList.add("is-leaving");
    }

    function clearLeaving(index) {
        lines[index].classList.remove("is-leaving");
    }

    function goToNextPage() {
        if (leaving) return;

        leaving = true;
        hint.classList.remove("is-visible");
        page.classList.add("is-fading-out");

        window.setTimeout(function () {
            window.location.href = NEXT_PAGE;
        }, 800);
    }

    function handleAdvance() {
        if (!ready || animating || leaving) return;

        // Last line is already shown -> move it up and show button
        if (currentIndex === lines.length - 1) {
            animating = true;
            lines[currentIndex].classList.add("is-sliding-up");
            
            window.setTimeout(function () {
                backButton.classList.add("is-visible");
                animating = false;
            }, 1125);
            return;
        }

        animating = true;

        hideLine(currentIndex);

        window.setTimeout(function () {
            clearLeaving(currentIndex);
            currentIndex += 1;
            showLine(currentIndex);
            animating = false;
        }, 750);
    }

    requestAnimationFrame(function () {
        page.classList.add("is-visible");

        window.setTimeout(function () {
            showLine(0);
            hint.classList.add("is-visible");
            ready = true;
        }, 350);
    });

    document.addEventListener("click", handleAdvance);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " " || event.code === "Space") {
            event.preventDefault();
            handleAdvance();
        }
    });
});