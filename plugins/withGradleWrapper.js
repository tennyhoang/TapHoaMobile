const { withGradleProperties } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// Gradle 9.x removed JvmVendorSpec.IBM_SEMERU — incompatible with RN 0.85.
// Pin to 8.10.2 until plugins are updated.
const GRADLE_VERSION = '8.10.2';

module.exports = function withGradleWrapper(config) {
  return withGradleProperties(config, async (config) => {
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
    }

    return config;
  });
};
