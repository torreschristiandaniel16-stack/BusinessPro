/*
    BUSINESSPRO
    Customer Website
    Supabase Connected Version
*/

const SUPABASE_URL =
    "https://utnpzsgoewiemtfuvwjk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_GM9ND5p_gH6lUcfRM3k2mQ_GNGZ8i9Y";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =====================================================
// GLOBAL DATA
// =====================================================

let currentBusiness = null;
let currentServices = [];
let selectedTime = "";


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeMobileMenu();

        initializeNavigation();

        initializeBooking();

        initializeContactForm();

        await loadBusinessFromSupabase();

    }
);


// =====================================================
// LOAD BUSINESS
// =====================================================

async function loadBusinessFromSupabase() {

    try {

        let business = null;


        /*
            First try the configured slug.
        */

        if (BUSINESS.slug) {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("businesses")
                    .select("*")
                    .eq(
                        "slug",
                        BUSINESS.slug
                    )
                    .maybeSingle();


            if (!error && data) {

                business = data;

            }

        }


        /*
            Fallback:
            load the first business.
        */

        if (!business) {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("businesses")
                    .select("*")
                    .limit(1)
                    .single();


            if (error) {

                console.error(
                    "Business loading error:",
                    error
                );

                showDatabaseError(
                    "Unable to load business information."
                );

                return;

            }


            business = data;

        }


        currentBusiness =
            business;


        BUSINESS.id =
            currentBusiness.id;


        /*
            Load available business information.
        */

        if (currentBusiness.name) {

            BUSINESS.name =
                currentBusiness.name;

        }


        if (currentBusiness.tagline) {

            BUSINESS.tagline =
                currentBusiness.tagline;

        }


        if (currentBusiness.description) {

            BUSINESS.description =
                currentBusiness.description;

        }


        if (currentBusiness.phone) {

            BUSINESS.phone =
                currentBusiness.phone;

        }


        if (currentBusiness.email) {

            BUSINESS.email =
                currentBusiness.email;

        }


        if (currentBusiness.address) {

            BUSINESS.address =
                currentBusiness.address;

        }


        /*
            Load services and settings.
        */

        await loadServices();

        await loadBusinessSettings();

        initializeBusiness();

    } catch (error) {

        console.error(
            "Unexpected business error:",
            error
        );

    }

}


// =====================================================
// LOAD SERVICES
// =====================================================

async function loadServices() {

    const servicesGrid =
        document.getElementById(
            "servicesGrid"
        );


    const bookingService =
        document.getElementById(
            "bookingService"
        );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("services")
                .select(
                    "id,business_id,name,description,price,duration_minutes,active"
                )
                .eq(
                    "business_id",
                    BUSINESS.id
                )
                .eq(
                    "active",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Services loading error:",
                error
            );


            if (servicesGrid) {

                servicesGrid.innerHTML = `
                    <div class="empty-state">
                        <h3>Unable to load services</h3>
                        <p>
                            Please check the Supabase connection.
                        </p>
                    </div>
                `;

            }

            return;

        }


        currentServices =
            data || [];


        console.log(
            "Services loaded:",
            currentServices
        );


        if (
            currentServices.length === 0
        ) {

            if (servicesGrid) {

                servicesGrid.innerHTML = `
                    <div class="empty-state">
                        <h3>No services available</h3>
                        <p>
                            Please check back soon.
                        </p>
                    </div>
                `;

            }


            if (bookingService) {

                bookingService.innerHTML = `
                    <option value="">
                        No services available
                    </option>
                `;

            }

            return;

        }


        /*
            Render services.
        */

        if (servicesGrid) {

            servicesGrid.innerHTML =
                currentServices
                    .map(
                        service => {

                            return `
                                <div class="service-card">

                                    <div class="service-card-top">

                                        <h3>
                                            ${escapeHTML(
                                                service.name
                                            )}
                                        </h3>

                                        ${
                                            service.price
                                                ? `
                                                    <span class="service-price">
                                                        ${escapeHTML(
                                                            service.price
                                                        )}
                                                    </span>
                                                  `
                                                : ""
                                        }

                                    </div>

                                    <p>
                                        ${escapeHTML(
                                            service.description || ""
                                        )}
                                    </p>

                                    ${
                                        service.duration_minutes
                                            ? `
                                                <small>
                                                    ${service.duration_minutes}
                                                    minute appointment
                                                </small>
                                              `
                                            : ""
                                    }

                                </div>
                            `;

                        }
                    )
                    .join("");

        }


        /*
            Booking dropdown.
        */

        if (bookingService) {

            bookingService.innerHTML = `
                <option value="">
                    Select a service
                </option>
            `;


            currentServices.forEach(
                service => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        service.id;


                    option.textContent =
                        service.price
                            ? `${service.name} — ${service.price}`
                            : service.name;


                    bookingService.appendChild(
                        option
                    );

                }
            );

        }

    } catch (error) {

        console.error(
            "Unexpected services error:",
            error
        );

    }

}


