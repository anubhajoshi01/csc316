const DATA_PATH = "./data/sol_data.csv";

const fmtSci = d3.format(".3~s");
const fmtRatio = (x) => {
    if (!isFinite(x)) return "—";
    if (x >= 1000) return d3.format(".2~s")(x) + "×";
    if (x >= 10) return d3.format(".1f")(x) + "×";
    return d3.format(".2f")(x) + "×";
};

const planetsOnly = d3.select("#planetsOnly");

let all = [];
let AName = "";

function isTrue(v){ return String(v).toLowerCase() === "true"; }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

function angleFromRatio(r){
    if (!isFinite(r) || r <= 0) return 0;
    return clamp(-Math.log10(r) * 14, -24, 24);
}

function makeDropdown(containerId, onChange){
    const root = d3.select(containerId);
    root.selectAll("*").remove();

    const btn = root.append("button")
        .attr("class", "dd-btn")
        .attr("type", "button");

    const label = btn.append("span").attr("class", "label").text("—");
    btn.append("span").attr("class", "muted").text("▼");

    const menu = root.append("div").attr("class", "dd-menu");

    function setItems(items, selected){
        menu.selectAll("*").remove();
        items.forEach(d => {
            menu.append("div")
                .attr("class", "dd-item" + (d.eName === selected ? " active" : ""))
                .text(d.eName)
                .on("click", (event) => {
                    event.stopPropagation();
                    label.text(d.eName);
                    menu.classed("open", false);
                    onChange(d.eName);
                });
        });
        label.text(selected || "—");
    }

    btn.on("click", (event) => {
        event.stopPropagation();
        menu.classed("open", !menu.classed("open"));
    });

    document.addEventListener("click", () => menu.classed("open", false));
    return { setItems };
}

let leftBall, rightBall, leftPanG, rightPanG;

function drawScale(){
    const svg = d3.select("#vis");
    const W = svg.node().getBoundingClientRect().width;
    const H = +svg.attr("height");
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    svg.selectAll("*").remove();

    const cx = W/2;
    const pivotY = 170;
    const beamLen = Math.min(520, W*0.86);

    svg.append("circle")
        .attr("cx", cx).attr("cy", pivotY)
        .attr("r", 10)
        .attr("fill", "#0c1322")
        .attr("stroke", "#2a3550")
        .attr("stroke-width", 2);

    svg.append("path")
        .attr("d", `M ${cx-90} ${pivotY+160} L ${cx+90} ${pivotY+160} L ${cx+52} ${pivotY+86} L ${cx-52} ${pivotY+86} Z`)
        .attr("fill", "#0c1322")
        .attr("stroke", "#2a3550")
        .attr("stroke-width", 2);

    const beamG = svg.append("g")
        .attr("id", "beamG")
        .datum({ cx, pivotY })
        .attr("transform", `translate(${cx},${pivotY}) rotate(0)`);

    beamG.append("line")
        .attr("x1", -beamLen/2).attr("x2", beamLen/2)
        .attr("y1", 0).attr("y2", 0)
        .attr("stroke", "#c7d2fe")
        .attr("stroke-width", 6)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.9);

    const leftX = -beamLen/2 + 46;
    const rightX = beamLen/2 - 46;

    beamG.append("line")
        .attr("x1", leftX).attr("x2", leftX)
        .attr("y1", 0).attr("y2", 86)
        .attr("stroke", "#94a3b8").attr("stroke-width", 3);

    beamG.append("line")
        .attr("x1", rightX).attr("x2", rightX)
        .attr("y1", 0).attr("y2", 86)
        .attr("stroke", "#94a3b8").attr("stroke-width", 3);

    leftPanG = beamG.append("g").attr("id", "leftPanG").attr("transform", `translate(${leftX},86) rotate(0)`);
    rightPanG = beamG.append("g").attr("id", "rightPanG").attr("transform", `translate(${rightX},86) rotate(0)`);

    function pan(panG, color){
        panG.append("path")
            .attr("d", `M -60 0 L 60 0 L 44 18 L -44 18 Z`)
            .attr("fill", "#0c1322")
            .attr("stroke", "#2a3550")
            .attr("stroke-width", 2);

        const ball = panG.append("circle")
            .attr("cx", 0).attr("cy", -20)
            .attr("r", 18)
            .attr("fill", color)
            .attr("opacity", 0.25);

        panG.append("text")
            .attr("class", "panLabel")
            .attr("text-anchor", "middle")
            .attr("x", 0).attr("y", 40)
            .attr("fill", "#cbd5e1")
            .attr("font-size", 12)
            .attr("font-weight", 800);

        return ball;
    }

    leftBall = pan(leftPanG, "var(--a)");
    rightBall = pan(rightPanG, "var(--b)");
}

