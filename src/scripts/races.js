document.addEventListener("DOMContentLoaded", function() {
  fetch('../../../json/players/races.json')
      .then(response => response.json())
      .then(races => {
          races.forEach(race => {
              const divClass = `.lin_${race.type}`;
              const container = document.querySelector(divClass);

              if (container) {
                  const raceDiv = document.createElement("div");
                  raceDiv.className = "race";

                  const raceName = document.createElement("a");
                  raceName.href = "#";
                  raceName.textContent = race.name;
                  raceName.addEventListener('click', function(event) {
                      event.preventDefault();
                      openModal(race.name); // Passa o nome da raça como parâmetro
                  });

                  raceDiv.appendChild(raceName);
                  container.appendChild(raceDiv);
              }
          });
      })
      .catch(error => {
          console.error('Erro ao carregar o arquivo JSON:', error);
      });
});

// Obter elementos da modal e do botão de fechar
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];
var modalContent = document.getElementById("modalContent");

function openModal(raceName) {
    const markdownFilePath = `../../../json/players/races/${raceName}.md`;

    fetch(markdownFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Arquivo Markdown não encontrado');
            }
            return response.text();
        })
        .then(markdown => {
            // Converte Markdown para HTML usando marked.js
            const htmlContent = marked.parse(markdown);

            // Limpa o conteúdo atual da modal
            modalContent.innerHTML = '';

            // Insere o conteúdo HTML convertido na modal
            modalContent.innerHTML = htmlContent;

            // Exibe a modal
            modal.style.display = "block";
        })
        .catch(error => {
            console.error('Erro ao carregar o arquivo Markdown:', error);
        });
}




// Função para fechar a modal
function closeModal() {
  modal.style.display = "none";
}

// Quando o usuário clicar no botão de fechar, fecha a modal
span.onclick = function() {
  closeModal();
}

// Quando o usuário clicar fora da modal, fecha a modal
window.onclick = function(event) {
  if (event.target == modal) {
      closeModal();
  }
}