// =====================================================
// LOAD BUSINESS SETTINGS
// =====================================================

async function loadBusinessSettings() {

    if (!BUSINESS.id) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("business_settings")
                .select("*")
                .eq(
                    "business_id",
                    BUSINESS.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Settings loading error:",
                error
            );

            return;

        }


        if (!data) {
            return;
        }


        /*
            Support common column naming.
        */

        if (data.opening_time) {

            BUSINESS.booking.openingTime =
                String(
                    data.opening_time
                ).substring(0, 5);

        }


        if (data.closing_time) {

            BUSINESS.booking.closingTime =
                String(
                    data.closing_time
                ).substring(0, 5);

        }


        if (data.slot_minutes) {

            BUSINESS.booking.slotMinutes =
                Number(
                    data.slot_minutes
                );

        }


        /*
            Open days.
        */

        const days = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday"
        ];


        const daysOpen = [];


        days.forEach(
            (day, index) => {

                if (data[day] === true) {

                    daysOpen.push(index);

                }

            }
        );


        if (daysOpen.length > 0) {

            BUSINESS.booking.daysOpen =
                daysOpen;

        }

    } catch (error) {

        console.error(
            "Unexpected settings error:",
            error
        );

    }

}


// =====================================================
// INITIALIZE BUSINESS
// =====================================================

function initializeBusiness() {

    const name =
        BUSINESS.name ||
        "YOUR BUSINESS";


    const logo =
        document.getElementById(
            "businessLogo"
        );


    if (logo) {

        logo.innerHTML =
            formatBusinessName(name);

    }


    const heroName =
        document.getElementById(
            "heroBusinessName"
        );


    if (heroName) {

        heroName.textContent =
            name;

    }


    const heroTagline =
        document.getElementById(
            "heroTagline"
        );


    if (heroTagline) {

        heroTagline.innerHTML =
            formatTagline(
                BUSINESS.tagline
            );

    }


    const heroDescription =
        document.getElementById(
            "heroDescription"
        );


    if (heroDescription) {

        heroDescription.textContent =
            BUSINESS.description;

    }


    const customersStat =
        document.getElementById(
            "customersStat"
        );


    if (customersStat) {

        customersStat.textContent =
            BUSINESS.customers;

    }


    const ratingStat =
        document.getElementById(
            "ratingStat"
        );


    if (ratingStat) {

        ratingStat.textContent =
            BUSINESS.rating;

    }


    const experienceStat =
        document.getElementById(
            "experienceStat"
        );


    if (experienceStat) {

        experienceStat.textContent =
            BUSINESS.experience;

    }


    /*
        Contact information.
    */

    const contactPhone =
        document.getElementById(
            "contactPhone"
        );


    if (contactPhone) {

        contactPhone.textContent =
            BUSINESS.phone;

        contactPhone.href =
            "tel:" +
            BUSINESS.phone.replace(
                /\s/g,
                ""
            );

    }


    const contactEmail =
        document.getElementById(
            "contactEmail"
        );


    if (contactEmail) {

        contactEmail.textContent =
            BUSINESS.email;

        contactEmail.href =
            "mailto:" +
            BUSINESS.email;

    }


    const contactAddress =
        document.getElementById(
            "contactAddress"
        );


    if (contactAddress) {

        contactAddress.textContent =
            BUSINESS.address;

    }


    const contactHours =
        document.getElementById(
            "contactHours"
        );


    if (contactHours) {

        contactHours.textContent =
            formatBusinessHours();

    }


    const facebookLink =
        document.getElementById(
            "facebookLink"
        );


    if (facebookLink) {

        facebookLink.href =
            BUSINESS.facebook;

    }


    const instagramLink =
        document.getElementById(
            "instagramLink"
        );


    if (instagramLink) {

        instagramLink.href =
            BUSINESS.instagram;

    }


    /*
        Footer.
    */

    const footerBusinessName =
        document.getElementById(
            "footerBusinessName"
        );


    if (footerBusinessName) {

        footerBusinessName.innerHTML =
            formatBusinessName(name);

    }


    const copyrightBusiness =
        document.getElementById(
            "copyrightBusiness"
        );


    if (copyrightBusiness) {

        copyrightBusiness.textContent =
            name;

    }


    const copyrightYear =
        document.getElementById(
            "copyrightYear"
        );


    if (copyrightYear) {

        copyrightYear.textContent =
            new Date().getFullYear();

    }


    const bookingTitle =
        document.getElementById(
            "bookingTitle"
        );


    if (bookingTitle) {

        bookingTitle.textContent =
            BUSINESS.booking.title;

    }


    const bookingDescription =
        document.getElementById(
            "bookingDescription"
        );


    if (bookingDescription) {

        bookingDescription.textContent =
            BUSINESS.booking.description;

    }


    initializeTestimonials();

}


