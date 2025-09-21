import {Star} from "lucide-react";

const Testimonials = () => {
    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Marketing Director",
            company: "TechFlow Inc",
            image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
            content:
                "BulkSMS  has transformed our customer communication. The delivery rates are exceptional, and the analytics help us optimize every campaign.",
            rating: 5,
        },
        {
            name: "Michael Chen",
            role: "E-commerce Manager",
            company: "ShopSmart",
            image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
            content:
                "We've seen a 40% increase in customer engagement since switching to BulkSMS. The two-way messaging feature is a game-changer.",
            rating: 5,
        },
        {
            name: "Emily Rodriguez",
            role: "Operations Manager",
            company: "HealthCare Plus",
            image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
            content:
                "Appointment reminders have never been easier. Our no-show rate dropped by 60% after implementing their automated messaging system.",
            rating: 5,
        },
        {
            name: "David Kim",
            role: "Logistics Coordinator",
            company: "FastTrack Delivery",
            image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150",
            content:
                "Real-time delivery notifications keep our customers informed and happy. The API integration was seamless and support was outstanding.",
            rating: 5,
        },
        {
            name: "Lisa Thompson",
            role: "Restaurant Owner",
            company: "Bella Vista",
            image: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150",
            content:
                "Reservation confirmations and special offers via SMS have boosted our bookings by 35%. The platform is intuitive and reliable.",
            rating: 5,
        },
        {
            name: "James Wilson",
            role: "Real Estate Agent",
            company: "Prime Properties",
            image: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150",
            content:
                "Property alerts and viewing reminders help me stay connected with clients. The global reach feature is perfect for international buyers.",
            rating: 5,
        },
    ];

    return (
        <section className="py-20 ">
            <div className="max-w-screen-xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        What Our <span className="text-blue-600">Customers Say</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Join thousands of satisfied customers who trust our platform for their critical communications
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-black/10"
                        >
                            <div className="flex items-center mb-6">
                                {/* <img
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    className="w-12 h-12 rounded-full mr-4 object-cover"
                                /> */}
                                <div>
                                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                                    <p className="text-sm text-blue-600 font-medium">{testimonial.company}</p>
                                </div>
                            </div>

                            <div className="flex items-center mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="size-4 text-yellow-400 fill-current" />
                                ))}
                            </div>

                            <blockquote className="relative">
                                <p className="text-gray-700 leading-relaxed ">{testimonial.content}</p>
                            </blockquote>
                        </div>
                    ))}
                </div>

                {/* Trust Indicators */}
                <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">4.9/5</div>
                        <p className="text-gray-600">Average Rating</p>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                        <p className="text-gray-600">Happy Customers</p>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">99.2%</div>
                        <p className="text-gray-600">Satisfaction Rate</p>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                        <p className="text-gray-600">Support Available</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
