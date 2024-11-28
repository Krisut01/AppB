let token = localStorage.getItem('token');

// Check if user is logged in on page load
if (token) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("message-section").style.display = "block";
    document.getElementById("inbox-section").style.display = "block";
    document.getElementById("logout-btn").style.display = "inline-block";
    loadInbox(); // Load inbox after successful login
}

async function register() {
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    try {
        const response = await fetch("http://127.0.0.1:8000/api/auth/register/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
        });

        if (response.ok) {
            alert("Registration successful! You can now log in.");
        } else {
            const data = await response.json();
            document.getElementById("register-error").innerText = "Error: " + JSON.stringify(data);
        }
    } catch (error) {
        console.error(error);
        document.getElementById("register-error").innerText = "An error occurred.";
    }
}

async function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            token = data.access;
            localStorage.setItem('token', token);  // Save token to localStorage

            document.getElementById("auth-section").style.display = "none";
            document.getElementById("message-section").style.display = "block";
            document.getElementById("inbox-section").style.display = "block";
            document.getElementById("logout-btn").style.display = "inline-block";
            loadInbox(); // Load inbox after successful login
        } else {
            const data = await response.json();
            document.getElementById("login-error").innerText = "Error: " + JSON.stringify(data);
        }
    } catch (error) {
        console.error(error);
        document.getElementById("login-error").innerText = "An error occurred.";
    }
}

async function sendMessage() {
    const recipientUsername = document.getElementById("recipient").value;
    const content = document.getElementById("message-content").value;

    try {
        const userResponse = await fetch(`http://127.0.0.1:8000/api/auth/users/get_by_username/?username=${recipientUsername}`, {
            headers: { "Authorization": `Bearer ${token}` },
        });

        if (!userResponse.ok) {
            document.getElementById("message-error").innerText = "Recipient not found.";
            return;
        }

        const userData = await userResponse.json();
        const recipientId = userData.id;

        const response = await fetch("http://127.0.0.1:8000/api/messages/send/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ recipient: recipientId, content }),
        });

        if (response.ok) {
            alert("Message sent!");
            loadInbox();
        } else {
            const data = await response.json();
            document.getElementById("message-error").innerText = JSON.stringify(data);
        }
    } catch (error) {
        console.error(error);
        document.getElementById("message-error").innerText = "An error occurred.";
    }
}

async function loadInbox() {
    if (!token) {
        console.error("No token found! You must be logged in.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/api/messages/inbox/", {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const messages = await response.json();
            const inboxDiv = document.getElementById("inbox");
            inboxDiv.innerHTML = "";  // Clear the inbox before rendering new messages

            messages.forEach(msg => {
                const messageDiv = document.createElement("div");
                messageDiv.className = "inbox-message";

                messageDiv.innerHTML = `
                    <p><strong>From:</strong> ${msg.sender}</p>
                    <p><strong>Encrypted Message:</strong> ${msg.encrypted_message}</p>
                    <p><strong>Decrypted Message:</strong> ${msg.decrypted_message}</p>
                    <p><small>${msg.timestamp}</small></p>
                `;
                inboxDiv.appendChild(messageDiv);
            });
        } else {
            console.log('Error fetching inbox.');
        }
    } catch (error) {
        console.error(error);
        document.getElementById("message-error").innerText = "An error occurred while loading the inbox.";
    }
}

function logout() {
    localStorage.removeItem('token');
    token = null;

    document.getElementById("auth-section").style.display = "block";
    document.getElementById("message-section").style.display = "none";
    document.getElementById("inbox-section").style.display = "none";
    document.getElementById("logout-btn").style.display = "none";
}
