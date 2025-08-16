// Create the popup HTML and insert it into the document
const popupHTML = `
  <div id="cookie-popup">
    <p>Cookies are used to track progress. Reject if you don't want progress to be tracked. Can be changed later in settings.</p>
    <button id="accept-btn">Accept</button>
    <button id="reject-btn">Reject</button>
  </div>
`;

document.body.insertAdjacentHTML('beforeend', popupHTML);

const style = document.createElement('style');
style.textContent = `
  #cookie-popup {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    max-width: 400px;
    margin: auto;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 20px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    display: none;
  }

  #cookie-popup p {
    margin: 0 0 10px;
    font-size: 14px;
    color: #333;
  }

  #cookie-popup button {
    padding: 8px 16px;
    font-size: 14px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-right: 10px;
  }

  #accept-btn {
    background-color: #4CAF50;
    color: white;
  }

  #accept-btn:hover {
    background-color: #45a049;
  }

  #reject-btn {
    background-color: #ccc;
    color: #333;
  }

  #reject-btn:hover {
    background-color: #bbb;
  }
`;
document.head.appendChild(style);

// Consent logic
function handleConsent(choice) {
  localStorage.setItem("cookieConsent", choice);
  document.getElementById("cookie-popup").style.display = "none";
  console.log("User choice:", choice);
}

window.addEventListener('load', () => {
  if (!localStorage.getItem("cookieConsent")) {
    document.getElementById("cookie-popup").style.display = "block";
  }

  document.getElementById("accept-btn").addEventListener("click", () => handleConsent("accepted"));
  document.getElementById("reject-btn").addEventListener("click", () => handleConsent("rejected"));
});