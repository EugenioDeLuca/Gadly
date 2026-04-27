document.addEventListener('DOMContentLoaded', function() {
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const passwordInput = document.getElementById('password');
const lengthInput = document.getElementById('length');
const pwdResultArea = document.getElementById('pwd-result-area');
const includeLower = document.getElementById('include-lower');
const includeUpper = document.getElementById('include-upper');
const includeNumbers = document.getElementById('include-numbers');
const includeSymbols = document.getElementById('include-symbols');

function showError(msg) {
    if (pwdResultArea) {
        pwdResultArea.textContent = (msg || '').replace(/\.$/, '');
        pwdResultArea.classList.add('error');
        pwdResultArea.classList.remove('hidden');
        pwdResultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}
function hideError() {
    if (pwdResultArea) {
        pwdResultArea.textContent = '';
        pwdResultArea.classList.remove('error');
        pwdResultArea.classList.add('hidden');
    }
}

function generatePassword(showAlert) {
    hideError();
    const raw = parseInt(lengthInput.value, 10);
    if (lengthInput.value.trim() === "" || isNaN(raw)) {
        if (showAlert) showError(gettext("Please enter a number of characters."));
        return "";
    }
    const length = raw;

    if (length < 14) {
        if (showAlert) showError(gettext("Password must be at least 14 characters."));
        return "";
    }
    if (length > 128) {
        if (showAlert) showError(gettext("Password cannot exceed 128 characters."));
        return "";
    }

    if (!includeLower.checked || !includeUpper.checked || !includeNumbers.checked || !includeSymbols.checked) {
        if (showAlert) showError(gettext("You must select all options to generate a password!"));
        return "";
    }

    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}<>?";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/** Altezza del textarea = contenuto a font size invariato (CSS); niente riduzione font. */
function sizePasswordBox() {
    if (!passwordInput) return;
    if (!passwordInput.value) {
        passwordInput.style.height = '';
        passwordInput.style.overflowY = '';
        return;
    }
    passwordInput.style.fontSize = '';
    passwordInput.style.overflowY = 'hidden';
    passwordInput.style.height = 'auto';
    passwordInput.style.height = passwordInput.scrollHeight + 'px';
}

function updatePassword(showAlert) {
    const pwd = generatePassword(showAlert);
    passwordInput.value = pwd;
    if (pwd) {
        requestAnimationFrame(function() {
            requestAnimationFrame(sizePasswordBox);
        });
    } else {
        passwordInput.style.height = '';
        passwordInput.style.overflowY = '';
    }
}

generateBtn.addEventListener('click', function() { updatePassword(true); });

function onLengthTweak() {
    hideError();
    passwordInput.value = '';
    passwordInput.style.height = '';
    passwordInput.style.overflowY = '';
}

lengthInput.addEventListener('input', onLengthTweak);
lengthInput.addEventListener('change', onLengthTweak);
[includeLower, includeUpper, includeNumbers, includeSymbols].forEach(function(cb) {
    cb.addEventListener('change', function() { hideError(); });
});

window.addEventListener('resize', function() {
    if (passwordInput && passwordInput.value) sizePasswordBox();
});

copyBtn.addEventListener('click', () => {
    if (!passwordInput.value) return;
    navigator.clipboard.writeText(passwordInput.value).then(() => {
        copyBtn.textContent = gettext('Copied!');
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = gettext('Copy');
            copyBtn.classList.remove('copied');
        }, 2000);
    });
});
});
