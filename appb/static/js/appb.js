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

            for (const msg of messages) {
                // Decrypt the message content
                const decryptedMessage = decryptMessage(msg.content);

                // Fetch the sender's name using the sender's ID
                const senderName = await getSenderName(msg.sender_id);

                // Create a new div for each message
                const messageDiv = document.createElement("div");
                messageDiv.className = "inbox-message";

                messageDiv.innerHTML = `
                    <p><strong>From:</strong> ${senderName}</p>
                    <p><strong>Encrypted Message:</strong> ${msg.content}</p>
                    <p><strong>Decrypted Message:</strong> ${decryptedMessage}</p>
                    <p><small>${msg.timestamp}</small></p>
                `;
                inboxDiv.appendChild(messageDiv);
            }
        } else {
            console.log('Error fetching inbox.');
        }
    } catch (error) {
        console.error(error);
        document.getElementById("message-error").innerText = "An error occurred while loading the inbox.";
    }
}

// Function to decrypt the message (use your actual decryption method here)
function decryptMessage(encryptedMessage) {
    try {
        // Assuming you're using the same encryption method on both apps (Fernet or AES)
        const cipher = new Fernet('YOUR_ENCRYPTION_KEY'); // Replace with your key
        const decrypted = cipher.decrypt(encryptedMessage);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed", error);
        return "Decryption error";  // Return a fallback message
    }
}

// Function to get sender's name from the sender's ID
async function getSenderName(senderId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/users/${senderId}/`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const sender = await response.json();
            return sender.username || 'Unknown';  // Assuming the API returns a username field
        } else {
            console.error("Error fetching sender name.");
            return "Unknown Sender";  // Fallback if name not found
        }
    } catch (error) {
        console.error("Error fetching sender name", error);
        return "Unknown Sender";  // Fallback in case of error
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
