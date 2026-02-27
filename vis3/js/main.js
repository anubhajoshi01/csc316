// main.js
let svg = d3.select("#vis3").append("svg")
    .attr("width", 1100)
    .attr("height", 520);

// Layout constants
const groundY = 380;
const throwX = 120;
const throwY = 190;

// --- ground line ---
const W = +svg.attr("width");

const ground = d3.range(0, W + 1, 10).map(function (x) {
    return { x: x, y: groundY + Math.sin(x / 14) * 3 };
});

svg.append("path")
    .attr("d", d3.line().x(d => d.x).y(d => d.y)(ground))
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 4);

// The dude holding the bat
const dude = svg.append("g")
    .attr("transform", "translate(" + 70 + "," + (groundY - 20) + ")");

// head
dude.append("circle")
    .attr("cx", 0)
    .attr("cy", -70)
    .attr("r", 16)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3);

// body
dude.append("line")
    .attr("x1", 0)
    .attr("y1", -54)
    .attr("x2", 0)
    .attr("y2", -10)
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

// legs
dude.append("line")
    .attr("x1", 0).attr("y1", -10).attr("x2", -12).attr("y2", 10)
    .attr("stroke", "white").attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

dude.append("line")
    .attr("x1", 0)
    .attr("y1", -10)
    .attr("x2", 12)
    .attr("y2", 10)
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

// arm 1 (longer)
dude.append("line")
    .attr("x1", 0).attr("y1", -42)
    .attr("x2", -22).attr("y2", -52)
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

// arm 2 (shorter)
dude.append("line")
    .attr("x1", 0).attr("y1", -42 + 2)
    .attr("x2", -22).attr("y2", -44)
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

// bat body
dude.append("line")
    .attr("x1", -25).attr("y1", -40)
    .attr("x2", -35).attr("y2", -100)
    .attr("stroke", "#8b5a2b")
    .attr("stroke-width", 9)
    .attr("stroke-linecap", "round");

// Data extracted from the dataset manually

const planetGravity = [
    { name: "Mercury", g: 3.70 },
    { name: "Venus",   g: 8.87 },
    { name: "Earth",   g: 9.81 },
    { name: "Mars",    g: 3.71 },
    { name: "Jupiter", g: 24.79 },
    { name: "Saturn",  g: 10.44 },
    { name: "Uranus",  g: 8.69 },
    { name: "Neptune", g: 11.15 }
];

// Some setups
const orderedPlanets = planetGravity.slice().sort((a, b) => b.g - a.g);

const arcColors = d3.schemeCategory10;

// xAxis domain affected by the gravity
const [minG, maxG] = d3.extent(planetGravity, d => d.g);

const xAxis = d3.scaleLinear()
    .domain([minG, maxG])
    .range([W - 90, throwX + 220]);

const ARC_HEIGHT = 150;

// Label staggering to avoid crowded labels
const BASE_LABEL_Y = groundY + 35;
const LABEL_STEP_Y = 14;
const LABEL_LEVELS = 5;

function labelYForPlanet(name) {
    const idx = orderedPlanets.findIndex(d => d.name === name);
    const level = (idx < 0 ? 0 : (idx % LABEL_LEVELS));
    return BASE_LABEL_Y + level * LABEL_STEP_Y;
}

function cssPlanetClass(name) {
    return String(name).toLowerCase(); // "Mercury" -> "mercury"
}

// Layers so new throws draw cleanly
const arcLayer    = svg.append("g").attr("class", "arcLayer");
const planetLayer = svg.append("g").attr("class", "planetLayer");
const labelLayer  = svg.append("g").attr("class", "labelLayer");

const placed = new Set();

// -----------------------------------------
// UI controls (AI coded)
// -----------------------------------------
const controls = d3.select("body")
    .append("div")
    .attr("class", "ctrlBar")
    .style("text-align", "center");

controls.append("span")
    .text("Choose a planet: ")
    .style("margin-right", "10px");

const select = controls.append("select")
    .attr("id", "planetSelect")
    .attr("class", "planetSelect");

select.selectAll("option")
    .data(orderedPlanets)
    .enter()
    .append("option")
    .attr("value", d => d.name)
    .text(d => d.name);

controls.append("button")
    .attr("class", "navBtn")
    .style("margin-left", "12px")
    .text("Throw")
    .on("click", () => {
        const name = select.property("value");
        throwPlanet(name);
    });

// -----------------------------------------
// Throw animation (AI coded)
// -----------------------------------------
function throwPlanet(name) {
    if (placed.has(name)) return;

    const p = planetGravity.find(d => d.name === name);
    if (!p) return;

    // landing x is driven by gravity
    const x = xAxis(p.g);

    // Keep base radii; CSS will scale visually via transform: scale(--scale)
    const planetR = (p.name === "Jupiter") ? 22 : 16;
    const planetY = groundY - planetR;

    // Constant arc height
    const cx = (throwX + x) / 2;
    const cy = throwY - ARC_HEIGHT;

    const dPath = `M ${throwX},${throwY} Q ${cx},${cy} ${x},${planetY - 10}`;

    // Draw the arc now (so the moving planet can follow it)
    const arc = arcLayer.append("path")
        .attr("d", dPath)
        .attr("fill", "none")
        .attr("stroke", (p.name === "Earth")
            ? "white"
            : arcColors[orderedPlanets.findIndex(q => q.name === p.name) % arcColors.length]
        )
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", (p.name === "Earth") ? null : "10 10")
        .attr("stroke-linecap", "round");

    const arcNode = arc.node();
    const L = arcNode.getTotalLength();

    const cls = String(p.name).toLowerCase(); // "Jupiter" -> "jupiter"

    const ball = planetLayer.append("circle")
        .attr("class", `planet ${cls}`)  // matches .planet.jupiter, .planet.earth, etc
        .attr("r", planetR)
        .attr("cx", throwX)
        .attr("cy", throwY);

    // Animate along the arc using getPointAtLength
    ball.transition()
        .duration(1400)
        .ease(d3.easeCubicInOut)
        .attrTween("cx", () => t => arcNode.getPointAtLength(t * L).x)
        .attrTween("cy", () => t => arcNode.getPointAtLength(t * L).y)
        .on("end", () => {
            // Snap to final ground position
            ball.attr("cx", x).attr("cy", planetY);

            // Saturn ring
            if (p.name === "Saturn") {
                planetLayer.insert("ellipse", "circle")
                    .attr("class", "saturn-ring")
                    .attr("cx", x)
                    .attr("cy", planetY)
                    .attr("rx", planetR + 25)
                    .attr("ry", 6);
            }

            // Label under the planet (staggered vertically)
            labelLayer.append("text")
                .attr("class", "planet-label")
                .attr("x", x)
                .attr("y", labelYForPlanet(p.name))
                .attr("text-anchor", "middle")
                .text(p.name);

            placed.add(name);

            // Disable selected planet in dropdown
            select.selectAll("option")
                .filter(d => d.name === name)
                .attr("disabled", true);
        });
}