// =====================================================
// BUSINESS HOURS
// =====================================================

function formatBusinessHours() {

    const open =
        formatTime(
            BUSINESS.booking.openingTime
        );


    const close =
        formatTime(
            BUSINESS.booking.closingTime
        );


    const days =
        BUSINESS.booking.daysOpen ||
        [];


    if (
        days.includes(1) &&
        days.includes(2) &&
        days.includes(3) &&
        days.includes(4) &&
        days.includes(5) &&
        days.includes(6) &&
        !days.includes(0)
    ) {

        return `Mon - Sat: ${open} - ${close}`;

    }


    if (
        days.length === 7
    ) {

        return `Mon - Sun: ${open} - ${close}`;

    }


    const names = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];


    const selected =
        days
            .sort(
                (a, b) =>
                    a - b
            )
            .map(
                day =>
                    names[day]
            );


    return (
        selected.join(", ") +
        `: ${open} - ${close}`
    );

}


// =====================================================
// TESTIMONIALS
// =====================================================

function initializeTestimonials() {

    const grid =
        document.getElementById(
            "testimonialsGrid"
        );


    if (!grid) {
        return;
    }


    if (
        !BUSINESS.testimonials ||
        BUSINESS.testimonials.length === 0
    ) {

        grid.innerHTML = "";

        return;

    }


    grid.innerHTML =
        BUSINESS.testimonials
            .map(
                testimonial => {

                    return `
                        <div class="testimonial-card">

                            <div class="testimonial-stars">
                                ★★★★★
                            </div>

                            <p>
                                "${escapeHTML(
                                    testimonial.text
                                )}"
                            </p>

                            <strong>
                                ${escapeHTML(
                                    testimonial.name
                                )}
                            </strong>

                        </div>
                    `;

                }
            )
            .join("");

}


// =====================================================
// MOBILE MENU
// =====================================================

function initializeMobileMenu() {

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );


    const mainNav =
        document.getElementById(
            "mainNav"
        );


    if (
        !menuToggle ||
        !mainNav
    ) {

        return;

    }


    menuToggle.addEventListener(
        "click",
        () => {

            mainNav.classList.toggle(
                "active"
            );


            menuToggle.classList.toggle(
                "active"
            );

        }
    );


    mainNav
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        mainNav.classList.remove(
                            "active"
                        );


                        menuToggle.classList.remove(
                            "active"
                        );

                    }
                );

            }
        );

}


