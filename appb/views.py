from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import render
from .serializers import RegisterSerializer, LoginSerializer
from django.contrib.auth.models import User
from .models import Message
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load the shared encryption key from the environment
key = os.getenv('ENCRYPTION_KEY')
cipher_suite = Fernet(key)

def messaging_interface(request):
    # Render your messaging interface template
    return render(request, 'appb/messaging_interface.html')

def home(request):
    return render(request, 'appb/messaging_interface.html')

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"message": "Registration successful!"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def send_message(request):
    if request.method == 'POST':
        recipient_username = request.data.get('recipient')
        message_content = request.data.get('message')

        # Encrypt the message content
        encrypted_message = cipher_suite.encrypt(message_content.encode())

        try:
            recipient = User.objects.get(username=recipient_username)
        except User.DoesNotExist:
            return Response({"error": "Recipient not found"}, status=status.HTTP_404_NOT_FOUND)

        # Store the encrypted message in the DB
        message = Message(sender=request.user, recipient=recipient, encrypted_content=encrypted_message)
        message.save()

        return Response({"message": "Message sent successfully!"}, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_inbox(request):
    # Fetch messages for the authenticated user (recipient)
    messages = Message.objects.filter(recipient=request.user)
    message_data = []

    for msg in messages:
        try:
            # Decrypt the message content
            decrypted_content = cipher_suite.decrypt(msg.encrypted_content).decode()
        except Exception as e:
            decrypted_content = "Error decrypting message"  # In case of decryption failure

        # Append both encrypted and decrypted content to the response
        message_data.append({
            'sender': msg.sender.username,  # Correctly fetch sender's username
            'encrypted_message': msg.encrypted_content.decode(),  # Encrypted message
            'decrypted_message': decrypted_content,  # Decrypted message
            'timestamp': msg.timestamp,
        })

    return Response(message_data, status=status.HTTP_200_OK)
