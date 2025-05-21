// config.js - Configuration pour les chemins d'accès aux ressources
// À placer dans le répertoire racine de votre application 
// ou dans le même répertoire que resourceManager.js

// Configuration globale pour ResourceManager
window.resourceManagerConfig = {
    // Chemin de base pour accéder aux ressources
    // Pour GitHub Pages, utiliser le chemin absolu avec le nom du dépôt
    baseDataPath: '/TYF_Bundle/',
    
    // Options supplémentaires
    enableLog: true,         // Activer les logs détaillés
    cacheEnabled: true,      // Activer le cache de données
    fallbackEnabled: true,   // Utiliser les données de fallback en cas d'échec
    
    // Options pour le développement local
    // Ces valeurs sont automatiquement ignorées sur GitHub Pages
    localBasePath: './',
    
    // Version de l'application
    version: '2.2.2'
};

// Détection du mode (production ou développement)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Mode développement détecté - Utilisation des chemins locaux');
    window.resourceManagerConfig.baseDataPath = window.resourceManagerConfig.localBasePath;
} else if (window.location.hostname.includes('github.io')) {
    console.log('GitHub Pages détecté - Utilisation des chemins GitHub');
    // Garder le chemin GitHub Pages par défaut
} else {
    console.log('Environnement inconnu - Utilisation des chemins par défaut');
}

console.log('Configuration chargée:', window.resourceManagerConfig);