// =====================================================
// BOOKING INITIALIZATION
// =====================================================

function initializeBooking() {

    const bookingForm =
        document.getElementById(
            "bookingForm"
        );


    const bookingDate =
        document.getElementById(
            "bookingDate"
        );


    const newBookingButton =
        document.getElementById(
            "newBookingButton"
        );


    if (!bookingForm) {
        return;
    }


    /*
        Minimum date = today.
    */

    if (bookingDate) {

        const today =
            new Date();


        const localDate =
            today.getFullYear() +
            "-" +
            String(
                today.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                today.getDate()
            ).padStart(2, "0");


        bookingDate.min =
            localDate;


        bookingDate.addEventListener(
            "change",
            async () => {

                selectedTime = "";


                const hiddenTime =
                    document.getElementById(
                        "bookingTime"
                    );


                if (hiddenTime) {

                    hiddenTime.value =
                        "";

                }


                await generateTimeSlots();

            }
        );

    }


    bookingForm.addEventListener(
        "submit",
        handleBookingSubmit
    );


    if (newBookingButton) {

        newBookingButton.addEventListener(
            "click",
            () => {

                const form =
                    document.getElementById(
                        "bookingForm"
                    );


                const success =
                    document.getElementById(
                        "bookingSuccess"
                    );


                if (form) {

                    form.reset();

                    form.classList.remove(
                        "hidden"
                    );

                }


                if (success) {

                    success.classList.add(
                        "hidden"
                    );

                }


                selectedTime = "";


                const timeSlots =
                    document.getElementById(
                        "timeSlots"
                    );


                if (timeSlots) {

                    timeSlots.innerHTML = `
                        <p class="time-placeholder">
                            Select a date first.
                        </p>
                    `;

                }

            }
        );

    }

}


// =====================================================
// LOAD BOOKED TIMES
// =====================================================

async function getBookedTimes(
    date
) {

    if (!BUSINESS.id) {

        return [];

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("bookings")
                .select(
                    "booking_time,status"
                )
                .eq(
                    "business_id",
                    BUSINESS.id
                )
                .eq(
                    "booking_date",
                    date
                );


        if (error) {

            console.error(
                "Availability error:",
                error
            );

            return [];

        }


        /*
            Only these statuses occupy a slot.
        */

        const activeStatuses = [
            "Pending",
            "Approved",
            "Completed"
        ];


        return (
            data || []
        )
            .filter(
                booking =>
                    activeStatuses.includes(
                        booking.status
                    )
            )
            .map(
                booking =>
                    normalizeTime(
                        booking.booking_time
                    )
            );


    } catch (error) {

        console.error(
            "Unexpected availability error:",
            error
        );

        return [];

    }

}


// =====================================================
// GENERATE TIME SLOTS
// =====================================================

