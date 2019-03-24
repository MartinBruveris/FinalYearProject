from channels.generic.websocket import AsyncJsonWebsocketConsumer
from MeetMeHere.utils import *
from MeetMeHere.exceptions import CustomException
from django.contrib.gis.geos import Point


class LocationShareConsumer(AsyncJsonWebsocketConsumer):

    def __init__(self, scope):
        super().__init__(scope)
        self.session_created = None
        self.user = None
        self.active = False

    async def connect(self):
        ticket_received = self.scope["url_route"]["kwargs"]["token"]
        try:
            socket_ticket_object = await confirm_socket_ticket(ticket_received)
            if socket_ticket_object:
                try:
                    await remove_used_ticket(socket_ticket_object.socket_ticket)
                    await self.accept()
                except CustomException as error:
                    print("Connection error: {}".format(error))
                    await self.close()
        except CustomException as error:
            print("Connection error: {}".format(error))
            await self.close()

    async def disconnect(self, close_code):
        if self.session_created is not None and self.active:
            print(self.session_created)
            # await self.delete_closed_session(self.session_created)
            self.session_created = None
        elif self.active:
            print("User {} disconnected".format(self.user.username))
            await self.leave_session(self.user)
            self.user = None

    async def receive_json(self, content, **kwargs):
        command = content.get("command", None)
        auth_token = content.get("userToken", None)
        user = await get_user(auth_token)
        session_id = content.get("sessionId", None)

        if command == "startSession":
            await self.create_session(user, content)
        if command == "stopSession":
            await self.delete_closed_session(session_id)
        if command == "joinSession":
            session_id = content.get("payload").get("session_id", None)
            await self.join_session(session_id, user, content)
        if command == "leaveSession":
            await self.leave_session(user)
        if command == "exchangeData":
            await self.exchange_data(content)
        if command == "shareDestination":
            await self.share_destination(content)
        if command == "updateDestination":
            await self.update_destination(content)
        if command == "removeDestination":
            await self.remove_destination(content)
        if command == "reconnect":
            await self.reconnect(content, user)

    async def create_session(self, user, content):
        print("CREATE SESSION")
        point = Point(content["payload"]["lng"], content["payload"]["lat"])
        try:
            session = await create_session(user, point)
            print("Session with ID {} was created by {}".format(session.session_id, user.username))
            await self.channel_layer.group_add(session.session_id, self.channel_name)
            await self.send_json({
                "session_id": session.session_id,
                "status": "session_created",
            })
            self.session_created = session.session_id
            self.active = True
            self.user = user
        except CustomException as error:
            await self.send_json({
                "status": "error",
                "errorMsg": str(error),
            })
            print("Error creating session: {}".format(error))

    async def delete_closed_session(self, session_id):
        print("DELETE SESSION")
        try:
            await self.channel_layer.group_send(
                session_id,
                {
                    "type": "session.message",
                    "clientAction": "terminateSession",
                    "userId": None,
                    "lat": None,
                    "lng": None,
                    "userPositions": None
                })
            await delete_session(session_id)
            self.active = False
            print("Session {} was deleted by {}".format(session_id, self.user.username))
        except CustomException as error:
            print("Error deleting session: {}".format(error))

    async def join_session(self, session_id, user, content):
        print("JOIN SESSION")
        print(content)
        session_id = session_id
        point = Point(content["payload"]["coords"]["lng"], content["payload"]["coords"]["lat"])
        try:
            await session_add_user(user, session_id, point)
            await self.channel_layer.group_add(session_id, self.channel_name)
            self.user = user
            self.session_created = None
            self.active = True
            user_locations = await get_user_positions(session_id)
            marker = await get_session_marker(session_id)
            print(marker)
            print(type(marker))
            await self.send_json({
                "status": "session_joined",
                "marker": marker
            })

            await self.channel_layer.group_send(
                session_id,
                {
                    "type": "session.message",
                    "clientAction": "getOtherUserPos",
                    "userId": user.username,
                    "lat": None,
                    "lng": None,
                    "userPositions": user_locations
                })

            print("User {} joined session {}".format(user.username, session_id))
        except CustomException as error:
            print("Error joining the session {}".format(error))
            await self.send_json({
                "status": "error",
                "errorMsg": str(error),
            })
            await self.close()

    async def leave_session(self, user):
        print("LEAVE SESSION")
        try:
            session = await session_remove_user(user)
            await self.channel_layer.group_send(
                session.session_id,
                {
                    "type": "session.message",
                    "clientAction": "leave",
                    "userId": user.username,
                    "lat": None,
                    "lng": None,
                    "userPositions": None
                })
            await self.channel_layer.group_discard(
                session.session_id,
                self.channel_name,
            )
            await self.send_json({
                "status": "session_leave",
            })
            self.active = False
            self.user = None
            print("User {} just left session {}".format(user.username, session.session_id))
        except CustomException as error:
            print("Error while leaving session {}".format(error))

    async def share_destination(self, data):
        print("SHARE DESTINATION")
        print(data)
        if data["lng"] and data["lat"]:
            point = Point(data["lng"], data["lat"])
            try:
                await session_add_destination(data["sessionId"], point)
                await self.channel_layer.group_send(
                    data["sessionId"],
                    {
                        "type": "session.message",
                        "clientAction": "setDestination",
                        "userId": self.user.username,
                        "lat": data["lat"],
                        "lng": data["lng"],
                        "userPositions": None
                    }
                )
            except CustomException as error:
                print("Error while adding destination marker: {}".format(error))

    async def update_destination(self, data):
        print("UPDATE DESTINATION")
        if data["lng"] and data["lat"]:
            point = Point(data["lng"], data["lat"])
            try:
                await session_update_destination(data["sessionId"], point)
                await self.channel_layer.group_send(
                    data["sessionId"],
                    {
                        "type": "session.message",
                        "clientAction": "updateDestination",
                        "userId": self.user.username,
                        "lat": data["lat"],
                        "lng": data["lng"],
                        "userPositions": None
                    }
                )
            except CustomException as error:
                print("Error while updating destination marker: {}".format(error))

    async def remove_destination(self, data):
        print("REMOVE DESTINATION")
        try:
            await session_remove_destination(data["sessionId"])
            await self.channel_layer.group_send(
                data["sessionId"],
                {
                    "type": "session.message",
                    "clientAction": "removeDestination",
                    "userId": self.user.username,
                    "lat": None,
                    "lng": None,
                    "userPositions": None
                }
            )
        except CustomException as error:
            print("Error while updating destination marker: {}".format(error))

    async def reconnect(self, data, user):
        print("RECONNECT")
        try:
            user_locations = await get_user_positions(data["sessionId"])
            print("other user locations {}".format(user_locations))
            await self.channel_layer.group_add(data["sessionId"], self.channel_name)
            await self.send_json({
                "type": "session.message",
                "clientAction": "getOtherUserPos",
                "userId": data["userId"],
                "lat": None,
                "lng": None,
                "userPositions": user_locations
            })
            self.user = user
        except CustomException as error:
            print("Error in reconnect position retrieval {}".format(error))
            await self.send_json({
                "status": "error",
                "errorMsg": str(error),
            })

    async def exchange_data(self, data):
        session_id = data["sessionId"]
        await self.channel_layer.group_send(
            session_id,
            {
                "type": "session.message",
                "clientAction": "exchange",
                "userId": data["userId"],
                "lat": data["lat"],
                "lng": data["lng"],
                "userPositions": None
            })
        if data["lng"] and data["lat"] and data["userId"]:
            point = Point(float(data["lng"]), float(data["lat"]))
            await update_user_position(data["userId"], point)
            print("loc update {} point {}".format(data["userId"], point))

    async def session_message(self, event):
        await self.send_json({
            "type": "session.message",
            "clientAction": event["clientAction"],
            "userId": event["userId"],
            "lat": event["lat"],
            "lng": event["lng"],
            "userPositions": event["userPositions"]
        })
