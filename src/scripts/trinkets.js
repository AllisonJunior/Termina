document.addEventListener('DOMContentLoaded', function () {
    // Caminho para o arquivo JSON
    const jsonFilePath = '../../../../json/players/items/trinkets.json';

    console.log(jsonFilePath);

    // Seleciona o tbody da tabela
    const tbody = document.querySelector('table tbody');

    // Função para carregar e adicionar os dados à tabela
    function loadDescriptions() {
        fetch(jsonFilePath)
            .then(response => response.json())
            .then(data => {
                data.forEach(item => {
                    // Cria uma nova linha para cada item
                    const tr = document.createElement('tr');

                    // Cria a célula da tabela e define o texto como a descrição
                    const td = document.createElement('td');
                    td.textContent = item.description;

                    // Adiciona a célula à linha
                    tr.appendChild(td);

                    // Adiciona a linha ao tbody
                    tbody.appendChild(tr);
                });
            })
            .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));
    }

    // Carrega as descrições ao carregar a página
    loadDescriptions();
});
