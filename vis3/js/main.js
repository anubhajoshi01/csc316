// mass.js
let svg = d3.select("#vis3").append("svg")
    .attr('width', 1100)
    .attr('height', 520)

// Layout constants
const groundY = 380;
const throwX  = 120;
const throwY  = 190;

// --- ground line ---
const W = +svg.attr("width");

const ground = d3.range(0, W + 1, 10).map(function(x) {
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
    .attr("stroke", "black")
    .attr("stroke-width", 3);

// body
dude.append("line")
    .attr("x1", 0)
    .attr("y1", -54)
    .attr("x2", 0)
    .attr("y2", -10)
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

// legs
dude.append("line")
    .attr("x1", 0).attr("y1", -10).attr("x2", -12).attr("y2", 10)
    .attr("stroke", "black").attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

dude.append("line")
    .attr("x1", 0)
    .attr("y1", -10)
    .attr("x2",  12)
    .attr("y2", 10)
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

// --- Arms BOTH behind the body (like your sketch) ---

// arm 1 (longer)
dude.append("line")
    .attr("x1", 0).attr("y1", -42)
    .attr("x2", -22).attr("y2", -52)
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

// arm 2 (shorter)
dude.append("line")
    .attr("x1", 0).attr("y1", -42 + 2)
    .attr("x2", -22).attr("y2", -44)
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

// bat body
dude.append("line")
    .attr("x1", -25).attr("y1", -40)
    .attr("x2", -35).attr("y2", -100)
    .attr("stroke", "#8b5a2b") // brown like in last lab
    .attr("stroke-width", 9)
    .attr("stroke-linecap", "round");


// Planet data (Since there is only a few, i extract it manually from the dataset.
// Only the rank of the gravity strength is extracted, not real numbers)
const planets = [
    { name: "Jupiter", strength: 7 },
    { name: "Neptune", strength: 6 },
    { name: "Saturn",  strength: 5 },
    { name: "Earth",   strength: 4 },
    { name: "Venus",   strength: 3 },
    { name: "Uranus",  strength: 2 },
    { name: "Mars",    strength: 1 },
    { name: "Mercury", strength: 0 }
];

// Axis scales
const xAxis = d3.scalePoint()
    .domain(planets.map(function(p) { return p.name; }))
    .range([throwX + 220, W - 90])
    .padding(0.3);

const yAxis = d3.scaleLinear()
    .domain([0, 7])       // 0 = weakest (tallest), 7 = strongest (flattest)
    .range([230, 90]);    // taller → flatter

// Colors to distinguish planets
const arcColors = d3.schemeCategory10;
const planetColor = d3.scaleOrdinal(d3.schemeCategory10);

// Foreach planet:
planets.forEach(function(p, i) {
    const x = xAxis(p.name);
    const planetR = (p.name === "Jupiter") ? 22 : 16;
    const planetY = groundY - planetR;

    // planets
    svg.append("circle")
        .attr("cx", x)
        .attr("cy", planetY)
        .attr("r", planetR)
        .attr("fill", planetColor(p.name))
        .attr("stroke", "#222")
        .attr("stroke-width", 2);

    // Additional Saturn ring
    if (p.name === "Saturn") {
        svg.append("ellipse")
            .attr("cx", x)
            .attr("cy", planetY)
            .attr("rx", planetR + 12)
            .attr("ry", 6)
            .attr("fill", "none")
            .attr("stroke", "grey")
            .attr("stroke-width", 3);
    }

    // labels
    svg.append("text")
        .attr("class", "planet-label")
        .attr("x", x)
        .attr("y", groundY + 35)
        .text(p.name);

    // arc (not properly scaled)
    const dPath = "M " + throwX + "," + throwY +
        " Q " + ((throwX + x) / 2) + "," + (throwY - yAxis(p.strength)) +
        " " + x + "," + (planetY - 10);

    svg.append("path")
        .attr("d", dPath)
        .attr("fill", "none")
        .attr("stroke", (p.name === "Earth") ? "black" : arcColors[i % arcColors.length])
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", (p.name === "Earth") ? null : "10 10")
        .attr("stroke-linecap", "round");
});