async function generateTimeSlots() {

    const dateInput =
        document.getElementById(
            "bookingDate"
        );


    const container =
        document.getElementById(
            "timeSlots"
        );


    const hiddenTime =
        document.getElementById(
            "bookingTime"
        );


    if (
        !dateInput ||
        !container
    ) {

        return;

    }


    const selectedDate =
        dateInput.value;


    if (!selectedDate) {

        container.innerHTML = `
            <p class="time-placeholder">
                Select a date first.
            </p>
        `;

        return;

    }


    const date =
        new Date(
            selectedDate +
            "T00:00:00"
        );


    const day =
        date.getDay();


    /*
        Check open day.
    */

    if (
        !BUSINESS.booking.daysOpen.includes(
            day
        )
    ) {

        container.innerHTML = `
            <p class="time-placeholder">
                We're closed on this day.
            </p>
        `;

        return;

    }


    /*
        Show loading.
    */

    container.innerHTML = `
        <p class="time-placeholder">
            Checking availability...
        </p>
    `;


    /*
        Get booked times from Supabase.
    */

    const bookedTimes =
        await getBookedTimes(
            selectedDate
        );


    console.log(
        "Booked times:",
        bookedTimes
    );


    const slots = [];


    const [
        openingHour,
        openingMinute
    ] =
        BUSINESS.booking.openingTime
            .split(":")
            .map(Number);


    const [
        closingHour,
        closingMinute
    ] =
        BUSINESS.booking.closingTime
            .split(":")
            .map(Number);


    let currentMinutes =
        openingHour * 60 +
        openingMinute;


    const closingMinutes =
        closingHour * 60 +
        closingMinute;


    while (
        currentMinutes <
        closingMinutes
    ) {

        const hour =
            Math.floor(
                currentMinutes / 60
            );


        const minute =
            currentMinutes % 60;


        const value =
            String(hour).padStart(
                2,
                "0"
            ) +
            ":" +
            String(minute).padStart(
                2,
                "0"
            );


        slots.push(value);


        currentMinutes +=
            Number(
                BUSINESS.booking.slotMinutes
            );

    }


    /*
        Render slots.
    */

    container.innerHTML =
        slots
            .map(
                time => {

                    const isBooked =
                        bookedTimes.includes(
                            time
                        );


                    return `
                        <button
                            type="button"
                            class="time-slot ${
                                isBooked
                                    ? "booked"
                                    : ""
                            }"
                            data-time="${time}"
                            ${
                                isBooked
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                isBooked
                                    ? `${formatTime(time)} — Booked`
                                    : formatTime(time)
                            }
                        </button>
                    `;

                }
            )
            .join("");


    /*
        Clear selected time.
    */

    selectedTime = "";


    if (hiddenTime) {

        hiddenTime.value = "";

    }


    /*
        Add click handlers only to available slots.
    */

    container
        .querySelectorAll(
            ".time-slot:not(.booked)"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        container
                            .querySelectorAll(
                                ".time-slot"
                            )
                            .forEach(
                                slot => {

                                    slot.classList.remove(
                                        "selected"
                                    );

                                }
                            );


                        button.classList.add(
                            "selected"
                        );


                        selectedTime =
                            button.dataset.time;


                        if (hiddenTime) {

                            hiddenTime.value =
                                selectedTime;

                        }

                    }
                );

            }
        );

}


// =====================================================
// SUBMIT BOOKING
// =====================================================

