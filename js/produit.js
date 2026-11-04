"use strict";

/* Fiche produit : lit ?id=... dans l'URL, charge le JSON, affiche le produit.
   Dépend de js/panier.js (lirePanier, ajouterAuPanier), chargé avant ce fichier. */

const URL_JSON = "../data/produits.json";
const SEUIL_STOCK_FAIBLE = 5;
const formatPrix = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const LIBELLES_USAGES = { maison: "Maison", pro: "Professionnel", gaming: "Gaming" };

// Les clés du JSON sont sans accent ni majuscule : on les transforme pour l'affichage.
// Une clé absente de cette liste est affichée avec une majuscule (ex : "poids" -> "Poids").
const LIBELLES_CARACTERISTIQUES = {
  processeur: "Processeur",
  ram: "Mémoire (RAM)",
  stockage: "Stockage",
  ecran: "Écran",
  "carte-graphique": "Carte graphique",
  systeme: "Système d'exploitation",
  autonomie: "Autonomie",
  connectique: "Connectique",
  resolution: "Résolution",
  couleur: "Couleur",
};

let produit = null;

const el = {
  titre: document.getElementById("produit-titre"),
  filNom: document.getElementById("fil-nom"),
  erreur: document.getElementById("erreur-produit"),
  texteErreur: document.getElementById("texte-erreur"),
  fiche: document.getElementById("fiche-produit"),
  image: document.getElementById("image-principale"),
  miniatures: document.getElementById("miniatures"),
  reference: document.getElementById("produit-reference"),
  stock: document.getElementById("produit-stock"),
  prix: document.getElementById("produit-prix"),
  description: document.getElementById("produit-description"),
  usage: document.getElementById("produit-usage"),
  tableau: document.getElementById("tableau-caracteristiques"),
  formulaire: document.getElementById("formulaire-ajout"),
  quantite: document.getElementById("quantite"),
  boutonAjouter: document.getElementById("btn-ajouter"),
  message: document.getElementById("message-ajout"),
  messageTexte: document.getElementById("message-texte"),
  lienPanier: document.getElementById("lien-panier"),
};

/* ---------- Utilitaires ---------- */

