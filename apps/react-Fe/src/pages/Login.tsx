import { useForm, type SubmitHandler } from "react-hook-form";
import { AuthService } from "../api/auth/auth";

interface IFormInput {
    identifier: string; // can be email or username
    password: string;
}

export default function Login() {
    const { register, handleSubmit } = useForm<IFormInput>();
    const onSubmit: SubmitHandler<IFormInput> = (data) => {
        const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.identifier);
        isEmail
            ? { email: data.identifier, password: data.password }
            : { username: data.identifier, password: data.password };
        const auth = new AuthService
        auth.login(data.identifier, data.password)
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
            <input className="py-12" type="submit" />
        </form>
    );
}
