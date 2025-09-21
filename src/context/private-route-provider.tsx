"use client";

import Loader from "@/components/shared/loader";
import {useRouter} from "next/navigation";
import {ReactNode, useEffect} from "react";
import {useUser} from "./firebase-context";

interface PrivateRouteProps {
    children: ReactNode;
    adminOnly?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({children, adminOnly = false}) => {
    const {user, loading} = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) router.replace("/login");
            else if (adminOnly && user.role !== "admin") router.replace("/dashboard");
            else if (!adminOnly && user.role === "admin") router.replace("/admin");
        }
    }, [user, loading, adminOnly, router]);

    if (loading) {
        return <Loader />;
    }

    return <>{children}</>;
};

export default PrivateRoute;
