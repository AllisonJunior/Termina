// Imports
import { createNavBar  } from "./navbar.js";
import { initializeSPA } from "./SPA.js";

// Função de Configuração e Manipulação Geral das páginas do Sistema (Web App)
function startApp ()
{
 // Vars | Elements
 const favIcon = document . createElement ( "link" ); 
 favIcon . rel    = "icon";
 favIcon . href   = "res/favicons/icon.png"; 

 // Detalhes Genéricos da Página (Icone, Título, Navbar, etc)
 document . title = "Termina";
 document . head . appendChild ( favIcon );

 // Itens carregados via import 
 const navBar = createNavBar ();

 // Inicialização do SPA (Single Page Application)
 initializeSPA ( navBar );
}

// Main
startApp ();
