import * as bcrypt from 'bcryptjs';

async function test() {
    console.log('Testing bcryptjs...');
    const password = 'admin123';
    console.log(`Hashing password: ${password}`);

    try {
        const hash = await bcrypt.hash(password, 12);
        console.log(`Generated hash: ${hash}`);

        const valid = await bcrypt.compare(password, hash);
        console.log(`Self-verification result: ${valid}`);

        if (valid) {
            console.log('SUCCESS: bcryptjs is working correctly.');
        } else {
            console.error('FAILURE: bcryptjs failed to verify its own hash.');
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
}

test();
