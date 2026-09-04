/*
    BUSINESSPRO
    Customer Website Configuration
*/

const BUSINESS = {
    slug: "your-business",

    // Fallback information
    name: "YOUR BUSINESS",
    tagline: "Quality Service. Made For You.",
    description:
        "We provide reliable, professional and affordable services designed around what our customers need.",

    phone: "+63 900 000 0000",
    email: "hello@yourbusiness.com",
    address: "Your Business Address",

    maps: "https://maps.google.com/",
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",

    customers: "500+",
    rating: "5★",
    experience: "5+",

    services: [],

    testimonials: [
        {
            name: "Maria S.",
            text: "Amazing service from start to finish. Highly recommended!"
        },
        {
            name: "John D.",
            text: "Professional, friendly and very easy to deal with."
        },
        {
            name: "Angela R.",
            text: "Great experience. I'll definitely come back again."
        }
    ],

    booking: {
        enabled: true,
        title: "Book an Appointment",
        description: "Choose a service, date and available time.",
        openingTime: "08:00",
        closingTime: "18:00",
        slotMinutes: 15,

        daysOpen: [1, 2, 3, 4, 5, 6]
    },

    id: null
};
