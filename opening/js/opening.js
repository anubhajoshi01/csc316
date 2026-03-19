function generateStars() {
    const container = document.querySelector(".transition-stars");
    const starCount = 120;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement("span");
        star.classList.add("star");

        const rand = Math.random();
        if (rand < 0.7) star.classList.add("small");
        else if (rand < 0.95) star.classList.add("medium");
        else star.classList.add("large");

        star.style.left = Math.random() * 98 + "%";
        star.style.top = Math.random() * 98 + "%";

        star.style.opacity = 0.3 + Math.random() * 0.7;

        container.appendChild(star);
    }
}

generateStars();


document.addEventListener("DOMContentLoaded", function () {
    const page = document.getElementById("openingPage");
    const hint = document.getElementById("openingHint");
    const lines = [
        document.getElementById("line1"),
        document.getElementById("line2"),
        document.getElementById("line3")
    ];

    const NEXT_PAGE = "../scale/index.html";

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

        if (currentIndex === lines.length - 1) {
            goToNextPage();
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