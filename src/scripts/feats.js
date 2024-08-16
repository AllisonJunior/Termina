document.addEventListener("DOMContentLoaded", function() {
    fetch('../../../json/players/feats.json')
        .then(response => response.json())
        .then(feats => {
            feats.forEach((feats, index) => {
                const container = document.querySelector(".featsList");
  
                if (container) {
                    const featsDiv = document.createElement("div");
                    feats.className = "feats";
  
                    // Define a cor de fundo e o padding
                    featsDiv.style.backgroundColor = (index % 2 === 0) ? "aliceblue" : "#fff";
                    featsDiv.style.padding = "10px"; // Define o padding
  
                    const featsName = document.createElement("a");
                    featsName.href = "#";
                    featsName.textContent = feats.name;
                    featsName.addEventListener('click', function(event) {
                        event.preventDefault();
                        openModal(feats.name); // Passa o nome do background como parâmetro
                    });
  
                    const featsDesc = document.createElement("p");
                    featsDesc.textContent = feats.desc;
  
                    featsDiv.appendChild(featsName);
                    featsDiv.appendChild(featsDesc);
                    container.appendChild(featsDiv);
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

function openModal(featName) {
    const markdownFilePath = `../../../json/players/feats/${featName}.md`;

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
