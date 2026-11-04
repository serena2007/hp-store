"use strict";

/* Gestion du panier (localStorage).
   Le panier ne stocke que { id, quantite } : les prix sont relus depuis produits.json.
   La clé "panier" est la même que dans main.js : ne pas la changer. */

const CLE_PANIER = "panier";
const CLE_PROMO = "codePromo";
const SEUIL_LIVRAISON_GRATUITE = 30; // € : livraison gratuite dès ce montant
const FRAIS_LIVRAISON = 5; // € sinon

// Codes promo : pourcentage de remise et montant minimum du panier
const CODES_PROMO = {
  AUTOMNE20: { pourcentage: 20, minimum: 500 },
  AUTOMNE25: { pourcentage: 25, minimum: 2000 },
};

const arrondir = (montant) => Math.round(montant * 100) / 100;

/* ---------- Lecture / écriture ---------- */

function lirePanier() {
  try {
    const panier = JSON.parse(localStorage.getItem(CLE_PANIER));
    if (!Array.isArray(panier)) return [];
    // On ne garde que les lignes valides
    return panier.filter(
      (l) => l && l.id !== undefined && Number.isInteger(l.quantite) && l.quantite > 0
    );
  } catch {
    return [];
  }
}

function sauverPanier(panier) {
  try {
    localStorage.setItem(CLE_PANIER, JSON.stringify(panier));
  } catch (erreur) {
    console.error("Impossible de sauvegarder le panier :", erreur);
  }
  mettreAJourCompteur();
  document.dispatchEvent(new CustomEvent("panier-modifie"));
}

/* ---------- Actions ---------- */

// stockMax est facultatif : si fourni, la quantité ne dépasse jamais le stock.
// Retourne true si l'ajout est complet, false s'il a été limité ou refusé.
function ajouterAuPanier(id, quantite = 1, stockMax = Infinity) {
  if (!Number.isInteger(quantite) || quantite < 1) return false;

  const panier = lirePanier();
  const ligne = panier.find((l) => String(l.id) === String(id));
  const demandee = (ligne ? ligne.quantite : 0) + quantite;
  const finale = Math.min(demandee, stockMax);
  if (finale < 1) return false; // produit sans stock : rien à ajouter

  if (ligne) ligne.quantite = finale;
  else panier.push({ id, quantite: finale });

  sauverPanier(panier);
  return finale === demandee;
}

// Une quantité <= 0 supprime la ligne
function modifierQuantite(id, quantite, stockMax = Infinity) {
  let panier = lirePanier();
  if (quantite <= 0) {
    panier = panier.filter((l) => String(l.id) !== String(id));
  } else {
    const ligne = panier.find((l) => String(l.id) === String(id));
    if (!ligne) return;
    ligne.quantite = Math.min(quantite, stockMax);
  }
  sauverPanier(panier);
}

function supprimerDuPanier(id) {
  sauverPanier(lirePanier().filter((l) => String(l.id) !== String(id)));
}

function viderPanier() {
  sauverCodePromo("");
  sauverPanier([]);
}

function nombreArticles() {
  return lirePanier().reduce((somme, l) => somme + l.quantite, 0);
}

/* ---------- Code promo ---------- */

function lireCodePromo() {
  try {
    return localStorage.getItem(CLE_PROMO) || "";
  } catch {
    return "";
  }
}

function sauverCodePromo(code) {
  try {
    const propre = code.trim().toUpperCase();
    if (propre) localStorage.setItem(CLE_PROMO, propre);
    else localStorage.removeItem(CLE_PROMO);
  } catch (erreur) {
    console.error("Impossible de sauvegarder le code promo :", erreur);
  }
  document.dispatchEvent(new CustomEvent("panier-modifie"));
}

/* ---------- Calculs ---------- */

// Retourne le détail des lignes et les totaux.
// produits = contenu de produits.json ; codePromo = texte saisi par le client
function calculerTotaux(produits, codePromo = "") {
  const lignes = lirePanier()
    .map((l) => {
      const produit = produits.find((p) => String(p.id) === String(l.id));
      return produit
        ? { produit, quantite: l.quantite, total: arrondir(produit.prix * l.quantite) }
        : null;
    })
    .filter(Boolean); // ignore les produits qui n'existent plus dans le JSON

  const sousTotal = arrondir(lignes.reduce((somme, l) => somme + l.total, 0));

  let remise = 0;
  let messagePromo = "";
  const code = codePromo.trim().toUpperCase();
  if (code) {
    const promo = CODES_PROMO[code];
    if (!promo) {
      messagePromo = "Code promo invalide.";
    } else if (sousTotal < promo.minimum) {
      messagePromo = `Ce code est valable dès ${promo.minimum} € d'achats.`;
    } else {
      remise = arrondir((sousTotal * promo.pourcentage) / 100);
      messagePromo = `Code ${code} appliqué : -${promo.pourcentage} %.`;
    }
  }

  const apresRemise = sousTotal - remise;
  const livraison = sousTotal === 0 || apresRemise >= SEUIL_LIVRAISON_GRATUITE ? 0 : FRAIS_LIVRAISON;

  return {
    lignes,
    sousTotal,
    remise,
    livraison,
    total: arrondir(apresRemise + livraison),
    messagePromo,
    promoAppliquee: remise > 0,
  };
}

/* ---------- Compteur de la navbar ---------- */

function mettreAJourCompteur() {
  const compteur = document.getElementById("compteur-panier");
  if (compteur) compteur.textContent = nombreArticles();
}

document.addEventListener("DOMContentLoaded", mettreAJourCompteur);
// Met à jour le compteur si le panier change dans un autre onglet
window.addEventListener("storage", mettreAJourCompteur);