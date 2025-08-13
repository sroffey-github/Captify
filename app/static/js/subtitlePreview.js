document.addEventListener('DOMContentLoaded', () => {
    const previewInput = document.getElementById('preview-input');
    const fontSelect = document.getElementById('font-family-select');
    const fontSlider = document.getElementById('font-size-slider');
    const fontValue = document.getElementById('font-size-value');
    const colourButtons = document.querySelectorAll('#text-colour-buttons button');
    const bgSelect = document.getElementById('background-select');

    // Font family
    fontSelect.addEventListener('change', () => {
        previewInput.style.fontFamily = fontSelect.value;
    });

    // Font size
    fontSlider.addEventListener('input', () => {
        fontValue.textContent = fontSlider.value;
        previewInput.style.fontSize = fontSlider.value + 'px';
    });

    // Text colour buttons
    colourButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colourButtons.forEach(b => b.classList.remove('border-primary'));
            btn.classList.add('border-primary');

            const computedColor = window.getComputedStyle(btn).backgroundColor;
            previewInput.style.color = computedColor;
            previewInput.value = "Subtitle Preview";
        });
    });

    // Background
    bgSelect.addEventListener('change', () => {
        previewInput.style.backgroundColor = bgSelect.value === 'Transparent' ? 'transparent' : bgSelect.value.toLowerCase();
    });
});