function echapper(texte) {
  const remplacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texte).replace(/[&<>"']/g, (c) => remplacements[c]);
}

function libelleCaracteristique(cle) {
  if (LIBELLES_CARACTERISTIQUES[cle]) return LIBELLES_CARACTERISTIQUES[cle];
  const texte = cle.replace(/[-_]/g, " ");
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function badgeStock(stock) {
  if (stock <= 0) return '<span class="badge text-bg-secondary">Rupture de stock</span>';
  if (stock <= SEUIL_STOCK_FAIBLE) return `<span class="badge text-bg-warning">Plus que ${stock} en stock</span>`;
  return '<span class="badge text-bg-success">En stock</span>';
}

function afficherMessage(texte, type, avecLien = false) {
  el.message.className = `alert alert-${type} mt-3`; // retire aussi la classe d-none
  el.messageTexte.textContent = texte;
  el.lienPanier.classList.toggle("d-none", !avecLien);
}

function afficherErreur(texte) {
  el.titre.textContent = "Produit introuvable";
  el.filNom.textContent = "Introuvable";
  el.texteErreur.textContent = texte;
  el.erreur.classList.remove("d-none");
}

/* ---------- Affichage ---------- */

function definirImage(fichier, alt) {
  el.image.src = `../images/${fichier}`;
  el.image.alt = alt;
}

function afficherGalerie(p) {
  const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image];
  definirImage(images[0], p.nom);
  if (images.length < 2) return;

  el.miniatures.innerHTML = images
    .map(
      (fichier, i) => `
      <button type="button" class="fiche-miniature ${i === 0 ? "actif" : ""}" data-index="${i}"
              aria-label="Voir l'image ${i + 1} sur ${images.length}" aria-pressed="${i === 0}">
        <img src="../images/${echapper(fichier)}" alt="" width="80" height="60" loading="lazy">
      </button>`
    )
    .join("");

  el.miniatures.addEventListener("click", (e) => {
    const bouton = e.target.closest(".fiche-miniature");
    if (!bouton) return;
    const index = Number(bouton.dataset.index);
    definirImage(images[index], `${p.nom} - vue ${index + 1}`);
    el.miniatures.querySelectorAll(".fiche-miniature").forEach((b) => {
      const actif = b === bouton;
      b.classList.toggle("actif", actif);
      b.setAttribute("aria-pressed", String(actif));
    });
  });
}

function afficherProduit(p) {
  document.title = `${p.nom} - HP Store`;
  el.titre.textContent = p.nom;
  el.filNom.textContent = p.nom;
  el.reference.textContent = `Référence : ${p.reference}`;
  el.stock.innerHTML = badgeStock(p.stock);
  el.prix.textContent = formatPrix.format(p.prix);
  el.usage.textContent = [].concat(p.usage)
    .map((u) => LIBELLES_USAGES[u] || u)
    .join(", ");

  if (p.description) el.description.textContent = p.description;
  else el.description.classList.add("d-none");

  el.tableau.innerHTML = Object.entries(p.caracteristiques || {})
    .map(([cle, valeur]) => `<tr><th scope="row">${echapper(libelleCaracteristique(cle))}</th><td>${echapper(valeur)}</td></tr>`)
    .join("");

  afficherGalerie(p);

  if (p.stock > 0) {
    el.quantite.max = p.stock;
  } else {
    el.quantite.disabled = true;
    el.boutonAjouter.disabled = true;
    el.boutonAjouter.textContent = "Indisponible";
    afficherMessage("Ce produit est actuellement en rupture de stock.", "secondary");
  }

  el.fiche.classList.remove("d-none");
}

/* ---------- Ajout au panier ---------- */

function gererAjout(e) {
  e.preventDefault();
  if (!produit || produit.stock <= 0) return;

  const quantiteDemandee = parseInt(el.quantite.value, 10);
  if (!Number.isInteger(quantiteDemandee) || quantiteDemandee < 1) {
    afficherMessage("Saisissez une quantité d'au moins 1.", "danger");
    return;
  }

  // Quantité encore disponible = stock - ce qui est déjà dans le panier
  const ligne = lirePanier().find((l) => String(l.id) === String(produit.id));
  const disponible = produit.stock - (ligne ? ligne.quantite : 0);

  if (disponible <= 0) {
    afficherMessage("Vous avez déjà tout le stock disponible dans votre panier.", "warning", true);
    return;
  }

  const quantiteAjoutee = Math.min(quantiteDemandee, disponible);
  ajouterAuPanier(produit.id, quantiteAjoutee, produit.stock);

  if (quantiteAjoutee < quantiteDemandee) {
    afficherMessage(`Stock limité : seulement ${quantiteAjoutee} article(s) ajouté(s).`, "warning", true);
  } else {
    afficherMessage(`${quantiteAjoutee} × ${produit.nom} ajouté(s) au panier.`, "success", true);
  }
}

/* ---------- Initialisation ---------- */

async function init() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    afficherErreur("Aucun produit n'a été sélectionné.");
    return;
  }

  let produits;
  try {
    const reponse = await fetch(URL_JSON);
    if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`);
    produits = await reponse.json();
  } catch (erreur) {
    console.error(erreur);
    afficherErreur("Impossible de charger le produit. Rechargez la page ou réessayez plus tard.");
    return;
  }

  produit = produits.find((p) => String(p.id) === id);
  if (!produit) {
    afficherErreur("Ce produit n'existe pas ou n'est plus proposé.");
    return;
  }

  afficherProduit(produit);
  el.formulaire.addEventListener("submit", gererAjout);
}

init();