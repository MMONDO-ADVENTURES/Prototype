document.addEventListener("DOMContentLoaded", function () {
    const counters = document.querySelectorAll(".stat-number");

    if (counters.length === 0) return;

    const animateCount = (counter) => {
        const target = +counter.innerText.replace(/[+,]/g, "");
        let count = 0;
        const speed = 200;
        const increment = Math.ceil(target / speed);

        const updateCount = () => {
            count += increment;
            if (count < target) {
                counter.innerText = count.toLocaleString();
                requestAnimationFrame(updateCount);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };

        updateCount();
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
});
