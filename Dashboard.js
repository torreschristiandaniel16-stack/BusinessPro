//===========================================
// BUSINESSPRO V6 — SUPABASE CONFIG
// ============================================================

const SUPABASE_URL =
    "https://utnpzsgoewiemtfuvwjk.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_GM9ND5p_gH6lUcfRM3k2mQ_GNGZ8i9Y";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;
let currentBusiness = null;
let bookings = [];
let customers = [];
let inquiries = [];


// ============================================================
// START
// ============================================================

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {

    const isLoginPage =
        document.body.classList.contains("login-page");

    if (isLoginPage) {
        setupLogin();
        await redirectIfAlreadyLoggedIn();
        return;
    }

    await initializeDashboard();
}


// ============================================================
// LOGIN
// ============================================================

function setupLogin() {

    const form =
        document.getElementById("loginForm");

    if (!form) return;

    form.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email =
            document.getElementById("email")
                .value
                .trim();

        const password =
            document.getElementById("password")
                .value;

        const message =
            document.getElementById("loginMessage");

        message.className = "";
        message.textContent = "Signing in...";

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            message.className =
                "error-message";

            message.textContent =
                error.message;

            return;
        }

        if (data.user) {

            message.className =
                "success-message";

            message.textContent =
                "Login successful. Opening dashboard...";

            setTimeout(function() {

                window.location.href =
                    "dashboard.html";

            }, 500);
        }

    });
}


// ============================================================
// EXISTING SESSION
// ============================================================

async function redirectIfAlreadyLoggedIn() {

    const {
        data: {
            session
        }
    } =
        await supabaseClient.auth.getSession();

    if (session) {

        window.location.href =
            "dashboard.html";
    }
}


// ============================================================
// DASHBOARD INITIALIZATION
// ============================================================

async function initializeDashboard() {

    const loading =
        document.getElementById("loading");

    try {

        const {
            data: {
                session
            }
        } =
            await supabaseClient.auth.getSession();

        if (!session) {

            window.location.href =
                "login.html";

            return;
        }

        currentUser =
            session.user;

        await loadOwnerBusiness();

        await Promise.all([
            loadBookings(),
            loadCustomers(),
            loadInquiries()
        ]);

        updateOwnerUI();

        updateStats();

        renderRecentBookings();

        renderBookings();

        renderCustomers();

        renderInquiries();

        setupDashboardEvents();

        loading.classList.add("hidden");

    } catch (error) {

        console.error(error);

        loading.textContent =
            "Unable to load dashboard: " +
            error.message;
    }
}


// ============================================================
// LOAD BUSINESS
// ============================================================

async function loadOwnerBusiness() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("business_owners")
            .select(`
                id,
                full_name,
                business_id,
                businesses (
                    id,
                    name,
                    tagline,
                    description,
                    phone,
                    email,
                    address
                )
            `)
            .eq(
                "id",
                currentUser.id
            )
            .single();

    if (error) {

        console.error(error);

        throw new Error(
            "Your account is not connected to a business."
        );
    }

    if (!data || !data.businesses) {

        throw new Error(
            "No business is assigned to this owner."
        );
    }

    currentBusiness =
        data.businesses;

    window.BUSINESS_OWNER =
        data;
}


// ============================================================
// LOAD BOOKINGS
// ============================================================

async function loadBookings() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("bookings")
            .select(`
                *,
                services (
                    name
                )
            `)
            .eq(
                "business_id",
                currentBusiness.id
            )
            .order(
                "booking_date",
                {
                    ascending: true
                }
            )
            .order(
                "booking_time",
                {
                    ascending: true
                }
            );

    if (error) {
        throw error;
    }

    bookings =
        data || [];
}


// ============================================================
// LOAD CUSTOMERS
// ============================================================

async function loadCustomers() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("customers")
            .select("*")
            .eq(
                "business_id",
                currentBusiness.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {
        throw error;
    }

    customers =
        data || [];
}


