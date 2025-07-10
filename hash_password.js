const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 12; // Use the same salt rounds as in your project

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed password for "admin123":');
    console.log(hash);
});