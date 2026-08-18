# Automatisation des contrats de sous-traitance — kit Google Workspace (ECRB)

Solution proposée pour automatiser la génération des contrats de sous-traitance d'ECRB, reconstruite à partir de leur **vrai modèle de contrat** (fichier fourni par le client : `context/import/CONTRAT DE SOUS TRAITANCE MOD.doc`) : remplacer la ressaisie manuelle d'un modèle Word par un formulaire, avec génération automatique du contrat en Word/PDF et alimentation automatique d'un tableau de suivi (statistiques contrats, ouvriers).

Première version construite sur un modèle générique reconstitué (« contrat de prestation de services ») en attendant le vrai document — remplacée depuis par cette version basée sur le contrat réel du client.

**Architecture retenue :** Google Form → Google Sheet → Google Apps Script → Google Doc modèle → export Word/PDF. Choisie plutôt que Microsoft 365 (connecteur de génération de documents payant chez Power Automate) ou un développement sur mesure (coût et maintenance plus élevés pour ce volume) — voir le raisonnement complet échangé avant la construction de ce kit.

## Contenu

| Fichier | Rôle |
|---|---|
| [`prototype/index.html`](prototype/index.html) | **Démo à présenter au client** — prototype interactif dans le navigateur : formulaire → contrat généré (Word/PDF) → tableau de suivi (Excel). Fonctionne sans installation, à ouvrir directement ou héberger en ligne pour la présentation. |
| [`GUIDE-INSTALLATION.md`](GUIDE-INSTALLATION.md) | Installation de la vraie automatisation en production, en 8 étapes (~30-45 min), une fois le client convaincu |
| [`modele-contrat/contrat-sous-traitance-ecrb.md`](modele-contrat/contrat-sous-traitance-ecrb.md) | Trame du contrat de sous-traitance ECRB avec balises de fusion, reconstruite à partir du vrai document du client (détail de l'analyse des champs surlignés en bas du fichier) |
| [`formulaire/champs-formulaire.md`](formulaire/champs-formulaire.md) | Liste exacte des questions à créer dans le Google Form |
| [`suivi/structure-fichier-suivi.md`](suivi/structure-fichier-suivi.md) | Structure du tableau de suivi (onglets Contrats / Ouvriers / Statistiques) |
| [`script/Code.gs`](script/Code.gs) | Le script d'automatisation (Google Apps Script), à coller tel quel |

## Prototype de démonstration vs. version en production

Le dossier `prototype/` est un **outil de présentation**, pas la solution finale : il tourne entièrement dans le navigateur, sans serveur ni base de données partagée — les contrats générés pendant une démo restent stockés localement dans le navigateur utilisé (`localStorage`), pas dans un vrai tableau accessible à toute l'équipe. Il permet de montrer concrètement le résultat (formulaire, contrat Word/PDF, tableau exportable en Excel) sans attendre l'installation complète.

Une fois le client convaincu, la vraie automatisation à mettre en place est celle décrite dans `GUIDE-INSTALLATION.md` (Google Form + Sheet partagé + Apps Script) : mêmes écrans et même résultat pour l'utilisateur, mais avec des données centralisées et accessibles à plusieurs personnes.

## Ce que ça change pour le client

**Avant :** ouvrir le fichier Word modèle, remplacer manuellement chaque champ, vérifier qu'aucun n'a été oublié, imprimer, puis (si fait) ressaisir les infos ailleurs pour le suivi.

**Après :** remplir un formulaire en 2 minutes → le contrat Word et PDF sont générés automatiquement, prêts à télécharger et imprimer → le tableau de suivi (contrats, montants, statuts) se met à jour tout seul.

## Important avant mise en service réelle

- **Deux points à confirmer avec le client** (voir le détail dans `modele-contrat/contrat-sous-traitance-ecrb.md`, section "Notes d'analyse") :
  1. Le nom du prestataire est désormais injecté automatiquement partout, y compris à la signature — corrige une incohérence trouvée dans le fichier original (deux noms différents entre le corps du texte et la signature)
  2. Le corps de métier a été ajouté comme champ variable, alors qu'il n'était pas surligné dans le document original — à confirmer que c'est bien voulu (utile seulement si ECRB réutilise ce même modèle pour d'autres métiers que la peinture)
- Le contrat réel du client ne contient **aucune clause de pénalité de retard** ni de clause de résiliation formelle (contrairement à la première version générique) — à signaler au client : ajouter ce type de clause est une amélioration possible, pas une obligation, mais ça vaut la peine d'être mentionné
- Une fois validé, l'installation (`GUIDE-INSTALLATION.md`) se fait directement dans le compte Google du client (ou de l'entreprise) — pas dans un compte tiers, pour que le client reste propriétaire de ses données et de ses contrats

## Évolutions possibles (non incluses dans cette première version)

- Formulaire dédié pour l'ajout des ouvriers (même principe que les contrats)
- Envoi automatique du contrat par e-mail au prestataire après génération
- Signature électronique intégrée
- Alertes automatiques sur les contrats arrivant à échéance
