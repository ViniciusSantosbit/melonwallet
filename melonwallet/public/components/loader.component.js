export function hideLoader(delayMs = 1500) {
    setTimeout(() => {
        const loader = document.getElementById('loader-wrapper');
        if (loader) loader.classList.add('fade-out');
    }, delayMs);
}
