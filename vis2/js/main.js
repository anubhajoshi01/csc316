function drawOrbitGraph(svgSelector, csvPath, userConfig = {}) {
    const cfg = {
        width: 1100,
        height: 650,
        margin: { top: 30, right: 30, bottom: 30, left: 80 },
        showLabelsFor: "major", // "major" | "all" | "none"
        curvedLinks: true,
        ...userConfig
    };

    const svg = d3.select(svgSelector)
        .attr("viewBox", [0, 0, cfg.width, cfg.height])
        .attr("font-family", "system-ui, -apple-system, Segoe UI, Roboto, sans-serif");

    svg.selectAll("*").remove();

    const rootG = svg.append("g");

    // Zoom / pan (optional but nice)
    svg.call(
        d3.zoom()
            .scaleExtent([0.6, 3])
            .on("zoom", (event) => rootG.attr("transform", event.transform))
    );

    // Tooltip
    const tip = d3.select("body")
        .append("div")
        .style("position", "fixed")
        .style("pointer-events", "none")
        .style("padding", "8px 10px")
        .style("background", "rgba(0,0,0,0.82)")
        .style("color", "white")
        .style("border-radius", "8px")
        .style("font-size", "12px")
        .style("line-height", "1.3")
        .style("opacity", 0);

    const toNum = (v) => (v == null || v === "" ? null : +v);
    const toBool = (v) => (v === true || v === "true" || v === "TRUE" || v === "1" || v === 1);

    d3.csv(csvPath, (d) => ({
        id: d.eName,
        eName: d.eName,
        isPlanet: toBool(d.isPlanet),
        orbit_type: d.orbit_type, // "Primary" or "Secondary"
        orbits: d.orbits && d.orbits.trim() !== "" ? d.orbits.trim() : null,

        semimajorAxis: toNum(d.semimajorAxis),        // km (for primary: about Sun; for secondary: about parent)
        semimajorAxis_AU: toNum(d.semimajorAxis_AU),  // AU-ish (tiny for moons)

        eccentricity: toNum(d.eccentricity),
        inclination: toNum(d.inclination),
        density: toNum(d.density),
        gravity: toNum(d.gravity),
        escape: toNum(d.escape),
        meanRadius: toNum(d.meanRadius),
        mass_kg: toNum(d.mass_kg),
        discoveryDate: d.discoveryDate || null,
    })).then((rows) => {
        // --- Build nodes + links (Sun is implicit root) ---
        const sunX = cfg.margin.left;
        const sunY = cfg.height / 2;

        const sun = {
            id: "Sun",
            eName: "Sun",
            orbit_type: "Root",
            isPlanet: false,
            parentId: null,
            depth: 0
        };

        // Parent rule:
        // Primary -> Sun
        // Secondary -> d.orbits
        const nodes = [sun, ...rows.map((r) => ({
            ...r,
            parentId: r.orbit_type === "Primary" ? "Sun" : r.orbits,
            depth: r.orbit_type === "Primary" ? 1 : 2
        }))];

        const byId = new Map(nodes.map((n) => [n.id, n]));

        // Filter out links with missing parent nodes (just in case)
        const links = nodes
            .filter((n) => n.id !== "Sun" && n.parentId && byId.has(n.parentId))
            .map((n) => ({
                source: n.id,
                target: n.parentId
            }));

        // Attach parent refs + children counts
        for (const n of nodes) {
            if (n.parentId && byId.has(n.parentId)) n.parent = byId.get(n.parentId);
        }
        const childCount = new Map();
        for (const l of links) {
            childCount.set(l.target, (childCount.get(l.target) || 0) + 1);
        }

        // --- Scales ---
        const prim = nodes.filter((d) => d.orbit_type === "Primary");
        const auVals = prim
            .map((d) => d.semimajorAxis_AU)
            .filter((v) => v != null && isFinite(v) && v > 0);

        // If something is weird with AU, fallback to km
        const useAU = auVals.length >= 5;
        const primaryDistVals = useAU
            ? auVals
            : prim.map(d => d.semimajorAxis).filter(v => v != null && isFinite(v) && v > 0);

        const primaryExtent = d3.extent(primaryDistVals);
        const xPrimary = d3.scaleLog()
            .domain([Math.max(primaryExtent[0] || 1e-6, 1e-6), primaryExtent[1] || 1])
            .range([sunX + 80, cfg.width - cfg.margin.right])
            .clamp(true);

        const sec = nodes.filter((d) => d.orbit_type === "Secondary");
        const satKm = sec
            .map((d) => d.semimajorAxis)
            .filter((v) => v != null && isFinite(v) && v > 0);

        const satExtent = d3.extent(satKm);
        const satDist = d3.scaleSqrt()
            .domain([satExtent[0] || 1, satExtent[1] || 1])
            .range([12, 70])
            .clamp(true);

        // Color by parent (so all moons of Jupiter share a color, etc.)
        const parentKeys = Array.from(new Set(
            nodes.filter(d => d.depth === 1).map(d => d.id)
        ));
        const colorByParent = d3.scaleOrdinal()
            .domain(parentKeys)
            .range(d3.schemeTableau10.concat(d3.schemeSet3 || []));

        function nodeColor(d) {
            if (d.id === "Sun") return "#FDB813"; // sun-ish
            if (d.depth === 1) return colorByParent(d.id); // primary body color = its own key
            // secondary inherits parent's color
            const p = d.parent?.id;
            if (p && d3.schemeTableau10) return colorByParent(p);
            return "#999";
        }

        function nodeRadius(d) {
            if (d.id === "Sun") return 14;
            if (d.isPlanet) return 7;
            if (d.depth === 1) return (childCount.get(d.id) ? 6 : 4);
            return 3.5;
        }

        // --- Initial positions ---
        for (const n of nodes) {
            if (n.id === "Sun") {
                n.x = sunX; n.y = sunY;
                n.fx = sunX; n.fy = sunY; // keep Sun fixed
            } else if (n.depth === 1) {
                const dist = useAU ? n.semimajorAxis_AU : n.semimajorAxis;
                const safe = (dist && dist > 0) ? dist : (useAU ? 1e-6 : 1);
                n.x = xPrimary(safe);
                n.y = sunY + (Math.random() - 0.5) * 250;
            } else {
                // secondary starts near parent
                const p = n.parent;
                const dx = (n.semimajorAxis && n.semimajorAxis > 0) ? satDist(n.semimajorAxis) : 25;
                n.x = (p?.x ?? sunX) + dx;
                n.y = (p?.y ?? sunY) + (Math.random() - 0.5) * 60;
            }
        }

        // --- Draw ---
        const linkG = rootG.append("g").attr("fill", "none").attr("stroke-opacity", 0.55);
        const nodeG = rootG.append("g");
        const labelG = rootG.append("g").attr("pointer-events", "none");

        const linkSel = linkG.selectAll("path")
            .data(links)
            .join("path")
            .attr("stroke", (d) => {
                const s = byId.get(d.source);
                const t = byId.get(d.target);
                // primary-to-sun links slightly darker
                return (t && t.id === "Sun") ? "rgba(60,60,60,0.65)" : "rgba(80,80,80,0.45)";
            })
            .attr("stroke-width", (d) => {
                const t = byId.get(d.target);
                return (t && t.id === "Sun") ? 1.6 : 1.1;
            });

        const nodeSel = nodeG.selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", nodeRadius)
            .attr("fill", nodeColor)
            .attr("stroke", "rgba(0,0,0,0.25)")
            .attr("stroke-width", 1);

        // Labels: major only (Sun + planets + bodies with children) unless config says otherwise
        const shouldLabel = (d) => {
            if (cfg.showLabelsFor === "none") return false;
            if (cfg.showLabelsFor === "all") return d.id !== "Sun"; // include everything but you can change
            // "major"
            return d.id === "Sun" || d.isPlanet || (d.depth === 1 && (childCount.get(d.id) || 0) > 0);
        };

        const labelSel = labelG.selectAll("text")
            .data(nodes.filter(shouldLabel))
            .join("text")
            .attr("font-size", 12)
            .attr("fill", "rgba(20,20,20,0.92)")
            .text(d => d.eName);

        // Drag
        const drag = d3.drag()
            .on("start", (event, d) => {
                if (!event.active) sim.alphaTarget(0.2).restart();
                d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x; d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) sim.alphaTarget(0);
                if (d.id !== "Sun") { d.fx = null; d.fy = null; } // let it relax back
            });

        nodeSel.call(drag);

        // Tooltip + highlighting
        function fmt(v) { return (v == null || !isFinite(v)) ? "—" : v; }

        nodeSel
            .on("mouseenter", (event, d) => {
                // highlight connected links
                linkSel.attr("stroke-opacity", (l) =>
                    (l.source === d.id || l.target === d.id) ? 0.95 : 0.18
                );
                nodeSel.attr("opacity", (n) => (n.id === d.id || n.id === d.parentId) ? 1 : 0.65);

                tip.style("opacity", 1).html(`
          <div style="font-weight:700; margin-bottom:4px;">${d.eName}</div>
          <div>orbit_type: <b>${d.orbit_type}</b></div>
          <div>orbits: <b>${d.parentId || "—"}</b></div>
          <div style="margin-top:6px;">
            <div>semimajorAxis (km): <b>${fmt(d.semimajorAxis)}</b></div>
            <div>semimajorAxis (AU): <b>${fmt(d.semimajorAxis_AU)}</b></div>
            <div>eccentricity: <b>${fmt(d.eccentricity)}</b></div>
          </div>
        `);
            })
            .on("mousemove", (event) => {
                tip.style("left", (event.clientX + 12) + "px")
                    .style("top", (event.clientY + 12) + "px");
            })
            .on("mouseleave", () => {
                linkSel.attr("stroke-opacity", 0.55);
                nodeSel.attr("opacity", 1);
                tip.style("opacity", 0);
            });

        // Link path (curved like your sketch)
        function linkPath(d) {
            const s = d.source, t = d.target;
            const sx = s.x, sy = s.y, tx = t.x, ty = t.y;

            if (!cfg.curvedLinks) return `M${tx},${ty}L${sx},${sy}`;

            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2;

            const dx = sx - tx;
            const dy = sy - ty;
            const dist = Math.hypot(dx, dy) || 1;

            // Perpendicular offset for arc
            const nx = -dy / dist;
            const ny = dx / dist;

            // Primary arcs larger
            const isPrimaryLink = (t.id === "Sun");
            const base = isPrimaryLink ? 0.28 : 0.18;
            const offset = dist * base;

            // Flip arc direction based on whether source is above/below sun
            const sign = (sy >= sunY) ? 1 : -1;

            const cx = mx + nx * offset * sign;
            const cy = my + ny * offset * sign;

            return `M${tx},${ty}Q${cx},${cy}${sx},${sy}`;
        }

        // --- Simulation ---
        // Link distances:
        // - primary: match x distance from Sun based on semimajor axis
        // - secondary: short branch around parent based on semimajorAxis km
        const simLinks = links.map(l => ({
            source: byId.get(l.source),
            target: byId.get(l.target)
        }));

        const linkForce = d3.forceLink(simLinks)
            .id(d => d.id)
            .distance((l) => {
                const s = l.source;
                const t = l.target;

                if (t.id === "Sun") {
                    const dist = useAU ? s.semimajorAxis_AU : s.semimajorAxis;
                    const safe = (dist && dist > 0) ? dist : (useAU ? 1e-6 : 1);
                    return Math.max(30, xPrimary(safe) - sunX);
                } else {
                    const km = s.semimajorAxis;
                    return (km && km > 0) ? satDist(km) : 25;
                }
            })
            .strength((l) => (l.target.id === "Sun" ? 0.25 : 0.55));

        // ForceX: primaries pulled to their x-by-distance; secondaries pulled near parent x
        const fx = d3.forceX((d) => {
            if (d.id === "Sun") return sunX;

            if (d.depth === 1) {
                const dist = useAU ? d.semimajorAxis_AU : d.semimajorAxis;
                const safe = (dist && dist > 0) ? dist : (useAU ? 1e-6 : 1);
                return xPrimary(safe);
            }

            // secondary follows parent
            const p = d.parent;
            const bump = (d.semimajorAxis && d.semimajorAxis > 0) ? satDist(d.semimajorAxis) * 0.25 : 12;
            return (p ? p.x : sunX) + bump;
        }).strength((d) => (d.depth === 1 ? 0.18 : 0.35));

        // ForceY: keep roughly centered; secondaries pulled closer to parent’s y
        const fy = d3.forceY((d) => {
            if (d.id === "Sun") return sunY;
            if (d.depth === 2 && d.parent) return d.parent.y;
            return sunY;
        }).strength((d) => (d.depth === 2 ? 0.25 : 0.06));

        const sim = d3.forceSimulation(nodes)
            .force("link", linkForce)
            .force("x", fx)
            .force("y", fy)
            .force("charge", d3.forceManyBody().strength(-70))
            .force("collide", d3.forceCollide().radius(d => nodeRadius(d) + 2))
            .alpha(1)
            .alphaDecay(0.04)
            .on("tick", ticked);

        function ticked() {
            // Keep things inside bounds a bit
            for (const n of nodes) {
                if (n.id === "Sun") continue;
                n.x = Math.max(cfg.margin.left, Math.min(cfg.width - cfg.margin.right, n.x));
                n.y = Math.max(cfg.margin.top, Math.min(cfg.height - cfg.margin.bottom, n.y));
            }

            linkSel.attr("d", (d) => {
                // d.source/d.target are still ids in our original array, so map them
                const s = byId.get(d.source);
                const t = byId.get(d.target);
                return linkPath({ source: s, target: t });
            });

            nodeSel.attr("cx", d => d.x).attr("cy", d => d.y);

            labelSel
                .attr("x", d => d.x + nodeRadius(d) + 5)
                .attr("y", d => d.y + 4);
        }
    });
}
