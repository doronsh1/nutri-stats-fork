// Test script to verify special characters work in passwords
const bcrypt = require('bcryptjs');

async function testPasswordWithSpecialChars() {
    console.log('🧪 Testing password with special characters...');

    // Test various special character combinations
    const testPasswords = [
        'Password123!',
        'P@ssw0rd#$%',
        'Test!@#$%^&*()',
        'Spëcîål_Chärs-123',
        'パスワード123!',
        'Пароль123!@#',
        'Test"Password\'123',
        'Test\\Password/123',
        'Test<Password>123',
        'Test{Password}123',
        'Test[Password]123',
        'Test|Password~123'
    ];

    for (const password of testPasswords) {
        try {
            // Test hashing
            const hashed = await bcrypt.hash(password, 10);

            // Test comparison
            const isValid = await bcrypt.compare(password, hashed);

            console.log(`✅ Password "${password}" - Hash: ${isValid ? 'SUCCESS' : 'FAILED'}`);

            // Test JSON stringification (what happens in the API)
            const jsonTest = JSON.stringify({ password });
            const parsed = JSON.parse(jsonTest);
            const jsonMatch = parsed.password === password;

            console.log(`   JSON: ${jsonMatch ? 'SUCCESS' : 'FAILED'}`);

        } catch (error) {
            console.log(`❌ Password "${password}" - ERROR: ${error.message}`);
        }
    }
}

// Run test
testPasswordWithSpecialChars().catch(console.error);