import { io } from 'socket.io-client';

const socket = io(process.env.URL, {path: '/poker.js/server/socket.io'});

export default socket;