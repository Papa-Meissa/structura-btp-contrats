/**
 * Prototype de démonstration — Générateur de contrats de sous-traitance ECRB.
 *
 * Fonctionne entièrement dans le navigateur (aucun serveur) : les contrats
 * générés pendant la démo sont conservés dans le stockage local du
 * navigateur (localStorage), pas dans un vrai tableau partagé.
 *
 * La version en production s'appuiera sur le kit d'automatisation Google
 * Workspace déjà livré (../GUIDE-INSTALLATION.md) : formulaire, tableau de
 * suivi et contrats partagés par toute l'équipe, pas seulement stockés sur
 * un poste. Ce prototype sert à démontrer le résultat final au client.
 *
 * Champs et texte du contrat basés sur le modèle réel fourni par le client
 * (voir ../modele-contrat/contrat-sous-traitance-ecrb.md).
 */

const STORAGE_KEY = 'demo-contrats-ecrb';

// Informations fixes de l'entreprise, extraites du modèle réel fourni
// (y compris le logo et le cachet, retrouvés dans des zones de texte
// flottantes du .doc original — voir modele-contrat/contrat-sous-traitance-ecrb.md).
const ENTREPRISE = {
  nom: 'ECRB',
  description: 'Entreprise de construction de routes et bâtiment tout corps d\'état',
  adresseAgence: 'Villa 56 Mariste, Fort B, Dakar',
  ninea: '010156786',
  rccm: 'SN.THS.2023.B.1453',
  telephones: '77 286 25 70 / 33 858 60 65',
  email: 'sas.ecrb@ecrb.fr',
  directeurGeneral: 'Abdoul Aziz SAMBE',
};

// Logo et cachet préchargés au chargement de la page, sous deux formes :
// - dataUrl : pour l'aperçu à l'écran (<img src>) et le PDF (jsPDF)
// - bytes (Uint8Array) : pour le Word (docx.js attend les octets bruts de
//   l'image, pas un chemin de fichier ni une chaîne CSS)
const IMAGES = { logo: null, cachet: null, logoBytes: null, cachetBytes: null };