async function handleBookingSubmit(
    event
) {

    event.preventDefault();


    const serviceId =
        document.getElementById(
            "bookingService"
        ).value;


    const date =
        document.getElementById(
            "bookingDate"
        ).value;


    const time =
        document.getElementById(
            "bookingTime"
        ).value;


    const name =
        document.getElementById(
            "bookingName"
        ).value.trim();


    const phone =
        document.getElementById(
            "bookingPhone"
        ).value.trim();


    const email =
        document.getElementById(
            "bookingEmail"
        ).value.trim();


    const notes =
        document.getElementById(
            "bookingNotes"
        ).value.trim();


    const message =
        document.getElementById(
            "bookingMessage"
        );


    /*
        Validation.
    */

    if (!serviceId) {

        showMessage(
            message,
            "Please select a service.",
            "error"
        );

        return;

    }


    if (!date) {

        showMessage(
            message,
            "Please select a date.",
            "error"
        );

        return;

    }


    if (!time) {

        showMessage(
            message,
            "Please select an available time.",
            "error"
        );

        return;

    }


    if (!name || !phone) {

        showMessage(
            message,
            "Please enter your name and phone number.",
            "error"
        );

        return;

    }


    const service =
        currentServices.find(
            item =>
                String(item.id) ===
                String(serviceId)
        );


    if (!service) {

        showMessage(
            message,
            "Selected service could not be found.",
            "error"
        );

        return;

    }


    /*
        FINAL AVAILABILITY CHECK.

        This protects against two customers
        choosing the same slot at nearly
        the same time.
    */

    const bookedTimes =
        await getBookedTimes(
            date
        );


    if (
        bookedTimes.includes(
            normalizeTime(time)
        )
    ) {

        showMessage(
            message,
            "Sorry, that time was just booked. Please choose another time.",
            "error"
        );


        await generateTimeSlots();


        return;

    }


    /*
        Find or create customer.
    */

    let customerId =
        null;


    const {
        data: existingCustomer,
        error: customerSearchError
    } =
        await supabaseClient
            .from("customers")
            .select("id")
            .eq(
                "business_id",
                BUSINESS.id
            )
            .eq(
                "phone",
                phone
            )
            .maybeSingle();


    if (
        customerSearchError &&
        customerSearchError.code !==
            "PGRST116"
    ) {

        console.error(
            "Customer search error:",
            customerSearchError
        );

    }


    if (existingCustomer) {

        customerId =
            existingCustomer.id;

    } else {

        const {
            data: newCustomer,
            error: customerError
        } =
            await supabaseClient
                .from("customers")
                .insert({

                    business_id:
                        BUSINESS.id,

                    name:
                        name,

                    phone:
                        phone,

                    email:
                        email || null

                })
                .select("id")
                .single();


        if (customerError) {

            console.error(
                "Customer creation error:",
                customerError
            );


            showMessage(
                message,
                "Unable to create customer record.",
                "error"
            );


            return;

        }


        customerId =
            newCustomer.id;

    }


    /*
        Generate booking code.
    */

    const bookingCode =
        generateBookingCode();


    /*
        Insert booking using
        YOUR EXACT bookings schema.
    */

    const {
        data: booking,
        error: bookingError
    } =
        await supabaseClient
            .from("bookings")
            .insert({

                booking_code:
                    bookingCode,

                business_id:
                    BUSINESS.id,

                service_id:
                    service.id,

                customer_id:
                    customerId,

                booking_date:
                    date,

                booking_time:
                    time,

                customer_name:
                    name,

                customer_phone:
                    phone,

                customer_email:
                    email || null,

                notes:
                    notes || null,

                status:
                    "Pending"

            })
            .select(
                "id,booking_code"
            )
            .single();


    if (bookingError) {

        console.error(
            "Booking creation error:",
            bookingError
        );


        showMessage(
            message,
            "Unable to submit your booking. Please try again.",
            "error"
        );


        return;

    }


    /*
        Hide form.
    */

    const bookingForm =
        document.getElementById(
            "bookingForm"
        );


    const bookingSuccess =
        document.getElementById(
            "bookingSuccess"
        );


    const successDetails =
        document.getElementById(
            "bookingSuccessDetails"
        );


    if (bookingForm) {

        bookingForm.classList.add(
            "hidden"
        );

    }


    if (bookingSuccess) {

        bookingSuccess.classList.remove(
            "hidden"
        );

    }


    /*
        Confirmation.
    */

    if (successDetails) {

        successDetails.innerHTML = `

            <p>
                <strong>Booking ID</strong><br>
                ${escapeHTML(
                    booking.booking_code ||
                    bookingCode
                )}
            </p>

            <p>
                <strong>
                    ${escapeHTML(
                        service.name
                    )}
                </strong>
            </p>

            <p>
                ${escapeHTML(
                    formatDate(date)
                )}
            </p>

            <p>
                ${escapeHTML(
                    formatTime(time)
                )}
            </p>

            <p>
                We'll contact you at
                <strong>
                    ${escapeHTML(phone)}
                </strong>
                to confirm your appointment.
            </p>

        `;

    }


    /*
        Refresh slots in background.
    */

    await generateTimeSlots();

}


// =====================================================
// CONTACT FORM
// =====================================================

