export function createNavBar ()
{
 // Criação da nossa barra de navegação e definição da sua classe para 
 // estilização via Css   
 const navBar = document . createElement ( "nav" );   
 navBar . className = "navBar";

 navBar . innerHTML = `
 <button class="system_title" type="button" setPage="home">
          Termina
 </button>

 <hr class="system_title_separator">

 <ul class = "system_sections">
      <li> <button setPage = "lore"> História </button> </li>
      <li> <button setPage = "characters"> Personagens </button> </li>
      <li class="system_sections_separator" aria-hidden="true"></li>
      <li> <button setPage = "system"> Sistema </button> </li>
 </ul>
 `;

 // Após modificações e definições, inserimos a navbar no topo do body (inserir no head não funciona)
 document . body . prepend ( navBar );

 return navBar;
}