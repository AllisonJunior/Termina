document.addEventListener("DOMContentLoaded", function() {
    const spellSection = document.querySelector(".spell_section");
    let spellsData = [];
    let selectedLevel = "0"; // Define o nível padrão como 0 (Cantrip)
    const schoolNames = {
        'abjuration': 'Abjuração',
        'necromancy': 'Necromância',
        'divination': 'Divinação',
        'enchantment': 'Encantamento',
        'conjuration': 'Conjuração',
        'evocation': 'Evocação',
        'illusion': 'Ilusão',
        'transmutation': 'Transmutação'
    };

    function formatSpellName(spell) {
        switch (spell.type) {
            case 'c':
                return `${spell.name} 🅲`;
            case 'r':
                return `${spell.name} 🆁`;
            case 'b':
                return `${spell.name} 🅲🆁`;
            default:
                return spell.name; // Para o tipo 'n' ou qualquer outro tipo não especificado
        }
    }

    function createTableRow(spell) {
        const row = document.createElement("tr");
    
        const nameCell = document.createElement("td");
        const schoolCell = document.createElement("td");
        const castCell = document.createElement("td");
        const rangeCell = document.createElement("td");
        const durationCell = document.createElement("td");
    
        // Cria o link e define seu comportamento
        const link = document.createElement("a");
        link.href = "#"; // Define o href para # para que o link não navegue para outra página
        link.textContent = formatSpellName(spell);
        link.addEventListener("click", (event) => {
            event.preventDefault(); // Impede o comportamento padrão do link
            openModal(spell.name); // Abre a modal com o nome da magia
        });
    
        // Adiciona o link à célula de nome
        nameCell.appendChild(link);
    
        // Usa o mapeamento para exibir o nome da escola de forma organizada
        schoolCell.textContent = schoolNames[spell.school] || spell.school;
        castCell.textContent = spell.cast;
        rangeCell.textContent = spell.range;
        durationCell.textContent = spell.duration;
    
        row.appendChild(nameCell);
        row.appendChild(schoolCell);
        row.appendChild(castCell);
        row.appendChild(rangeCell);
        row.appendChild(durationCell);
    
        return row;
    }
    
    // Funções para abrir e fechar a modal (conforme o código anterior)
    // Obter elementos da modal e do botão de fechar
    var modal = document.getElementById("myModal");
    var span = document.getElementsByClassName("close")[0];
    var modalContent = document.getElementById("modalContent");
    
    function openModal(spellName) {
        const markdownFilePath = `../../../json/players/spells/${spellName}.md`;
    
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
    
    // Fecha a modal quando o usuário clica no (x)
    span.onclick = function() {
        modal.style.display = "none";
    }
    
    // Fecha a modal se o usuário clicar fora dela
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    

    // Função para carregar e processar o arquivo JSON
    function loadSpells() {
        fetch('../../../json/players/spells.json')
            .then(response => response.json())
            .then(data => {
                spellsData = data;
                filterSpells(); // Filtra e exibe as magias ao carregar
            })
            .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));
    }

    // Função para filtrar e exibir as magias com base nos filtros selecionados
    function filterSpells() {
        spellSection.innerHTML = '';

        // Obtém os valores selecionados dos checkboxes de escolas
        const selectedSchools = Array.from(document.querySelectorAll('input[name="school"]:checked')).map(cb => cb.value);

        // Obtém os valores selecionados dos checkboxes de classes
        const selectedClasses = Array.from(document.querySelectorAll('input[name="class"]:checked')).map(cb => cb.value);

        // Filtra as magias com base nos filtros de nível, escola e classes
        const filteredSpells = spellsData.filter(spell => {
            const isLevelMatch = spell.level === selectedLevel;
            const isSchoolMatch = selectedSchools.length === 0 || selectedSchools.includes(spell.school);
            const isClassMatch = selectedClasses.length === 0 || spell.classes.some(cls => selectedClasses.includes(cls));

            return isLevelMatch && isSchoolMatch && isClassMatch;
        });

        // Adiciona as magias filtradas na tabela
        filteredSpells.forEach(spell => {
            const row = createTableRow(spell);
            spellSection.appendChild(row);
        });
    }

    // Função para filtrar por nível e manter os filtros de escola e classes
    function filterSpellsByLevel(level) {
        selectedLevel = level; // Atualiza o nível selecionado
        filterSpells(); // Reaplica os filtros
    }

    // Adiciona event listeners aos checkboxes de filtros
    const filterCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", filterSpells);
    });

    // Adiciona event listeners aos botões de nível
    const buttons = document.querySelectorAll(".spellsLevel .btn");

    buttons.forEach((button, index) => {
        button.addEventListener("click", () => {
            // Remove a classe .active de todos os botões
            buttons.forEach(btn => btn.classList.remove("active"));
            
            // Adiciona a classe .active ao botão clicado
            button.classList.add("active");
            
            const level = button.textContent.trim();
            // Atualiza o nível selecionado com base no texto do botão
            filterSpellsByLevel(level === "Truques" ? "0" : index.toString());
        });
    });

    // Aplica a classe .active ao botão correspondente ao nível padrão


    loadSpells(); // Carrega as magias ao iniciar
});

// Função para aplicar filtros com base nos parâmetros da URL
// Função para aplicar filtros com base nos parâmetros da URL
function applyFiltersFromQueryParams() {
    const params = new URLSearchParams(window.location.search);

    const schools = params.get('schools');
    const classes = params.get('classes');
    const level = params.get('level');
    const spell = params.get('spell'); // Adiciona o parâmetro para a magia específica

    // Marca as checkboxes das escolas de magia
    if (schools) {
        schools.split(',').forEach(school => {
            const schoolCheckbox = document.querySelector(`input[name="school"][value="${school}"]`);
            if (schoolCheckbox) {
                schoolCheckbox.checked = true;
            }
        });
    }

    // Marca as checkboxes das classes
    if (classes) {
        classes.split(',').forEach(cls => {
            const classCheckbox = document.querySelector(`input[name="class"][value="${cls}"]`);
            if (classCheckbox) {
                classCheckbox.checked = true;
            }
        });
    }

    // Seleciona o botão de nível
    if (level) {
        const levelButton = document.querySelector(`.spellsLevel button[id="${level}"]`);
        if (levelButton) {
            levelButton.classList.add('active');
            filterSpellsByLevel(level); // Atualiza o filtro de nível
        }
    }

    // Abre a modal da magia específica se o parâmetro "spell" estiver presente
    if (spell) {
        openModal(spell); // Chama a função para abrir a modal
    }
}

// Chama a função quando a página carrega
window.onload = function() {
    applyFiltersFromQueryParams();
};
