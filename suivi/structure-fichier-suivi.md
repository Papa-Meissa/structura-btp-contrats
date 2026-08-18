# Structure du fichier de suivi (Google Sheet, exportable en Excel)

Un seul fichier Google Sheet, plusieurs onglets. Google Sheets peut être téléchargé en `.xlsx` à tout moment (Fichier > Télécharger > Microsoft Excel), donc ce fichier fait à la fois office d'outil vivant (mis à jour automatiquement) et de fichier Excel classique dès qu'on en a besoin (impression, envoi par mail, archivage).

## Onglet 1 — "Contrats prestataires"

Créé automatiquement par la liaison Google Form → Sheets (voir `../formulaire/champs-formulaire.md`). Colonnes finales attendues :

| Colonne | Origine |
|---|---|
| Horodatage | Auto (Form) |
| Objet des travaux (titre) | Form |
| Adresse des travaux | Form |
| Nom du prestataire | Form |
| Date de naissance | Form |
| Lieu de naissance | Form |
| Date de transmission de l'offre | Form |
| Description des travaux (phrase) | Form |
| Nom du conducteur de travaux | Form |
| Délai (en jours) | Form |
| Montant total (FCFA) | Form |
| Montant de l'avance (FCFA) | Form |
| Numéro contrat | Script (auto) |
| Montant solde | Script (auto, calculé) |
| Lien contrat Word | Script (auto) |
| Lien contrat PDF | Script (auto) |
| Statut | Manuel |

## Onglet 2 — "Ouvriers"

Alimenté manuellement pour l'instant (pas de formulaire dédié dans cette première version — peut être ajouté plus tard sur le même principe que les contrats si le besoin se confirme).

| Colonne | Exemple |
|---|---|
| Nom | Diop |
| Prénom | Moussa |
| Poste / Métier | Maçon |
| Téléphone | +221 77 XXX XX XX |
| N° CNI | |
| Date d'embauche | 03/02/2026 |
| Chantier affecté | Résidence [nom] |
| Taux journalier (FCFA) | |
| Statut | Actif / Inactif |

## Onglet 3 — "Statistiques" (tableau de bord simple)

Onglet avec quelques formules pointant vers les deux premiers onglets, pour avoir une vue d'ensemble sans recompter à la main :

| Indicateur | Formule type (à adapter selon les colonnes réelles) |
|---|---|
| Nombre total de contrats | `=COUNTA('Contrats prestataires'!A2:A)` |
| Montant total engagé (FCFA) | `=SUM('Contrats prestataires'!J2:J)` *(colonne "Montant total")* |
| Contrats en cours | `=COUNTIF('Contrats prestataires'!O2:O; "En cours")` *(colonne "Statut")* |
| Nombre d'ouvriers actifs | `=COUNTIF(Ouvriers!H2:H; "Actif")` |

*(Ajuster les lettres de colonnes selon l'ordre réel une fois le Form créé — les lettres exactes dépendent de l'ordre des questions.)*

## Pourquoi cette structure

- **Un seul fichier** plutôt que plusieurs : une seule source de vérité, plus simple à sauvegarder et à partager avec un comptable ou un associé
- **Séparation par onglet** plutôt que tout mélanger dans une seule feuille : chaque type de donnée garde ses propres colonnes pertinentes, sans colonnes vides inutiles
- **Onglet Statistiques distinct** : évite de polluer les données brutes avec des formules, et sert de vue "direction" rapide à consulter
