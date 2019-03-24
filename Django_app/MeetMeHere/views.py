from django.contrib.auth import authenticate, login
from rest_framework import status
import json
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from MeetMeHere.models import User, WebsocketTicket
import hashlib
import binascii
from datetime import datetime


class TokenLogin(APIView):
    permission_classes = (permissions.AllowAny,)

    @staticmethod
    def post(request,):
        unicode_data = request.body.decode('utf-8')
        json_data = json.loads(unicode_data)
        if (not json_data['username']) or (not json_data['password']):
            return Response({"detail": "Missing username and/or password"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=json_data['username'], password=json_data['password'])
        if user:
            if user.is_active:
                login(request, user)
                try:
                    my_token = Token.objects.get(user=user)
                    print("User {} just obtained auth token".format(json_data['username']))
                    return Response({"token": "{}".format(my_token.key)}, status=status.HTTP_200_OK)
                except Token.DoesNotExist:
                    return Response({"detail": "Could not get token"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"detail": "Inactive account"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"detail": 'Invalid User Id or Password'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterUser(APIView):
    permission_classes = (permissions.AllowAny,)

    @staticmethod
    def post(request,):
        print(request.body)
        unicode_data = request.body.decode('utf-8')
        json_data = json.loads(unicode_data)
        print(json_data)
        username = json_data['username']
        print(username)
        password = json_data['password']
        print(password)
        email = json_data['email']
        print(email)
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            try:
                new_user = User.objects.create_user(username, email, password)
                new_user.save()
                return Response({"status": "registered"})
            except (RuntimeError, TypeError, NameError):
                return Response({"detail": "Error while registering, try again"}, status=status.HTTP_400_BAD_REQUEST)
        if user:
            return Response({"detail": 'This username is already taken'}, status=status.HTTP_400_BAD_REQUEST)


class GetSocketTicket(APIView):
    permission_classes = (permissions.AllowAny,)

    @staticmethod
    def post(request,):
        unicode_data = request.body.decode('utf-8')
        json_data = json.loads(unicode_data)
        user_auth_token = json_data['auth_token']
        salt = json_data['username'].encode()
        try:
            token = Token.objects.get(key=user_auth_token)
            user_object = User.objects.get(username=token.user.username)
        except Token.DoesNotExist:
            return Response("error while authenticating token")
        if user_object:
            time_now = datetime.utcnow()
            unique = str.encode(time_now.__str__())+binascii.unhexlify(user_auth_token)
            socket_ticket = hashlib.pbkdf2_hmac('sha1', unique, salt, 100000)
            new_socket_ticket = WebsocketTicket(user=user_object, origin=salt,
                                                socket_ticket=binascii.hexlify(socket_ticket))
            try:
                new_socket_ticket.save()
            except RuntimeError:
                return Response("couldn't save the socket ticket")
            return Response({"socket_ticket": "{}".format(new_socket_ticket.socket_ticket.decode("utf-8"))},
                            status=status.HTTP_200_OK)
        else:
            return Response({"detail": 'No such user exist'}, status=status.HTTP_400_BAD_REQUEST)
