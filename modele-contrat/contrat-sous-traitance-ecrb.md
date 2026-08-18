# Modèle de contrat de sous-traitance — ECRB

Reconstitué à partir du fichier réel fourni par le client (`context/import/CONTRAT DE SOUS TRAITANCE MOD.doc`), analysé via Word pour détecter, **mot par mot**, quels passages sont surlignés (jaune ou vert) — ce sont ces passages, et uniquement ceux-là, qui deviennent des variables. Tout le reste (formulations, ordre des phrases, orthographe même particulière) est repris à l'identique, y compris les tournures propres à un contrat de peinture. Voir les notes en bas pour le détail complet.

**Mise en forme à reproduire à l'identique** (mesurée sur le fichier original, voir `../prototype/assets/styles.css` pour l'implémentation) :
- Logo ECRB en en-tête, avec l'adresse de l'agence Dakar à côté (voir « Logo, cachet et adresses » ci-dessous)
- Police : **Vinci Sans** (police corporate ECRB) — titre 14pt centré, corps 12pt justifié, signature 11pt, pied de page Arial 8pt
- Marges : haut 1,5 cm / bas-gauche-droite 2,5 cm
- 4 sections numérotées « 1- », « 2- », « 3- », « 4- » en gras
- Bloc signature en tableau à bordures invisibles, avec le cachet ECRB inséré automatiquement côté « L'entreprise »
- Pied de page avec les coordonnées du siège (Mekhé) sur toutes les pages

**Comment changer le fichier source à générer, pour une fidélité garantie (recommandé) :** ne pas repartir de ce texte reconstitué à la main — il ne peut pas inclure le logo ni le cachet avec une fidélité parfaite. Repartir directement du **vrai fichier `.doc` du client** :

1. Dans Google Drive, importer le fichier `context/import/CONTRAT DE SOUS TRAITANCE MOD.doc`
2. Clic droit dessus > **Ouvrir avec > Google Docs** (conversion automatique, conserve le texte, le logo, le cachet et leur position)
3. Vérifier visuellement que la conversion n'a rien décalé (Google Docs gère parfois différemment les zones de texte flottantes de Word — à contrôler surtout autour du logo et du cachet)
4. Dans ce Doc converti, remplacer **uniquement** les passages listés dans « Champs confirmés variables » ci-dessous par les balises `{{comme_ceci}}`, et retirer leur surlignage jaune/vert (Format > Effacer la mise en forme sur la sélection, ou changer la couleur de surlignage sur « Aucune »)
5. Renommer ce Doc, par exemple « MODÈLE — Contrat de sous-traitance ECRB », et noter son identifiant (voir `../GUIDE-INSTALLATION.md`, Étape 1)

C'est cette copie du **vrai fichier client, convertie et retouchée a minima**, qui doit être utilisée comme `MODELE_DOC_ID` dans `../script/Code.gs` — pas une reconstruction texte comme celle ci-dessous. Le texte de ce fichier `.md` sert de **référence de contenu** (pour vérifier qu'aucun mot n'a été altéré pendant la conversion), pas de modèle à copier-coller.

### Retouches de présentation demandées en plus de la fidélité stricte

Le client a ensuite demandé quelques ajouts qui ne sont **pas** dans le document original (donc à faire manuellement dans le Google Doc converti, pas automatiques) :

