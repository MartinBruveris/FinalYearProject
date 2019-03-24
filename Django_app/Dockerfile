FROM python:3.5


RUN apt-get -y update
RUN apt-get -y upgrade

RUN apt-get -y install libgdal-dev

RUN mkdir -p /usr/src/app

COPY requirements.txt /usr/src/app/
COPY . /usr/src/app

WORKDIR /usr/src/app

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -U Twisted[tls,http2]

EXPOSE 443
#CMD ["python", "manage.py", "runserver", "0.0.0.0:443"]