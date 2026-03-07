// ==========================
// Constants & Dimensions
// ==========================
const width = 1100;
const height = 800;
const panelWidth = 800 / 2;
const panelHeight = height / 2;

const panels = [
    { name: "Sun", x: 0, y: 0 },
    { name: "Saturn", x: panelWidth, y: 0 },
    { name: "Neptune", x: 0, y: panelHeight },
    { name: "Uranus", x: panelWidth, y: panelHeight }
];

const centralColors = {
    Sun: "#ffdd33",
    Saturn: "#f5e134",
    Neptune: "#1f466f",
    Uranus: "#79c8ed"
};

let isAnimating = false;
const animationTasks = [];
let mainTimer;
let startTime = 0;
let pausedAt = 0;

// ==========================
// SVG Canvas
// ==========================
const svg = d3.select("#vis4")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// ==========================
// Helper Functions
// ==========================
function createPanel(group, panel) {
    // Panel border
    group.append("rect")
        .attr("width", panelWidth)
        .attr("height", panelHeight)
        .attr("fill", "transparent")
        .attr("stroke", "#444");

    // Panel title
    group.append("text")
        .attr("x", panelWidth / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-size", 20)
        .attr("font-weight", "bold")
        .text(panel.name);

    // Optional note for Sun
    if (panel.name === "Sun") {
        group.append("text")
            .attr("x", panelWidth / 2)
            .attr("y", 60)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("fill", "#aaa")
            .text("Note: Sun's orbiting bodies are shown for comparison");
    }
}

function drawCentralBody(group, centerX, centerY, centralBody) {
    group.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radiusScale(centralBody.meanRadius))
        .attr("fill", centralColors[centralBody.eName])
        .attr("stroke", centralBody.eName === "Sun" ? "orange" : "black");
}

function drawOrbitingBodies(group, panel, centralBody, orbiters) {
    const centerX = panelWidth / 2;
    const centerY = panelHeight / 2 + 20;
    const baseA = 80;
    const spacing = 45;

    orbiters.forEach((obj, i) => {
        const e = obj.eccentricity;
        const a = baseA + i * spacing;
        const c = a * e;
        const b = a * Math.sqrt(1 - e * e);
        
        // Draw the planet at the focus of the orbit, so the center of the ellipse is shifted by c from the focus
        const focusX = centerX - c;

        // Draw the orbit
        group.append("ellipse")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("rx", a)
            .attr("ry", b)
            .attr("fill", "none")
            .attr("stroke", colorScale(obj.eName))
            .attr("stroke-dasharray", "2,4")
            .attr("stroke-width", 2);

        // Draw the orbiting object
        const orbiter = group.append("circle")
            .attr("cx", centerX + a)
            .attr("cy", centerY)
            .attr("r", radiusScale(obj.meanRadius))
            .attr("fill", colorScale(obj.eName))
            .attr("stroke", "#333");

        // Draw the central body at the focus of the first orbit
        if (i === 0) {
            drawCentralBody(group, focusX, centerY, centralBody);
        }

        // ==========================
        // Animation Toggle Logic (AI coded)
        // ==========================
        const baseSpeed = 0.001 / (Math.sqrt(a) * 0.2);
        
        // We need to track the current angle for each orbiter individually
        let currentAngle = 0;
        
        animationTasks.push((elapsed, deltaTime) => {
            // Calculate current position's distance from the focus
            const r = (a * (1 - Math.pow(e, 2))) / (1 + e * Math.cos(currentAngle));

            const angularVelocity = baseSpeed / (Math.pow(a, 2) / Math.pow(r, 2)) * speedMultiplier;
            
            // Update the angle based on the new velocity
            currentAngle += angularVelocity * (deltaTime || 16);

            // Update the visual position
            orbiter
                .attr("cx", centerX + a * Math.cos(currentAngle))
                .attr("cy", centerY + b * Math.sin(currentAngle));
        });
    });
}

