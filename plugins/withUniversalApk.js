const { withAppBuildGradle } = require('@expo/config-plugins');

// Disable per-ABI splits so one APK installs on all CPU architectures.
module.exports = function withUniversalApk(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('splits {')) {
      // Replace any existing splits block with one that disables ABI splits
      contents = contents.replace(
        /splits\s*\{[^}]*abi\s*\{[^}]*\}[^}]*\}/s,
        'splits {\n        abi {\n            enable false\n        }\n    }'
      );
    } else {
      // Inject before the closing brace of the android block
      contents = contents.replace(
        /(android\s*\{[^]*)(\n\})/,
        '$1\n    splits {\n        abi {\n            enable false\n        }\n    }\n}'
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
