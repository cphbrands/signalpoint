"use client";
import {Eye, EyeOff} from "lucide-react";
import {useState} from "react";
import {Input} from "./input";

export default function PasswordInput({id, ...props}: React.ComponentProps<"input">) {
    const [isShow, setIsShow] = useState(false);
    return (
        <div className="relative">
            <Input id={id} type={isShow ? "text" : "password"} required placeholder="• • • • • • • •" {...props} />

            <button
                type="button"
                onClick={() => setIsShow(!isShow)}
                className="absolute top-1/2 right-3 -translate-y-1/2"
            >
                {!isShow ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
        </div>
    );
}