// ============================================================
// LOAD INQUIRIES
// ============================================================

async function loadInquiries() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("inquiries")
            .select("*")
            .eq(
                "business_id",
                currentBusiness.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {
        throw error;
    }

    inquiries =
        data || [];
}


// ============================================================
// OWNER UI
// ============================================================

function updateOwnerUI() {

    const ownerName =
        document.getElementById("ownerName");

    const ownerEmail =
        document.getElementById("ownerEmail");

    const welcomeText =
        document.getElementById("welcomeText");

    if (ownerName) {

        ownerName.textContent =
            window.BUSINESS_OWNER.full_name ||
            "Business Owner";
    }

    if (ownerEmail) {

        ownerEmail.textContent =
            currentUser.email || "";
    }

    if (welcomeText) {

        welcomeText.textContent =
            currentBusiness.name;
    }

    document.title =
        currentBusiness.name +
        " — BusinessPro";
}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total =
        bookings.length;

    const pending =
        bookings.filter(
            booking =>
                booking.status === "Pending"
        ).length;

    const approved =
        bookings.filter(
            booking =>
                booking.status === "Approved"
        ).length;

    const completed =
        bookings.filter(
            booking =>
                booking.status === "Completed"
        ).length;

    document.getElementById(
        "totalBookings"
    ).textContent = total;

    document.getElementById(
        "pendingBookings"
    ).textContent = pending;

    document.getElementById(
        "approvedBookings"
    ).textContent = approved;

    document.getElementById(
        "completedBookings"
    ).textContent = completed;
}


// ============================================================
// RECENT BOOKINGS
// ============================================================

function renderRecentBookings() {

    const container =
        document.getElementById(
            "recentBookings"
        );

    if (!container) return;

    const recent =
        [...bookings]
            .sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            )
            .slice(0, 5);

    if (!recent.length) {

        container.innerHTML =
            emptyState(
                "No bookings yet",
                "Customer bookings will appear here."
            );

        return;
    }

    container.innerHTML =
        recent
            .map(
                booking =>
                    bookingHTML(
                        booking,
                        true
                    )
            )
            .join("");
}


// ============================================================
// ALL BOOKINGS
// ============================================================