async function precharger(url) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(new Blob([bytes]));
  });
  return { dataUrl, bytes };
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('contractForm');
  const previewPanel = document.getElementById('previewPanel');
  const previewBody = document.getElementById('previewBody');
  const trackerBody = document.getElementById('trackerBody');

  try {
    const [logo, cachet] = await Promise.all([
      precharger('assets/images/ecrb-logo.png'),
      precharger('assets/images/ecrb-cachet.png'),
    ]);
    IMAGES.logo = logo.dataUrl; IMAGES.logoBytes = logo.bytes;
    IMAGES.cachet = cachet.dataUrl; IMAGES.cachetBytes = cachet.bytes;
  } catch (e) {
    console.error('Impossible de précharger le logo/cachet :', e);
  }

  renderTracker();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = collecterDonneesFormulaire(form);
    const contrat = enregistrerContrat(data);
    afficherApercu(contrat);
    renderTracker();
    previewPanel.classList.add('show');
    previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('resetFormBtn').addEventListener('click', () => {
    form.reset();
    previewPanel.classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Word : construit directement avec docx.js (texte, images, tableaux et
  // alignements posés programmatiquement), pas une conversion de HTML — la
  // conversion (html-docx-js) ignorait trop de mise en forme (taille du
  // logo, alignements) pour être fiable.
  document.getElementById('downloadWordBtn').addEventListener('click', () => {
    const contrats = chargerContrats();
    const c = contrats[contrats.length - 1];
    if (!c) return;
    genererWord(c);
  });

  // PDF : généré directement avec jsPDF (dessin programmatique : texte,
  // images, positions), sans passer par une capture d'écran du DOM
  // (html2canvas produisait une page blanche). Résultat : un vrai fichier
  // téléchargé en un clic, pas une simple boîte de dialogue d'impression.
  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const contrats = chargerContrats();
    const c = contrats[contrats.length - 1];
    if (!c) return;
    genererPdf(c);
  });

  document.getElementById('exportExcelBtn').addEventListener('click', () => {
    const contrats = chargerContrats();
    if (contrats.length === 0) {
      alert('Aucun contrat à exporter pour le moment. Générez un contrat avec le formulaire ci-dessus.');
      return;
    }
    const feuille = XLSX.utils.json_to_sheet(contrats.map(c => ({
      'Numéro contrat': c.numero,
      'Date': c.dateContrat,
      'Objet des travaux (titre)': c.objetHeader,
      'Adresse des travaux': c.adresseTravaux,
      'Nom du prestataire': c.nomPrestataire,
      'Date de naissance': c.dateNaissance,
      'Lieu de naissance': c.lieuNaissance,
      "Date de transmission de l'offre": c.dateOffre,
      'Description des travaux (phrase)': c.descriptionTravaux,
      'Nom du conducteur de travaux': c.nomConducteur,
      'Délai (jours)': c.delaiJours,
      'Montant total (FCFA)': c.montantTotal,
      "Montant de l'avance (FCFA)": c.montantAvance,
      'Montant solde (FCFA)': c.montantSolde,
      'Statut': c.statut,
    })));
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, 'Contrats prestataires');
    XLSX.writeFile(classeur, 'Suivi-contrats-sous-traitance.xlsx');
  });

  document.getElementById('clearDemoBtn').addEventListener('click', () => {
    if (!confirm('Effacer toutes les données de cette démonstration ? Cette action ne supprime rien côté client, uniquement dans ce navigateur.')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderTracker();
    previewPanel.classList.remove('show');
  });

  // ── Fonctions ──────────────────────────────────────────────────────

  function collecterDonneesFormulaire(form) {
    const fd = new FormData(form);
    return {
      objetHeader: fd.get('objetHeader').trim(),
      adresseTravaux: fd.get('adresseTravaux').trim(),
      nomPrestataire: fd.get('nomPrestataire').trim(),
      dateNaissance: fd.get('dateNaissance'),
      lieuNaissance: fd.get('lieuNaissance').trim(),
      dateOffre: fd.get('dateOffre'),
      descriptionTravaux: fd.get('descriptionTravaux').trim(),
      nomConducteur: fd.get('nomConducteur').trim(),
      delaiJours: fd.get('delaiJours'),
      montantTotal: Number(fd.get('montantTotal')) || 0,
      montantAvance: Number(fd.get('montantAvance')) || 0,
    };
  }

  function enregistrerContrat(data) {
    const contrats = chargerContrats();
    const numero = genererNumeroContrat(contrats.length + 1);
    const contrat = {
      numero,
      dateContrat: formaterDateDuJour(),
      statut: 'À jour',
      montantSolde: data.montantTotal - data.montantAvance,
      ...data,
    };
    contrats.push(contrat);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contrats));
    return contrat;
  }

  function chargerContrats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function genererNumeroContrat(index) {
    const annee = new Date().getFullYear();
    return `CT-${annee}-${String(index).padStart(3, '0')}`;
  }

  function formaterDateDuJour() {
    return new Date().toLocaleDateString('fr-FR');
  }

  function formaterDateChamp(valeurISO) {
    if (!valeurISO) return '[date]';
    const d = new Date(valeurISO + 'T00:00:00');
    return d.toLocaleDateString('fr-FR');
  }

  // N'utilise pas toLocaleString('fr-FR') : son séparateur de milliers est un
  // caractère espace fine insécable (U+202F), que la police standard du
  // moteur PDF (jsPDF/helvetica) n'affiche pas correctement — ça rendait
  // "105 000" en "105/000" et décalait tout le texte qui suivait sur la
  // même ligne. Un espace normal évite le problème, à l'écran comme dans
  // le Word et le PDF générés.
  function formaterMontant(montant) {
    const n = Math.round(Number(montant) || 0);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Reproduction fidèle du document original (texte, ordre, orthographe même
  // particulière comme "SOUSTRAITANCE" en un mot ou "Maitre d'oeuvre" sans
  // accent/ligature) : seuls les passages qui étaient surlignés dans le
  // fichier du client sont substitués. Voir
  // ../modele-contrat/contrat-sous-traitance-ecrb.md pour le détail.
  function afficherApercu(c) {
    previewBody.dataset.numero = c.numero;
    previewBody.innerHTML = `
      <div class="doc-letterhead">
        <img src="${IMAGES.logo || 'assets/images/ecrb-logo.png'}" alt="Logo ECRB" width="110" height="93">
        <div class="agence">
          <strong>${ENTREPRISE.nom}</strong><br>
          ${ENTREPRISE.adresseAgence}<br>
          Tel : ${ENTREPRISE.telephones.split(' / ')[0]}<br>
          Tel : ${ENTREPRISE.telephones.split(' / ')[1]}
        </div>
      </div>
      <h2 class="doc-title">CONTRAT DE SOUSTRAITANCE</h2>
      <p>OBJET : TRAVAUX <strong class="champ">${escapeHtml(c.objetHeader.toUpperCase())}</strong></p>
      <p>Adresse des travaux : <strong class="champ">${escapeHtml(c.adresseTravaux)}</strong></p>
      <p>Sur la base des négociations et visite du chantier, le Peintre M. ${escapeHtml(c.nomPrestataire)} Né le ${formaterDateChamp(c.dateNaissance)} à ${escapeHtml(c.lieuNaissance)}, a transmis le ${formaterDateChamp(c.dateOffre)} son offre de prix pour les travaux de ${escapeHtml(c.descriptionTravaux)} pour une somme de ${formaterMontant(c.montantTotal)} FCFA.</p>
      <p>L'offre s'entend être conforme aux pièces techniques communiquées à M. ${escapeHtml(c.nomConducteur)} Conducteur des travaux ${ENTREPRISE.nom}.</p>

      <p class="doc-section">1- Modes opératoires – Ordonnancement</p>
      <ul class="doc-list">
        <li>Le conducteur de travaux de la société ${ENTREPRISE.nom}, sur le chantier est votre interlocuteur privilégié et assurera un suivi régulier du bon ordonnancement des travaux dans les règles de l'art.</li>
        <li>A la fin des travaux, il est convenu de faire une réception contradictoire entre les deux parties avant le solde des travaux.</li>
      </ul>

      <p class="doc-section">2- Sujétions et conditions de l'offre :</p>
      <ul class="doc-list">
        <li>M. ${escapeHtml(c.nomPrestataire)} justifie de sa capacité et de ses compétences pour la réalisation des travaux de peinture visés en objet, conformément au descriptif du cahier des charges.</li>
        <li>M. ${escapeHtml(c.nomPrestataire)} a effectué la visite préalable du site afin de constater l'état des surfaces, d'évaluer la nature des travaux de peinture à réaliser, de prendre en compte l'environnement du chantier ainsi que les contraintes et sujétions techniques liées à l'exécution des prestations.</li>
        <li>M. ${escapeHtml(c.nomPrestataire)} s'engage à livrer la zone de prestations entièrement achevée, incluant le respect des règles de sécurité et d'hygiène sur le chantier, la protection des surfaces non peintes ainsi que le nettoyage complet du chantier.</li>
      </ul>

      <p class="doc-section">3- Planning général</p>
      <p>M. ${escapeHtml(c.nomPrestataire)} s'engage à respecter le planning établi par l'entreprise ${ENTREPRISE.nom} pour la partie peintre. Réalisation sous un délai de ${escapeHtml(String(c.delaiJours))} jours maximum</p>

      <p class="doc-section">4- Conditions financières</p>
      <p>Selon la proposition financière le montant est de :</p>
      <div class="montant-encadre">
        <p>MONTANT TOTAL H.T. (Prix ferme non actualisable, non révisable) : <strong class="champ">${formaterMontant(c.montantTotal)} FCFA</strong></p>
        <p><em>Traité en auto liquidation</em></p>
      </div>
      <p>Ce prix s'entend ferme, non actualisable et non révisable.</p>
      <p>Règlement :</p>
      <ul class="doc-list">
        <li><strong class="champ">${formaterMontant(c.montantAvance)} F</strong> pour avance de démarrage</li>
        <li>${formaterMontant(c.montantSolde)} F après finitions des travaux et réception par le Maitre d'oeuvre.</li>
      </ul>
      <p>Paiement effectué par virement Ria, Wave ou versement espèce avec décharge.</p>

      <table class="sign">
        <tr>
          <td>
            Le sous-traitant<br>
            M. ${escapeHtml(c.nomPrestataire)}
            <p class="signature-caption">Signature et cachet précédé de la mention « lu et approuvé »</p>
          </td>
          <td class="entreprise">
            L'entreprise<br>
            Le Directeur Général<br>
            ${ENTREPRISE.directeurGeneral}<br>
            <img class="cachet" src="${IMAGES.cachet || 'assets/images/ecrb-cachet.png'}" alt="Cachet ${ENTREPRISE.nom}" width="190" height="55">
          </td>
        </tr>
      </table>

      <div class="doc-footer">
        <span>${ENTREPRISE.nom} – ${ENTREPRISE.description}</span>
        <span>NINEA ${ENTREPRISE.ninea} - RCCM ${ENTREPRISE.rccm}</span>
        <span>Mobile : ${ENTREPRISE.telephones} - email : ${ENTREPRISE.email}</span>
      </div>
    `;
  }

  // Génération PDF dessinée directement avec jsPDF (texte + images
  // positionnés en mm), sans capture d'écran du DOM — reproduit la même
  // structure que afficherApercu() ci-dessus, en téléchargement direct.
  function genererPdf(c) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297;
    const marginL = 25, marginR = 25;
    const contentW = pageW - marginL - marginR;
    const bottomLimit = pageH - 22;
    let y = 15;

    function checkPageBreak(h) {
      if (y + h > bottomLimit) { doc.addPage(); y = 15; }
    }

    function paragraph(text, { size = 11, style = 'normal', align = 'left', gapAfter = 3.5 } = {}) {
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      const lineH = size * 0.42;
      const lines = doc.splitTextToSize(text, contentW);
      lines.forEach(line => {
        checkPageBreak(lineH);
        const x = align === 'center' ? pageW / 2 : (align === 'right' ? pageW - marginR : marginL);
        doc.text(line, x, y, { align });
        y += lineH;
      });
      y += gapAfter;
    }

    function bullet(text, { size = 11, gapAfter = 1.5 } = {}) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(size);
      const indent = 5;
      const lineH = size * 0.42;
      const lines = doc.splitTextToSize(text, contentW - indent - 2);
      lines.forEach((line, i) => {
        checkPageBreak(lineH);
        doc.text((i === 0 ? '- ' : '') + line, marginL + indent, y);
        y += lineH;
      });
      y += gapAfter;
    }

    // Ligne à plusieurs segments, certains en gras (jsPDF n'a pas de style
    // mixte natif sur un seul doc.text) : avance x du texte imprimé.
    function mixedLine(parts, { size = 11, gapAfter = 3.5 } = {}) {
      checkPageBreak(size * 0.42);
      doc.setFontSize(size);
      let cx = marginL;
      parts.forEach(p => {
        doc.setFont('helvetica', p.bold ? 'bold' : 'normal');
        doc.text(p.text, cx, y);
        cx += doc.getTextWidth(p.text);
      });
      y += size * 0.42 + gapAfter;
    }

    // Letterhead — remonté vers le haut de page, les deux numéros sur deux lignes
    if (IMAGES.logo) doc.addImage(IMAGES.logo, 'PNG', marginL, 6, 22, 18.5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(ENTREPRISE.nom, marginL + 26, 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(ENTREPRISE.adresseAgence, marginL + 26, 14);
    const [tel1, tel2] = ENTREPRISE.telephones.split(' / ');
    doc.text('Tel : ' + tel1, marginL + 26, 18);
    doc.text('Tel : ' + tel2, marginL + 26, 22);
    doc.setDrawColor(26, 143, 209);
    doc.setLineWidth(0.6);
    doc.line(marginL, 27, pageW - marginR, 27);
    y = 35;

    // Titre encadré
    doc.setFont('helvetica', 'normal'); doc.setFontSize(14);
    const titreY = y;
    doc.text('CONTRAT DE SOUSTRAITANCE', pageW / 2, titreY, { align: 'center' });
    doc.setDrawColor(0); doc.setLineWidth(0.3);
    doc.rect(marginL, titreY - 6, contentW, 9);
    y = titreY + 9;

    mixedLine([{ text: 'OBJET : TRAVAUX ' }, { text: c.objetHeader.toUpperCase(), bold: true }]);
    mixedLine([{ text: 'Adresse des travaux : ' }, { text: c.adresseTravaux, bold: true }]);
    paragraph(`Sur la base des négociations et visite du chantier, le Peintre M. ${c.nomPrestataire} Né le ${formaterDateChamp(c.dateNaissance)} à ${c.lieuNaissance}, a transmis le ${formaterDateChamp(c.dateOffre)} son offre de prix pour les travaux de ${c.descriptionTravaux} pour une somme de ${formaterMontant(c.montantTotal)} FCFA.`);
    paragraph(`L'offre s'entend être conforme aux pièces techniques communiquées à M. ${c.nomConducteur} Conducteur des travaux ${ENTREPRISE.nom}.`);

    paragraph('1- Modes opératoires – Ordonnancement', { style: 'bold', gapAfter: 2 });
    bullet(`Le conducteur de travaux de la société ${ENTREPRISE.nom}, sur le chantier est votre interlocuteur privilégié et assurera un suivi régulier du bon ordonnancement des travaux dans les règles de l'art.`);
    bullet('A la fin des travaux, il est convenu de faire une réception contradictoire entre les deux parties avant le solde des travaux.', { gapAfter: 3.5 });

    paragraph("2- Sujétions et conditions de l'offre :", { style: 'bold', gapAfter: 2 });
    bullet(`M. ${c.nomPrestataire} justifie de sa capacité et de ses compétences pour la réalisation des travaux de peinture visés en objet, conformément au descriptif du cahier des charges.`);
    bullet(`M. ${c.nomPrestataire} a effectué la visite préalable du site afin de constater l'état des surfaces, d'évaluer la nature des travaux de peinture à réaliser, de prendre en compte l'environnement du chantier ainsi que les contraintes et sujétions techniques liées à l'exécution des prestations.`);
    bullet(`M. ${c.nomPrestataire} s'engage à livrer la zone de prestations entièrement achevée, incluant le respect des règles de sécurité et d'hygiène sur le chantier, la protection des surfaces non peintes ainsi que le nettoyage complet du chantier.`, { gapAfter: 3.5 });

    paragraph('3- Planning général', { style: 'bold', gapAfter: 2 });
    paragraph(`M. ${c.nomPrestataire} s'engage à respecter le planning établi par l'entreprise ${ENTREPRISE.nom} pour la partie peintre. Réalisation sous un délai de ${c.delaiJours} jours maximum`);

    paragraph('4- Conditions financières', { style: 'bold', gapAfter: 2 });
    paragraph('Selon la proposition financière le montant est de :');

    // Bloc montant encadré
    checkPageBreak(16);
    const cadreY = y;
    mixedLine([
      { text: 'MONTANT TOTAL H.T. (Prix ferme non actualisable, non révisable) : ' },
      { text: `${formaterMontant(c.montantTotal)} FCFA`, bold: true },
    ], { gapAfter: 1 });
    paragraph('Traité en auto liquidation', { style: 'italic', gapAfter: 1 });
    doc.setDrawColor(0); doc.setLineWidth(0.3);
    doc.rect(marginL, cadreY - 5, contentW, y - cadreY + 2);
    y += 4;

    paragraph('Ce prix s\'entend ferme, non actualisable et non révisable.');
    paragraph('Règlement :', { gapAfter: 2 });
    mixedLine([{ text: '- ' }, { text: formaterMontant(c.montantAvance) + ' F', bold: true }, { text: ' pour avance de démarrage' }], { gapAfter: 1.5 });
    bullet(`${formaterMontant(c.montantSolde)} F après finitions des travaux et réception par le Maitre d'oeuvre.`, { gapAfter: 3.5 });
    paragraph('Paiement effectué par virement Ria, Wave ou versement espèce avec décharge.');

    // Bloc signature : sous-traitant à gauche (avec la mention "signature et
    // cachet"), entreprise à droite (légèrement décalée vers l'intérieur
    // pour s'aligner avec le cachet, plus étroit que la colonne).
    checkPageBreak(45);
    y += 6;
    const signY = y;
    const entrepriseX = pageW - marginR - 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text('Le sous-traitant', marginL, signY);
    doc.text('M. ' + c.nomPrestataire, marginL, signY + 5);
    doc.setFontSize(9);
    doc.text('Signature et cachet précédé de', marginL, signY + 11);
    doc.text('la mention « lu et approuvé »', marginL, signY + 15);

    doc.setFontSize(11);
    doc.text("L'entreprise", entrepriseX, signY, { align: 'right' });
    doc.text('Le Directeur Général', entrepriseX, signY + 5, { align: 'right' });
    doc.text(ENTREPRISE.directeurGeneral, entrepriseX, signY + 10, { align: 'right' });
    if (IMAGES.cachet) {
      const cachetW = 45, cachetH = 45 * (83 / 288);
      doc.addImage(IMAGES.cachet, 'PNG', entrepriseX - cachetW, signY + 14, cachetW, cachetH);
      y = signY + 14 + cachetH;
    } else {
      y = signY + 14;
    }

    // Pied de page (répété sur chaque page générée) — 3 lignes, mobile et
    // e-mail regroupés, remonté un peu au-dessus du bord bas de la page
    // pour rester dans la zone imprimable.
    const nbPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= nbPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(150); doc.setLineWidth(0.2);
      doc.line(marginL, pageH - 17, pageW - marginR, pageH - 17);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(0);
      doc.text(`${ENTREPRISE.nom} – ${ENTREPRISE.description}`, pageW / 2, pageH - 13, { align: 'center' });
      doc.text(`NINEA ${ENTREPRISE.ninea} - RCCM ${ENTREPRISE.rccm}`, pageW / 2, pageH - 9.5, { align: 'center' });
      doc.text(`Mobile : ${ENTREPRISE.telephones} - email : ${ENTREPRISE.email}`, pageW / 2, pageH - 6, { align: 'center' });
    }

    doc.save(`Contrat-${c.numero}.pdf`);
  }

  // Génération Word construite directement avec docx.js (paragraphes,
  // tableaux, images en octets bruts, alignements) — reproduit la même
  // structure que genererPdf() ci-dessus, dans un vrai .docx valide.
  async function genererWord(c) {
    const {
      Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
      AlignmentType, WidthType, BorderStyle, Footer, VerticalAlign,
    } = window.docx;

    const SANS_BORDURE = {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    };

    // "Vinci Sans" (police corporate ECRB) n'est presque jamais installée
    // sur la machine qui ouvre le fichier : Word substitue alors par une
    // police par défaut qui peut être une police à empattements (serif),
    // très différente de l'aperçu écran/PDF. Arial est universellement
    // disponible sous Word et visuellement proche d'Inter/Helvetica déjà
    // utilisées à l'écran et dans le PDF — évite un rendu incohérent.
    const FONT = 'Arial';

    function para(text, { align = AlignmentType.JUSTIFIED, bold = false, italics = false, size = 24, after = 160 } = {}) {
      return new Paragraph({
        alignment: align,
        spacing: { after },
        children: [new TextRun({ text, bold, italics, size, font: FONT })],
      });
    }

    function bulletPara(text, { after = 80 } = {}) {
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 340 },
        spacing: { after },
        children: [new TextRun({ text: '- ' + text, size: 24, font: FONT })],
      });
    }

    // Paragraphe à plusieurs segments, certains en gras (ex. un label normal
    // suivi d'une valeur de champ en gras) — para() ne gère qu'un seul style.
    function paraMixed(parts, { align = AlignmentType.JUSTIFIED, size = 24, after = 160 } = {}) {
      return new Paragraph({
        alignment: align,
        spacing: { after },
        children: parts.map(p => new TextRun({ text: p.text, bold: !!p.bold, size, font: FONT })),
      });
    }

    // Encadre un ou plusieurs paragraphes dans un tableau 1x1 avec bordure —
    // façon la plus fiable d'obtenir un cadre autour d'un bloc dans docx.js.
    function encadrer(paragraphes) {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 150, right: 150 },
          children: paragraphes,
        })] })],
      });
    }

    const children = [];

    // En-tête : logo + adresse agence, dans un tableau à 2 colonnes sans
    // bordures (façon la plus fiable de poser deux blocs côte à côte).
    const letterheadCells = [
      new TableCell({
        width: { size: 22, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: IMAGES.logoBytes
          ? [new Paragraph({ children: [new ImageRun({ type: 'png', data: IMAGES.logoBytes, transformation: { width: 90, height: 76 } })] })]
          : [new Paragraph({ text: '' })],
      }),
      new TableCell({
        width: { size: 78, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          para(ENTREPRISE.nom, { align: AlignmentType.LEFT, bold: true, size: 18, after: 20 }),
          para(ENTREPRISE.adresseAgence, { align: AlignmentType.LEFT, size: 16, after: 20 }),
          para('Tel : ' + ENTREPRISE.telephones.split(' / ')[0], { align: AlignmentType.LEFT, size: 16, after: 0 }),
          para('Tel : ' + ENTREPRISE.telephones.split(' / ')[1], { align: AlignmentType.LEFT, size: 16, after: 0 }),
        ],
      }),
    ];
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: SANS_BORDURE,
      rows: [new TableRow({ children: letterheadCells })],
    }));
    children.push(new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '1A8FD1' } }, spacing: { after: 200 } }));

    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 320 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 6 },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 6 },
        left: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 6 },
        right: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 6 },
      },
      children: [new TextRun({ text: 'CONTRAT DE SOUSTRAITANCE', size: 28, font: FONT })],
    }));
    children.push(paraMixed([{ text: 'OBJET : TRAVAUX ' }, { text: c.objetHeader.toUpperCase(), bold: true }]));
    children.push(paraMixed([{ text: 'Adresse des travaux : ' }, { text: c.adresseTravaux, bold: true }]));
    children.push(para(`Sur la base des négociations et visite du chantier, le Peintre M. ${c.nomPrestataire} Né le ${formaterDateChamp(c.dateNaissance)} à ${c.lieuNaissance}, a transmis le ${formaterDateChamp(c.dateOffre)} son offre de prix pour les travaux de ${c.descriptionTravaux} pour une somme de ${formaterMontant(c.montantTotal)} FCFA.`));
    children.push(para(`L'offre s'entend être conforme aux pièces techniques communiquées à M. ${c.nomConducteur} Conducteur des travaux ${ENTREPRISE.nom}.`));

    children.push(para('1- Modes opératoires – Ordonnancement', { bold: true, align: AlignmentType.LEFT, after: 80 }));
    children.push(bulletPara(`Le conducteur de travaux de la société ${ENTREPRISE.nom}, sur le chantier est votre interlocuteur privilégié et assurera un suivi régulier du bon ordonnancement des travaux dans les règles de l'art.`));
    children.push(bulletPara('A la fin des travaux, il est convenu de faire une réception contradictoire entre les deux parties avant le solde des travaux.', { after: 200 }));

    children.push(para("2- Sujétions et conditions de l'offre :", { bold: true, align: AlignmentType.LEFT, after: 80 }));
    children.push(bulletPara(`M. ${c.nomPrestataire} justifie de sa capacité et de ses compétences pour la réalisation des travaux de peinture visés en objet, conformément au descriptif du cahier des charges.`));
    children.push(bulletPara(`M. ${c.nomPrestataire} a effectué la visite préalable du site afin de constater l'état des surfaces, d'évaluer la nature des travaux de peinture à réaliser, de prendre en compte l'environnement du chantier ainsi que les contraintes et sujétions techniques liées à l'exécution des prestations.`));
    children.push(bulletPara(`M. ${c.nomPrestataire} s'engage à livrer la zone de prestations entièrement achevée, incluant le respect des règles de sécurité et d'hygiène sur le chantier, la protection des surfaces non peintes ainsi que le nettoyage complet du chantier.`, { after: 200 }));

    children.push(para('3- Planning général', { bold: true, align: AlignmentType.LEFT, after: 80 }));
    children.push(para(`M. ${c.nomPrestataire} s'engage à respecter le planning établi par l'entreprise ${ENTREPRISE.nom} pour la partie peintre. Réalisation sous un délai de ${c.delaiJours} jours maximum`));

    children.push(para('4- Conditions financières', { bold: true, align: AlignmentType.LEFT, after: 80 }));
    children.push(para('Selon la proposition financière le montant est de :'));
    children.push(encadrer([
      paraMixed([
        { text: 'MONTANT TOTAL H.T. (Prix ferme non actualisable, non révisable) : ' },
        { text: `${formaterMontant(c.montantTotal)} FCFA`, bold: true },
      ], { after: 40 }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 0 },
        children: [new TextRun({ text: 'Traité en auto liquidation', italics: true, size: 24, font: FONT })],
      }),
    ]));
    children.push(new Paragraph({ text: '', spacing: { after: 160 } }));
    children.push(para("Ce prix s'entend ferme, non actualisable et non révisable."));
    children.push(para('Règlement :', { after: 80 }));
    children.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 340 },
      spacing: { after: 80 },
      children: [
        new TextRun({ text: '- ', size: 24, font: FONT }),
        new TextRun({ text: formaterMontant(c.montantAvance) + ' F', bold: true, size: 24, font: FONT }),
        new TextRun({ text: ' pour avance de démarrage', size: 24, font: FONT }),
      ],
    }));
    children.push(bulletPara(`${formaterMontant(c.montantSolde)} F après finitions des travaux et réception par le Maitre d'oeuvre.`, { after: 200 }));
    children.push(para('Paiement effectué par virement Ria, Wave ou versement espèce avec décharge.'));

    // Signature : sous-traitant à gauche (avec la mention "signature et
    // cachet"), entreprise à droite (légèrement décalée vers l'intérieur
    // pour s'aligner avec le cachet, plus étroit que la colonne).
    const cachetEnfants = [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        indent: { right: 300 },
        spacing: { after: 60 },
        children: [new TextRun({ text: "L'entreprise", size: 24, font: FONT })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        indent: { right: 300 },
        spacing: { after: 0 },
        children: [new TextRun({ text: 'Le Directeur Général', size: 24, font: FONT })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        indent: { right: 300 },
        spacing: { after: 80 },
        children: [new TextRun({ text: ENTREPRISE.directeurGeneral, size: 24, font: FONT })],
      }),
    ];
    if (IMAGES.cachetBytes) {
      cachetEnfants.push(new Paragraph({
        alignment: AlignmentType.RIGHT,
        indent: { right: 300 },
        children: [new ImageRun({ type: 'png', data: IMAGES.cachetBytes, transformation: { width: 180, height: 52 } })],
      }));
    }
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: SANS_BORDURE,
      rows: [new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              para('Le sous-traitant', { align: AlignmentType.LEFT, after: 60 }),
              para('M. ' + c.nomPrestataire, { align: AlignmentType.LEFT, after: 60 }),
              para('Signature et cachet précédé de la mention « lu et approuvé »', { align: AlignmentType.LEFT, size: 18, after: 0 }),
            ],
          }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: cachetEnfants }),
        ],
      })],
    }));

    // 3 lignes (mobile + e-mail regroupés sur la même ligne, comme demandé).
    const pied = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 40 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '999999' } },
        children: [new TextRun({ text: `${ENTREPRISE.nom} – ${ENTREPRISE.description}`, size: 16, font: FONT })],
      }),
      para(`NINEA ${ENTREPRISE.ninea} - RCCM ${ENTREPRISE.rccm}`, { align: AlignmentType.CENTER, size: 16, after: 40 }),
      para(`Mobile : ${ENTREPRISE.telephones} - email : ${ENTREPRISE.email}`, { align: AlignmentType.CENTER, size: 16, after: 0 }),
    ];

    // Marge basse du corps de texte agrandie pour que le contenu s'arrête
    // bien avant le pied de page (plus de collision comme précédemment) ;
    // "footer" rapproche le pied de page du bord bas de la page (le fait
    // "descendre") tout en restant dans la zone imprimable standard
    // (une imprimante classique gère sans problème une marge de 0,4 po).
    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 500, bottom: 1600, left: 1418, right: 1418, footer: 560 } } },
        footers: { default: new Footer({ children: pied }) },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    telechargerBlob(blob, `Contrat-${c.numero}.docx`);
  }

  function renderTracker() {
    const contrats = chargerContrats();
    trackerBody.innerHTML = '';
    if (contrats.length === 0) {
      trackerBody.innerHTML = '<tr class="empty-row"><td colspan="9">Aucun contrat généré pour l\'instant — remplissez le formulaire ci-dessus pour voir le tableau se remplir automatiquement.</td></tr>';
      return;
    }
    contrats.slice().reverse().forEach(c => {
      const tr = document.createElement('tr');
      const tagClass = c.statut === 'Terminé' ? 'tag-termine' : 'tag-cours';
      tr.innerHTML = `
        <td>${c.numero}</td>
        <td>${c.dateContrat}</td>
        <td>${escapeHtml(c.objetHeader)}</td>
        <td>${escapeHtml(c.nomPrestataire)}</td>
        <td>${escapeHtml(c.adresseTravaux)}</td>
        <td>${formaterMontant(c.montantTotal)} FCFA</td>
        <td>${formaterMontant(c.montantAvance)} / ${formaterMontant(c.montantSolde)} FCFA</td>
        <td>${escapeHtml(String(c.delaiJours))} j</td>
        <td><span class="tag ${tagClass}">${c.statut}</span></td>
      `;
      trackerBody.appendChild(tr);
    });
  }

  function telechargerBlob(blob, nomFichier) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }
});
