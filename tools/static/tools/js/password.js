document.addEventListener('DOMContentLoaded', function() {
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const passwordInput = document.getElementById('password');
const lengthInput = document.getElementById('length');
const includeLower = document.getElementById('include-lower');
const includeUpper = document.getElementById('include-upper');
const includeNumbers = document.getElementById('include-numbers');
const includeSymbols = document.getElementById('include-symbols');
function generatePassword(showAlert) {
    const raw = parseInt(lengthInput.value, 10);
    if (lengthInput.value.trim() === "" || isNaN(raw)) {
        if (showAlert) alert("Please enter a number of characters.");
        return "";
    }
    const length = raw;

    if (length < 14) {
        if (showAlert) alert("Password must be at least 14 characters.");
        return "";
    }
    if (length > 128) {
        if (showAlert) alert("Password cannot exceed 128 characters.");
        return "";
    }

    if (!includeLower.checked || !includeUpper.checked || !includeNumbers.checked || !includeSymbols.checked) {
        if (showAlert) alert("You must select all options to generate a password!");
        return "";
    }

    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}<>?";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function updatePassword(showAlert) {
    const pwd = generatePassword(showAlert);
    passwordInput.value = pwd;
}

generateBtn.addEventListener('click', function() { updatePassword(true); });

lengthInput.addEventListener('input', function() { updatePassword(false); });
lengthInput.addEventListener('change', function() { updatePassword(false); });

copyBtn.addEventListener('click', () => {
    if (!passwordInput.value) return;
    passwordInput.select();
    navigator.clipboard.writeText(passwordInput.value).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
});
});