function renderBookings() {

    const container =
        document.getElementById(
            "bookingsList"
        );

    if (!container) return;

    const search =
        (
            document.getElementById(
                "bookingSearch"
            )?.value || ""
        )
        .toLowerCase()
        .trim();

    const status =
        document.getElementById(
            "bookingStatusFilter"
        )?.value || "All";

    const filtered =
        bookings.filter(
            booking => {

                const matchesSearch =
                    !search ||

                    String(
                        booking.booking_code
                    )
                    .toLowerCase()
                    .includes(search) ||

                    String(
                        booking.customer_name
                    )
                    .toLowerCase()
                    .includes(search) ||

                    String(
                        booking.customer_phone
                    )
                    .toLowerCase()
                    .includes(search);

                const matchesStatus =
                    status === "All" ||
                    booking.status === status;

                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );

    if (!filtered.length) {

        container.innerHTML =
            emptyState(
                "No bookings found",
                "Try changing your search or filter."
            );

        return;
    }

    container.innerHTML =
        filtered
            .map(
                booking =>
                    bookingHTML(
                        booking,
                        false
                    )
            )
            .join("");
}


// ============================================================
// BOOKING CARD
// ============================================================

function bookingHTML(
    booking,
    compact = false
) {

    const serviceName =
        booking.services?.name ||
        "Service";

    const statusClass =
        String(
            booking.status
        )
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );

    const date =
        formatDate(
            booking.booking_date
        );

    const time =
        formatTime(
            booking.booking_time
        );

    let actions = "";

    if (!compact) {

        actions = `
            <div class="booking-actions">

                ${
                    booking.status === "Pending"
                    ? `
                        <button
                            class="action-button approve-button"
                            onclick="changeBookingStatus('${booking.id}', 'Approved')"
                        >
                            ✓ Approve
                        </button>

                        <button
                            class="action-button reject-button"
                            onclick="changeBookingStatus('${booking.id}', 'Rejected')"
                        >
                            ✕ Reject
                        </button>
                    `
                    : ""
                }

                ${
                    booking.status === "Approved"
                    ? `
                        <button
                            class="action-button complete-button"
                            onclick="changeBookingStatus('${booking.id}', 'Completed')"
                        >
                            ✓ Complete
                        </button>
                    `
                    : ""
                }

                ${
                    booking.status === "Rejected"
                    ? `
                        <button
                            class="action-button approve-button"
                            onclick="changeBookingStatus('${booking.id}', 'Approved')"
                        >
                            ↻ Approve
                        </button>
                    `
                    : ""
                }

                <button
                    class="action-button delete-button"
                    onclick="deleteBooking('${booking.id}')"
                >
                    🗑 Delete
                </button>

            </div>
        `;
    }

    return `
        <div class="booking-card">

            <div class="booking-top">

                <div>

                    <div class="booking-code">
                        ${escapeHTML(
                            booking.booking_code
                        )}
                    </div>

                    <div class="booking-name">
                        ${escapeHTML(
                            booking.customer_name
                        )}
                    </div>

                    <div class="booking-service">
                        ${escapeHTML(
                            serviceName
                        )}
                    </div>

                </div>

                <div>

                    <span class="status status-${statusClass}">
                        ${escapeHTML(
                            booking.status
                        )}
                    </span>

                </div>

            </div>

            <div class="booking-details">

                <span>
                    📅 ${date}
                </span>

                <span>
                    ⏰ ${time}
                </span>

            </div>

            <div class="booking-contact">

                📱 ${
                    escapeHTML(
                        booking.customer_phone ||
                        "No phone"
                    )
                }

                ${
                    booking.customer_email
                    ? `
                        <br>
                        ✉️ ${
                            escapeHTML(
                                booking.customer_email
                            )
                        }
                    `
                    : ""
                }

            </div>

            ${
                booking.notes
                ? `
                    <div class="booking-notes">

                        <strong>
                            Notes:
                        </strong>

                        ${escapeHTML(
                            booking.notes
                        )}

                    </div>
                `
                : ""
            }

            ${actions}

        </div>
    `;
}


// ============================================================
// CHANGE BOOKING STATUS
// ============================================================

