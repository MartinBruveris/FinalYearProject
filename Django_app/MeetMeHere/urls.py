from django.conf.urls import url
from MeetMeHere.views import RegisterUser, TokenLogin, GetSocketTicket

urlpatterns = [
    url(r'^get_auth_token/$', TokenLogin.as_view()),
    url(r'^register/$', RegisterUser.as_view()),
    url(r'^get_socket_token/$', GetSocketTicket.as_view()),
]
