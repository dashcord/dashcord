const screen = document.createElement('div');
screen.setAttribute('id', 'modal-screen');
document.body.appendChild(screen);
const win = document.createElement('div');
win.setAttribute('id', 'modal-window');
win.innerHTML = `<div id="modal-window-text-container">
    <p id="modal-window-text">Lorem ipsum dolor set amet?</p>
    <input type="text" id="modal-window-input">
</div>
<div id="modal-window-controls-boolean" class="modal-window-controls">
    <div id="modal-window-button-yes" class="modal-window-button">
        <i class="mdi mdi-check"></i>
    </div>
    <div id="modal-window-button-no" class="modal-window-button">
        <i class="mdi mdi-close"></i>
    </div>
</div>
<div id="modal-window-controls-confirm" class="modal-window-controls">
    <div id="modal-window-button-ok" class="modal-window-button">
        <i class="mdi mdi-check"></i>
    </div>
</div>`;
document.body.appendChild(win);
const buttonYes = document.getElementById('modal-window-button-yes');
const buttonNo = document.getElementById('modal-window-button-no');
const buttonOk = document.getElementById('modal-window-button-ok');
const textBox = document.getElementById('modal-window-text');
const inputBox = document.getElementById('modal-window-input');

let modalTask = null;
let modalHandlerYes = null;
let modalHandlerNo = null;
function hideModal() {
  if (modalTask) window.clearTimeout(modalTask);
  win.classList.remove('visible');
  screen.classList.remove('visible');
  modalTask = window.setTimeout(function() {
    screen.style.display = win.style.display = 'none';
  }, 300);
}
function showModal(type, text, yesCb, noCb, initialValue) {
  if (modalTask) window.clearTimeout(modalTask);
  modalHandlerYes = yesCb;
  modalHandlerNo = noCb;
  textBox.innerText = text;
  inputBox.value = initialValue || '';
  screen.style.display = win.style.display = 'block';
  modalTask = window.setTimeout(function() {
    win.classList.remove('boolean', 'confirm', 'text');
    win.classList.add('visible', type);
    screen.classList.add('visible');
    inputBox.focus();
  }, 1);
}
function confirm(e) {
  hideModal();
  if (modalHandlerYes) modalHandlerYes(e, inputBox.value);
}
function cancel(e) {
  hideModal();
  if (modalHandlerNo) modalHandlerNo(e);
}
screen.onclick = cancel;
document.onkeydown = function(e) {
  if (e.keyCode === 27) cancel(e);
};
inputBox.onkeydown = function(e) {
  if (e.keyCode === 13) confirm(e);
};
buttonYes.onclick = buttonOk.onclick = confirm;
buttonNo.onclick = cancel;

