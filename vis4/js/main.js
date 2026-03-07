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

let radiusScale;
let colorScale;

let isAnimating = false;
const animationTasks = [];
let mainTimer;
let lastTime = 0;
let speedMultiplier = 1;


// ==========================
// SVG Canvas
// ==========================
const svg = d3.select("#vis4")
    .append("svg")
    .attr("width", width)
    .attr("height", height);


// ==========================
// Panel Creation
// ==========================
function createPanel(group, panel) {

    // Border
    group.append("rect")
        .attr("width", panelWidth)
        .attr("height", panelHeight)
        .attr("fill", "none")
        .attr("stroke", "#444");

    // Title
    group.append("text")
        .attr("x", panelWidth / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-size", 20)
        .attr("font-weight", "bold")
        .text(panel.name);

    // Sun note
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


// ==========================
// Draw Central Body
// ==========================
function drawCentralBody(group, x, y, body) {

    group.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", radiusScale(body.meanRadius))
        .attr("fill", centralColors[body.eName])
        .attr("stroke", body.eName === "Sun" ? "orange" : "black");
}


// ==========================
// Draw Orbits
// ==========================
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

        const focusX = centerX - c;

        // Draw orbit
        group.append("ellipse")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("rx", a)
            .attr("ry", b)
            .attr("fill", "none")
            .attr("stroke", colorScale(obj.eName))
            .attr("stroke-dasharray", "2,4")
            .attr("stroke-width", 2);

        // Draw orbiter
        const orbiter = group.append("circle")
            .attr("cx", centerX + a)
            .attr("cy", centerY)
            .attr("r", radiusScale(obj.meanRadius))
            .attr("fill", colorScale(obj.eName))
            .attr("stroke", "#333");

        // Draw central body once
        if (i === 0) {
            drawCentralBody(group, focusX, centerY, centralBody);
        }

        // ======================
        // Animation
        // ======================
        const baseSpeed = 0.001 / (Math.sqrt(a) * 0.2);
        let currentAngle = 0;

        animationTasks.push((elapsed, deltaTime) => {

            const r = (a * (1 - e ** 2)) / (1 + e * Math.cos(currentAngle));
            const angularVelocity = baseSpeed / ((a ** 2) / (r ** 2)) * speedMultiplier;

            currentAngle += angularVelocity * (deltaTime || 16);

            orbiter
                .attr("cx", centerX + a * Math.cos(currentAngle))
                .attr("cy", centerY + b * Math.sin(currentAngle));
        });

    });
}


// ==========================
// Legend
// ==========================
function createLegend(svg, mostEccentric) {

    const legend = svg.append("g")
        .attr("transform", `translate(900,60)`);

    legend.append("text")
        .text("Orbiting Bodies")
        .attr("font-size", 16)
        .attr("font-weight", "bold")
        .attr("y", -20);

    const items = legend.selectAll(".legend-item")
        .data(mostEccentric)
        .enter()
        .append("g")
        .attr("transform", (d,i) => `translate(0,${i*30})`);

    items.append("circle")
        .attr("r", 8)
        .attr("fill", d => colorScale(d.eName))
        .attr("stroke", "#333");

    items.append("text")
        .attr("x", 20)
        .attr("y", 5)
        .attr("font-size", 14)
        .text((d,i) =>
            d.discoveryDate !== "NA"
            ? `${i+1}. ${d.eName} (${d.discoveryDate})`
            : `${i+1}. ${d.eName}`
        );
}


// ==========================
// Load Data
// ==========================
d3.csv("data/sol_data.csv").then(data => {

    data.forEach(d => {
        d.eccentricity = +d.eccentricity;
        d.meanRadius = +d.meanRadius;
    });

    data.sort((a,b) => b.eccentricity - a.eccentricity);

    let mostEccentric = data.slice(0,5);

    const earth = data.find(d => d.eName === "Earth");
    if (earth) mostEccentric.push(earth);

    // Scales
    radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data,d=>d.meanRadius)])
        .range([6,27]);

    colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(mostEccentric.map(d=>d.eName));

    // Panels
    const panelGroups = svg.selectAll(".panel")
        .data(panels)
        .enter()
        .append("g")
        .attr("class","panel")
        .attr("transform", d=>`translate(${d.x},${d.y})`);

    panelGroups.each(function(panel){

        const g = d3.select(this);

        createPanel(g,panel);

        const centralBody = data.find(d=>d.eName===panel.name);
        if(!centralBody) return;

        const orbiters = mostEccentric.filter(obj=>{
            if(panel.name==="Sun") return obj.orbits==="NA";
            return obj.orbits===panel.name;
        });

        drawOrbitingBodies(g,panel,centralBody,orbiters);
    });

    createLegend(svg, mostEccentric);
});


// ==========================
// Animation Toggle
// ==========================
d3.select("#orbit-toggle").on("click", function(){

    isAnimating = !isAnimating;
    const btn = d3.select(this);

    if(isAnimating){

        btn.text("Stop Animation");
        lastTime = performance.now();

        mainTimer = d3.timer(()=>{

            const now = performance.now();
            const deltaTime = now - lastTime;
            lastTime = now;

            animationTasks.forEach(task => task(now, deltaTime));
        });

    } else {

        btn.text("Start Animation");
        if(mainTimer) mainTimer.stop();
    }
});


// ==========================
// Speed Slider
// ==========================
d3.select("#speed-slider").on("input", function(){

    speedMultiplier = +this.value;

    d3.select("#speed-value")
        .text(speedMultiplier + "x");
});