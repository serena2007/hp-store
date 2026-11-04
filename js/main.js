// HP Store - script commun à toutes les pages

// Le panier est stocké dans localStorage sous la clé "panier"
// Format : [{ "id": 1, "quantite": 2 }, { "id": 4, "quantite": 1 }]
function lirePanier() {
    try {
        return JSON.parse(localStorage.getItem("panier")) || [];
    } catch (erreur) {
        return [];
    }
}

// Affiche le nombre total d'articles à côté de l'icône du panier
function majCompteurPanier() {
    const compteur = document.getElementById("compteur-panier");
    if (!compteur) return;
    const total = lirePanier().reduce((somme, article) => somme + (article.quantite || 0), 0);
    compteur.textContent = total;
}

// Case "Inclure la TVA" : bascule les prix entre TTC et HT (TVA à 20 %)
function formaterPrix(valeur) {
    return valeur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function initTVA() {
    const case_tva = document.getElementById("inclure-tva");
    if (!case_tva) return;
    case_tva.addEventListener("change", function () {
        document.querySelectorAll("[data-ttc]").forEach(function (element) {
            const ttc = parseFloat(element.dataset.ttc);
            element.textContent = formaterPrix(case_tva.checked ? ttc : ttc / 1.2);
        });
        document.querySelectorAll(".prix-etiquette").forEach(function (element) {
            element.textContent = case_tva.checked ? "TVA incluse" : "HT";
        });
    });
}

// Bannière : défilement automatique avec bouton Pause / Lecture
function initBanniere() {
    const banniere = document.getElementById("banniere");
    const bouton = document.getElementById("pause-banniere");
    if (!banniere || !bouton || typeof bootstrap === "undefined") return;
    const carrousel = bootstrap.Carousel.getOrCreateInstance(banniere);
    let enPause = false;
    bouton.addEventListener("click", function () {
        enPause = !enPause;
        if (enPause) { carrousel.pause(); } else { carrousel.cycle(); }
        bouton.textContent = enPause ? "Lecture" : "Pause";
        bouton.setAttribute("aria-label", enPause ? "Reprendre le défilement" : "Mettre le défilement en pause");
    });
}

// Inscription newsletter (démonstration : rien n'est envoyé)
function initNewsletter() {
    const formulaire = document.getElementById("form-newsletter");
    const message = document.getElementById("message-newsletter");
    if (!formulaire || !message) return;
    formulaire.addEventListener("submit", function (evenement) {
        evenement.preventDefault();
        message.textContent = "Merci ! Votre inscription est enregistrée (démonstration).";
        formulaire.reset();
    });
}

document.addEventListener("DOMContentLoaded", function () {
    majCompteurPanier();
    initTVA();
    initNewsletter();
    initBanniere();
});

// Mise à jour du compteur quand le panier change dans un autre onglet
window.addEventListener("storage", majCompteurPanier);