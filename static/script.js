console.log("Dashboard JS Loaded");


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard");

        if (!response.ok) {
            throw new Error("Dashboard API failed");
        }

        const data = await response.json();

        console.log("Dashboard Data:", data);

        const totalUnits = document.getElementById("totalUnits");
        const totalHospitals = document.getElementById("totalHospitals");
        const criticalStock = document.getElementById("criticalStock");
        const emergencyCount = document.getElementById("emergencyCount");

        if (totalUnits)
            totalUnits.innerText = data.total_units || 0;

        if (totalHospitals)
            totalHospitals.innerText = data.hospitals || 0;

        if (criticalStock)
            criticalStock.innerText = data.critical || 0;

        if (emergencyCount)
            emergencyCount.innerText = data.emergency_requests || 0;

    } catch (error) {

        console.error("Dashboard Error:", error);

    }
}


/* =========================
   INVENTORY
========================= */

async function loadInventory(tableId) {

    try {

        const response = await fetch("/api/inventory");

        if (!response.ok) {
            throw new Error("Inventory API failed");
        }

        const data = await response.json();

        console.log("Inventory:", data);

        const table = document.getElementById(tableId);

        if (!table) return;

        table.innerHTML = "";

        if (!data || data.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        No blood inventory available
                    </td>
                </tr>
            `;

            return;
        }

        data.forEach(item => {

            const available = Number(item.available) || 0;
            const capacity = Number(item.capacity) || 0;

            let percentage = 0;

            if (capacity > 0) {
                percentage = (available / capacity) * 100;
            }

            let status = "Available";

            if (percentage <= 20) {
                status = "Critical";
            }
            else if (percentage <= 50) {
                status = "Low";
            }

            table.innerHTML += `
                <tr>

                    <td>${item.hospital || "-"}</td>

                    <td>
                        <span class="blood-badge">
                            ${item.blood_group || "-"}
                        </span>
                    </td>

                    <td>${available} Units</td>

                    <td>${capacity} Units</td>

                    <td>${Math.round(percentage)}%</td>

                    <td>${status}</td>

                    <td>
                        <button
                            onclick="deleteInventory('${item.hospital}', '${item.blood_group}')">
                            Delete
                        </button>
                    </td>

                </tr>
            `;

        });

    } catch (error) {

        console.error("Inventory Error:", error);

    }
}


/* =========================
   DELETE INVENTORY
========================= */

async function deleteInventory(hospital, bloodGroup) {

    if (!confirm("Delete this blood inventory?")) {
        return;
    }

    try {

        const response = await fetch(
            `/api/inventory/${encodeURIComponent(hospital)}/${encodeURIComponent(bloodGroup)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        alert(result.message || "Deleted successfully");

        loadDashboard();
        loadInventory("dashboardInventory");
        loadInventory("inventoryTable");

    } catch (error) {

        console.error("Delete Error:", error);

    }
}


/* =========================
   SECTION
========================= */

function showSection(sectionId, button = null) {

    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    const section = document.getElementById(sectionId);

    if (section) {
        section.classList.add("active");
    }

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
   EMERGENCY REQUESTS
========================= */

async function loadRequests() {

    try {

        const response = await fetch("/api/emergency");

        const data = await response.json();

        const table = document.getElementById("requestsTable");

        if (!table) return;

        table.innerHTML = "";

        if (!data || data.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        No emergency requests
                    </td>
                </tr>
            `;

            return;
        }

        data.forEach(item => {

            table.innerHTML += `
                <tr>

                    <td>${item.patient || "-"}</td>

                    <td>${item.hospital || "-"}</td>

                    <td>${item.blood_group || "-"}</td>

                    <td>${item.units || 0}</td>

                    <td>${item.urgency || "-"}</td>

                    <td>${item.status || "Pending"}</td>

                </tr>
            `;

        });

    } catch (error) {

        console.error("Requests Error:", error);

    }
}


/* =========================
   START DASHBOARD
========================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Dashboard Starting...");

    loadDashboard();

    loadInventory("dashboardInventory");

});