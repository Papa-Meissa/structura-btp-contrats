/**
 * Automatisation des contrats de sous-traitance — ECRB.
 *
 * Se déclenche à chaque nouvelle réponse au Google Form (onglet
 * "Contrats prestataires" du Sheet lié) : copie le modèle de contrat
 * (Google Doc), remplace les balises {{...}} par les données saisies,
 * exporte le résultat en PDF, et écrit les liens (Word + PDF) et le
 * numéro de contrat dans la ligne correspondante du tableau de suivi.
 *
 * Installation : voir ../GUIDE-INSTALLATION.md
 * Champs et modèle basés sur le contrat réel fourni par le client, voir
 * ../modele-contrat/contrat-sous-traitance-ecrb.md
 */

// ── À CONFIGURER AVANT TOUTE UTILISATION ────────────────────────────────
// ID du Google Doc modèle (dans son URL : https://docs.google.com/document/d/CET_ID/edit)
const MODELE_DOC_ID = 'COLLER_ICI_L_ID_DU_GOOGLE_DOC_MODELE';

// ID du dossier Drive où seront rangés les contrats générés
// (dans l'URL du dossier : https://drive.google.com/drive/folders/CET_ID)
const DOSSIER_CONTRATS_ID = 'COLLER_ICI_L_ID_DU_DOSSIER_DRIVE_DESTINATION';

// Nom exact de l'onglet contenant les réponses du formulaire
const NOM_ONGLET_CONTRATS = 'Contrats prestataires';
// ─────────────────────────────────────────────────────────────────────

/**
 * Fonction principale, appelée automatiquement par le déclencheur
 * "Lors de la soumission du formulaire" (voir GUIDE-INSTALLATION.md).
 */
function onFormSubmitContrat(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== NOM_ONGLET_CONTRATS) return;

  const row = e.range.getRow();
  const derniereColonne = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, derniereColonne).getValues()[0];
  const values = sheet.getRange(row, 1, 1, derniereColonne).getValues()[0];

  const data = {};
  headers.forEach((h, i) => { data[h] = values[i]; });

  const numeroContrat = genererNumeroContrat(row);

  // 1. Copier le modèle Google Doc
  const modele = DriveApp.getFileById(MODELE_DOC_ID);
  const dossier = DriveApp.getFolderById(DOSSIER_CONTRATS_ID);
  const nomFichier = `Contrat ${numeroContrat} - ${data['Nom du prestataire'] || 'sans nom'}`;
  const copie = modele.makeCopy(nomFichier, dossier);
  const doc = DocumentApp.openById(copie.getId());
  const corps = doc.getBody();

  // 2. Remplacer les balises {{...}} par les valeurs du formulaire
  //    (les clés à gauche doivent correspondre exactement aux intitulés
  //    du Form, voir ../formulaire/champs-formulaire.md)
  //    Seuls les champs listés ici étaient surlignés comme variables dans
  //    le document original du client — tout le reste (dont « Peintre »,
  //    « travaux de peinture », « surfaces non peintes ») reste du texte
  //    fixe écrit directement dans le Doc modèle, pas remplacé ici.
  const objetHeader = data['Objet des travaux (titre)'] || '';
  const montantTotal = Number(data['Montant total (FCFA)']) || 0;
  const montantAvance = Number(data['Montant de l\'avance (FCFA)']) || 0;
  const montantSolde = montantTotal - montantAvance;

  const correspondances = {
    '{{numero_contrat}}': numeroContrat,
    '{{objet_header}}': objetHeader.toUpperCase(),
    '{{adresse_travaux}}': data['Adresse des travaux'] || '',
    '{{nom_prestataire}}': data['Nom du prestataire'] || '',
    '{{date_naissance}}': formaterDate(data['Date de naissance']),
    '{{lieu_naissance}}': data['Lieu de naissance'] || '',
    '{{date_offre}}': formaterDate(data['Date de transmission de l\'offre']),
    '{{description_travaux}}': data['Description des travaux (phrase)'] || '',
    '{{nom_conducteur_travaux}}': data['Nom du conducteur de travaux'] || '',
    '{{delai_jours}}': data['Délai (en jours)'] || '',
    '{{montant_total}}': formaterMontant(montantTotal),
    '{{montant_avance}}': formaterMontant(montantAvance),
    '{{montant_solde}}': formaterMontant(montantSolde),
  };

  Object.keys(correspondances).forEach(cle => {
    corps.replaceText(echapperRegex(cle), String(correspondances[cle]));
  });
  doc.saveAndClose();

  // 3. Exporter une copie PDF dans le même dossier
  const pdfBlob = DriveApp.getFileById(copie.getId()).getAs('application/pdf');
  const fichierPdf = dossier.createFile(pdfBlob).setName(nomFichier + '.pdf');

  // 4. Écrire numéro de contrat, solde calculé et liens dans la ligne du tableau de suivi
  ecrireDansColonne(sheet, headers, row, 'Numéro contrat', numeroContrat);
  ecrireDansColonne(sheet, headers, row, 'Montant solde', montantSolde);
  ecrireDansColonne(sheet, headers, row, 'Lien contrat Word', copie.getUrl());
  ecrireDansColonne(sheet, headers, row, 'Lien contrat PDF', fichierPdf.getUrl());
  ecrireDansColonne(sheet, headers, row, 'Statut', 'À jour');
}

/**
 * Génère un numéro de contrat du type CT-2026-001, incrémenté selon la ligne.
 */
function genererNumeroContrat(row) {
  const annee = new Date().getFullYear();
  const numero = String(row - 1).padStart(3, '0'); // row 2 = premier contrat
  return `CT-${annee}-${numero}`;
}

function formaterDateDuJour() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function formaterDate(valeur) {
  if (!valeur) return '';
  const d = new Date(valeur);
  if (isNaN(d.getTime())) return String(valeur);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

// Espace normal plutôt que toLocaleString('fr-FR') (qui utilise un espace
// fine insécable pouvant mal s'afficher selon le moteur de rendu) — voir
// prototype/assets/script.js pour le détail du bug observé côté PDF.
function formaterMontant(montant) {
  const n = Math.round(Number(montant) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function echapperRegex(texte) {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ecrireDansColonne(sheet, headers, row, nomColonne, valeur) {
  const col = headers.indexOf(nomColonne) + 1;
  if (col > 0) sheet.getRange(row, col).setValue(valeur);
}

/**
 * Fonction de test manuelle : régénère le contrat pour la DERNIÈRE ligne
 * du tableau, sans passer par une vraie soumission de formulaire.
 * Pratique pour tester le script depuis l'éditeur Apps Script
 * (bouton "Exécuter" sur cette fonction) avant de configurer le
 * déclencheur automatique.
 */
function testerGenerationDerniereLigne() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOM_ONGLET_CONTRATS);
  const derniereLigne = sheet.getLastRow();
  const derniereColonne = sheet.getLastColumn();
  const range = sheet.getRange(derniereLigne, 1, 1, derniereColonne);
  onFormSubmitContrat({ range: range });
}
