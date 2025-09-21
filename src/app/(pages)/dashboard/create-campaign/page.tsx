"use client";

import UserDashboardLayout from "@/components/dashboard/layout/user-dashboard-layout";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {useUser} from "@/context/firebase-context";
import {db, storage} from "@/firebase";
import useCurrentCredits from "@/hooks/use-current-credit";
import {addDoc, collection, doc, increment, serverTimestamp, updateDoc} from "firebase/firestore";
import {getDownloadURL, ref, uploadBytes} from "firebase/storage";
import {Info, Loader2} from "lucide-react";
import Link from "next/link";
import {useMemo, useState} from "react";

export default function CreateCampaign() {
    const {user} = useUser();
    const userCurrentCredits = useCurrentCredits();

    const [campaignName, setCampaignName] = useState("");
    const [message, setMessage] = useState("");
    const [contactCount, setContactCount] = useState<number>(0);
    const [file, setFile] = useState<File | null>(null);
    const [sendType, setSendType] = useState<"now" | "later">("now");
    const [scheduledDate, setScheduledDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getSegments = (msg: string) => {
        const len = msg.length;
        if (len === 0) return 0;
        if (len <= 160) return 1;
        if (len <= 306) return 2;
        if (len <= 459) return 3;
        return Math.ceil(len / 153);
    };

    const segments = useMemo(() => getSegments(message), [message]);
    const requiredCredits = useMemo(() => contactCount * segments, [contactCount, segments]);

    const validate = () => {
        if (!campaignName.trim()) return "Campaign name is required!";
        if (!message.trim()) return "Message cannot be empty!";
        if (contactCount <= 0) return "Please enter a valid contact count!";
        if (!file) return "Please upload a CSV/XLS/XLSX file!";
        if (!user) return "User not found!";
        if ((userCurrentCredits ?? 0) < requiredCredits) return "Not enough credits to create this campaign!";
        if (sendType === "later" && new Date(scheduledDate) <= new Date())
            return "Scheduled date must be in the future!";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const errorMessage = validate();
        if (errorMessage) {
            setError(errorMessage);
            return;
        }

        setLoading(true);

        try {
            // upload file to Firebase storage
            const fileRef = ref(storage, `campaign-files/${user!.uid}/${Date.now()}-${file!.name}`);
            await uploadBytes(fileRef, file!);
            const fileURL = await getDownloadURL(fileRef);

            // save campaign
            await addDoc(collection(db, "campaigns"), {
                userId: user!.uid,
                name: campaignName,
                message,
                fileURL,
                contactCount,
                segments,
                requiredCredits,
                createdAt: serverTimestamp(),
                status: "scheduled",
                delivered: 0,
                scheduledAt: sendType === "later" ? scheduledDate : "instant",
            });

            const userRef = doc(db, "users", user!.uid);
            await updateDoc(userRef, {
                currentCredit: increment(-requiredCredits),
            });
            alert("Campaign created successfully!");
            setCampaignName("");
            setMessage("");
            setContactCount(0);
            setFile(null);
            setScheduledDate("");
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to create campaign. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserDashboardLayout>
            <div className="container py-8 mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Create SMS Campaign</h1>
                        <p className="text-muted-foreground mt-1">
                            Create a new SMS campaign to send messages to your contacts
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <Button asChild>
                            <Link href="/dashboard/campaigns">All Campaigns</Link>
                        </Button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="rounded-lg space-y-6 border p-6 bg-card">
                    {error && <p className="text-red-600 font-medium bg-red-50 p-2 rounded">⚠ {error}</p>}

                    <div>
                        <Label className="mb-2">Campaign Name</Label>
                        <Input
                            type="text"
                            placeholder="Enter campaign name"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label className="mb-2">Message</Label>
                        <Textarea
                            placeholder="Type your SMS message..."
                            value={message}
                            className="resize-none h-32"
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Characters: {message.length} | Segments: {segments}
                        </p>
                    </div>

                    <div>
                        <Label className="mb-2">Total Contacts</Label>
                        <Input
                            type="number"
                            placeholder="Enter contact count"
                            value={contactCount}
                            onChange={(e) => setContactCount(Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <Label className="mb-2">Upload File (CSV/XLS/XLSX)</Label>
                        <Input
                            type="file"
                            accept=".csv,.xls,.xlsx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <div className="text-sm text-gray-500 mt-1">
                            <strong>Instructions:</strong>
                            <ul className="list-disc ml-5 mt-1 space-y-1">
                                <li>Upload your contacts file in CSV/XLS/XLSX format.</li>
                                <li>File will be stored securely and accessible to admin for processing.</li>
                                <li>Max file size recommended: 5MB.</li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <Label className="mb-2">Send Option</Label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" checked={sendType === "now"} onChange={() => setSendType("now")} />
                                Now
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={sendType === "later"}
                                    onChange={() => setSendType("later")}
                                />
                                Later
                            </label>
                        </div>
                        {sendType === "later" && (
                            <Input
                                type="datetime-local"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="mt-2"
                            />
                        )}
                    </div>

                    <Card>
                        <CardContent>
                            <div className="flex items-start">
                                <Info className="h-5 w-5 mr-2 font-medium flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-medium mb-1">Campaign Summary</h3>
                                    <ul className="text-sm font-medium space-y-1">
                                        <li>Recipients: {contactCount}</li>
                                        <li>
                                            Message length: {message.length} characters ({segments} SMS per contact)
                                        </li>
                                        <li>Total credits required: {requiredCredits}</li>
                                        {scheduledDate && (
                                            <li>Scheduled for: {new Date(scheduledDate).toLocaleString()}</li>
                                        )}
                                        {userCurrentCredits !== undefined && userCurrentCredits < requiredCredits && (
                                            <li className="text-red-600 font-medium">⚠ Not enough credits</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        type="submit"
                        disabled={
                            loading ||
                            !file ||
                            !campaignName.trim() ||
                            !message.trim() ||
                            contactCount <= 0 ||
                            (userCurrentCredits ?? 0) < requiredCredits
                        }
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" /> Creating...
                            </span>
                        ) : (
                            "Create Campaign"
                        )}
                    </Button>
                </form>
            </div>
        </UserDashboardLayout>
    );
}