function setPanRotation(panSel, deg){
    const pan = d3.select(panSel);
    const base = pan.attr("data-base") || pan.attr("transform");
    if (!pan.attr("data-base")) pan.attr("data-base", base.replace(/rotate\([^)]+\)/, "rotate(0)"));
    pan.attr("transform", pan.attr("data-base").replace(/rotate\([^)]+\)/, `rotate(${deg})`));
}

function computePools(){
    const sun = all.find(d => d.eName === "Sun");

    const planets = all.filter(d => d.isPlanet);
    const nonSunAll = all.filter(d => d.eName !== "Sun");

    const basePool = planetsOnly.property("checked") ? planets : nonSunAll;

    const A = all.find(d => d.eName === AName);
    const AVol = A ? A.volume : NaN;

    let othersLabel = "All others (excluding Sun)";
    let othersPool = basePool.filter(d => d.eName !== "Sun" && d.eName !== AName);

    if (AName === "Sun"){
        othersLabel = "All planets (excluding Sun)";
        othersPool = planets.filter(d => d.eName !== "Sun");
    }

    const othersVol = d3.sum(othersPool, d => d.volume);

    return { A, AVol, othersVol, othersLabel, othersPool };
}

function update(){
    const { AVol, othersVol, othersLabel, othersPool } = computePools();

    document.getElementById("bLabel").textContent = othersLabel;

    const ratio = AVol / othersVol;
    const ang = angleFromRatio(ratio);

    document.getElementById("kpiRatio").textContent = (isFinite(ratio) && othersVol > 0) ? fmtRatio(ratio) : "—";
    document.getElementById("kpiA").textContent = isFinite(AVol) ? fmtSci(AVol) : "—";
    document.getElementById("kpiB").textContent = (isFinite(othersVol) && othersVol > 0) ? fmtSci(othersVol) : "—";

    d3.select("#leftPanG").select("text.panLabel").text(AName || "—");
    d3.select("#rightPanG").select("text.panLabel").text("Others");

    const volList = all.filter(d => d.eName !== "Sun").map(d => d.volume);
    const vMin = d3.min(volList), vMax = d3.max(volList);

    const rScale = d3.scaleSqrt()
        .domain([Math.cbrt(vMin), Math.cbrt(vMax)])
        .range([10, 34]);

    if (leftBall && isFinite(AVol)){
        const aForSize = (AName === "Sun" && isFinite(AVol)) ? vMax : AVol;
        leftBall.transition().duration(350).attr("r", rScale(Math.cbrt(aForSize)));
    }
    if (rightBall && isFinite(othersVol) && othersVol > 0){
        rightBall.transition().duration(350).attr("r", rScale(Math.cbrt(othersVol)));
    }

    const beamG = d3.select("#beamG");
    const meta = beamG.datum();
    beamG.transition().duration(450)
        .attr("transform", `translate(${meta.cx},${meta.pivotY}) rotate(${ang})`);

    setPanRotation("#leftPanG", -ang);
    setPanRotation("#rightPanG", -ang);
}

function rebuild(ddA){
    const planets = all.filter(d => d.isPlanet);
    const base = planetsOnly.property("checked") ? planets : all;

    const sun = all.find(d => d.eName === "Sun");
    let list = base.slice();
    if (sun && !list.some(d => d.eName === "Sun")) list = [sun, ...list];

    list.sort((a,b) => d3.descending(a.volume, b.volume));

    if (!list.some(d => d.eName === AName)){
        AName = list.some(d => d.eName === "Jupiter") ? "Jupiter" : list[0].eName;
    }

    ddA.setItems(list, AName);
    update();
}

d3.csv(DATA_PATH).then(rows => {
    all = rows.map(d => ({
        eName: d.eName,
        isPlanet: isTrue(d.isPlanet),
        volume: +d.volume
    })).filter(d => d.eName && isFinite(d.volume) && d.volume > 0);

    all.sort((a,b) => d3.descending(a.volume, b.volume));

    AName = all.some(d => d.eName === "Jupiter") ? "Jupiter" : all[0].eName;

    drawScale();

    const ddA = makeDropdown("#ddA", (name) => { AName = name; update(); });

    rebuild(ddA);
    planetsOnly.on("change", () => rebuild(ddA));

    window.addEventListener("resize", () => {
        drawScale();
        update();
    });
}).catch(err => {
    console.error(err);
    alert("CSV load failed. Put sol_data.csv in data/ and run a local server.");
});
