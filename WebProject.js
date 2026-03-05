// JavaScript code
const STORAGE_KEY = "vernball_player";

function handleSubmit(event) {
    event.preventDefault();
    console.log("Form submitted");

    const form = document.getElementById("registrationForm");

    const formData = getFormData(form);

    if (saveFormDataToLocalStorage(formData)) {
        alert("Player registered!");
    }

    displayUserCard(formData);
}

function initializeApp() {
    document
        .getElementById("registrationForm")
        .addEventListener("submit", handleSubmit);
}

document.addEventListener("DOMContentLoaded", initializeApp);
function getFormData(form) {
    const formData = new FormData(form);

    const data = {};

    for(let [key, value] of formData.entries()) {
        data[key] = value;
    }

    return {
        fullName: data.fullName,
        email: data.email,
        position: data.position
    };
    
}


function saveFormDataToLocalStorage(formData) {
    try {
        const userJSON = JSON.stringify(formData);
        localStorage.setItem(STORAGE_KEY, userJSON);
        console.log('Saved successfully!');
        return true;
    }
    catch (error) {
        console.log('Error saving to local storage:', error);
        return false;
    }
    
}

function displayUserCard(userData) {
    const userCardContainer = document.getElementById('userCard');
    console.log(userData);

    let cardHtml = `
        <div class="card">
            <div>
                <h5>${userData.fullName}</h5>
                <p class="card-text">Email: ${userData.email}</p>
                <p class="card-text">Position: ${userData.position}</p>
            </div>
        </div>
    `;

    userCardContainer.innerHTML = cardHtml;
}
