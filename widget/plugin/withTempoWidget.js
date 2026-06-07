/**
 * withTempoWidget — Expo config plugin
 *
 * Injects the Tempo home-screen widget into the native Android & iOS projects
 * during `expo prebuild`.
 *
 * Android:
 *   • Copies res/ + Kotlin sources into android/app/src/main/...
 *   • Registers TempoWidgetProvider in AndroidManifest.xml
 *   • Adds TempoWidgetPackage to MainApplication.kt's packages list
 *
 * iOS:
 *   • Copies the Swift widget extension target sources into ios/TempoWidget/
 *   • Adds the App Group entitlement to the host app
 *
 * NOTE: For iOS, fully wiring the widget extension target into the Xcode
 * project programmatically requires xcode/pbxproj manipulation that's brittle
 * across Expo versions. We copy the source files; you'll add the extension
 * target in Xcode once with File > New > Target > Widget Extension, then
 * point it at widget/ios/TempoWidget. See widget/README.md for the 2-minute
 * walkthrough.
 */
const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  withEntitlementsPlist,
} = require('@expo/config-plugins');

const PACKAGE = 'com.tempo.timerapp.widget';
const APP_GROUP = 'group.com.tempo.timerapp';

const copyFile = (src, dest) => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
};

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
};

const withAndroidWidgetFiles = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, 'android', 'app', 'src', 'main');
      const widgetRoot = path.join(projectRoot, 'widget', 'android');

      copyDir(path.join(widgetRoot, 'res'), path.join(androidRoot, 'res'));

      const javaRoot = path.join(androidRoot, 'java', ...PACKAGE.split('.'));
      copyDir(path.join(widgetRoot, 'kotlin', ...PACKAGE.split('.')), javaRoot);

      return cfg;
    },
  ]);

const withAndroidWidgetManifest = (config) =>
  withAndroidManifest(config, async (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;

    application.receiver = application.receiver || [];
    const exists = application.receiver.some(
      (r) => r['$']?.['android:name'] === `${PACKAGE}.TempoWidgetProvider`
    );
    if (!exists) {
      application.receiver.push({
        $: {
          'android:name': `${PACKAGE}.TempoWidgetProvider`,
          'android:exported': 'true',
          'android:label': '@string/tempo_widget_label',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              { $: { 'android:name': `${PACKAGE}.REFRESH` } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/tempo_widget_info',
            },
          },
        ],
      });
    }
    return cfg;
  });

const withAndroidWidgetPackage = (config) =>
  withMainApplication(config, async (cfg) => {
    let src = cfg.modResults.contents;
    const importLine = `import ${PACKAGE}.TempoWidgetPackage`;
    if (!src.includes(importLine)) {
      src = src.replace(
        /^(package [^\n]+\n)/m,
        `$1\n${importLine}\n`
      );
    }
    if (!src.includes('TempoWidgetPackage()')) {
      // Kotlin-style autolinking + manual addition
      src = src.replace(
        /(getPackages\(\)[^{]*\{[\s\S]*?val packages = PackageList\(this\)\.packages[\s\S]*?)(\n\s*return packages)/,
        `$1\n            packages.add(TempoWidgetPackage())$2`
      );
      // Fallback for projects exposing packages as a property
      src = src.replace(
        /(override val reactNativeHost[\s\S]*?override fun getPackages\(\)[\s\S]*?return\s+)(packages|PackageList\(this\)\.packages)/,
        (m, head, tail) =>
          `${head}${tail}.also { it.add(TempoWidgetPackage()) }`
      );
    }
    cfg.modResults.contents = src;
    return cfg;
  });

const withIosWidgetFiles = (config) =>
  withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const src = path.join(projectRoot, 'widget', 'ios', 'TempoWidget');
      const dest = path.join(projectRoot, 'ios', 'TempoWidget');
      copyDir(src, dest);
      return cfg;
    },
  ]);

const withIosAppGroup = (config) =>
  withEntitlementsPlist(config, async (cfg) => {
    const groups = cfg.modResults['com.apple.security.application-groups'] || [];
    if (!groups.includes(APP_GROUP)) groups.push(APP_GROUP);
    cfg.modResults['com.apple.security.application-groups'] = groups;
    return cfg;
  });

module.exports = function withTempoWidget(config) {
  config = withAndroidWidgetFiles(config);
  config = withAndroidWidgetManifest(config);
  config = withAndroidWidgetPackage(config);
  config = withIosWidgetFiles(config);
  config = withIosAppGroup(config);
  return config;
};
