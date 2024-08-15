document.addEventListener("DOMContentLoaded", function() {
    fetch('../../../json/players/races.json')
        .then(response => response.json())
        .then(races => {
            const types = new Set(races.map(race => race.type));
            
            types.forEach(type => {
                const filteredRaces = races.filter(race => race.type === type);
                filteredRaces.forEach((race, index) => {
                    const divClass = `.lin_${type}`;
                    const container = document.querySelector(divClass);
  
                    if (container) {
                        const raceDiv = document.createElement("div");
                        raceDiv.className = "race";
  
                        const raceName = document.createElement("a");
                        raceName.href = "#";
                        raceName.textContent = race.name;
                        raceName.addEventListener('click', function(event) {
                            event.preventDefault();
                            openModal(race.key); // Passa a chave da raça como parâmetro
                        });
  
                        const raceDesc = document.createElement("p");
                        raceDesc.textContent = race.desc;
  
                        raceDiv.appendChild(raceName);
                        raceDiv.appendChild(raceDesc);
                        container.appendChild(raceDiv);
  
                        // Se for o último item do tipo, adiciona um <br>
                        if (index === filteredRaces.length - 1) {
                            container.appendChild(document.createElement("br"));
                        }
                    }
                });
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

function openModal(raceKey) {
    const markdownFilePath = `../../../json/players/races/${raceKey}.md`;

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
