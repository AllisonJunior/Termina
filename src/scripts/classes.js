// scripts.js

// Função para carregar o arquivo JSON e exibir os dados
async function loadClasses() {
    try {
        // Carrega o arquivo JSON
        const response = await fetch('../../../json/players/classes.json');
        
        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error('Erro na resposta da rede: ' + response.statusText);
        }

        // Tenta converter a resposta em JSON
        const data = await response.json();

        // Obtém a div onde os links serão adicionados
        const classesDiv = document.getElementById('classes');
        
        // Adiciona cada item do JSON como um elemento <a>
        data.forEach(item => {
            const link = document.createElement('a');
            link.href = item.link;
            link.textContent = item.nome;
            link.title = item.descricao;
            link.className = 'class-link'; // Adiciona uma classe para estilização (opcional)
            
            // Adiciona o link à div
            classesDiv.appendChild(link);
            
            // Adiciona uma quebra de linha (opcional)
            classesDiv.appendChild(document.createElement('br'));
        });
    } catch (error) {
        console.error('Erro ao carregar o JSON:', error);
    }
}

// Chama a função para carregar as classes quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', loadClasses);
