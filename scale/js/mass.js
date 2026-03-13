const DATA_PATH = "data/sol_data.csv";

const svg = d3.select("#vis");
const width = 960;
const height = 520;
svg.attr("viewBox", `0 0 ${width} ${height}`);

const beamY = 230;
const pivotX = width / 2;
const pivotY = beamY + 20;
const beamHalf = 290;

const colorA = "#7dd3fc";
const colorB = "#c4b5fd";

let rawData = [];
let selectableBodies = [];
let selectedA = null;
let earthBody = null;

let numA = 1;
let numB = 1;

const ddA = d3.select("#ddA");

function normalizeName(name) {
    return String(name || "").trim().toLowerCase();
}

function parseMass(value) {
    const n = +value;
    return Number.isFinite(n) ? n : 0;
}

function getName(d) {
    return d.eName || d.name || d.planet || d.body || d.Body || "Unknown";
}

function getMass(d) {
    return parseMass(
        d.mass_kg ??
        d.mass ??
        d.Mass ??
        d.masskg ??
        d["mass (kg)"] ??
        d["Mass (kg)"]
    );
}

function isSelectablePlanet(d) {
    const name = normalizeName(getName(d));
    console.log("name", name)
    if (name === "sun") return false;

    return (
        [
            "mercury",
            "venus",
            "earth",
            "mars",
            "jupiter",
            "saturn",
            "uranus",
            "neptune",
            "pluto"
        ].includes(name)
    );
}

function formatMass(m) {
    if (!Number.isFinite(m)) return "—";

    if (m >= 1e24) return d3.format(".2f")(m / 1e24) + " × 10²⁴ kg";
    if (m >= 1e21) return d3.format(".2f")(m / 1e21) + " × 10²¹ kg";
    if (m >= 1e18) return d3.format(".2f")(m / 1e18) + " × 10¹⁸ kg";

    return d3.format(",.0f")(m) + " kg";
}

function formatRatio(r) {
    if (!Number.isFinite(r)) return "—";
    return d3.format(".3f")(r) + "×";
}

// add listener for numbers of bodies
d3.select("#scale-go-button").on("click", function(event) {
    let numBodies = d3.select("#num-bodies").node().value;
    let numEarths = d3.select("#num-earths").node().value;
    console.log(numBodies, numEarths);
    updateAll();
})

// num planets
d3.select("#planet-1").on("click", function(event) {
    numA = numA + 1;
    updateAll();
})

d3.select("#planet-10").on("click", function(event) {
    numA = numA + 10;
    updateAll();
})

d3.select("#planet-100").on("click", function(event) {
    numA = numA + 100;
    updateAll();
})

// earths
d3.select("#earth-1").on("click", function(event) {
    numB = numB + 1;
    updateAll();
})

d3.select("#earth-10").on("click", function(event) {
    numB = numB + 10;
    updateAll();
})

d3.select("#earth-100").on("click", function(event) {
    numB = numB + 100;
    updateAll();
})

// clear button
d3.select("#clear-all-scale").on("click", function(event) {
    numA = 1;
    numB = 1;
    updateAll();
})

function buildDropdown(items) {
    ddA.html("");

    const wrapper = ddA.append("div").attr("class", "dd-wrap");

    const button = wrapper
        .append("button")
        .attr("class", "dd-btn")
        .attr("type", "button");

    const labelSpan = button.append("span");
    button.append("span").text("▾");

    const menu = wrapper.append("div").attr("class", "dd-menu");

    function refreshButton() {
        labelSpan.text(selectedA ? getName(selectedA) : "Select a planet");
    }

    function refreshMenu() {
        const itemsSel = menu.selectAll(".dd-item")
            .data(items, d => getName(d));

        itemsSel.enter()
            .append("div")
            .attr("class", "dd-item")
            .merge(itemsSel)
            .classed("active", d => selectedA && getName(d) === getName(selectedA))
            .text(d => getName(d))
            .on("click", function(_, d) {
                selectedA = d;
                console.log(selectedA)
                numA = 1;
                numB = 1;
                d3.select("#add-planet-text")
                    .text(`Add ${selectedA.eName}${selectedA.eName.slice(-1) === 's' ? 'e' : ''}s`)
                console.log("called function a", d)
                menu.classed("open", false);
                refreshButton();
                refreshMenu();
                updateAll();
            });

        itemsSel.exit().remove();
    }

    button.on("click", function(event) {
        event.stopPropagation();
        menu.classed("open", !menu.classed("open"));
    });

    d3.select(window).on("click.dropdown-close", function(event) {
        if (!wrapper.node().contains(event.target)) {
            menu.classed("open", false);
        }
    });

    refreshButton();
    refreshMenu();
}

