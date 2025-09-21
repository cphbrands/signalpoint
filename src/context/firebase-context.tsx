"use client";

import {auth, db, storage} from "@/firebase";
import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    User as FirebaseUser,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    updateProfile,
} from "firebase/auth";
import {arrayUnion, doc, getDoc, setDoc, updateDoc} from "firebase/firestore";
import {getDownloadURL, ref, uploadBytes} from "firebase/storage";
import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";

interface Campaign {
    name: string;
    message: string;
    file?: string;
}

interface UserData {
    uid: string;
    displayName: string;
    email: string;
    currentCredit: number;
    campaigns: Campaign[];
    role: "user" | "admin";
    phone?: string;
    companyName?: string;
}

interface UserContextProps {
    user: UserData | null;
    loading: boolean;
    register: (data: {fullName: string; email: string; password: string}) => Promise<void>;
    login: (data: {email: string; password: string}) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateProfileField: (fields: Partial<UserData>) => Promise<void>;
    changeDisplayName: (newName: string) => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
    reauthenticateAndChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    createCampaign: (data: {name: string; message: string; file?: File}) => Promise<void>;
}

const DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
const UserContext = createContext<UserContextProps | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within UserProvider");
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({children}) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    // check if user is logged in
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser: FirebaseUser | null) => {
            if (currentUser) {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                setUser(docSnap.exists() ? ({uid: currentUser.uid, ...docSnap.data()} as UserData) : null);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // user register and data will be stored in firestore
    const register = async ({fullName, email, password}: {fullName: string; email: string; password: string}) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, {displayName: fullName});

        const role: "admin" | "user" = email === DEFAULT_ADMIN_EMAIL ? "admin" : "user";

        const userData: UserData = {
            uid: cred.user.uid,
            displayName: fullName,
            email,
            currentCredit: 0,
            campaigns: [],
            role,
            phone: "",
            companyName: "",
        };

        await setDoc(doc(db, "users", cred.user.uid), userData);
        setUser(userData);
    };

    // user login
    const login = async ({email, password}: {email: string; password: string}) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const docSnap = await getDoc(doc(db, "users", cred.user.uid));
        setUser({uid: cred.user.uid, ...docSnap.data()} as UserData);
    };

    // user logout
    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    // reset password
    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email, {
            url: "https://bulksms-weld.vercel.app/login",
        });
    };

    // update user profile
    const updateProfileField = async (fields: Partial<UserData>) => {
        if (!user) throw new Error("No user logged in");
        await updateDoc(doc(db, "users", user.uid), fields);
        setUser((prev) => (prev ? {...prev, ...fields} : null));
    };

    // update user display name
    const changeDisplayName = async (newName: string) => {
        if (!user) throw new Error("No user logged in");
        if (!auth.currentUser) throw new Error("No firebase user");
        await updateProfile(auth.currentUser, {displayName: newName});
        await updateProfileField({displayName: newName});
    };

    const changePassword = async (newPassword: string) => {
        if (!auth.currentUser) throw new Error("No user logged in");
        await updatePassword(auth.currentUser, newPassword);
    };

    //  reauthenticate with current password before updating
    const reauthenticateAndChangePassword = async (currentPassword: string, newPassword: string) => {
        if (!auth.currentUser || !auth.currentUser.email) {
            throw new Error("No user logged in");
        }
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
    };

    const createCampaign = async ({name, message, file}: {name: string; message: string; file?: File}) => {
        if (!user) throw new Error("No user logged in");

        let fileURL = "";
        if (file) {
            const storageRef = ref(storage, `campaigns/${user.uid}/${file.name}`);
            await uploadBytes(storageRef, file);
            fileURL = await getDownloadURL(storageRef);
        }

        const newCampaign: Campaign = {name, message, file: fileURL};

        await updateDoc(doc(db, "users", user.uid), {
            campaigns: arrayUnion(newCampaign),
        });

        setUser((prev) => (prev ? {...prev, campaigns: [...prev.campaigns, newCampaign]} : null));
    };

    return (
        <UserContext.Provider
            value={{
                user,
                loading,
                register,
                login,
                logout,
                resetPassword,
                updateProfileField,
                changeDisplayName,
                changePassword,
                reauthenticateAndChangePassword,
                createCampaign,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};
