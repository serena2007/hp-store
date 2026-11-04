"use strict";

/* Catalogue : chargement du JSON, recherche, filtres, tri, affichage des cartes.
   Dépend de js/panier.js (lirePanier, ajouterAuPanier), chargé avant ce fichier. */

const URL_JSON = "../data/produits.json";
const SEUIL_STOCK_FAIBLE = 5;
const formatPrix = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

let tousLesProduits = [];

const el = {
  liste: document.getElementById("liste-produits"),
  compteur: document.getElementById("compteur-resultats"),
  aucunResultat: document.getElementById("aucun-resultat"),
  erreur: document.getElementById("message-erreur"),
  recherche: document.getElementById("filtre-recherche"),
  categorie: document.getElementById("filtre-categorie"),
  usage: document.getElementById("filtre-usage"),
  prixMin: document.getElementById("filtre-prix-min"),
  prixMax: document.getElementById("filtre-prix-max"),
  dispo: document.getElementById("filtre-dispo"),
  tri: document.getElementById("tri"),
  formulaire: document.getElementById("formulaire-filtres"),
  toast: document.getElementById("toast-panier"),
  toastMessage: document.getElementById("toast-message"),
};

/* ---------- Utilitaires ---------- */

function echapper(texte) {
  const remplacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texte).replace(/[&<>"']/g, (c) => remplacements[c]);
}

// "Écran" et "ecran" doivent donner le même résultat
function normaliser(texte) {
  return String(texte).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/* ---------- Filtres et tri ---------- */

function lireFiltres() {
  return {
    recherche: normaliser(el.recherche.value),
    categorie: el.categorie.value,
    usage: el.usage.value,
    prixMin: parseFloat(el.prixMin.value),
    prixMax: parseFloat(el.prixMax.value),
    dispoSeulement: el.dispo.checked,
    tri: el.tri.value,
  };
}

function filtrerEtTrier(produits, f) {
  const resultat = produits.filter((p) => {
    if (f.recherche && !normaliser(`${p.nom} ${p.reference}`).includes(f.recherche)) return false;
    if (f.categorie && p.categorie !== f.categorie) return false;
    if (f.usage && ![].concat(p.usage).includes(f.usage)) return false;
    if (!Number.isNaN(f.prixMin) && p.prix < f.prixMin) return false;
    if (!Number.isNaN(f.prixMax) && p.prix > f.prixMax) return false;
    if (f.dispoSeulement && p.stock <= 0) return false;
    return true;
  });

  if (f.tri === "prix-asc") resultat.sort((a, b) => a.prix - b.prix);
  else if (f.tri === "prix-desc") resultat.sort((a, b) => b.prix - a.prix);
  else if (f.tri === "nom") resultat.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return resultat;
}

/* ---------- Affichage ---------- */

function badgeStock(stock) {
  if (stock <= 0) return '<span class="badge text-bg-secondary">Rupture de stock</span>';
  if (stock <= SEUIL_STOCK_FAIBLE) return `<span class="badge text-bg-warning">Plus que ${stock} en stock</span>`;
  return '<span class="badge text-bg-success">En stock</span>';
}

function creerCarte(p) {
  const enStock = p.stock > 0;
  const caracteristiques = Object.values(p.caracteristiques || {})
    .slice(0, 3)
    .map((valeur) => `<li>${echapper(valeur)}</li>`)
    .join("");

  return `
    <div class="col">
      <article class="card h-100 carte-produit ${enStock ? "" : "carte-produit-rupture"}">
        <img src="../images/${echapper(p.image)}" class="card-img-top carte-produit-image"
             alt="${echapper(p.nom)}" width="400" height="300" loading="lazy">
        <div class="card-body d-flex flex-column">
          <div class="mb-2">${badgeStock(p.stock)}</div>
          <h2 class="carte-produit-nom">
            <a href="produit.html?id=${encodeURIComponent(p.id)}">${echapper(p.nom)}</a>
          </h2>
          <ul class="carte-produit-caracteristiques mb-3">${caracteristiques}</ul>
          <p class="mt-auto mb-3">
            <span class="carte-produit-prix">${formatPrix.format(p.prix)}</span>
            <span class="carte-produit-tva">TVA incluse</span>
          </p>
          <div class="d-grid gap-2">
            <a class="btn btn-outline-primary" href="produit.html?id=${encodeURIComponent(p.id)}">Voir produit</a>
            <button type="button" class="btn btn-primary btn-ajouter" data-id="${echapper(p.id)}" ${enStock ? "" : "disabled"}>
              ${enStock ? "Ajouter au panier" : "Indisponible"}
            </button>
          </div>
        </div>
      </article>
    </div>`;
}

function afficher() {
  const produits = filtrerEtTrier(tousLesProduits, lireFiltres());
  el.liste.innerHTML = produits.map(creerCarte).join("");
  el.aucunResultat.classList.toggle("d-none", produits.length > 0);
  el.compteur.textContent =
    produits.length === 0 ? "" : `${produits.length} produit${produits.length > 1 ? "s" : ""}`;
}

function reinitialiserFiltres() {
  el.formulaire.reset();
  el.tri.value = "pertinence";
  afficher();
}

/* ---------- Panier ---------- */

function afficherToast(message) {
  el.toastMessage.textContent = message;
  bootstrap.Toast.getOrCreateInstance(el.toast, { delay: 3500 }).show();
}

function gererAjout(id) {
  const produit = tousLesProduits.find((p) => String(p.id) === id);
  if (!produit || produit.stock <= 0) return;

  const ligne = lirePanier().find((l) => String(l.id) === id);
  const dejaDansLePanier = ligne ? ligne.quantite : 0;

  if (dejaDansLePanier >= produit.stock) {
    afficherToast(`Stock maximum atteint pour ${produit.nom}.`);
    return;
  }
  ajouterAuPanier(produit.id, 1);
  afficherToast(`${produit.nom} a été ajouté au panier.`);
}

/* ---------- Initialisation ---------- */

// Permet à la recherche de la navbar de renvoyer ici : catalogue.html?q=omnibook&categorie=pc-portables
function appliquerParametresUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("q")) el.recherche.value = params.get("q");
  if (params.has("categorie")) el.categorie.value = params.get("categorie");
  if (params.has("usage")) el.usage.value = params.get("usage");
}

async function init() {
  try {
    const reponse = await fetch(URL_JSON);
    if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`);
    tousLesProduits = await reponse.json();
  } catch (erreur) {
    console.error(erreur);
    el.erreur.textContent =
      "Impossible de charger les produits. Vérifiez votre connexion ou rechargez la page.";
    el.erreur.classList.remove("d-none");
    return;
  }

  appliquerParametresUrl();
  afficher();

  el.formulaire.addEventListener("input", afficher);
  el.formulaire.addEventListener("submit", (e) => e.preventDefault());
  el.tri.addEventListener("change", afficher);
  document.getElementById("btn-reinitialiser").addEventListener("click", reinitialiserFiltres);
  document.getElementById("btn-reinitialiser-vide").addEventListener("click", reinitialiserFiltres);
  el.liste.addEventListener("click", (e) => {
    const bouton = e.target.closest(".btn-ajouter");
    if (bouton) gererAjout(bouton.dataset.id);
  });
}

init();