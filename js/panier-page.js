"use strict";

/* Page panier : affiche les articles, modifie les quantités, applique le code promo.
   Dépend de js/panier.js (lirePanier, modifierQuantite, supprimerDuPanier, viderPanier,
   calculerTotaux, lireCodePromo, sauverCodePromo), chargé avant ce fichier. */

const URL_PRODUITS = "../data/produits.json";
const formatEuro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

let produits = [];

const el = {
  erreur: document.getElementById("message-erreur"),
  vide: document.getElementById("panier-vide"),
  contenu: document.getElementById("panier-contenu"),
  lignes: document.getElementById("lignes-panier"),
  btnVider: document.getElementById("btn-vider"),
  formPromo: document.getElementById("form-promo"),
  codePromo: document.getElementById("code-promo"),
  messagePromo: document.getElementById("message-promo"),
  sousTotal: document.getElementById("sous-total"),
  ligneRemise: document.getElementById("ligne-remise"),
  remise: document.getElementById("remise"),
  livraison: document.getElementById("livraison"),
  infoLivraison: document.getElementById("info-livraison"),
  total: document.getElementById("total"),
};

function echapper(texte) {
  const remplacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texte).replace(/[&<>"']/g, (c) => remplacements[c]);
}

function afficher() {
  const t = calculerTotaux(produits, lireCodePromo());
  const estVide = t.lignes.length === 0;

  el.vide.classList.toggle("d-none", !estVide);
  el.contenu.classList.toggle("d-none", estVide);
  if (estVide) return;

  el.lignes.innerHTML = t.lignes
    .map((l) => {
      const p = l.produit;
      return `
        <tr>
          <th scope="row">
            <div class="d-flex align-items-center gap-3">
              <img class="panier-image" src="../images/${echapper(p.image)}" alt="" width="80" height="80" loading="lazy">
              <a href="produit.html?id=${encodeURIComponent(p.id)}">${echapper(p.nom)}</a>
            </div>
          </th>
          <td>${formatEuro.format(p.prix)}</td>
          <td>
            <label class="visually-hidden" for="qte-${p.id}">Quantité de ${echapper(p.nom)}</label>
            <input id="qte-${p.id}" type="number" class="form-control champ-quantite"
                   min="1" max="${p.stock}" step="1" value="${l.quantite}" data-id="${p.id}">
          </td>
          <td>${formatEuro.format(l.total)}</td>
          <td>
            <button type="button" class="btn btn-sm btn-contour btn-supprimer" data-id="${p.id}"
                    aria-label="Supprimer ${echapper(p.nom)} du panier">Supprimer</button>
          </td>
        </tr>`;
    })
    .join("");

  el.sousTotal.textContent = formatEuro.format(t.sousTotal);
  el.ligneRemise.classList.toggle("d-none", !t.promoAppliquee);
  el.remise.textContent = "-" + formatEuro.format(t.remise);
  el.livraison.textContent = t.livraison === 0 ? "Gratuite" : formatEuro.format(t.livraison);
  el.total.textContent = formatEuro.format(t.total);

  const restant = SEUIL_LIVRAISON_GRATUITE - (t.sousTotal - t.remise);
  el.infoLivraison.textContent =
    t.livraison > 0
      ? `Plus que ${formatEuro.format(restant)} d'achats pour la livraison gratuite.`
      : "Livraison gratuite.";

  el.messagePromo.textContent = t.messagePromo;
  el.messagePromo.className = "small mt-2 mb-0 " + (t.promoAppliquee ? "text-success" : "text-danger");
}

/* ---------- Actions ---------- */

// Changement de quantité : limitée au stock, jamais inférieure à 1
el.lignes.addEventListener("change", (e) => {
  const champ = e.target.closest(".champ-quantite");
  if (!champ) return;
  const produit = produits.find((p) => String(p.id) === champ.dataset.id);
  const quantite = parseInt(champ.value, 10);
  if (produit && Number.isInteger(quantite) && quantite >= 1) {
    modifierQuantite(produit.id, quantite, produit.stock);
  }
  afficher();
});

el.lignes.addEventListener("click", (e) => {
  const bouton = e.target.closest(".btn-supprimer");
  if (!bouton) return;
  supprimerDuPanier(bouton.dataset.id);
  afficher();
});

el.btnVider.addEventListener("click", () => {
  if (window.confirm("Voulez-vous vraiment vider le panier ?")) {
    viderPanier();
    afficher();
  }
});

el.formPromo.addEventListener("submit", (e) => {
  e.preventDefault();
  sauverCodePromo(el.codePromo.value);
  afficher();
});

/* ---------- Initialisation ---------- */

async function init() {
  el.codePromo.value = lireCodePromo();
  try {
    const reponse = await fetch(URL_PRODUITS);
    if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`);
    produits = await reponse.json();
  } catch (erreur) {
    console.error(erreur);
    el.erreur.textContent = "Impossible de charger le panier. Rechargez la page ou réessayez plus tard.";
    el.erreur.classList.remove("d-none");
    return;
  }
  afficher();
}

init();