function initializeContactForm() {

    const contactForm =
        document.getElementById(
            "contactForm"
        );


    if (!contactForm) {
        return;
    }


    contactForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                document.getElementById(
                    "name"
                ).value.trim();


            const phone =
                document.getElementById(
                    "phone"
                ).value.trim();


            const email =
                document.getElementById(
                    "email"
                ).value.trim();


            const userMessage =
                document.getElementById(
                    "message"
                ).value.trim();


            const formMessage =
                document.getElementById(
                    "formMessage"
                );


            if (!BUSINESS.id) {

                showMessage(
                    formMessage,
                    "Business information is still loading.",
                    "error"
                );

                return;

            }


            const {
                error
            } =
                await supabaseClient
                    .from("inquiries")
                    .insert({

                        business_id:
                            BUSINESS.id,

                        name:
                            name,

                        phone:
                            phone || null,

                        email:
                            email || null,

                        message:
                            userMessage

                    });


            if (error) {

                console.error(
                    "Inquiry error:",
                    error
                );


                showMessage(
                    formMessage,
                    "Unable to send your message. Please try again.",
                    "error"
                );


                return;

            }


            showMessage(
                formMessage,
                "Message sent successfully! We'll get back to you soon.",
                "success"
            );


            contactForm.reset();

        }
    );

}


// =====================================================
// NAVIGATION
// =====================================================

function initializeNavigation() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    event => {

                        const targetId =
                            link.getAttribute(
                                "href"
                            );


                        if (
                            !targetId ||
                            targetId === "#"
                        ) {

                            return;

                        }


                        const target =
                            document.querySelector(
                                targetId
                            );


                        if (!target) {

                            return;

                        }


                        event.preventDefault();


                        target.scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "start"

                        });

                    }
                );

            }
        );

}


// =====================================================
// BOOKING CODE
// =====================================================

function generateBookingCode() {

    const random =
        Math.floor(
            100000 +
            Math.random() *
            900000
        );


    return `BK-${random}`;

}


// =====================================================
// NORMALIZE TIME
// =====================================================

function normalizeTime(time) {

    if (!time) {
        return "";
    }


    /*
        Handles:
        10:30
        10:30:00
    */

    return String(time)
        .substring(0, 5);

}


// =====================================================
// FORMAT BUSINESS NAME
// =====================================================

function formatBusinessName(
    name
) {

    const words =
        String(name)
            .trim()
            .split(/\s+/);


    if (
        words.length === 1
    ) {

        return escapeHTML(
            name
        );

    }


    const midpoint =
        Math.ceil(
            words.length / 2
        );


    const first =
        words
            .slice(
                0,
                midpoint
            )
            .join(" ");


    const second =
        words
            .slice(
                midpoint
            )
            .join(" ");


    return `
        ${escapeHTML(first)}
        <span>
            ${escapeHTML(second)}
        </span>
    `;

}


// =====================================================
// FORMAT TAGLINE
// =====================================================

function formatTagline(
    tagline
) {

    if (!tagline) {
        return "";
    }


    const words =
        String(tagline)
            .trim()
            .split(" ");


    if (
        words.length < 3
    ) {

        return escapeHTML(
            tagline
        );

    }


    const midpoint =
        Math.ceil(
            words.length / 2
        );


    return `
        ${escapeHTML(
            words
                .slice(
                    0,
                    midpoint
                )
                .join(" ")
        )}

        <br>

        ${escapeHTML(
            words
                .slice(
                    midpoint
                )
                .join(" ")
        )}
    `;

}


// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(
    time
) {

    if (!time) {
        return "";
    }


    const parts =
        String(time)
            .split(":");


    let hour =
        parseInt(
            parts[0],
            10
        );


    const minute =
        parts[1] || "00";


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    if (hour === 0) {

        hour = 12;

    }


    if (hour > 12) {

        hour -= 12;

    }


    return `
        ${hour}:${minute} ${period}
    `;

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
    dateString
) {

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-US",
        {
            weekday:
                "long",

            year:
                "numeric",

            month:
                "long",

            day:
                "numeric"
        }
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    element,
    text,
    type
) {

    if (!element) {
        return;
    }


    element.textContent =
        text;


    element.className =
        `form-message ${type}`;

}


// =====================================================
// DATABASE ERROR
// =====================================================

function showDatabaseError(
    message
) {

    const servicesGrid =
        document.getElementById(
            "servicesGrid"
        );


    if (servicesGrid) {

        servicesGrid.innerHTML = `
            <div class="empty-state">

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>

            </div>
        `;

    }

}
