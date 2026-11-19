/*
 * Turns the entries of a month's page into a logbook, with one open spread per day.
 *
 * Each entry in the page's HTML is an <article class="entry"> with the day as its id and the full
 * date in data-date. The script splits each entry into two facing pages. The left page shows the
 * entry's text. The right page shows the entry's <figure>, if it has one, with that day's commits
 * beneath it. An entry with a data-title in place of a date, as in the prelude, has no day to show
 * commits for, so its text runs across both pages instead.
 *
 * The spreads sit side by side in one strip that scrolls sideways and snaps to a whole spread.
 * The reader turns a page by swiping, scrolling sideways, pressing the arrow keys, or clicking the
 * arrow buttons. The address follows the open day, as in 2026-11.html#12, so that a link can open
 * the logbook on that day.
 */
(() => {
    const book = document.querySelector(".logbook");
    if (!book) {
        return;
    }

    const commitsByDay = window.SARX_COMMITS?.[book.dataset.month] ?? {};
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

    // Reads an ISO date such as "2026-11-12" as midnight UTC, so that no time zone shifts the day
    function readDate(iso) {
        return new Date(`${iso}T00:00:00Z`);
    }

    // Builds the right page's list of the commits made on one day
    function buildCommitList(iso) {
        const section = document.createElement("section");
        section.className = "commits";

        const heading = document.createElement("h3");
        heading.textContent = `Commits on ${shortDate.format(readDate(iso))}`;
        section.append(heading);

        const commits = commitsByDay[iso] ?? [];
        if (commits.length === 0) {
            const empty = document.createElement("p");
            empty.className = "commits-empty";
            empty.textContent = "No commits on this day.";
            section.append(empty);
            return section;
        }

        const list = document.createElement("ol");
        for (const commit of commits) {
            const item = document.createElement("li");
            if (commit.agent) {
                item.classList.add("is-agent");
            }

            const hash = document.createElement("code");
            hash.className = "commit-hash";
            hash.textContent = commit.hash;

            const kind = document.createElement("span");
            kind.className = "commit-kind";
            kind.textContent = commit.scope ? `${commit.type} ${commit.scope}` : commit.type;

            const description = document.createElement("span");
            description.className = "commit-description";
            description.textContent = commit.description;

            item.append(hash, kind, description);
            if (commit.agent) {
                const agent = document.createElement("span");
                agent.className = "commit-agent";
                agent.textContent = "by Claude";
                item.append(agent);
            }
            list.append(item);
        }
        section.append(list);
        return section;
    }

    // Lays out an undated entry, such as one in the prelude, as one text that runs across both pages
    function buildFlowingSpread(entry) {
        const title = document.createElement("h2");
        title.className = "entry-date";
        title.textContent = entry.dataset.title;

        const flow = document.createElement("div");
        flow.className = "page page-flow";
        flow.append(title, ...entry.childNodes);

        entry.classList.add("spread", "spread-flowing");
        entry.setAttribute("aria-label", entry.dataset.title);
        entry.replaceChildren(flow);
        return entry;
    }

    // Splits one entry into its two facing pages, keeping the entry element and its id
    function buildSpread(entry) {
        const iso = entry.dataset.date;
        if (!iso) {
            return buildFlowingSpread(entry);
        }
        const figure = entry.querySelector(":scope > figure");
        if (figure) {
            figure.remove();
        }

        const date = document.createElement("h2");
        date.className = "entry-date";
        const time = document.createElement("time");
        time.dateTime = iso;
        time.textContent = longDate.format(readDate(iso));
        date.append(time);

        const left = document.createElement("div");
        left.className = "page page-left";
        left.append(date, ...entry.childNodes);

        const right = document.createElement("div");
        right.className = "page page-right";
        if (figure) {
            right.append(figure);
        }
        right.append(buildCommitList(iso));

        entry.classList.add("spread");
        entry.setAttribute("aria-label", time.textContent);
        entry.replaceChildren(left, right);
        return entry;
    }

    const entries = [...book.querySelectorAll(":scope > .entry")];
    if (entries.length === 0) {
        return;
    }

    const strip = document.createElement("div");
    strip.className = "strip";
    strip.tabIndex = 0;
    strip.setAttribute("aria-label", "Entries, one day per spread");
    strip.append(...entries.map(buildSpread));
    book.replaceChildren(strip);

    // Builds the arrow buttons, the dots and the counter that sit beneath the book
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "turn turn-previous";
    previous.setAttribute("aria-label", "Previous day");
    previous.textContent = "‹";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "turn turn-next";
    next.setAttribute("aria-label", "Next day");
    next.textContent = "›";

    const dots = document.createElement("div");
    dots.className = "dots";
    const dotButtons = entries.map((entry, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot";
        dot.setAttribute("aria-label", entry.getAttribute("aria-label"));
        dot.addEventListener("click", () => turnTo(index));
        dots.append(dot);
        return dot;
    });

    const counter = document.createElement("p");
    counter.className = "counter";
    counter.setAttribute("aria-live", "polite");

    const controls = document.createElement("div");
    controls.className = "controls";
    controls.append(previous, dots, counter, next);
    book.after(controls);

    let current = -1;

    // Marks the spread at the index as open: sizes the strip to it, and updates the controls and the address
    function showSpread(index) {
        if (index === current) {
            return;
        }
        current = index;
        strip.style.height = `${entries[index].getBoundingClientRect().height}px`;
        previous.disabled = index === 0;
        next.disabled = index === entries.length - 1;
        dotButtons.forEach((dot, dotIndex) => dot.setAttribute("aria-current", String(dotIndex === index)));
        counter.textContent = `${index + 1} of ${entries.length}`;
        history.replaceState(null, "", `#${entries[index].id}`);
    }

    // Scrolls the strip to the spread at the index, sliding unless the reader prefers less motion
    function turnTo(index) {
        const clamped = Math.min(Math.max(index, 0), entries.length - 1);
        const behavior = reducedMotion.matches ? "auto" : "smooth";
        strip.scrollTo({ left: clamped * strip.clientWidth, behavior });
        showSpread(clamped);
    }

    // Works out which spread the strip shows after the reader scrolls or swipes it
    function readScrolledIndex() {
        return Math.round(strip.scrollLeft / strip.clientWidth);
    }

    // Returns the index of the spread whose day the address names, or the first spread
    function findLinkedIndex() {
        const day = decodeURIComponent(location.hash.slice(1));
        const index = entries.findIndex((entry) => entry.id === day);
        return index === -1 ? 0 : index;
    }

    let scrollFrame = 0;
    strip.addEventListener("scroll", () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => showSpread(readScrolledIndex()));
    });

    previous.addEventListener("click", () => turnTo(current - 1));
    next.addEventListener("click", () => turnTo(current + 1));

    // Turns the page with the arrow keys, unless the reader is typing or holding a modifier
    document.addEventListener("keydown", (event) => {
        const typing = event.target.closest?.("input, textarea, select, [contenteditable]");
        if (typing || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            turnTo(current - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            turnTo(current + 1);
        }
    });

    // Keeps the open spread in place when the window changes size, since each spread is one strip wide
    window.addEventListener("resize", () => {
        const index = current;
        current = -1;
        strip.scrollLeft = index * strip.clientWidth;
        showSpread(index);
    });

    window.addEventListener("hashchange", () => turnTo(findLinkedIndex()));

    // Resizes the strip whenever the open spread changes height, as it does once the fonts load
    const spreadSizes = new ResizeObserver(() => {
        if (current >= 0) {
            strip.style.height = `${entries[current].getBoundingClientRect().height}px`;
        }
    });
    entries.forEach((entry) => spreadSizes.observe(entry));

    const start = findLinkedIndex();
    strip.scrollLeft = start * strip.clientWidth;
    showSpread(start);
})();
