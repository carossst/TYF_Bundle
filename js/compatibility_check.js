/*
 * compatibility-check.js - Script de vérification de compatibilité
 * À exécuter dans la console du navigateur pour diagnostiquer les problèmes
 */

function checkTYFCompatibility() {
  console.log("🔍 TYF COMPATIBILITY CHECK - Version 2.3.1");
  console.log("=" .repeat(50));
  
  const issues = [];
  const warnings = [];
  const success = [];

  // 1. Vérification des éléments DOM critiques
  console.log("\n📋 DOM ELEMENTS CHECK");
  const criticalElements = [
    'welcome-screen', 'quiz-selection', 'quiz-screen', 'result', 'stats-screen',
    'themes-list', 'quizzes-list', 'quiz', 'feedback', 'quiz-name',
    'progress', 'progress-steps', 'final-score', 'answers-summary'
  ];

  criticalElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      success.push(`✅ ${id} - found`);
    } else {
      issues.push(`❌ ${id} - MISSING`);
    }
  });

  // 2. Vérification des éléments stats dashboard
  console.log("\n📊 STATS DASHBOARD CHECK");
  const statsElements = [
    'welcome-quizzes-completed', 'welcome-accuracy', 
    'welcome-themes-progress', 'welcome-streak',
    'stats-quizzes-completed', 'stats-average-score',
    'themes-bars-container', 'quiz-history-list'
  ];

  statsElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      success.push(`✅ ${id} - found`);
    } else {
      warnings.push(`⚠️ ${id} - missing (stats may not work)`);
    }
  });

  // 3. Vérification des boutons CTA
  console.log("\n🔘 CTA BUTTONS CHECK");
  const ctaButtons = [
    'cta-explore-themes', 'cta-view-stats', 'cta-try-again',
    'back-to-quiz-selection-from-results', 'back-to-themes-from-stats',
    'show-stats-btn-from-quiz'
  ];

  ctaButtons.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      success.push(`✅ ${id} - found`);
    } else {
      warnings.push(`⚠️ ${id} - missing (navigation may be limited)`);
    }
  });

  // 4. Vérification des modules JavaScript
  console.log("\n🔧 JAVASCRIPT MODULES CHECK");
  const modules = [
    { name: 'window.ResourceManager', obj: window.ResourceManager },
    { name: 'window.QuizManager', obj: window.QuizManager },
    { name: 'window.QuizUI', obj: window.QuizUI },
    { name: 'window.storage', obj: window.storage }
  ];

  modules.forEach(({ name, obj }) => {
    if (obj) {
      success.push(`✅ ${name} - loaded`);
    } else {
      issues.push(`❌ ${name} - MISSING`);
    }
  });

  // 5. Vérification des méthodes storage
  if (window.storage) {
    console.log("\n💾 STORAGE METHODS CHECK");
    const storageMethods = [
      'getProgress', 'saveQuizResult', 'getVisualizationData', 
      'checkAndAwardBadges', 'getUserBadges'
    ];

    storageMethods.forEach(method => {
      if (typeof window.storage[method] === 'function') {
        success.push(`✅ storage.${method} - available`);
      } else {
        issues.push(`❌ storage.${method} - MISSING`);
      }
    });
  }

  // 6. Vérification de la structure audio
  console.log("\n🎵 AUDIO STRUCTURE CHECK");
  const audioTest = async () => {
    try {
      const response = await fetch('./audio/Colors/');
      if (response.ok) {
        success.push("✅ Audio folder structure - accessible");
      } else {
        warnings.push("⚠️ Audio folder structure - may need adjustment");
      }
    } catch (error) {
      warnings.push("⚠️ Audio folder structure - cannot verify");
    }
  };
  audioTest();

  // 7. Résumé des résultats
  setTimeout(() => {
    console.log("\n" + "=" .repeat(50));  
    console.log("📊 COMPATIBILITY SUMMARY");
    console.log("=" .repeat(50));
    
    console.log(`🟢 Success: ${success.length} items`);
    success.forEach(s => console.log(`   ${s}`));
    
    if (warnings.length > 0) {
      console.log(`\n🟡 Warnings: ${warnings.length} items`);
      warnings.forEach(w => console.log(`   ${w}`));
    }
    
    if (issues.length > 0) {
      console.log(`\n🔴 Critical Issues: ${issues.length} items`);
      issues.forEach(i => console.log(`   ${i}`));
    }

    // Recommandations
    console.log("\n💡 RECOMMENDATIONS:");
    if (issues.length === 0) {
      console.log("✅ All critical components found - Application should work!");
    } else {
      console.log("❌ Critical issues found - Application may not work properly");
      console.log("   → Check missing DOM elements in index.html"); 
      console.log("   → Verify all JavaScript files are loaded");
    }

    if (warnings.length > 0) {
      console.log("⚠️ Some optional features may not work:");
      console.log("   → Stats dashboard may show incomplete data");
      console.log("   → Navigation buttons may be missing");
      console.log("   → Audio files may not play");
    }

    console.log("\n🔧 Next steps:");
    console.log("1. Fix critical issues (❌) first");
    console.log("2. Add missing DOM elements from patch file");  
    console.log("3. Test basic functionality");
    console.log("4. Address warnings (⚠️) for full features");
    
  }, 1000);
}

// Fonction d'aide rapide  
function quickTYFTest() {
  console.log("🚀 QUICK TYF TEST");
  
  const essential = ['welcome-screen', 'themes-list', 'quiz', 'ResourceManager'];
  let allGood = true;
  
  essential.forEach(item => {
    const element = document.getElementById(item) || window[item];
    if (!element) {
      console.log(`❌ ${item} - MISSING`);
      allGood = false;
    } else {
      console.log(`✅ ${item} - OK`);
    }
  });
  
  console.log(allGood ? "🎉 Basic setup looks good!" : "⚠️ Issues detected - run checkTYFCompatibility() for details");
}

// Auto-exécution si dans la console
if (typeof window !== 'undefined') {
  console.log("TYF Compatibility Checker loaded!");
  console.log("Run checkTYFCompatibility() for full analysis");
  console.log("Run quickTYFTest() for basic check");
}