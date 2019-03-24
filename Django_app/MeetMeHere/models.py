from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token
from django.contrib.gis.db import models


class User(AbstractUser):
    def __str__(self):
        return "username: {}, email: {}, password: {} ".format(self.username, self.email, self.password)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)


class WebsocketTicket(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, verbose_name="websocket owner")
    origin = models.CharField(max_length=35, null=False, blank=False)
    socket_ticket = models.CharField(blank=False, unique=True, max_length=256)

    def __str__(self):
        return "username: {}, origin: {}, socket_ticket: {}".format(self.user, self.origin, self.socket_ticket)


class Session(models.Model):
    class Meta:
        unique_together = (("session_id", "host"),)
    session_id = models.CharField(max_length=5, primary_key=True)
    host = models.OneToOneField(User, on_delete=models.CASCADE, blank=False, null=False)
    last_known_location = models.PointField(verbose_name="last known location")
    destination_marker = models.PointField(verbose_name="destination marker", blank=True, null=True)

    def __str__(self):
        return "session_id: {}, host: {}, marker: {}".format(self.session_id, self.host, self.destination_marker)


class SessionParticipants(models.Model):
    class Meta:
        unique_together = (("session_id", "participant"),)
    session_id = models.ForeignKey('Session', on_delete=models.CASCADE, null=False, blank=False)
    participant = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True,
                                       verbose_name="session participant")
    last_known_location = models.PointField(verbose_name="last known location")

    def __str__(self):
        return "session_id: {}, participant: {}, last_loc: {}".format(self.session_id, self.participant,
                                                                      self.last_known_location)