async function changeBookingStatus(
    bookingId,
    newStatus
) {

    const confirmed =
        confirm(
            `Change booking status to ${newStatus}?`
        );

    if (!confirmed) return;

    const {
        error
    } =
        await supabaseClient
            .from("bookings")
            .update({
                status: newStatus,
                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                bookingId
            )
            .eq(
                "business_id",
                currentBusiness.id
            );

    if (error) {

        alert(
            "Unable to update booking:\n" +
            error.message
        );

        return;
    }

    await loadBookings();

    updateStats();

    renderRecentBookings();

    renderBookings();
}


// ============================================================
// DELETE BOOKING
// ============================================================

async function deleteBooking(
    bookingId
) {

    const confirmed =
        confirm(
            "Delete this booking permanently?"
        );

    if (!confirmed) return;

    const {
        error
    } =
        await supabaseClient
            .from("bookings")
            .delete()
            .eq(
                "id",
                bookingId
            )
            .eq(
                "business_id",
                currentBusiness.id
            );

    if (error) {

        alert(
            "Unable to delete booking:\n" +
            error.message
        );

        return;
    }

    await loadBookings();

    updateStats();

    renderRecentBookings();

    renderBookings();
}


// ============================================================
// CUSTOMERS
// ============================================================

function renderCustomers() {

    const container =
        document.getElementById(
            "customersList"
        );

    if (!container) return;

    if (!customers.length) {

        container.innerHTML =
            emptyState(
                "No customers yet",
                "Customers will appear here after bookings."
            );

        return;
    }

    container.innerHTML =
        customers
            .map(
                customer => `
                    <div class="customer-card">

                        <h3>
                            ${escapeHTML(
                                customer.name
                            )}
                        </h3>

                        <p>
                            📱 ${
                                escapeHTML(
                                    customer.phone ||
                                    "No phone"
                                )
                            }
                        </p>

                        <p>
                            ✉️ ${
                                escapeHTML(
                                    customer.email ||
                                    "No email"
                                )
                            }
                        </p>

                    </div>
                `
            )
            .join("");
}


// ============================================================
// INQUIRIES
// ============================================================

function renderInquiries() {

    const container =
        document.getElementById(
            "inquiriesList"
        );

    if (!container) return;

    if (!inquiries.length) {

        container.innerHTML =
            emptyState(
                "No inquiries",
                "Customer messages will appear here."
            );

        return;
    }

    container.innerHTML =
        inquiries
            .map(
                inquiry => {

                    let inquiryStatusClass =
                        "status-approved";

                    if (
                        inquiry.status === "New"
                    ) {
                        inquiryStatusClass =
                            "status-pending";
                    }

                    if (
                        inquiry.status === "Resolved"
                    ) {
                        inquiryStatusClass =
                            "status-completed";
                    }

                    return `

                        <div class="inquiry-card">

                            <div class="booking-top">

                                <div>

                                    <h3>
                                        ${escapeHTML(
                                            inquiry.name
                                        )}
                                    </h3>

                                    <p>
                                        📱 ${
                                            escapeHTML(
                                                inquiry.phone ||
                                                "No phone"
                                            )
                                        }
                                    </p>

                                    <p>
                                        ✉️ ${
                                            escapeHTML(
                                                inquiry.email ||
                                                "No email"
                                            )
                                        }
                                    </p>

                                </div>

                                <div>

                                    <span class="status ${inquiryStatusClass}">
                                        ${escapeHTML(
                                            inquiry.status
                                        )}
                                    </span>

                                </div>

                            </div>

                            <div class="inquiry-message">

                                ${escapeHTML(
                                    inquiry.message ||
                                    "No message."
                                )}

                            </div>

                            <div class="inquiry-actions">

                                ${
                                    inquiry.status !==
                                    "Resolved"
                                    ? `
                                        <button
                                            class="action-button complete-button"
                                            onclick="resolveInquiry('${inquiry.id}')"
                                        >
                                            ✓ Mark Resolved
                                        </button>
                                    `
                                    : ""
                                }

                                <button
                                    class="action-button delete-button"
                                    onclick="deleteInquiry('${inquiry.id}')"
                                >
                                    🗑 Delete
                                </button>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


// ============================================================
// RESOLVE INQUIRY
// ============================================================

async function resolveInquiry(
    inquiryId
) {

    const {
        error
    } =
        await supabaseClient
            .from("inquiries")
            .update({
                status: "Resolved",
                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                inquiryId
            )
            .eq(
                "business_id",
                currentBusiness.id
            );

    if (error) {

        alert(
            "Unable to update inquiry:\n" +
            error.message
        );

        return;
    }

    await loadInquiries();

    renderInquiries();
}


// ============================================================
// DELETE INQUIRY
// ============================================================

async function deleteInquiry(
    inquiryId
) {

    const confirmed =
        confirm(
            "Delete this inquiry permanently?"
        );

    if (!confirmed) return;

    const {
        error
    } =
        await supabaseClient
            .from("inquiries")
            .delete()
            .eq(
                "id",
                inquiryId
            )
            .eq(
                "business_id",
                currentBusiness.id
            );

    if (error) {

        alert(
            "Unable to delete inquiry:\n" +
            error.message
        );

        return;
    }

    await loadInquiries();

    renderInquiries();
}


// ============================================================
// DASHBOARD EVENTS
// ============================================================

function setupDashboardEvents() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                function() {

                    showSection(
                        item.dataset.section
                    );

                    navItems.forEach(
                        nav =>
                            nav.classList.remove(
                                "active"
                            )
                    );

                    item.classList.add(
                        "active"
                    );
                }
            );

        }
    );


    const viewBookingsButton =
        document.getElementById(
            "viewBookingsButton"
        );

    if (viewBookingsButton) {

        viewBookingsButton.addEventListener(
            "click",
            function() {

                showSection("bookings");

                navItems.forEach(
                    nav =>
                        nav.classList.remove(
                            "active"
                        )
                );

                const bookingNav =
                    document.querySelector(
                        '[data-section="bookings"]'
                    );

                if (bookingNav) {
                    bookingNav.classList.add(
                        "active"
                    );
                }

            }
        );
    }


    const search =
        document.getElementById(
            "bookingSearch"
        );

    if (search) {

        search.addEventListener(
            "input",
            renderBookings
        );
    }


    const filter =
        document.getElementById(
            "bookingStatusFilter"
        );

    if (filter) {

        filter.addEventListener(
            "change",
            renderBookings
        );
    }


    const refreshBookings =
        document.getElementById(
            "refreshBookings"
        );

    if (refreshBookings) {

        refreshBookings.addEventListener(
            "click",
            async function() {

                refreshBookings.textContent =
                    "Refreshing...";

                await loadBookings();

                updateStats();

                renderRecentBookings();

                renderBookings();

                refreshBookings.textContent =
                    "🔄 Refresh";
            }
        );
    }


    const refreshInquiries =
        document.getElementById(
            "refreshInquiries"
        );

    if (refreshInquiries) {

        refreshInquiries.addEventListener(
            "click",
            async function() {

                refreshInquiries.textContent =
                    "Refreshing...";

                await loadInquiries();

                renderInquiries();

                refreshInquiries.textContent =
                    "🔄 Refresh";
            }
        );
    }


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );
    }
}


// ============================================================
// SHOW SECTION
// ============================================================

function showSection(
    section
) {

    const sections = {
        overview:
            document.getElementById(
                "overviewSection"
            ),

        bookings:
            document.getElementById(
                "bookingsSection"
            ),

        customers:
            document.getElementById(
                "customersSection"
            ),

        inquiries:
            document.getElementById(
                "inquiriesSection"
            )
    };


    Object.values(sections)
        .forEach(
            element => {

                if (element) {

                    element.classList.add(
                        "hidden"
                    );
                }

            }
        );


    if (sections[section]) {

        sections[section]
            .classList.remove(
                "hidden"
            );
    }


    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    const titles = {

        overview:
            "Dashboard",

        bookings:
            "Bookings",

        customers:
            "Customers",

        inquiries:
            "Inquiries"

    };


    if (pageTitle) {

        pageTitle.textContent =
            titles[section] ||
            "Dashboard";
    }
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    const confirmed =
        confirm(
            "Sign out of BusinessPro?"
        );

    if (!confirmed) return;

    await supabaseClient.auth.signOut();

    window.location.href =
        "login.html";
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    dateString
) {

    if (!dateString) return "—";

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );

    return date.toLocaleDateString(
        "en-PH",
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(
    timeString
) {

    if (!timeString) return "—";

    const parts =
        timeString
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

    hour =
        hour % 12 || 12;

    return (
        hour +
        ":" +
        minute +
        " " +
        period
    );
}


// ============================================================
// EMPTY STATE
// ============================================================

function emptyState(
    title,
    message
) {

    return `
        <div class="empty-state">

            <strong>
                ${escapeHTML(title)}
            </strong>

            <span>
                ${escapeHTML(message)}
            </span>

        </div>
    `;
}


// ============================================================
// SECURITY — ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
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
   
