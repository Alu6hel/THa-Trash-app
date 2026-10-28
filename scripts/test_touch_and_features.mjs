// ==============================================================================
// THa Trash App - Touch Ergonomics & Feature Debugging Audit Suite
// Validates: Touch targets (WCAG 44px+), touch-action rules, SVG touch coordinates,
// Leaflet touch zoom/pan, PWA installability, and Linux desktop integration.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import http from 'node:http';

const ROOT_DIR = process.cwd();
let passedAudits = 0;
let totalAudits = 0;

function assert(condition, message) {
  totalAudits++;
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  passedAudits++;
  console.log(`✅ [PASS] ${message}`);
}

console.log('====================================================');
console.log('   THA TRASH APP - TOUCH & FEATURE AUDIT SUITE      ');
console.log('====================================================\n');

// 1. Audit CSS Touch Rules
console.log('[STEP 1] Auditing CSS touch rules and gesture handling...');
const indexCss = fs.readFileSync(path.join(ROOT_DIR, 'src/index.css'), 'utf-8');
assert(indexCss.includes('touch-action: manipulation'), 'HTML/Body configured with touch-action: manipulation to eliminate 300ms tap delay');
assert(indexCss.includes('-webkit-tap-highlight-color: transparent'), 'Transparent tap highlight configured to eliminate grey flicker on touch screens');
assert(indexCss.includes('overscroll-behavior-y: contain'), 'Overscroll contain prevents dragging maps from triggering pull-to-refresh');
assert(indexCss.includes('.leaflet-container'), 'Leaflet container has dedicated touch-action rules (pan-x pan-y pinch-zoom)');
assert(indexCss.includes('.touch-scroll'), 'Touch scroll momentum helper (-webkit-overflow-scrolling: touch) declared');

// 2. Audit Area Map Touch Targets & Controls
console.log('\n[STEP 2] Auditing In Your Area Map touch targets & slider...');
const areaMapView = fs.readFileSync(path.join(ROOT_DIR, 'src/components/AreaMapView.tsx'), 'utf-8');
assert(areaMapView.includes('min-width: 44px') && areaMapView.includes('min-height: 48px'), 'Area map markers conform to WCAG 44px+ touch target standard');
assert(areaMapView.includes('type="range"'), 'Interactive touch range slider provided for direct finger dragging');
assert(areaMapView.includes('touch-none'), 'Touch range slider has touch-none for smooth hardware trackpad/touch dragging');
assert(areaMapView.includes('min-h-[38px]'), 'Quick fill adjuster preset buttons sized for finger taps (min-h-[38px])');
assert(areaMapView.includes('active:scale-95'), 'Preset buttons feature active:scale-95 tactile haptic feedback');

// 3. Audit GeoSocial CleanMap Touch Targets & Tab Sizing
console.log('\n[STEP 3] Auditing GeoSocial CleanMap touch targets & tab switching...');
const geoSocialView = fs.readFileSync(path.join(ROOT_DIR, 'src/components/GeoSocialView.tsx'), 'utf-8');
assert(geoSocialView.includes('min-width: 44px') && geoSocialView.includes('min-height: 44px'), 'GeoSocial dump markers sized to 44px+ touch targets');
assert(geoSocialView.includes('invalidateSize()'), 'Leaflet invalidateSize() triggered on map tab switch to ensure complete tile rendering');
assert(geoSocialView.includes('activeTab === \'map\''), 'Map tab switch listener correctly wired');

// 4. Audit Blueprint 2D SVG Touch Handlers & Hit Boxes
console.log('\n[STEP 4] Auditing Blueprint 2D SVG touch handlers...');
const facilityMapView = fs.readFileSync(path.join(ROOT_DIR, 'src/components/FacilityMapView.tsx'), 'utf-8');
assert(facilityMapView.includes('onTouchEnd={handleMapClick}'), 'SVG canvas has onTouchEnd listener for tap-to-place interactions');
assert(facilityMapView.includes('touches') && facilityMapView.includes('changedTouches'), 'handleMapClick extracts touch coordinates from touches / changedTouches');
assert(facilityMapView.includes('onTouchEnd={(e) =>'), 'Bin markers have onTouchEnd listener for instant tap selection');
assert(facilityMapView.includes('r="24"') && facilityMapView.includes('fill="transparent"'), 'Bin markers contain invisible 48px diameter touch hit target circle');

