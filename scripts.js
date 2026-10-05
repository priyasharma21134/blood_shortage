console.log("Blood Emergency Network Started");


/* =========================
   SECTION NAVIGATION
========================= */

function showSection(sectionId, button = null) {

    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    if (sectionId === "dashboard") {
        loadDashboard();
        loadInventory("dashboardInventory");
    }

    if (sectionId === "inventory") {
        loadInventory("inventoryTable");
    }

    if (sectionId === "requests") {
        loadRequests();
    }
}


/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard");

        const data = await response.json();

        document.getElementById("totalUnits").innerText =
            data.total_units;

        document.getElementById("totalHospitals").innerText =
            data.hospitals;

        document.getElementById("criticalStock").innerText =
            data.critical;

        document.getElementById("emergencyCount").innerText =
            data.emergency_requests;

    } catch (error) {

        console.error(error);

    }
}


/* =========================
   LOAD INVENTORY
========================= */

async function loadInventory(tableId) {

    try {

        const response = await fetch("/api/inventory");

        const data = await response.json();

        const table = document.getElementById(tableId);

        table.innerHTML = "";

        if (data.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        No blood inventory available
                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(item => {

            const available = Number(item.available);
            const capacity = Number(item.capacity);

            let percentage = 0;

            if (capacity > 0) {
                percentage = (available / capacity) * 100;
            }

            let status = "Available";
            let statusClass = "available";

            if (percentage <= 20) {
                status = "Critical";
                statusClass = "critical";
            }
            else if (percentage <= 50) {
                status = "Low";
                statusClass = "warning";
            }


            table.innerHTML += `

                <tr>

                    <td>${item.hospital}</td>

                    <td>
                        <span class="blood-badge">
                            ${item.blood_group}
                        </span>
                    </td>

                    <td>${available} Units</td>

                    <td>${capacity} Units</td>

                    <td>${Math.round(percentage)}%</td>

                    <td>
                        <span class="status ${statusClass}">
                            ${status}
                        </span>
                    </td>

                    <td>

                        <button
                            class="delete-btn"
                            onclick="deleteInventory(
                                '${encodeURIComponent(item.hospital)}',
                                '${encodeURIComponent(item.blood_group)}'
                            )">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        });

    } catch (error) {

        console.error(error);

    }
}


/* =========================
   ADD / UPDATE BLOOD
========================= */

document.getElementById("bloodForm").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const data = {

            hospital:
                document.getElementById("hospital").value,

            blood_group:
                document.getElementById("bloodGroup").value,

            available:
                document.getElementById("available").value,

            capacity:
                document.getElementById("capacity").value

        };


        try {

            const response = await fetch(
                "/api/inventory",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(data)
                }
            );


            const result = await response.json();


            document.getElementById("bloodMessage").innerText =
                result.message;


            if (result.success) {

                document.getElementById("bloodForm").reset();

                loadDashboard();

            }

        } catch (error) {

            document.getElementById("bloodMessage").innerText =
                "Something went wrong";

            console.error(error);

        }

    }
);


/* =========================
   DELETE INVENTORY
========================= */

async function deleteInventory(hospital, bloodGroup) {

    if (!confirm("Delete this blood inventory?")) {
        return;
    }


    try {

        const response = await fetch(
            `/api/inventory/${hospital}/${bloodGroup}`,
            {
                method: "DELETE"
            }
        );


        const result = await response.json();

        alert(result.message);

        loadInventory("inventoryTable");
        loadInventory("dashboardInventory");
        loadDashboard();

    } catch (error) {

        console.error(error);

    }
}


/* =========================
   EMERGENCY REQUEST
========================= */

document.getElementById("emergencyForm").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const data = {

            patient:
                document.getElementById("patient").value,

            hospital:
                document.getElementById("requestHospital").value,

            blood_group:
                document.getElementById("requestBloodGroup").value,

            units:
                document.getElementById("units").value,

            urgency:
                document.getElementById("urgency").value

        };


        try {

            const response = await fetch(
                "/api/emergency",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(data)
                }
            );


            const result = await response.json();


            document.getElementById("emergencyMessage").innerText =
                result.message;


            if (result.success) {

                document.getElementById("emergencyForm").reset();

                loadDashboard();

            }

        } catch (error) {

            document.getElementById("emergencyMessage").innerText =
                "Something went wrong";

            console.error(error);

        }

    }
);


/* =========================
   LOAD REQUESTS
========================= */

async function loadRequests() {

    try {

        const response =
            await fetch("/api/emergency");

        const data = await response.json();

        const table =
            document.getElementById("requestsTable");

        table.innerHTML = "";


        if (data.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">
                        No emergency requests
                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(item => {

            let urgencyClass = "available";

            if (item.urgency === "Critical") {
                urgencyClass = "critical";
            }
            else if (item.urgency === "High") {
                urgencyClass = "warning";
            }


            table.innerHTML += `

                <tr>

                    <td>${item.patient}</td>

                    <td>${item.hospital}</td>

                    <td>
                        <span class="blood-badge">
                            ${item.blood_group}
                        </span>
                    </td>

                    <td>${item.units}</td>

                    <td>
                        <span class="status ${urgencyClass}">
                            ${item.urgency}
                        </span>
                    </td>

                    <td>
                        <span class="status warning">
                            ${item.status}
                        </span>
                    </td>

                </tr>

            `;

        });

    } catch (error) {

        console.error(error);

    }
}


/* =========================
   INITIAL LOAD
========================= */

window.addEventListener("DOMContentLoaded", function() {

    loadDashboard();

    loadInventory("dashboardInventory");

});