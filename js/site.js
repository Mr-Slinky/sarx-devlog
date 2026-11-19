/*
 * Builds the parts of every page that come from the list of months in data/months.js: the sidebar
 * on a month's page, and the list of months on the front page. Keeping one list means that a new
 * month is added in one place, and every page picks it up.
 */
(() => {
    const months = window.SARX_MONTHS ?? [];
    const root = document.body.dataset.root ?? "";
    const currentMonth = document.body.dataset.month;
    const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

    // Splits a month id such as "2026-11" into its year and the name of its month
    function readMonth(id) {
        const [year, month] = id.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, 1));
        return { id, year, name: monthName.format(date) };
    }

    // Groups the months under their years, keeping the order of the list, newest first
    function groupByYear() {
        const years = new Map();
        for (const month of months.map(readMonth)) {
            if (!years.has(month.year)) {
                years.set(month.year, []);
            }
            years.get(month.year).push(month);
        }
        return years;
    }

    // The prelude comes before the first month, and holds the diary's undated sections
    const PRELUDE = { id: "prelude", year: null, name: "Prelude" };

    // Builds the link to one month's page, marked as the current page where it is one
    function buildMonthLink(month, label) {
        const link = document.createElement("a");
        link.href = `${root}log/${month.id}.html`;
        link.textContent = label;
        if (month.id === currentMonth) {
            link.setAttribute("aria-current", "page");
        }
        return link;
    }

    // Fills the sidebar with each year, and the months of that year beneath it
    function buildSidebar(sidebar) {
        const home = document.createElement("a");
        home.className = "sidebar-home";
        home.href = `${root}index.html`;
        home.textContent = "Sarx Devlog";

        const toggle = document.createElement("button");
        toggle.className = "sidebar-toggle";
        toggle.type = "button";
        toggle.textContent = "Months";
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", "sidebar-years");
        toggle.addEventListener("click", () => {
            const open = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!open));
            sidebar.classList.toggle("is-open", !open);
        });

        const list = document.createElement("div");
        list.className = "sidebar-years";
        list.id = "sidebar-years";

        const prelude = buildMonthLink(PRELUDE, PRELUDE.name);
        prelude.className = "sidebar-prelude";
        list.append(prelude);

        const years = groupByYear();
        const onMonthPage = currentMonth && currentMonth !== PRELUDE.id;
        const currentYear = onMonthPage ? readMonth(currentMonth).year : [...years.keys()][0];
        for (const [year, yearMonths] of years) {
            const details = document.createElement("details");
            details.open = year === currentYear;
            const summary = document.createElement("summary");
            summary.textContent = String(year);
            const monthList = document.createElement("ul");
            for (const month of yearMonths) {
                const item = document.createElement("li");
                item.append(buildMonthLink(month, month.name));
                monthList.append(item);
            }
            details.append(summary, monthList);
            list.append(details);
        }

        const header = document.createElement("div");
        header.className = "sidebar-header";
        header.append(home, toggle);
        sidebar.replaceChildren(header, list);
    }

    // Fills the front page's list with a link to every month, newest first
    function buildMonthList(container) {
        const list = document.createElement("ul");
        list.className = "month-list";
        const preludeItem = document.createElement("li");
        preludeItem.append(buildMonthLink(PRELUDE, PRELUDE.name));
        list.append(preludeItem);
        for (const month of months.map(readMonth)) {
            const item = document.createElement("li");
            item.append(buildMonthLink(month, `${month.name} ${month.year}`));
            list.append(item);
        }
        container.replaceChildren(list);
    }

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
        buildSidebar(sidebar);
    }
    const monthList = document.querySelector("[data-month-list]");
    if (monthList && months.length > 0) {
        buildMonthList(monthList);
    }
})();
