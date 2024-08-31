document.addEventListener("DOMContentLoaded", function() {
    fetch('../../../json/players/backgrounds.json')
        .then(response => response.json())
        .then(backgrounds => {
            backgrounds.forEach((background, index) => {
                const container = document.querySelector(".backag");
  
                if (container) {
                    const backgroundDiv = document.createElement("div");
                    backgroundDiv.className = "background";
  
                    // Define a cor de fundo e o padding
                    backgroundDiv.style.backgroundColor = (index % 2 === 0) ? "aliceblue" : "#fff";
                    backgroundDiv.style.padding = "10px"; // Define o padding
  
                    const backgroundName = document.createElement("a");
                    backgroundName.href = "#";
                    backgroundName.textContent = background.name;
                    backgroundName.addEventListener('click', function(event) {
                        event.preventDefault();
                        openModal(background.name); // Passa o nome do background como parâmetro
                    });
  
                    const backgroundDesc = document.createElement("p");
                    backgroundDesc.textContent = background.desc;
  
                    backgroundDiv.appendChild(backgroundName);
                    backgroundDiv.appendChild(backgroundDesc);
                    container.appendChild(backgroundDiv);
                }
            });
        })
        .catch(error => {
            console.error('Erro ao carregar o arquivo JSON:', error);
        });
});

// Funções para abrir e fechar a modal (conforme o código anterior)
// Obter elementos da modal e do botão de fechar
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];
var modalContent = document.getElementById("modalContent");

function openModal(backgroundName) {
    const markdownFilePath = `../../../json/players/backgrounds/${backgroundName}.md`;

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
