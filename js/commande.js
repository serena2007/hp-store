// HP Store - page de commande (récapitulatif du panier + formulaire fictif)
// Lit : localStorage "panier" = [{ "id": 1, "quantite": 2 }]
//       localStorage "codePromo" (facultatif) = "AUTOMNE20"
//       data/produits.json (champs utilisés : id, nom, prix TTC)

const SEUIL_LIVRAISON_GRATUITE = 30;   // livraison gratuite dès 30 €
const FRAIS_LIVRAISON = 5;
const CODES_PROMO = {
    AUTOMNE20: { taux: 0.20, minimum: 500 },
    AUTOMNE25: { taux: 0.25, minimum: 2000 },
};

function formaterEuros(valeur) {
    return valeur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function lireArticles() {
    try {
        return JSON.parse(localStorage.getItem("panier")) || [];
    } catch (erreur) {
        return [];
    }
}

async function chargerProduits() {
    const reponse = await fetch("../data/produits.json");
    if (!reponse.ok) throw new Error("produits.json introuvable");
    return reponse.json();
}

// Calcule les lignes et les totaux à partir du panier
function calculerRecap(articles, produits) {
    const lignes = [];
    articles.forEach(function (article) {
        const produit = produits.find(function (p) { return p.id === article.id; });
        if (produit) lignes.push({ nom: produit.nom, quantite: article.quantite, total: produit.prix * article.quantite });
    });
    const sousTotal = lignes.reduce(function (somme, ligne) { return somme + ligne.total; }, 0);
    const code = (localStorage.getItem("codePromo") || "").toUpperCase();
    const promo = CODES_PROMO[code];
    const reduction = promo && sousTotal >= promo.minimum ? sousTotal * promo.taux : 0;
    const apresRemise = sousTotal - reduction;
    const livraison = apresRemise >= SEUIL_LIVRAISON_GRATUITE ? 0 : FRAIS_LIVRAISON;
    return { lignes, sousTotal, reduction, livraison, total: apresRemise + livraison };
}

function afficherRecap(recap) {
    const liste = document.getElementById("liste-recap");
    liste.textContent = "";
    recap.lignes.forEach(function (ligne) {
        const element = document.createElement("li");
        element.className = "recap-ligne";
        const nom = document.createElement("span");
        nom.textContent = ligne.quantite + " × " + ligne.nom;
        const prix = document.createElement("span");
        prix.textContent = formaterEuros(ligne.total);
        element.append(nom, prix);
        liste.appendChild(element);
    });
    document.getElementById("sous-total").textContent = formaterEuros(recap.sousTotal);
    document.getElementById("ligne-reduction").hidden = recap.reduction === 0;
    document.getElementById("reduction").textContent = "-" + formaterEuros(recap.reduction);
    document.getElementById("livraison").textContent = recap.livraison === 0 ? "Gratuite" : formaterEuros(recap.livraison);
    document.getElementById("total").textContent = formaterEuros(recap.total);
}

function confirmerCommande(formulaire) {
    const numero = "HP-" + Date.now().toString().slice(-8);
    document.getElementById("numero-commande").textContent = numero;
    document.getElementById("message-confirmation").textContent =
        "Merci " + formulaire.prenom.value + " ! Un e-mail de confirmation serait envoyé à " + formulaire.email.value + ".";
    document.getElementById("zone-commande").hidden = true;
    document.getElementById("confirmation").hidden = false;
    localStorage.removeItem("panier");
    localStorage.removeItem("codePromo");
    if (typeof majCompteurPanier === "function") majCompteurPanier();   // défini dans main.js
    window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", async function () {
    const articles = lireArticles();
    const zone = document.getElementById("zone-commande");
    const panierVide = document.getElementById("panier-vide");
    const formulaire = document.getElementById("form-commande");

    if (articles.length === 0) {
        panierVide.hidden = false;
        return;
    }
    zone.hidden = false;

    try {
        const produits = await chargerProduits();
        afficherRecap(calculerRecap(articles, produits));
    } catch (erreur) {
        const message = document.getElementById("erreur-recap");
        message.textContent = "Impossible de charger les produits. Ouvrez le site avec Live Server ou GitHub Pages.";
        message.hidden = false;
    }

    formulaire.addEventListener("submit", function (evenement) {
        evenement.preventDefault();
        if (!formulaire.checkValidity()) {
            formulaire.classList.add("was-validated");
            const premiereErreur = formulaire.querySelector(":invalid");
            if (premiereErreur) premiereErreur.focus();
            return;
        }
        confirmerCommande(formulaire);
    });
});