function setAttrs(selection, attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
        selection.attr(key, value);
    });
}

function drawScale() {
    const g = svg.selectAll(".scale-group")
        .data([null])
        .join("g")
        .attr("class", "scale-group");

    const massA = getMass(selectedA);
    const massB = getMass(earthBody);

    // get number of each body set by the user
    // const numA = d3.select("#num-bodies").node().value;
    // const numB = d3.select("#num-earths").node().value;  

    // gotta have somethign where the sign depends on which is bigger or something. 
    const ratio = massB === 0 ? 1 : (massA * numA) / (massB * numB);

    // let addY = 300 * (ratio < 1 ? ratio : - 1 / ratio);

    const tilt = Math.max(-75, Math.min(75, Math.log10(Math.max(ratio, 1e-6)) * 24)) / 75;

    // console.log(theta)

    // // sin function for nicer scaling
    // const addY = Math.max(Math.min(Math.sin(theta) * 300, 170), -170)
    const addY = Math.max(Math.min(tilt * 300, 170), -170)
    // const addY = theta * 300
    console.log(addY)

    const leftY = beamY + addY;
    const rightY = beamY - addY;

    const leftPanX = pivotX - beamHalf + 60;
    const rightPanX = pivotX + beamHalf - 60;

    const rA = Math.max(14, Math.min(42, 14 + Math.log10(Math.max(massA, 1)) * 1.25));
    const rB = Math.max(14, Math.min(42, 14 + Math.log10(Math.max(massB, 1)) * 1.25));

    const duration = 800;
    const ease = d3.easeCubicInOut;

    const beamAttrs = {
        x1: pivotX - beamHalf,
        y1: leftY,
        x2: pivotX + beamHalf,
        y2: rightY
    };

    const leftHookAttrs = {
        x1: leftPanX,
        y1: leftY,
        x2: leftPanX,
        y2: leftY + 55
    };

    const rightHookAttrs = {
        x1: rightPanX,
        y1: rightY,
        x2: rightPanX,
        y2: rightY + 55
    };

    const leftPanAttrs = {
        cx: leftPanX,
        cy: leftY + 68,
        rx: 72,
        ry: 12
    };

    const rightPanAttrs = {
        cx: rightPanX,
        cy: rightY + 68,
        rx: 72,
        ry: 12
    };

    const leftBallAttrs = {
        cx: leftPanX,
        cy: leftY + 40,
        r: rA
    };

    const rightBallAttrs = {
        cx: rightPanX,
        cy: rightY + 40,
        r: rB
    };

    const leftLabelAttrs = {
        x: leftPanX,
        y: leftY + 115
    };

    const rightLabelAttrs = {
        x: rightPanX,
        y: rightY + 115
    };

    const beam = g.selectAll(".beam")
        .data([null])
        .join("line")
        .attr("class", "beam")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 6)
        .attr("stroke-linecap", "round");

    const beamExists = beam.attr("x1") !== null && beam.attr("x1") !== "";

    if (!beamExists) {
        setAttrs(beam, beamAttrs);
    } else {
        beam.transition()
            .duration(duration)
            .ease(ease)
            .attr("x1", beamAttrs.x1)
            .attr("y1", beamAttrs.y1)
            .attr("x2", beamAttrs.x2)
            .attr("y2", beamAttrs.y2);
    }

    g.selectAll(".pivot-base")
        .data([null])
        .join("polygon")
        .attr("class", "pivot-base")
        .attr("points", `${pivotX - 50},${pivotY + 95} ${pivotX + 50},${pivotY + 95} ${pivotX},${pivotY}`)
        .attr("fill", "#8796b0")
        .attr("opacity", 0.9);

    g.selectAll(".pivot-dot")
        .data([null])
        .join("circle")
        .attr("class", "pivot-dot")
        .attr("cx", pivotX)
        .attr("cy", pivotY)
        .attr("r", 8)
        .attr("fill", "#ffffff");

    const leftHook = g.selectAll(".left-hook")
        .data([null])
        .join("line")
        .attr("class", "left-hook")
        .attr("stroke", "#cde1ff")
        .attr("stroke-width", 2);

    const rightHook = g.selectAll(".right-hook")
        .data([null])
        .join("line")
        .attr("class", "right-hook")
        .attr("stroke", "#cde1ff")
        .attr("stroke-width", 2);

    const leftPan = g.selectAll(".left-pan")
        .data([null])
        .join("ellipse")
        .attr("class", "left-pan")
        .attr("fill", "none")
        .attr("stroke", colorA)
        .attr("stroke-width", 3);

    const rightPan = g.selectAll(".right-pan")
        .data([null])
        .join("ellipse")
        .attr("class", "right-pan")
        .attr("fill", "none")
        .attr("stroke", colorB)
        .attr("stroke-width", 3);

    const leftBall = g.selectAll(".left-ball")
        .data([null])
        .join("circle")
        .attr("class", "left-ball")
        .attr("fill", colorA)
        .attr("opacity", 0.9);

    const rightBall = g.selectAll(".right-ball")
        .data([null])
        .join("circle")
        .attr("class", "right-ball")
        .attr("fill", colorB)
        .attr("opacity", 0.9);

    const leftLabel = g.selectAll(".left-label")
        .data([null])
        .join("text")
        .attr("class", "left-label")
        .attr("text-anchor", "middle")
        .style("font-size", "14px");

    const rightLabel = g.selectAll(".right-label")
        .data([null])
        .join("text")
        .attr("class", "right-label")
        .attr("text-anchor", "middle")
        .style("font-size", "14px");

    if (!beamExists) {
        setAttrs(leftHook, leftHookAttrs);
        setAttrs(rightHook, rightHookAttrs);
        setAttrs(leftPan, leftPanAttrs);
        setAttrs(rightPan, rightPanAttrs);
        setAttrs(leftBall, leftBallAttrs);
        setAttrs(rightBall, rightBallAttrs);
        setAttrs(leftLabel, leftLabelAttrs);
        setAttrs(rightLabel, rightLabelAttrs);
    } else {
        leftHook.transition()
            .duration(duration)
            .ease(ease)
            .attr("x1", leftHookAttrs.x1)
            .attr("y1", leftHookAttrs.y1)
            .attr("x2", leftHookAttrs.x2)
            .attr("y2", leftHookAttrs.y2);

        rightHook.transition()
            .duration(duration)
            .ease(ease)
            .attr("x1", rightHookAttrs.x1)
            .attr("y1", rightHookAttrs.y1)
            .attr("x2", rightHookAttrs.x2)
            .attr("y2", rightHookAttrs.y2);

        leftPan.transition()
            .duration(duration)
            .ease(ease)
            .attr("cx", leftPanAttrs.cx)
            .attr("cy", leftPanAttrs.cy)
            .attr("rx", leftPanAttrs.rx)
            .attr("ry", leftPanAttrs.ry);

        rightPan.transition()
            .duration(duration)
            .ease(ease)
            .attr("cx", rightPanAttrs.cx)
            .attr("cy", rightPanAttrs.cy)
            .attr("rx", rightPanAttrs.rx)
            .attr("ry", rightPanAttrs.ry);

        leftBall.transition()
            .duration(duration)
            .ease(ease)
            .attr("cx", leftBallAttrs.cx)
            .attr("cy", leftBallAttrs.cy)
            .attr("r", leftBallAttrs.r);

        rightBall.transition()
            .duration(duration)
            .ease(ease)
            .attr("cx", rightBallAttrs.cx)
            .attr("cy", rightBallAttrs.cy)
            .attr("r", rightBallAttrs.r);

        leftLabel.transition()
            .duration(duration)
            .ease(ease)
            .attr("x", leftLabelAttrs.x)
            .attr("y", leftLabelAttrs.y);

        rightLabel.transition()
            .duration(duration)
            .ease(ease)
            .attr("x", rightLabelAttrs.x)
            .attr("y", rightLabelAttrs.y);
    }
    leftLabel.text(`${numA} ${getName(selectedA)}${
        numA > 1 ? `${selectedA.eName.slice(-1) === 's' ? 'es' : 's'}`: ''
    }`);
    rightLabel.text(`${numB} Earth${numB > 1 ? 's': ''}`);
}

function updateAll() {
    drawScale();
}

d3.csv(DATA_PATH, d => ({
    ...d,
    isPlanet: d.isPlanet === "true" || d.isPlanet === "TRUE" || d.isPlanet === true,
    mass_kg: +d.mass_kg
})).then(data => {
    rawData = data;

    selectableBodies = rawData.filter(d => isSelectablePlanet(d) && getMass(d) > 0);

    earthBody = selectableBodies.find(d => normalizeName(getName(d)) === "earth")
        || rawData.find(d => normalizeName(getName(d)) === "earth");

    if (!earthBody) {
        alert("Earth not found in CSV.");
        return;
    }

    selectableBodies.sort((a, b) => d3.ascending(getName(a), getName(b)));

    selectedA = selectableBodies.find(d => normalizeName(getName(d)) === "jupiter") || earthBody;

    buildDropdown(selectableBodies);
    updateAll();
}).catch(err => {
    console.error(err);
    alert("CSV load failed. Check that data/sol_data.csv exists.");
});