function createLegend(svg, mostEccentric) {
    const legend = svg.append("g")
        .attr("transform", `translate(900, 60)`);

    legend.append("text")
        .text("Orbiting Bodies")
        .attr("font-size", 16)
        .attr("font-weight", "bold")
        .attr("y", -20);

    const legendItems = legend.selectAll(".legend-item")
        .data(mostEccentric)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`);

    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 5)
        .attr("font-size", 14)
        .text((d, i) => d.discoveryDate != "NA" ? `${i + 1}. ${d.eName} (${d.discoveryDate})` : `${i + 1}. ${d.eName}`);

    legendItems.append("circle")
        .attr("r", 8)
        .attr("fill", d => colorScale(d.eName))
        .attr("stroke", "#333");
}

// ==========================
// Load Data & Draw
// ==========================
d3.csv("data/sol_data.csv").then(data => {

    // Parse numeric fields
    data.forEach(d => {
        d.eccentricity = +d.eccentricity;
        d.meanRadius = +d.meanRadius;
    });

    // Top eccentric bodies
    data.sort((a, b) => b.eccentricity - a.eccentricity);
    let mostEccentric = data.slice(0, 5);
    const earth = data.find(d => d.eName === "Earth");
    if (earth) mostEccentric.push(earth);

    // Define scales
    radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.meanRadius)])
        .range([6, 27]);

    colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(mostEccentric.map(d => d.eName));

    // Create panels
    const panelGroups = svg.selectAll(".panel")
        .data(panels)
        .enter()
        .append("g")
        .attr("class", "panel")
        .attr("id", d => `panel-${d.name.toLowerCase()}`)
        .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // Panel titles
    panelGroups.append("text").attr("class", "planet-text")
        .attr("x", panelWidth / 2)  // Center the title horizontally
        .attr("y", 30)             // Position the title just above the panel
        .attr("text-anchor", "middle") // Center the text horizontally
        .attr("font-size", 16)
        .attr("font-weight", "bold")
        .text(d => d.name);

    panelGroups.select("#panel-sun")
        .append("text").attr("class", "planet-text")
        .attr("x", panelWidth / 2)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "gray")
        .text("Note: Sun's orbiting bodies are shown for comparison");

    // Panel borders
    panelGroups.append("rect")
        .attr("width", panelWidth)
        .attr("height", panelHeight)
        .attr("fill", "none")
        .attr("stroke", "#ddd");

    // Draw each system
    panelGroups.each(function(panel) {
        const g = d3.select(this);
        createPanel(g, panel);

        const centralBody = data.find(d => d.eName === panel.name);
        if (!centralBody) return;

        // Filter orbiters
        const orbiters = mostEccentric.filter(obj => {
            if (panel.name === "Sun") return obj.orbits === "NA";
            return obj.orbits === panel.name;
        });

        drawOrbitingBodies(g, panel, centralBody, orbiters);
        
    });

    // Draw legend
    createLegend(svg, mostEccentric);
});

// ==========================
// Animation Toggle Logic (AI coded)
// ==========================
let lastTime = 0;

d3.select("#orbit-toggle").on("click", function() {
    isAnimating = !isAnimating;
    const btn = d3.select(this);

    if (isAnimating) {
        btn.text("Stop Animation");
        lastTime = performance.now(); // Reset lastTime on start
        
        mainTimer = d3.timer(() => {
            const now = performance.now();
            const deltaTime = now - lastTime;
            lastTime = now;

            // Pass deltaTime to each task
            animationTasks.forEach(task => task(now, deltaTime));
        });
    } else {
        btn.text("Start Animation");
        if (mainTimer) mainTimer.stop();
    }
});

    
    // ------- Legend -------
    const legend = svg.append("g")
        .attr("transform", `translate(820, 60)`);

    legend.append("text").attr("class", "planet-text")
        .text("Orbiting Bodies")
        .attr("font-size", 16)
        .attr("font-weight", "bold")
        .attr("y", -20);

    const legendItems = legend.selectAll(".legend-item")
        .data(mostEccentric)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`);

    legendItems.append("text").attr("class", "planet-text")
        .attr("x", 20)
        .attr("y", 5)
        .text((d, i) => d.discoveryDate != "NA" ? `${i + 1}. ${d.eName} (${d.discoveryDate})` : `${i + 1}. ${d.eName}`)
        .attr("font-size", 14);
let speedMultiplier = 1;

// Listener for the slider
d3.select("#speed-slider").on("input", function() {
    speedMultiplier = +this.value;
    d3.select("#speed-value").text(speedMultiplier + "x");
});