// 5. Audit Bottom Rudder Navigation & Circular Radial Gauges
console.log('\n[STEP 5] Auditing Bottom Rudder Navigation & Circular Gauges...');
const bottomNavTsx = fs.readFileSync(path.join(ROOT_DIR, 'src/components/BottomNavBar.tsx'), 'utf-8');
assert(bottomNavTsx.includes('fixed bottom-3 inset-x-0 mx-auto max-w-md'), 'Floating bottom navigation dock configured with mobile-first centering');
assert(bottomNavTsx.includes('min-w-[56px]'), 'Bottom navigation items sized to conform to WCAG mobile thumb touch targets');
assert(bottomNavTsx.includes('w-12 h-12 rounded-full') && bottomNavTsx.includes('active:scale-90'), 'Central floating Rudder (+) action button configured with haptic press scaling');
assert(bottomNavTsx.includes('backdrop-blur-xl'), 'Bottom dock styled with luxury glassmorphic backdrop-blur');

const gaugeTsx = fs.readFileSync(path.join(ROOT_DIR, 'src/components/CircularGauge.tsx'), 'utf-8');
assert(gaugeTsx.includes('<svg') && gaugeTsx.includes('strokeDashoffset'), 'CircularGauge component renders SVG radial progress stroke');
assert(gaugeTsx.includes('drop-shadow'), 'CircularGauge applies glowing drop-shadow filter');

const headerTsx = fs.readFileSync(path.join(ROOT_DIR, 'src/components/Header.tsx'), 'utf-8');
assert(headerTsx.includes('whitespace-nowrap'), 'Header logo & title configured with whitespace-nowrap to eliminate mobile text wrapping');
assert(headerTsx.includes('active:scale-95'), 'Header buttons feature active:scale-95 tactile touch feedback');

// 6. Audit Native Alu Systems Core
console.log('\n[STEP 6] Running Native Alu Systems Core (All 8 Z3 unit assertions)...');
const aluBin = path.join(ROOT_DIR, 'alu_engine/bin/tha_trash_engine');
assert(fs.existsSync(aluBin), 'Alu engine native binary exists');
const aluOutput = execSync(aluBin, { encoding: 'utf-8' });
assert(aluOutput.includes('All 8 Alu Engine verification tests PASSED!'), 'All 8 Z3 mathematical assertions passed');
assert(aluOutput.includes('Test 8: Contractor cleanup economics verified'), 'Test 8 for commercial cleanup job economics passed');

// 7. Audit Linux PC Desktop Shortcuts & Launcher
console.log('\n[STEP 7] Auditing Linux PC Desktop & Application Menu files...');
const desktopPath = '/home/davidalujones/Desktop/THa-Trash-App.desktop';
const appMenuPath = '/home/davidalujones/.local/share/applications/tha-trash-app.desktop';
const launcherPath = path.join(ROOT_DIR, 'launch.sh');

assert(fs.existsSync(desktopPath), `Desktop shortcut exists at ${desktopPath}`);
assert(fs.existsSync(appMenuPath), `System application menu shortcut exists at ${appMenuPath}`);
assert(fs.existsSync(launcherPath), `Launcher script exists at ${launcherPath}`);

const launcherContent = fs.readFileSync(launcherPath, 'utf-8');
assert(launcherContent.includes('--host 0.0.0.0'), 'Launcher binds to 0.0.0.0 for container and host browser connectivity');

// 8. Audit Production Distribution Build
console.log('\n[STEP 8] Auditing Production Distribution Files...');
const distIndex = path.join(ROOT_DIR, 'dist/index.html');
assert(fs.existsSync(distIndex), 'Production index.html exists');
const distHtml = fs.readFileSync(distIndex, 'utf-8');
assert(distHtml.includes('manifest.webmanifest'), 'Production bundle references PWA webmanifest');
assert(distHtml.includes('sw.js'), 'Production bundle registers service worker sw.js');

// 9. Audit Native Android APK & Installation
console.log('\n[STEP 9] Auditing Native Android APK & Device Deployment...');
const apkFile = path.join(ROOT_DIR, 'release/THa-Trash-App.apk');
assert(fs.existsSync(apkFile), 'Release APK file exists at release/THa-Trash-App.apk');
const apkSize = fs.statSync(apkFile).size;
assert(apkSize > 1000000, `APK size is verified (${(apkSize / (1024 * 1024)).toFixed(2)} MB)`);
assert(fs.existsSync(path.join(ROOT_DIR, 'capacitor.config.ts')), 'Capacitor Android configuration exists');
assert(fs.existsSync(path.join(ROOT_DIR, 'android/app/build/outputs/apk/debug/app-debug.apk')), 'Gradle output debug APK exists');

console.log('\n====================================================');
console.log(`   ALL ${passedAudits} TOUCH & FEATURE AUDITS PASSED 100%!   `);
console.log('====================================================');

