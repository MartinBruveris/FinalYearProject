from channels.db import database_sync_to_async
from MeetMeHere.models import WebsocketTicket, Session, SessionParticipants, User
from MeetMeHere.exceptions import CustomException
from rest_framework.authtoken.models import Token
# from django.contrib.gis.db import models
# from django.contrib.gis.geos import Point
from django.db import Error
import json
import string
import random
import hashlib
import binascii


class UserLocation:
    def __init__(self, user_id, lat, lng):
        self.user_id = user_id
        self.lat = lat
        self.lng = lng

    def __str__(self):
        return "userid:{} lat:{} lng:{}".format(self.user_id, self.lat, self.lng)

    def obj_dict(self):
        return self.__dict__


@database_sync_to_async
def confirm_socket_ticket(socket_ticket):
    try:
        ticket = WebsocketTicket.objects.get(socket_ticket=socket_ticket)
        if ticket:
            pass
    except WebsocketTicket.DoesNotExist:
        raise CustomException("Invalid socket ticket")
    return ticket


@database_sync_to_async
def remove_used_ticket(socket_ticket):
    try:
        WebsocketTicket.objects.get(socket_ticket=socket_ticket).delete()
    except Error:
        raise CustomException("Error while removing websocket ticket")


@database_sync_to_async
def get_user(auth_token):
    try:
        token = Token.objects.get(key=auth_token)
        user = token.user
    except Error:
        raise CustomException("Error getting user")
    return user


@database_sync_to_async
def create_session(user, point):
    identifier = None
    try:
        try:
            Session.objects.get(host_id=user.id).delete()
        except Session.DoesNotExist:
            pass
        try:
            code_not_unique = True
            while code_not_unique:
                print(identifier)
                identifier = get_unique_code()
                print(identifier)
                try:
                    Session.objects.get(session_id=identifier)
                except Session.DoesNotExist:
                    code_not_unique = False
            session = Session(session_id=identifier, host=user, last_known_location=point)
            session.save()
        except Error as error:
            print(error)
            raise CustomException("Error creating session")
        return session
    except Error as error:
        print(error)
        raise CustomException("Error while checking existing session")


@database_sync_to_async
def delete_session(session_id):
    try:
        Session.objects.get(session_id=session_id).delete()
    except Error as error:
        print(error)
        raise CustomException("Error deleting session")


@database_sync_to_async
def session_add_user(user, session_id, point):
    try:
        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            print("No such session")
            raise CustomException("No such session")
        SessionParticipants(session_id=session, participant=user, last_known_location=point).save()
    except Error as error:
        print(error)
        raise CustomException("Error adding participant to the session")


@database_sync_to_async
def session_remove_user(user):
    try:
        print("remove the user from the participants")
        session_participant = SessionParticipants.objects.get(participant=user)
        session_participant.delete()
        return session_participant.session_id
    except Error as error:
        print(error)
        raise CustomException("Error while removing the participant from the session")
    except SessionParticipants.DoesNotExist:
        raise CustomException("The session was interrupted and the user was removed from the participants table")


@database_sync_to_async
def session_add_destination(session_id, point):
    try:
        session = Session.objects.get(session_id=session_id)
        session.destination_marker = point
        session.save()
    except Error as error:
        print(error)
        raise CustomException("Error while adding destination marker")


@database_sync_to_async
def session_update_destination(session_id, point):
    try:
        Session.objects.filter(session_id=session_id).update(destination_marker=point)
    except Error as error:
        print(error)
        raise CustomException("Error while updating destination marker")


@database_sync_to_async
def session_remove_destination(session_id):
    try:
        Session.objects.filter(session_id=session_id).update(destination_marker=None)
    except Error as error:
        print(error)
        raise CustomException("Error while removing destination marker")


@database_sync_to_async
def get_user_positions(session_id):
    try:
        # x - lng y - lng
        locations = []
        session_host = Session.objects.get(session_id=session_id)
        host_location = UserLocation(session_host.host.username, session_host.last_known_location.y,
                                     session_host.last_known_location.x)

        session_participants = SessionParticipants.objects.filter(session_id=session_id)

        for element in session_participants:
            participant = UserLocation(element.participant.username, element.last_known_location.y,
                                       element.last_known_location.x)
            locations.append(participant)

        locations.append(host_location)
        return json.dumps(locations, default=UserLocation.obj_dict)
    except CustomException as error:
        print(error)
        raise CustomException("Error while getting user positions")


@database_sync_to_async
def get_session_marker(session_id):
    try:
        session = Session.objects.get(session_id=session_id)
        if session.destination_marker:
            return session.destination_marker.coords
        else:
            return session.destination_marker
    except Session.DoesNotExist:
        return None
        pass
    except CustomException as error:
        print(error)
        raise CustomException("Error while getting session marker")


@database_sync_to_async
def update_user_position(user_id, point):
    try:
        user = User.objects.get(username=user_id)
        Session.objects.filter(host_id=user.id).update(last_known_location=point)
        SessionParticipants.objects.filter(participant_id=user.id).update(last_known_location=point)
    except Error as error:
        print(error)
        raise CustomException("Error while updating user positions")


def get_unique_code():
    return ''.join(random.choice(string.ascii_uppercase) for _ in range(4))
