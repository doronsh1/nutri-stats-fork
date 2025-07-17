const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const OLD_SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');
const OLD_MEALS_DIR = path.join(__dirname, '..', 'data', 'meals');

// Default user credentials for migrating existing data
const DEFAULT_USER = {
    email: 'admin@nutrition.local',
    password: 'admin123',
    name: 'Default User'
};

async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [] };
    }
}

async function writeUsers(usersData) {
    await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function copyFile(src, dest) {
    try {
        const data = await fs.readFile(src);
        await fs.writeFile(dest, data);
        console.log(`✅ Copied: ${path.basename(src)}`);
    } catch (error) {
        console.error(`❌ Failed to copy ${src}:`, error.message);
    }
}

async function createDefaultUser() {
    try {
        const usersData = await readUsers();
        
        // Check if default user already exists
        const existingUser = usersData.users.find(user => user.email === DEFAULT_USER.email);
        if (existingUser) {
            console.log('📋 Default user already exists:', existingUser.id);
            return existingUser.id;
        }

        // Create default user
        const hashedPassword = await bcrypt.hash(DEFAULT_USER.password, 10);
        const defaultUser = {
            id: 'user_default_' + Date.now(),
            email: DEFAULT_USER.email,
            name: DEFAULT_USER.name,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            isMigrated: true
        };

        usersData.users.push(defaultUser);
        await writeUsers(usersData);

        console.log('✅ Created default user:', defaultUser.id);
        return defaultUser.id;
    } catch (error) {
        console.error('❌ Error creating default user:', error);
        throw error;
    }
}

async function migrateUserData(userId) {
    try {
        // Create user data directories
        const userDataPath = path.join(__dirname, '..', 'data', 'users', userId);
        const userMealsPath = path.join(userDataPath, 'meals');
        
        await fs.mkdir(userDataPath, { recursive: true });
        await fs.mkdir(userMealsPath, { recursive: true });

        console.log('📁 Created user directories for:', userId);

        // Migrate settings file
        if (await fileExists(OLD_SETTINGS_FILE)) {
            const newSettingsPath = path.join(userDataPath, 'settings.json');
            await copyFile(OLD_SETTINGS_FILE, newSettingsPath);
        }

        // Migrate meals files
        if (await fileExists(OLD_MEALS_DIR)) {
            const mealFiles = await fs.readdir(OLD_MEALS_DIR);
            
            for (const file of mealFiles) {
                if (file.endsWith('.json') && file !== 'init.js') {
                    const oldFilePath = path.join(OLD_MEALS_DIR, file);
                    const newFilePath = path.join(userMealsPath, file);
                    await copyFile(oldFilePath, newFilePath);
                }
            }
        }

        console.log('✅ Migration completed for user:', userId);
        return true;
    } catch (error) {
        console.error('❌ Error migrating user data:', error);
        throw error;
    }
}

async function runMigration() {
    console.log('🚀 Starting data migration to multi-user structure...');
    
    try {
        // Step 1: Create default user account
        const defaultUserId = await createDefaultUser();
        
        // Step 2: Migrate existing data to default user
        await migrateUserData(defaultUserId);
        
        // Step 3: Create backup info file
        const migrationInfo = {
            migratedAt: new Date().toISOString(),
            defaultUserId: defaultUserId,
            defaultUserCredentials: {
                email: DEFAULT_USER.email,
                password: DEFAULT_USER.password,
                note: 'These are the credentials for accessing your existing data'
            }
        };
        
        const infoPath = path.join(__dirname, '..', 'data', 'migration-info.json');
        await fs.writeFile(infoPath, JSON.stringify(migrationInfo, null, 2));
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('📋 Default user credentials:');
        console.log('   Email:', DEFAULT_USER.email);
        console.log('   Password:', DEFAULT_USER.password);
        console.log('📄 Migration info saved to:', infoPath);
        
        return migrationInfo;
    } catch (error) {
        console.error('💥 Migration failed:', error);
        throw error;
    }
}

// Check if migration is needed
async function needsMigration() {
    // Check if old data exists and new structure doesn't
    const hasOldSettings = await fileExists(OLD_SETTINGS_FILE);
    const hasOldMeals = await fileExists(OLD_MEALS_DIR);
    const usersData = await readUsers();
    const hasUsers = usersData.users.length > 0;
    
    return (hasOldSettings || hasOldMeals) && !hasUsers;
}

module.exports = {
    runMigration,
    needsMigration,
    createDefaultUser,
    migrateUserData,
    DEFAULT_USER
}; 