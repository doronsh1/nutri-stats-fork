const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function generateVersion() {
    try {
        // Get git commit hash (short)
        const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
        
        // Get git branch
        const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        
        // Get last commit date
        const commitDate = execSync('git log -1 --format=%cd --date=iso', { encoding: 'utf8' }).trim();
        
        // Get package version
        const packageJson = require('../package.json');
        const packageVersion = packageJson.version;
        
        // Build timestamp
        const buildDate = new Date().toISOString();
        
        const versionInfo = {
            version: packageVersion,
            gitHash,
            gitBranch,
            commitDate,
            buildDate,
            fullVersion: `v${packageVersion}-${gitHash}`
        };
        
        // Write to version.json
        const versionPath = path.join(__dirname, '../src/data/version.json');
        fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
        
        console.log('✅ Version info generated:', versionInfo.fullVersion);
        return versionInfo;
        
    } catch (error) {
        console.warn('⚠️ Could not generate git version info, using fallback');
        
        // Fallback version info
        const packageJson = require('../package.json');
        const fallbackVersion = {
            version: packageJson.version,
            gitHash: 'unknown',
            gitBranch: 'unknown',
            commitDate: 'unknown',
            buildDate: new Date().toISOString(),
            fullVersion: `v${packageJson.version}-dev`
        };
        
        const versionPath = path.join(__dirname, '../src/data/version.json');
        fs.writeFileSync(versionPath, JSON.stringify(fallbackVersion, null, 2));
        
        return fallbackVersion;
    }
}

// Run if called directly
if (require.main === module) {
    generateVersion();
}

module.exports = generateVersion;