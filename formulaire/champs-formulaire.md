# Champs du Google Form — Contrat de sous-traitance ECRB (peinture)

À créer dans Google Forms. **L'intitulé de chaque question doit être exactement celui indiqué dans la colonne "Intitulé exact"** — c'est ce texte qui devient l'en-tête de colonne dans le Google Sheet lié, et le script (`../script/Code.gs`) s'appuie sur ces en-têtes pour savoir quelle donnée va où.

Cette liste correspond exactement aux passages surlignés du document fourni par le client — voir `../modele-contrat/contrat-sous-traitance-ecrb.md` pour le détail de l'analyse. Ce modèle est actuellement spécifique à la peinture (voir la note dans ce même fichier) : aucun champ « corps de métier » n'est inclus, car ce n'était pas marqué comme variable dans le document original.

| # | Intitulé exact (à saisir tel quel dans le Form) | Type de question | Obligatoire | Remarques |
|---|---|---|---|---|
| 1 | Objet des travaux (titre) | Réponse courte | Oui | Reprend la ligne « OBJET : TRAVAUX ... » en majuscules. Ex. « PEINTURE TOILETTES INSTALLATIONS CHANTIER » — mis en majuscules automatiquement par le script |
| 2 | Adresse des travaux | Réponse courte | Oui | Ex. « Sare Drame » |
| 3 | Nom du prestataire | Réponse courte | Oui | Nom complet, ex. « OUMAR DIOMBO KANDE » |
| 4 | Date de naissance | Date | Oui | |
| 5 | Lieu de naissance | Réponse courte | Oui | |
| 6 | Date de transmission de l'offre | Date | Oui | |
| 7 | Description des travaux (phrase) | Réponse courte | Oui | Vient après « pour les travaux de... » dans le texte. Ex. « peintre des toilettes » — reprend la formulation exacte du document original, distincte du champ 1 |
| 8 | Nom du conducteur de travaux | Réponse courte | Oui | Référent chantier côté ECRB pour ce contrat |
| 9 | Délai (en jours) | Réponse courte (validation : nombre) | Oui | |
| 10 | Montant total (FCFA) | Réponse courte (validation : nombre) | Oui | |
| 11 | Montant de l'avance (FCFA) | Réponse courte (validation : nombre) | Oui | Le solde est calculé automatiquement (total − avance), pas ressaisi |

## Colonnes ajoutées manuellement dans le Sheet (pas dans le Form)

| Colonne | Rempli par |
|---|---|
| Numéro contrat | Script (généré automatiquement) |
| Montant solde | Script (calculé : Montant total − Montant avance) |
| Lien contrat Word | Script |
| Lien contrat PDF | Script |
| Statut | Manuel (À jour / Terminé) |

## Si ECRB veut réutiliser ce même outil pour d'autres corps de métier

Dans le document original, toutes les mentions de « Peintre », « peinture » et « surfaces non peintes » sont des mentions **fixes**, pas surlignées comme variables — ce modèle ne les a donc pas rendues modifiables, conformément à la consigne de ne rien changer sauf les variables marquées. Si ECRB souhaite un contrat générique pour maçon/électricien/etc., il faudra explicitement demander de généraliser ces mentions (ajouter un champ « corps de métier ») — ce n'est pas fait par défaut ici pour respecter strictement le document fourni.
