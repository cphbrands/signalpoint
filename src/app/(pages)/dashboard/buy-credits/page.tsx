"use client";

import OrderSummary from "@/components/dashboard/credits/order-summary";
import PackageCard from "@/components/dashboard/credits/package-card";
import PaymentTabs from "@/components/dashboard/credits/payment-tabs";
import SuccessMsg from "@/components/dashboard/credits/success-msg";
import UserDashboardLayout from "@/components/dashboard/layout/user-dashboard-layout";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {useUser} from "@/context/firebase-context";
import {db} from "@/firebase";
import {generateMemo} from "@/lib/sms";
import {addDoc, collection, serverTimestamp} from "firebase/firestore";
import {AlertCircle, Bitcoin, CreditCard} from "lucide-react";
import {useEffect, useState} from "react";

type PaymentDetails = {
    address: string;
    amount: number | string;
    memo: string;
};
type PaymentMethod = "bitcoin" | "erc20" | "trc20";

export default function BuyCredits() {
    const {user} = useUser();

    const packages = [
        {id: "starter", name: "Starter", credits: 2000, price: 2000 * 0.12, popular: false}, // $60
        {id: "business", name: "Business", credits: 5000, price: 5000 * 0.12, popular: true}, // $300
        {id: "enterprise", name: "Enterprise", credits: 10000, price: 10000 * 0.12, popular: false}, // $1200
    ];

    const cryptoOptions = [
        {id: "bitcoin", name: "Bitcoin", icon: <Bitcoin className="h-5 w-5" />},
        {id: "erc20", name: "ERC20", icon: <CreditCard className="h-5 w-5" />},
        {id: "trc20", name: "TRC20", icon: <CreditCard className="h-5 w-5" />},
    ];

    // State
    const [selectedPackage, setSelectedPackage] = useState(packages[1]); // default business
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bitcoin");

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
        address: "",
        amount: "",
        memo: "",
    });

    // Update payment details when package or method changes
    useEffect(() => {
        if (!selectedPackage) return; // nothing to update if no package selected

        const mockAddresses: Record<PaymentMethod, string> = {
            bitcoin: "bc1qd6sj66s575hass2wnl09vpphrajxzaq2athauz",
            erc20: "0x308898D8fdB04eF0D2e8c4C338284d27f381cc8A",
            trc20: "TV5z8mserwx2rg1g6LXyzkQ2ycfrA2Qk84",
        };
        setPaymentDetails({
            address: mockAddresses[paymentMethod],
            amount: selectedPackage.price,
            memo: generateMemo(8),
        });
    }, [paymentMethod, selectedPackage]);

    const handlePackageSelect = (pkg: (typeof packages)[0]) => {
        setSelectedPackage(pkg);
        setError("");
    };

    const handlePaymentMethodChange = (method: PaymentMethod) => {
        setPaymentMethod(method);
        setError("");
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleSubmitPayment = async () => {
        if (!selectedPackage) {
            setError("Please select a package");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await addDoc(collection(db, "cryptoPayments"), {
                userId: user?.uid,
                userName: user?.displayName || "",
                packageId: selectedPackage.id,
                packageName: selectedPackage.name,
                credits: selectedPackage.credits,
                amount: selectedPackage.price,
                method: paymentMethod,
                address: paymentDetails.address,
                memo: paymentDetails.memo,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            setSuccess(true);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Failed to process payment. Please try again.");
            setLoading(false);
        }
    };

    return (
        <UserDashboardLayout>
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-2">Buy Credits</h1>
                <p className="text-muted-foreground mb-8">Purchase SMS credits to send messages to your contacts</p>

                {error && (
                    <Alert className="mb-6 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-600">Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success ? (
                    <SuccessMsg credits={selectedPackage.credits} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {packages.map((pkg) => (
                                    <PackageCard
                                        key={pkg.id}
                                        pkg={pkg}
                                        selectedPackage={selectedPackage}
                                        handlePackageSelect={handlePackageSelect}
                                    />
                                ))}
                            </div>

                            {selectedPackage && (
                                <PaymentTabs
                                    cryptoOptions={cryptoOptions}
                                    paymentMethod={paymentMethod}
                                    paymentDetails={paymentDetails}
                                    selectedPackage={selectedPackage}
                                    handlePaymentMethodChange={handlePaymentMethodChange}
                                    handleCopyToClipboard={handleCopyToClipboard}
                                    handleSubmitPayment={handleSubmitPayment}
                                    loading={loading}
                                />
                            )}
                        </div>

                        <OrderSummary selectedPackage={selectedPackage} />
                    </div>
                )}
            </div>
        </UserDashboardLayout>
    );
}
