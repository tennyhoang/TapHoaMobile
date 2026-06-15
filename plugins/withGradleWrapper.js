const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// RN 0.85 on AGP 8.13 requires Gradle >= 8.13.
// Keep on 8.x until Gradle 9 compatibility is confirmed.
const GRADLE_VERSION = '8.13';

module.exports = function withGradleWrapper(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const wrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
        'gradle-wrapper.properties'
      );

      if (fs.existsSync(wrapperPath)) {
        let content = fs.readFileSync(wrapperPath, 'utf8');
        content = content.replace(
          /distributionUrl=.*gradle-.*-bin\.zip/,
          `distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip`
        );
        fs.writeFileSync(wrapperPath, content, 'utf8');
        // eslint-disable-next-line no-console
        console.log(`[withGradleWrapper] Pinned Gradle to ${GRADLE_VERSION}`);
      }

      return config;
    },
  ]);
};
