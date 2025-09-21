import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import { CONTACT_EMAIL } from "@/constants/web";

interface OrderSummaryProps {
    selectedPackage: {
        name: string;
        price: number;
        credits: number;
    };
}

export default function OrderSummary({selectedPackage}: OrderSummaryProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedPackage ? (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>{selectedPackage.name} Package</span>
                                <span>${selectedPackage.price}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Credits</span>
                                <span>{selectedPackage.credits}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Price per credit</span>
                                <span>${(selectedPackage.price / selectedPackage.credits).toFixed(2)}</span>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>${selectedPackage.price}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Select a package to see the summary</p>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-start">
                    <p className="text-xs text-muted-foreground">
                        By purchasing credits, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </CardFooter>
            </Card>
            <div>
                <h3 className="font-medium mb-2">Need More Credits?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    For custom packages or bulk discounts, contact our sales team.
                </p>
                <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${CONTACT_EMAIL}`}>Contact Sales</a>
                </Button>
            </div>
        </div>
    );
}
