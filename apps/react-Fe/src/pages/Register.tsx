import axios from "axios";
import { useState } from "react";

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const response = await axios.post("/api/register", {
                username,
                password,
                email,
            });
            console.log("Registration successful:", response.data);
        } catch (error) {
            console.error("Registration failed:", error);
        }
    }
    return (
        <div
            style={{
                padding: "20px",
                border: "1px solid #ccc",
                margin: "10px",
                backgroundColor: "#f0f0f0",
            }}
        >
            <h2>Register Page</h2>
            <form>
                <label>
                    Email: <input type="email" />
                </label>
                <br />
                <label>
                    New Password: <input type="password" />
                </label>
                <br />
                <label>
                    Confirm Password: <input type="password" />
                </label>
                <br />
                <button type="submit">Register</button>
            </form>
            <p>This is the actual Register component content.</p>
        </div>
    );
}

export default Register;
