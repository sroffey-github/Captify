document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('#text-colour-buttons button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('border-2', 'border-primary')); 
        btn.classList.add('border-2', 'border-primary');
      });
    });
});