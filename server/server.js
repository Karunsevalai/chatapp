import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import {Server} from "socket.io";


const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server,{
    cors: {origin:'*'}
});

//Store online users
export const userSocketMap = {};

//Socket.io connection handler

io.on("connection" , (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId]=socket.id;

    // Emit online users to all conneted clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect",()=>{
        console.log("User Disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    });
});

//Middleware setup
app.use(express.json({limit: '4mb'}));

// app.use(cors());
app.use(cors({
  origin: ["https://chatapp.mysqft.in", "https://chatapp-git-main-haris-projects-a4253eb9.vercel.app","http://localhost:5173"], // allow production + local dev
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200 
}));


app.use("/api/status", (req,res)=> res.send("Server is live"));

app.use("/api/auth",userRouter); 
app.use("/api/messages",messageRouter);
//Connect mongoDB

await connectDB()

//for vercel
// if(process.env.NODE_ENV !== "production"){
//    const PORT = process.env.PORT || 5000;
//    server.listen(PORT, ()=> console.log("Server is running on PORT: " +PORT));
// }

// // Export server for vercel
// export default server;


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});