import { useState } from "react";
import { registerUser } from "../api/auth/register";

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    const handleRegisterSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setEmail("");
        try {
            const data = await registerUser(username, email, password);
            console.log("Login successful:", data);
            // Handle successful login (e.g., store tokens, redirect)
        } catch (error: any) {
            console.error("Login failed:", error);
        }
    };
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
            <form onSubmit={handleRegisterSubmit}>
                <label>
                    Username/Email:{" "}
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>
                <br />
                <label>
                    Password:{" "}
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                <br />
                <button type="submit">Login</button>
            </form>
            <p>This is the actual Register component content.</p>
        </div>
    );
}

export default Register;