- Encadrer le titre « CONTRAT DE SOUSTRAITANCE » (bordure fine tout autour)
- Mettre en gras la valeur (pas le libellé) des champs : Objet des travaux, Adresse des travaux, Montant total, Montant de l'avance
- Encadrer le bloc « MONTANT TOTAL H.T. ... / Traité en auto liquidation »
- Bloc signature : la mention « Signature et cachet précédé de la mention "lu et approuvé" » passe sous « Le sous-traitant » (pas sous « L'entreprise ») ; « Abdoul Aziz SAMBE » sur sa propre ligne sous « Le Directeur Général » ; « L'entreprise » légèrement décalée vers la gauche pour s'aligner avec le cachet
- Pied de page sur 3 lignes (mobile et e-mail regroupés sur la même ligne), positionné un peu plus bas mais sans dépasser la zone imprimable

Ces retouches sont déjà appliquées dans le prototype de démo (`../prototype/assets/script.js`, fonction `genererWord`) — à reproduire à la main dans le Google Doc si le client veut que le vrai contrat ait le même rendu.

---

## CONTRAT DE SOUSTRAITANCE

**OBJET :** TRAVAUX {{objet_header}}

**Adresse des travaux :** {{adresse_travaux}}

Sur la base des négociations et visite du chantier, le Peintre M. {{nom_prestataire}} Né le {{date_naissance}} à {{lieu_naissance}}, a transmis le {{date_offre}} son offre de prix pour les travaux de {{description_travaux}} pour une somme de {{montant_total}} FCFA.

L'offre s'entend être conforme aux pièces techniques communiquées à M. {{nom_conducteur_travaux}} Conducteur des travaux ECRB.

**1- Modes opératoires – Ordonnancement**

Le conducteur de travaux de la société ECRB, sur le chantier est votre interlocuteur privilégié et assurera un suivi régulier du bon ordonnancement des travaux dans les règles de l'art.

A la fin des travaux, il est convenu de faire une réception contradictoire entre les deux parties avant le solde des travaux.

**2- Sujétions et conditions de l'offre :**

- M. {{nom_prestataire}} justifie de sa capacité et de ses compétences pour la réalisation des travaux de peinture visés en objet, conformément au descriptif du cahier des charges.
- M. {{nom_prestataire}} a effectué la visite préalable du site afin de constater l'état des surfaces, d'évaluer la nature des travaux de peinture à réaliser, de prendre en compte l'environnement du chantier ainsi que les contraintes et sujétions techniques liées à l'exécution des prestations.
- M. {{nom_prestataire}} s'engage à livrer la zone de prestations entièrement achevée, incluant le respect des règles de sécurité et d'hygiène sur le chantier, la protection des surfaces non peintes ainsi que le nettoyage complet du chantier.

**3- Planning général**

M. {{nom_prestataire}} s'engage à respecter le planning établi par l'entreprise ECRB pour la partie peintre. Réalisation sous un délai de {{delai_jours}} jours maximum

**4- Conditions financières**

Selon la proposition financière le montant est de :

MONTANT TOTAL H.T. (Prix ferme non actualisable, non révisable) : {{montant_total}} FCFA

*Traité en auto liquidation*

Ce prix s'entend ferme, non actualisable et non révisable.

Règlement :
- {{montant_avance}} F pour avance de démarrage
- {{montant_solde}} F après finitions des travaux et réception par le Maitre d'oeuvre.

Paiement effectué par virement Ria, Wave ou versement espèce avec décharge.

---

| Le sous-traitant | L'entreprise |
|---|---|
| M. {{nom_prestataire}} | Le Directeur Général — Abdoul Aziz SAMBE |
| *(signature)* | Signature et cachet précédé de la mention « lu et approuvé »<br>*(cachet ECRB inséré automatiquement, voir ci-dessous)* |

---

*(pied de page, sur toutes les pages — siège social)*
ECRB – Entreprise de construction de routes et bâtiment tout corps d'état     NINEA 010156786 - RCCM SN.THS.2023.B.1453
Mobile : 77 286 25 70 / 33 858 60 65 - email : sas.ecrb@ecrb.fr

---

## Logo, cachet et adresses

Le fichier `.doc` original contient un logo et un cachet en **images intégrées dans des zones de texte flottantes** — invisibles à une simple lecture du texte, il a fallu les extraire un par un via Word pour les découvrir. Ils sont disponibles ici :

- Logo : [`../prototype/assets/images/ecrb-logo.png`](../prototype/assets/images/ecrb-logo.png)
- Cachet : [`../prototype/assets/images/ecrb-cachet.png`](../prototype/assets/images/ecrb-cachet.png)

**Le cachet est inséré automatiquement sur chaque contrat généré**, côté « L'entreprise », comme demandé par le client. Il affiche : « Sarl ECRB — Quartier Mbambara, Mekhé-Sénégal — NINEA 010156786 - RCCM SN.THS.2023.B.1453 — Tél : 33 858 60 65 - 77 286 25 70 ».

**Deux adresses différentes trouvées dans le document, confirmées réelles par le client :**
- **Siège social : Quartier Mbambara, Mekhé, Sénégal** (celle du cachet officiel et du RCCM `SN.THS...`, THS = région de Thiès) — utilisée dans le pied de page
- **Agence : Villa 56 Mariste, Fort B, Dakar** — utilisée dans l'en-tête, à côté du logo

Le document original contenait aussi une **troisième version, plus ancienne**, de l'identité de l'entreprise dans une zone de texte de l'en-tête/pied de page non affichée par défaut (« SAS au capital social de 5000€, SIRET français, e-mail @yahoo.com ») — un reliquat visiblement obsolète (numéros d'immatriculation français, alors qu'ECRB est aujourd'hui une Sarl immatriculée au Sénégal). **Cette version n'est pas reprise.**

