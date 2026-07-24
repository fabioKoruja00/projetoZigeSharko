const botaoTrailer = document.querySelector(".botao-trailer");
const botaoFecharModal = document.querySelector(".fechar-modal");
const video = document.getElementById("video");
const modal = document.querySelector(".modal");

function abrirModal() {
  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden", "false");
  modal.inert = false;
  video.src = video.dataset.src;
  document.body.classList.add("modal-aberto");
  botaoFecharModal.focus();
}

function fecharModal() {
  modal.classList.remove("aberto");
  modal.setAttribute("aria-hidden", "true");
  modal.inert = true;
  video.removeAttribute("src");
  document.body.classList.remove("modal-aberto");
  botaoTrailer.focus();
}

botaoTrailer.addEventListener("click", abrirModal);
botaoFecharModal.addEventListener("click", fecharModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    fecharModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("aberto")) {
    fecharModal();
  }
});
