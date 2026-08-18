# Guide d'installation — Automatisation des contrats de sous-traitance (ECRB)

Mise en place dans un compte Google Workspace (ou Gmail classique — ça fonctionne aussi avec un compte Gmail gratuit, pas besoin d'un abonnement payant). Durée estimée : **30 à 45 minutes**, à faire une seule fois.

---

## Étape 1 — Créer le Google Doc modèle à partir du vrai fichier client

**Ne pas repartir de zéro dans un document vierge** — le texte reconstitué dans `modele-contrat/contrat-sous-traitance-ecrb.md` sert à vérifier le contenu, mais retaper le contrat à la main ne peut pas reproduire le logo et le cachet avec une fidélité parfaite (ce sont des images intégrées dans des zones de texte, pas de simples images collées). La méthode fiable : convertir le vrai fichier du client.

1. Dans Google Drive, importer le fichier `context/import/CONTRAT DE SOUS TRAITANCE MOD.doc`
2. Clic droit dessus > **Ouvrir avec > Google Docs** — Google Docs convertit automatiquement le fichier en conservant le texte, la mise en forme, le logo et le cachet
3. Vérifier visuellement que rien n'a été décalé pendant la conversion (Google Docs interprète parfois différemment les zones de texte flottantes de Word) — comparer avec l'original si besoin
4. Dans ce Doc converti, remplacer uniquement les passages variables par les balises `{{comme_ceci}}` (liste exacte dans `modele-contrat/contrat-sous-traitance-ecrb.md`, section « Champs confirmés variables »), et retirer leur surlignage jaune/vert (sélectionner le texte > outil surligneur > « Aucune couleur »)
5. Renommer le document, par exemple « MODÈLE — Contrat de sous-traitance ECRB »
6. Noter son identifiant : dans l'URL `https://docs.google.com/document/d/XXXXXXXXXXXX/edit`, copier la partie `XXXXXXXXXXXX`

## Étape 2 — Créer le dossier Drive de destination

1. Dans Google Drive, créer un dossier, par exemple « Contrats générés »
2. Ouvrir le dossier, noter son identifiant dans l'URL : `https://drive.google.com/drive/folders/XXXXXXXXXXXX`

## Étape 3 — Créer le Google Form

1. Aller sur [forms.google.com](https://forms.google.com), créer un formulaire, par exemple « Nouveau contrat de sous-traitance »
2. Ajouter les questions listées dans [`formulaire/champs-formulaire.md`](formulaire/champs-formulaire.md), avec **l'intitulé exact** indiqué pour chacune
3. Onglet « Réponses » du formulaire → cliquer sur l'icône Google Sheets verte → « Créer une feuille de calcul » → cela crée automatiquement le Sheet lié

## Étape 4 — Compléter le Sheet

1. Renommer l'onglet créé automatiquement en **« Contrats prestataires »** (nom exact, le script s'appuie dessus)
2. Ajouter, après la dernière colonne existante, les colonnes : `Numéro contrat`, `Montant solde`, `Lien contrat Word`, `Lien contrat PDF`, `Statut` (le script les remplira automatiquement)
3. Créer un deuxième onglet **« Ouvriers »** avec les colonnes décrites dans [`suivi/structure-fichier-suivi.md`](suivi/structure-fichier-suivi.md)
4. (Optionnel) Créer un troisième onglet **« Statistiques »** avec les formules suggérées dans le même fichier

## Étape 5 — Installer le script

1. Dans le Google Sheet, menu **Extensions > Apps Script**
2. Supprimer le contenu par défaut (`function myFunction() {}`) et coller l'intégralité de [`script/Code.gs`](script/Code.gs)
3. En haut du script, remplacer :
   - `COLLER_ICI_L_ID_DU_GOOGLE_DOC_MODELE` par l'identifiant noté à l'Étape 1
   - `COLLER_ICI_L_ID_DU_DOSSIER_DRIVE_DESTINATION` par l'identifiant noté à l'Étape 2
4. Enregistrer (icône disquette ou `Ctrl+S`)

## Étape 6 — Tester manuellement avant d'automatiser

1. Dans l'éditeur Apps Script, sélectionner la fonction `testerGenerationDerniereLigne` dans le menu déroulant en haut, puis cliquer sur **Exécuter**
2. La première exécution demande une autorisation Google (normal, c'est votre propre script sur vos propres fichiers) : cliquer sur « Vérifier les autorisations » → choisir le compte → « Autorisation avancée » (l'écran d'avertissement est normal pour un script personnel non publié) → « Accéder à [nom du projet] (non sécurisé) » → Autoriser
3. Vérifier dans le dossier Drive « Contrats générés » qu'un contrat Word + PDF a bien été créé, avec les bonnes informations
4. Vérifier que le Sheet affiche bien le numéro de contrat et les deux liens sur la ligne testée

*Remarque : pour ce test, il faut qu'il y ait déjà au moins une ligne de données dans l'onglet « Contrats prestataires » — remplir le Form une première fois avant de tester.*

## Étape 7 — Automatiser le déclenchement

1. Dans l'éditeur Apps Script, icône **horloge** (Déclencheurs) dans le menu de gauche
2. **Ajouter un déclencheur** :
   - Fonction à exécuter : `onFormSubmitContrat`
   - Source de l'événement : **Depuis la feuille de calcul**
   - Type d'événement : **Lors de la soumission du formulaire**
3. Enregistrer

À partir de maintenant, chaque réponse au formulaire génère automatiquement le contrat en Word et PDF, et met à jour le tableau de suivi — sans aucune action manuelle.

## Étape 8 — Partager le formulaire

Copier le lien du formulaire (bouton « Envoyer ») et le transmettre à la ou les personnes autorisées à créer des contrats. Le Sheet et le dossier Drive, eux, doivent rester en accès restreint (voir Cahier des charges du site, section "Sécurité et conformité", pour la logique générale de protection des données appliquée au reste du projet).

---

## En cas de problème

| Symptôme | Cause probable |
|---|---|
| Le contrat n'est pas généré après soumission du Form | Le déclencheur (Étape 7) n'est pas configuré, ou une erreur bloque le script — vérifier dans Apps Script > Exécutions (icône horloge à gauche) |
| Les balises `{{...}}` apparaissent telles quelles dans le contrat généré | L'intitulé de la question dans le Form ne correspond pas exactement à la clé attendue dans `Code.gs` — comparer avec `formulaire/champs-formulaire.md` |
| Erreur "Autorisation requise" à chaque exécution | Relancer l'autorisation depuis Apps Script > Exécuter une fonction manuellement une fois |
| Le PDF généré est vide ou mal formaté | Vérifier que le Doc modèle ne contient pas d'erreur de mise en forme autour des balises (éviter de couper une balise `{{...}}` en plusieurs styles de texte différents) |
