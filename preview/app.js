const buttons = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    buttons.forEach((item) => item.classList.remove('active'));
    screens.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.dataset.screen).classList.add('active');
  });
});

