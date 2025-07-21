import { useForm, type SubmitHandler } from "react-hook-form";
import { AuthService } from "../api/auth/auth";
import { useNavigate } from "react-router";
import { useAppDispatch } from "../store/hooks";
import { login } from "../store/slices/auth/authSlice";
import { useState } from "react";

interface IFormInput {
    identifier: string; // can be email or username
    password: string;
}

export default function Login() {
    const { register, handleSubmit } = useForm<IFormInput>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState("");

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        const auth = new AuthService();
        try {
            const result = await auth.login(data.identifier, data.password);
            dispatch(login({ userData: result.data.user })); // adjust if needed
            navigate("/chat");
        } catch (err) {
            setError("Login failed. Please check your credentials.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="justify-center">
                <input
                    type="text"
                    placeholder="Email or Username"
                    {...register("identifier", { required: "Email or Username is required" })}
                />
                <input
                    type="password"
                    placeholder="Password"
                    {...register("password", { required: "Password is required", minLength: { value: 0, message: "Password must be at least 6 characters" } })}
                />
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <input className="py-12" type="submit" />
        </form>
    );
}
