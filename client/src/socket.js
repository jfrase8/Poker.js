import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_URL, {transports: ['websocket'], path: `/poker.js/server/socket.io`});

export default socket;