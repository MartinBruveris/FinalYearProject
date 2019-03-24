from django.conf.urls import url

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.sessions import SessionMiddlewareStack
from MeetMeHere.consumers import LocationShareConsumer

application = ProtocolTypeRouter({

    # WebSocket chat handler
    "websocket": SessionMiddlewareStack(
        URLRouter([
            url("^socket_conn/(?P<token>\w+)/$", LocationShareConsumer),
        ])
    ),
})