---

## Notes d'analyse (comment ce modèle a été reconstitué)

Le fichier original a été ouvert via Word (automatisation COM, pas une simple extraction de texte) pour lire, **mot par mot**, la couleur de surlignage (`HighlightColorIndex`) de chaque portion de texte, dans le corps du document, les tableaux et le pied de page. Deux couleurs de surlignage étaient utilisées (jaune et vert) ; les deux marquent des variables.

Une première lecture avait manqué le logo et le cachet : ils sont dans des **zones de texte flottantes** (`Shapes`), invisibles à une lecture classique du texte (`Paragraphs`/`Range.Text`) et même de l'en-tête/pied de page standard. Il a fallu inspecter `document.Shapes` (corps) et les `Shapes` des en-têtes/pieds de page spécifiquement, puis extraire les images qu'ils contiennent une par une, pour les découvrir.

### Champs confirmés variables par le surlignage (et uniquement ceux-là)

`objet_header`, `adresse_travaux`, `nom_prestataire`, `date_naissance`, `lieu_naissance`, `date_offre`, `description_travaux` (la formulation en langage naturel après « pour les travaux de », distincte de `objet_header`), `montant_total`, `nom_conducteur_travaux`, `delai_jours`, `montant_avance`.

### Correction par rapport à une première version de ce modèle

Une première reconstitution avait ajouté un champ « corps de métier » (Peintre/Maçon/Électricien...) par supposition, pour que l'outil serve à tous les corps de métier. **Ce n'était pas ce que le fichier du client marquait comme variable.** Vérification faite : « Peintre », « travaux de peinture », « surfaces non peintes » et « pour la partie peintre » ne sont surlignés nulle part dans le fichier original — ce sont des mentions fixes. Conformément à l'instruction du client (« rien ne doit changer sauf les variables »), ce modèle les traite désormais comme fixes, à l'identique du document fourni.

**Conséquence à connaître :** ce modèle, tel que reconstitué, ne sert que pour des contrats de **peinture**. S'il doit aussi servir pour d'autres corps de métier, ces quatre mentions devront être généralisées en variable — c'est un changement à demander explicitement, pas une supposition que je referai.

### Incohérence corrigée (déjà signalée)

Le corps du texte nomme le prestataire « OUMAR DIOMBO KANDE », mais la ligne de signature du fichier original indique un nom différent, « MODOU MBOUP » — un reliquat d'un contrat précédent non mis à jour partout. Ce modèle utilise systématiquement `{{nom_prestataire}}`, y compris à la signature, pour que ce type d'erreur devienne impossible.

### Restent fixes (données d'entreprise et clauses, non surlignées, identiques à chaque contrat)

Nom et description d'ECRB, les deux adresses, NINEA, RCCM, téléphones, e-mail, logo, cachet, nom du Directeur Général (Abdoul Aziz Sambe) ; les 4 titres de section ; l'ensemble des clauses des sections 1, 2 et 3 hormis les balises listées plus haut ; « Traité en auto liquidation » ; la phrase sur les modalités de paiement (Ria/Wave/espèces).

### Montant de l'avance vs solde

Le formulaire ne demande que le montant total et le montant de l'avance ; le solde est calculé automatiquement (`solde = total − avance`) plutôt que ressaisi, pour qu'il ne puisse jamais y avoir d'incohérence entre les trois montants — le fichier original les indiquait tous les trois manuellement.
