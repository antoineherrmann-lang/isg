# ISG International

Application iPad pour les journées portes ouvertes de l'ISG Strasbourg : un globe 3D avec les destinations des étudiants. Un toucher sur un point ouvre la fiche du lieu, puis la vidéo de l'étudiant.

Un seul fichier `index.html`, sans dépendance à installer. Fonctionne hors-ligne une fois les contenus téléchargés.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | L'application complète (HTML, CSS, JavaScript, moteur 3D Three.js r128, polices Aileron et Barlow) |
| `sw.js` | Service worker : hors-ligne, mise à jour par version, lecture des vidéos en cache |
| `data/lieux.json` | Liste des destinations : à modifier pour ajouter ou changer un lieu |
| `data/terre.json` | Points de terre du globe (généré, ne pas modifier) |
| `videos/`, `posters/` | Une vidéo `.mp4` et une vignette `.jpg` par lieu (actuellement des vidéos de démonstration) |
| `icon-180.png`, `icon-192.png`, `icon-512.png` | Icônes de l'application |
| `.nojekyll` | Demande à GitHub Pages de servir les fichiers tels quels |

Tout doit rester **à la racine** du dépôt, avec le fichier caché `.nojekyll`.

## Installation sur GitHub Pages

1. Créer un dépôt GitHub public (par exemple `isg-international`).
2. Déposer tous les fichiers et dossiers à la racine (*Add file → Upload files*), puis *Commit changes*.
3. *Settings → Pages* : source **Deploy from a branch**, branche **main**, dossier **/ (root)**, puis *Save*.
4. Au bout d'une minute, l'adresse est `https://<compte>.github.io/isg-international/`.

## Installation sur l'iPad

1. Ouvrir l'adresse dans **Safari**, iPad connecté à Internet.
2. *Partager → Sur l'écran d'accueil*.
3. Ouvrir l'application depuis son icône et laisser le téléchargement se terminer (barre fine en haut de l'écran).
4. Réglages cachés (appui long d'une seconde sur le logo) : vérifier que tous les fichiers sont prêts.

## Ajouter ou remplacer une destination

1. Préparer la vidéo en H.264 / AAC, 720p, démarrage rapide :

       ffmpeg -i source.mov -vf scale=-2:720 -c:v libx264 -profile:v high -crf 23 -preset slow -c:a aac -b:a 128k -movflags +faststart montreal.mp4

2. Déposer le fichier dans `videos/` et une vignette 1280×720 dans `posters/`.
3. Ajouter un bloc dans `data/lieux.json` (copier un bloc existant, retirer `"demo": true`).
4. **Pour remplacer une vidéo existante, lui donner un nouveau nom de fichier** : l'iPad ne retélécharge pas un fichier déjà présent sous le même nom.
5. Publier une nouvelle version (voir ci-dessous).

Champs d'un lieu : `id` (unique, sans espace), `ville`, `pays`, `code` (code pays à 2 lettres, colore le pays sur le globe), `lat`, `lon`, `continent`, `etablissement`, `etudiant` (`prenom`, `programme`, `annee`), `titre`, `video`, `poster`, `duree` (secondes), `sous_titres` (fichier `.vtt`, facultatif).

## Mises à jour automatiques

L'application relit `index.html` sur le serveur toutes les 10 minutes, au retour de connexion et quand elle revient au premier plan. Si le numéro `APP_VERSION` a augmenté, elle s'installe toute seule **uniquement quand le globe tourne et que personne ne touche l'écran**. Le bouton rond en haut à droite lance la recherche et l'installation immédiatement.

**À chaque publication, `APP_VERSION` doit augmenter** (y compris pour un simple changement de `lieux.json` ou de vidéo), sinon l'iPad ne détecte rien. Avec le script de build : `python3 build.py 0.1.1`.

Si une mise à jour échoue, l'ancienne version continue de fonctionner et l'application réessaie 5 minutes plus tard.

## Mode présentation le jour J

- iPad branché, luminosité réglée à la main.
- *Réglages › Écran et luminosité › Verrouillage automatique* : **Jamais**.
- Lancer l'application depuis son icône, puis activer **Accès guidé** (*Réglages › Accessibilité › Accès guidé*, triple clic sur le bouton principal).
- Après 1 minute sans toucher (réglable), l'application ferme la fiche ou la vidéo et revient au globe.
