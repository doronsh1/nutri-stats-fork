# Artifact Cleanup Configuration

This document explains how to configure automatic artifact cleanup before test runs.

## Overview

The artifact cleanup feature automatically removes old test artifacts before each test run to:
- Prevent disk space issues
- Keep artifact directories clean
- Improve test performance
- Maintain organized test results

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLEANUP_ARTIFACTS` | `true` | Enable/disable artifact cleanup |
| `CLEANUP_MODE` | `all` | Cleanup mode: `all`, `selective`, `old`, `disabled` |
| `CLEANUP_AGE_DAYS` | `7` | Age threshold for `old` mode (days) |
| `CLEANUP_SCREENSHOTS` | `true` | Clean screenshots (selective mode) |
| `CLEANUP_VIDEOS` | `true` | Clean videos (selective mode) |
| `CLEANUP_TRACES` | `true` | Clean traces (selective mode) |
| `CLEANUP_REPORTS` | `false` | Clean reports (selective mode) |
| `ARTIFACT_VERBOSE` | `false` | Enable verbose logging |
| `SHOW_ARTIFACT_STATS` | `true` | Show cleanup statistics |

### Cleanup Modes

#### 1. `all` (Default)
Removes all artifacts before each test run.
```bash
CLEANUP_MODE=all npm run test
```

#### 2. `selective`
Removes only specified artifact types.
```bash
CLEANUP_MODE=selective CLEANUP_VIDEOS=false npm run test
```

#### 3. `old`
Removes only artifacts older than specified days.
```bash
CLEANUP_MODE=old CLEANUP_AGE_DAYS=3 npm run test
```

#### 4. `disabled`
Disables all cleanup (same as `CLEANUP_ARTIFACTS=false`).
```bash
CLEANUP_MODE=disabled npm run test
```

## Usage Examples

### Quick Commands

```bash
# Run tests with full cleanup (default)
npm run test

# Run tests without any cleanup
npm run test:no-clean

# Run tests cleaning only old artifacts
npm run test:clean-old

# Run tests with selective cleanup
npm run test:clean-selective

# Run tests with verbose cleanup logging
ARTIFACT_VERBOSE=true npm run test
```

### Custom Configuration

Create a `.env.local` file:
```env
# Custom cleanup configuration
CLEANUP_ARTIFACTS=true
CLEANUP_MODE=selective
CLEANUP_SCREENSHOTS=true
CLEANUP_VIDEOS=false
CLEANUP_TRACES=true
CLEANUP_REPORTS=false
ARTIFACT_VERBOSE=true
```

### CI/CD Configuration

For different environments:

**Development:**
```yaml
env:
  CLEANUP_MODE: old
  CLEANUP_AGE_DAYS: 1
  SHOW_ARTIFACT_STATS: true
```

**CI Pipeline:**
```yaml
env:
  CLEANUP_MODE: all
  ARTIFACT_VERBOSE: false
  SHOW_ARTIFACT_STATS: false
```

**Debugging:**
```yaml
env:
  CLEANUP_ARTIFACTS: false
  ARTIFACT_VERBOSE: true
```

## Configuration File

You can also use the `artifact-config.js` file for programmatic configuration:

```javascript
module.exports = {
  cleanup: {
    enabled: true,
    mode: 'selective',
    ageDays: 7,
    selective: {
      screenshots: true,
      videos: false,
      traces: true,
      reports: false
    }
  },
  logging: {
    verbose: false,
    showStats: true
  }
};
```

## Retention Policies

Set limits to prevent unlimited growth:

```env
# Maximum number of files
MAX_SCREENSHOTS=100
MAX_VIDEOS=50
MAX_TRACES=20
MAX_REPORTS=10

# Maximum size in MB
MAX_SCREENSHOTS_SIZE_MB=500
MAX_VIDEOS_SIZE_MB=1000
MAX_TRACES_SIZE_MB=200
MAX_REPORTS_SIZE_MB=100
```

## Manual Cleanup

You can also clean artifacts manually:

```bash
# Clean all artifacts
npm run artifacts:clean:all

# Clean artifacts older than 7 days
npm run artifacts:clean:old

# View current statistics
npm run artifacts:stats

# Clean specific types
node scripts/manage-artifacts.js clean --screenshots --videos
```

## Logging Output

### Normal Mode
```
🚀 Starting global test setup...
🧹 Cleaning up artifacts (mode: all)
✅ All artifacts cleaned
📊 Cleanup Summary: 28 → 0 files
✅ Global test setup complete
```

### Verbose Mode
```
🚀 Starting global test setup...

🔧 Artifact Configuration:
==========================
Cleanup Enabled: true
Cleanup Mode: selective
Selective Options:
  Screenshots: true
  Videos: false
  Traces: true
  Reports: false
Verbose Logging: true
Show Stats: true

🧹 Cleaning up artifacts (mode: selective)
🗑️ Cleaned up screenshots
🗑️ Cleaned up traces
✅ Selective artifacts cleaned
📊 Cleanup Summary: 28 → 15 files
✅ Global test setup complete
```

### Disabled Mode
```
🚀 Starting global test setup...
🔧 Artifact cleanup disabled
✅ Global test setup complete
```

## Best Practices

### Development
- Use `old` mode to keep recent artifacts for debugging
- Enable verbose logging for troubleshooting
- Keep reports for analysis

### CI/CD
- Use `all` mode for clean builds
- Disable verbose logging for cleaner output
- Archive important artifacts before cleanup

### Debugging
- Disable cleanup when investigating test failures
- Use selective mode to keep specific artifact types
- Enable statistics to monitor disk usage

## Troubleshooting

### Cleanup Fails
If cleanup fails, tests will continue but with a warning:
```
⚠️ Artifact cleanup failed: Permission denied
```

### Configuration Issues
Invalid configurations will show warnings and use defaults:
```
⚠️ Invalid cleanup mode 'invalid', defaulting to 'all'
```

### Disk Space Issues
Monitor artifact statistics and adjust retention policies:
```bash
npm run artifacts:stats
```

## Integration

The cleanup feature integrates with:
- **Global Setup**: Runs before all tests
- **Configuration**: Uses environment variables and config files
- **Logging**: Provides detailed feedback
- **Statistics**: Shows before/after metrics
- **Error Handling**: Graceful failure without breaking tests

This ensures your test artifacts stay organized and your disk space remains manageable!