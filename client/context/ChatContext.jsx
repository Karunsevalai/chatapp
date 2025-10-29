import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({ children}) =>{
    const [messages,setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser,setSelectedUser] = useState(null);
    const [unseenMessages,setunseenMessages] = useState({});
     

    const {socket,axios} = useContext(AuthContext);

    // function to get all the users for sidebar
    const getUsers = async() =>{
        try {
            const { data } = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users);
                setunseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to get messages for selected user
    const getMessages = async(userId) =>{
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to send message to selected user
    const sendMessage = async (body) =>{
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, body);
            if(data.success){
                setMessages((prevMessages) => [...prevMessages,data.newMessage]);
            }
            else{
                toast.error(data.message || "Failed to send message")
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
    // function to subcribe to messages for selected user
    const subcribeToMessages = async() =>{
        if(!socket) return; 

        socket.on("newMessage",(newMessage)=>{
          if(selectedUser && newMessage.senderId === selectedUser._id){
            newMessage.see = true;
            setMessages((prevMessages) => [...prevMessages,newMessage]);
            axios.put(`/api/messages/mark/${newMessage._id}`);
          }else{
            setunseenMessages((prevunseenMessages)=>({
                ...prevunseenMessages,
                [newMessage.senderId] : prevunseenMessages[newMessage.senderId] ? prevunseenMessages[newMessage.senderId]+1 : 1
            }));
          }
        });
    };

    // function to unsubscribe from messages
    const unsubscribeFromMessages = () =>{
        if(socket) socket.off("newMessage");
    }

    useEffect(()=>{
        subcribeToMessages();
        return ()=> unsubscribeFromMessages();
    },[socket,selectedUser])


    const value ={
             messages,
             users,
             selectedUser,
             getUsers,
             setMessages,
             sendMessage,
             setSelectedUser,
             unseenMessages,
             setunseenMessages,
             getMessages
    }
    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}