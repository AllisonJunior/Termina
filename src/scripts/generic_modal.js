// modal.js

// Função para carregar conteúdo Markdown de um arquivo
async function loadMarkdown(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Failed to fetch the markdown file:', error);
        return 'Failed to load content.';
    }
}

// Função para abrir o modal e carregar o conteúdo
function openModal(fileName, className) {
    const filePath = `../../../../json/players/classes/${className}/${fileName}.md`;
    loadMarkdown(filePath).then(content => {
        // Converte Markdown para HTML usando marked.js
        const htmlContent = marked.parse(content);

        // Limpa o conteúdo atual da modal
        document.getElementById('modalContent').innerHTML = '';

        // Insere o conteúdo HTML convertido na modal
        document.getElementById('modalContent').innerHTML = htmlContent;

        // Exibe a modal
        document.getElementById('myModal').style.display = 'block';
    });
}

// Evento para fechar o modal
document.addEventListener('DOMContentLoaded', function() {
    // Obter elementos da modal e do botão de fechar
    const modal = document.getElementById('myModal');
    const closeButton = document.querySelector('.close');

    // Adicionar evento ao botão de fechar
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Adicionar eventos aos links
    document.querySelectorAll('.linker').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const fileName = this.getAttribute('nameOfFile');
            const className = this.getAttribute('nameOfClass');
            openModal(fileName, className);
        });
    });

    // Quando o usuário clicar fora da modal, fecha a modal
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
