"use client";
import {db} from "@/firebase";
import {collection, onSnapshot, Timestamp, query, orderBy} from "firebase/firestore";
import {useEffect, useState} from "react";

type Payment = {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    credits: number;
    method: "bitcoin" | "erc20" | "trc20";
    status: "verified" | "pending" | "rejected";
    createdAt: Timestamp;
    memo: string;
};

export default function useAllPayments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const paymentsCol = query(collection(db, "cryptoPayments"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(paymentsCol, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()})) as Payment[];
            setPayments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return {
        payments,
        setPayments,
        loading,
    };
}
