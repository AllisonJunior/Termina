// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Mapeamento de armaduras para seus respectivos caminhos de imagem
    const armorImages = {
        robe: '../../../resources/imgs/items/armor/robe_armor.png',
        padded: '../../../resources/imgs/items/armor/padded_armor.png',
        leather: '../../../resources/imgs/items/armor/leather_armor.png',
        studded_leather_armor: '../../../resources/imgs/items/armor/studded_leather_armor.png',

        hide: '../../../resources/imgs/items/armor/hide_armor.png',
        chain_shirt: '../../../resources/imgs/items/armor/chain_shirt_armor.png',
        scale_mail: '../../../resources/imgs/items/armor/scale_mail_armor.png',
        spiked_armor: '../../../resources/imgs/items/armor/spiked_armor.png',
        breastplate: '../../../resources/imgs/items/armor/breastplate_armor.png',
        halfplate: '../../../resources/imgs/items/armor/halfplate_armor.png',

        ringmail: '../../../resources/imgs/items/armor/ringmail_armor.png',
        chainmail: '../../../resources/imgs/items/armor/chainmail_armor.png',
        splint: '../../../resources/imgs/items/armor/splint_armor.png',
        plate: '../../../resources/imgs/items/armor/plate_armor.png',        
        titanite: '../../../resources/imgs/items/armor/titanite_armor.png',        
        
        shield: '../../../resources/imgs/items/armor/shield.png',
        small_shield: '../../../resources/imgs/items/armor/small_shield.png',
        titanite_shield: '../../../resources/imgs/items/armor/titanite_shield.png',





        club: '../../../resources/imgs/items/weapons/club.png',
        dagger: '../../../resources/imgs/items/weapons/dagger.png',
        greatclub: '../../../resources/imgs/items/weapons/greatclub.png',
        handaxe: '../../../resources/imgs/items/weapons/handaxe.png',
        javelin: '../../../resources/imgs/items/weapons/javelin.png',
        light_hammer: '../../../resources/imgs/items/weapons/light_hammer.png',
        mace: '../../../resources/imgs/items/weapons/mace.png',
        quatterstaff: '../../../resources/imgs/items/weapons/quatterstaff.png',
        sickle: '../../../resources/imgs/items/weapons/sickle.png',
        spear: '../../../resources/imgs/items/weapons/spear.png',

        light_crossbow: '../../../resources/imgs/items/weapons/light_crossbow.png',
        dart: '../../../resources/imgs/items/weapons/dart.png',
        shortbow: '../../../resources/imgs/items/weapons/shortbow.png',
        sling: '../../../resources/imgs/items/weapons/sling.png',
    };

    const modal = document.getElementById('myModal');
    const modalContent = document.getElementById('modalContent');
    const closeBtn = document.querySelector('.close');

    // Estilos para centralizar a imagem
    modalContent.style.display = 'flex';
    modalContent.style.justifyContent = 'center';
    modalContent.style.alignItems = 'center';
    modalContent.style.height = '100%'; // Garante que o conteúdo ocupe a altura total do modal

    // Seleciona todos os links de armadura
    const armorLinks = document.querySelectorAll('.link');

    armorLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Impede o comportamento padrão do link

            const armorKey = this.getAttribute('data-armor');
            const imageSrc = armorImages[armorKey];

            if (imageSrc) {
                modalContent.innerHTML = `<img src="${imageSrc}" alt="Imagem do item" style="max-width: 100%; height: auto;">`;
                modal.style.display = 'block';
            } else {
                modalContent.innerHTML = '<p>Imagem não encontrada.</p>';
                modal.style.display = 'block';
            }
        });
    });

    // Fecha a modal ao clicar no 'X'
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Fecha a modal ao clicar fora do conteúdo
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});
