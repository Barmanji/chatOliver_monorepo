import { useForm, type SubmitHandler } from "react-hook-form";
import { AuthService } from "../api/auth/auth";

interface IFormInputs {
    fullname: string;
    username: string;
    email: string;
    password: string;
    profilePicture: string;
}


export default function Register() {
    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<IFormInputs>();
    const onSubmit: SubmitHandler<IFormInputs> = (data) => {
        const auth = new AuthService();
        auth.register(data.fullname, data.username, data.email, data.password, data.profilePicture)
        console.log(data)
    };


    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-center items-center h-screen">
                <div className="flex flex-col gap-10 justify-center items-center w-96 h-96 bg-gray-100 rounded-lg shadow-lg p-6">
                    <input
                        type="text"
                        placeholder="FullName"
                        {...register("fullname", { required: true })}
                    />
                    {errors.fullname && "FullName is required"}

                    <input
                        type="text"
                        placeholder="Username"
                        {...register("username", { required: true })}
                    />
                    {errors.username && "Username name is required"}

                    <input
                        type="email"
                        placeholder="Email"
                        {...register("email", { required: true })}
                    />
                    {errors.email && "Email is required"}

                    <input
                        type="password"
                        placeholder="Password"
                        {...register("password", { required: true })}
                    />
                    {errors.password && "Password is required"}

                    <input
                        type="text"
                        placeholder="Profile Picture URL"
                        {...register("profilePicture", { required: true })}
                    />
                    {errors.profilePicture && "Profile picture is required"}
                    <input type="submit" />
                </div>
            </div>
        </form>
    );
}
