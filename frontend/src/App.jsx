import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    api.get("/test")
      .then((res) => {
        setMessage(res.data.message);
      })
      .catch((err) => {
        console.error(err);
        setMessage("Failed to connect to backend");
      });
  }, []);

  return (
    <div>
      <h1>MERN Stack Test</h1>
      <h2>{message}</h2>
    </div>
  );
}

export default App;