./stoppoker.sh;
cd client;
screen -dmS poker-client npm start;
cd ../server;
screen -dmS poker-server npm start;