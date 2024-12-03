import json
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load the environment variables from the .env file
load_dotenv()

# Get the encryption key from the environment variable
key = os.getenv('ENCRYPTION_KEY')
cipher_suite = Fernet(key)

class EncryptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.body:
            try:
                # Try to decode and load the request data
                request_data = json.loads(request.body.decode('utf-8'))
                if 'message' in request_data:
                    encrypted_message = cipher_suite.encrypt(request_data['message'].encode())
                    request_data['message'] = encrypted_message.decode()

                # Replace the request body with encrypted data
                request._body = json.dumps(request_data).encode('utf-8')
            except json.JSONDecodeError:
                pass  # Handle any errors if the body isn't valid JSON

        # Process the request and get the response
        response = self.get_response(request)

        # Check if the response has a 'data' attribute before accessing it
        if hasattr(response, 'data') and 'message' in response.data:
            encrypted_message = response.data['message'].encode()
            decrypted_message = cipher_suite.decrypt(encrypted_message).decode()
            response.data['message'] = decrypted_message

        return response
