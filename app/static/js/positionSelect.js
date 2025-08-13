document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('#position-buttons button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('border-primary'));
            btn.classList.add('border-primary');
        });
    });
});