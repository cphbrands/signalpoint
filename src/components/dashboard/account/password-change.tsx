"use client";

import {Alert, AlertDescription} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import PasswordInput from "@/components/ui/password-input";
import {useUser} from "@/context/firebase-context";
import {Loader2} from "lucide-react";
import {useState} from "react";

export default function PasswordChange() {
    const {reauthenticateAndChangePassword} = useUser();
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleChangePassword = async () => {
        setPasswordError("");

        if (!currentPassword) {
            setPasswordError("Current password is required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }

        setSaving(true);

        try {
            await reauthenticateAndChangePassword(currentPassword, newPassword);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setPasswordError(error.message || "Failed to change password");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Update your password and security preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>

                        <PasswordInput
                            id="new-password"
                            onChange={(e) => setNewPassword(e.target.value)}
                            value={newPassword}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>

                        <PasswordInput
                            id="confirm-password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            value={confirmPassword}
                        />
                    </div>
                    {passwordError && (
                        <Alert variant="destructive">
                            <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                {saveSuccess && <div className="text-green-600 font-medium">Password changed successfully!</div>}
                <Button onClick={handleChangePassword} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        <>Change Password</>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
