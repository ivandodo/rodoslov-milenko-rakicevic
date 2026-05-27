// JavaScript Logic for Rodoslov Family Tree - Multi-Alphabet (Cyrillic / Latin)
document.addEventListener("DOMContentLoaded", () => {
    // Check if RODOSLOV_DATA is available (loaded from data.js)
    if (typeof RODOSLOV_DATA === "undefined") {
        console.error("RODOSLOV_DATA is not defined. Please ensure data.js is loaded correctly.");
        return;
    }

    // App state
    let currentLang = "cyr"; // 'cyr' (Cyrillic, default) or 'lat' (Latin)
    const treeRoot = RODOSLOV_DATA.tree;
    const individuals = RODOSLOV_DATA.individuals;
    const expandedNodes = new Set(); // tracks expanded node IDs
    let searchActive = false;

    // DOM Elements
    const treeRootContainer = document.getElementById("tree-root");
    const langToggleBtn = document.getElementById("lang-toggle");
    const expandAllBtn = document.getElementById("expand-all");
    const collapseAllBtn = document.getElementById("collapse-all");
    const searchInput = document.getElementById("search-input");
    
    // Stats elements
    const statTotal = document.getElementById("stat-total");
    const statMales = document.getElementById("stat-males");
    const statFemales = document.getElementById("stat-females");
    const statLiving = document.getElementById("stat-living");
    const statAvgLifespan = document.getElementById("stat-avg-lifespan");

    // Drawer elements
    const drawerBackdrop = document.getElementById("drawer-backdrop");
    const drawerCloseBtn = document.getElementById("drawer-close");
    const drawerName = document.getElementById("drawer-name");
    const drawerDates = document.getElementById("drawer-dates");
    const drawerGender = document.getElementById("drawer-gender");
    const drawerResidence = document.getElementById("drawer-residence");
    const drawerSpouses = document.getElementById("drawer-spouses");
    const drawerParent = document.getElementById("drawer-parent");
    const drawerChildren = document.getElementById("drawer-children");
    const drawerNotes = document.getElementById("drawer-notes");

    // Helper: Transliteration map from Cyrillic to Serbian Latin
    const CYR_TO_LAT = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Đ', 'Е': 'E', 'Ж': 'Ž', 'З': 'Z',
        'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj', 'М': 'M', 'Н': 'N', 'Њ': 'Nj', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'Ć', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
        'Ч': 'Č', 'Џ': 'Dž', 'Ш': 'Š',
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'đ', 'е': 'e', 'ж': 'ž', 'з': 'z',
        'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'ć', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
        'ч': 'č', 'џ': 'dž', 'ш': 'š'
    };

    function transliterateText(text) {
        if (!text) return text;
        return text.split('').map(char => CYR_TO_LAT[char] || char).join('');
    }

    // Translation Dictionary for fully localized interface
    const INTERFACE_TEXT = {
        cyr: {
            title: "Родослов Миленко Ракићевић",
            subtitle: "Интерактивно породично стабло",
            lbl_total: "Чланова укупно",
            lbl_males: "Мушкараца",
            lbl_females: "Жена",
            lbl_living: "Живих потомака",
            lbl_avg_lifespan: "Просечан животни век",
            search_placeholder: "Претражи по имену, надмику, супрузи, боравку...",
            btn_expand: '<i class="fas fa-expand-arrows-alt"></i> Рашири све',
            btn_collapse: '<i class="fas fa-compress-arrows-alt"></i> Скупи све',
            btn_lang: '<i class="fas fa-globe"></i> Латиница',
            show_descendants: "Прикажи potomke", // dynamic replacement
            born: "Рођен(а)",
            present: "данас",
            deceased: "преминуо",
            residence: "Место боравка",
            residence_empty: "Податак о месту боравка не постоји",
            parent: "Родитељ",
            spouses: "Брачни партнер(и)",
            children: "Деца",
            notes: "Изворни текст (PDF)",
            none_patriarch: "Нема (Родоначелник)",
            no_spouses: "Нема евидентираних брачних партнера",
            no_children: "Нема деце",
            no_notes: "Нема бележака",
            root: "Корен",
            generation_suffix: "колено",
            gen_tree_root: "Корен стабла",
            gen_descendant: "колено потомака",
            pol: "Пол",
            muski: "Мушки",
            zenski: "Женски",
            devojacko: "Девојачко презиме",
            prezime: "Презиме",
            poreklom_iz: "пореклом из",
            vencani: "венчани",
            god: "год.",
            lifetime_gen: "Животни век и Генерација",
            personal_data: "Лични Подаци"
        },
        lat: {
            title: "Rodoslov Milenko Rakićević",
            subtitle: "Interaktivno porodično stablo",
            lbl_total: "Članova ukupno",
            lbl_males: "Muškaraca",
            lbl_females: "Žena",
            lbl_living: "Živih potomaka",
            lbl_avg_lifespan: "Prosečan životni vek",
            search_placeholder: "Pretraži po imenu, nadimku, supruzi, boravku...",
            btn_expand: '<i class="fas fa-expand-arrows-alt"></i> Raširi sve',
            btn_collapse: '<i class="fas fa-compress-arrows-alt"></i> Skupi sve',
            btn_lang: '<i class="fas fa-globe"></i> Ćirilica',
            show_descendants: "Prikaži potomke",
            born: "Rođen(a)",
            present: "danas",
            deceased: "preminuo",
            residence: "Mesto boravka",
            residence_empty: "Podatak o mestu boravka ne postoji",
            parent: "Roditelj",
            spouses: "Bračni partner(i)",
            children: "Deca",
            notes: "Izvorni tekst (PDF)",
            none_patriarch: "Nema (Rodonačelnik)",
            no_spouses: "Nema evidentiranih bračnih partnera",
            no_children: "Nema dece",
            no_notes: "Nema beležaka",
            root: "Koren",
            generation_suffix: "koleno",
            gen_tree_root: "Koren stabla",
            gen_descendant: "koleno potomaka",
            pol: "Pol",
            muski: "Muški",
            zenski: "Ženski",
            devojacko: "Devojačko prezime",
            prezime: "Prezime",
            poreklom_iz: "poreklom iz",
            vencani: "venčani",
            god: "god.",
            lifetime_gen: "Životni vek i Generacija",
            personal_data: "Lični Podaci"
        }
    };

    function updateInterfaceTexts() {
        const t = INTERFACE_TEXT[currentLang];
        
        // Header
        document.querySelector(".title-sr").textContent = t.title;
        document.querySelector(".title-en").textContent = t.subtitle;
        
        // Stat Labels
        const lblTotal = document.getElementById("lbl-total");
        if (lblTotal) {
            lblTotal.textContent = t.lbl_total;
            document.getElementById("lbl-males").textContent = t.lbl_males;
            document.getElementById("lbl-females").textContent = t.lbl_females;
            document.getElementById("lbl-living").textContent = t.lbl_living;
            document.getElementById("lbl-avg-lifespan").textContent = t.lbl_avg_lifespan;
        }
        
        // Search Input
        const searchInputEl = document.getElementById("search-input");
        if (searchInputEl) {
            searchInputEl.placeholder = t.search_placeholder;
        }
        
        // Buttons
        document.getElementById("expand-all").innerHTML = t.btn_expand;
        document.getElementById("collapse-all").innerHTML = t.btn_collapse;
        document.getElementById("lang-toggle").innerHTML = t.btn_lang;
        
        // Drawer Section Titles
        document.getElementById("sec-dates").textContent = t.lifetime_gen;
        document.getElementById("sec-gender").textContent = t.personal_data;
        
        document.getElementById("sec-residence").innerHTML = `<i class="fas fa-map-marker-alt"></i> ${t.residence}`;
        document.getElementById("sec-parent").innerHTML = `<i class="fas fa-user-friends"></i> ${t.parent}`;
        document.getElementById("sec-spouses").innerHTML = `<i class="fas fa-ring"></i> ${t.spouses}`;
        document.getElementById("sec-children").innerHTML = `<i class="fas fa-child"></i> ${t.children}`;
        document.getElementById("sec-notes").innerHTML = `<i class="far fa-sticky-note"></i> ${t.notes}`;
    }

    // Default: expand root and first generation children
    expandedNodes.add(treeRoot.id);
    treeRoot.children.forEach(c => expandedNodes.add(c.id));

    // Initial render
    updateInterfaceTexts();
    calculateStats();
    renderTree();

    // Event Listeners
    langToggleBtn.addEventListener("click", () => {
        currentLang = currentLang === "cyr" ? "lat" : "cyr";
        updateInterfaceTexts();
        calculateStats();
        renderTree();
    });

    expandAllBtn.addEventListener("click", () => {
        individuals.forEach(ind => expandedNodes.add(ind.id));
        renderTree();
    });

    collapseAllBtn.addEventListener("click", () => {
        expandedNodes.clear();
        expandedNodes.add(treeRoot.id); // keep root open
        renderTree();
    });

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length === 0) {
                searchActive = false;
                renderTree();
                return;
            }

            searchActive = true;
            performSearch(query);
        });
    }

    drawerCloseBtn.addEventListener("click", closeDrawer);
    drawerBackdrop.addEventListener("click", (e) => {
        if (e.target === drawerBackdrop) closeDrawer();
    });

    function calculateStats() {
        const total = individuals.length;
        const males = individuals.filter(p => p.gender === "male").length;
        const females = individuals.filter(p => p.gender === "female").length;
        const living = individuals.filter(p => p.is_alive).length;
        
        // Calculate average lifespan for deceased with known birth and death years
        let lifespanSum = 0;
        let lifespanCount = 0;
        individuals.forEach(p => {
            if (!p.is_alive && p.birth_year && p.death_year) {
                const lifespan = p.death_year - p.birth_year;
                if (lifespan > 0 && lifespan < 110) {
                    lifespanSum += lifespan;
                    lifespanCount++;
                }
            }
        });
        const avgLifespan = lifespanCount > 0 ? Math.round(lifespanSum / lifespanCount) : 75;

        // Render Stats
        if (statTotal) {
            statTotal.textContent = total;
            statMales.textContent = males;
            statFemales.textContent = females;
            statLiving.textContent = living;
            
            const t = INTERFACE_TEXT[currentLang];
            statAvgLifespan.textContent = `${avgLifespan} ${t.god}`;
        }
    }

    // Render tree recursively
    function renderTree() {
        treeRootContainer.innerHTML = "";
        const rootElement = renderNode(treeRoot);
        treeRootContainer.appendChild(rootElement);
    }

    function renderNode(node) {
        const li = document.createElement("li");
        li.className = "tree-node";
        li.id = `node-${node.id}`;

        const isExpanded = expandedNodes.has(node.id) || searchActive;
        const t = INTERFACE_TEXT[currentLang];

        // 1. Determine names based on alphabet state
        const firstName = currentLang === "cyr" ? node.first_name_sr : node.first_name_en;
        const lastName = currentLang === "cyr" ? node.current_last_name_sr : node.current_last_name_en;
        const nickname = currentLang === "cyr" ? node.nickname_sr : node.nickname_en;
        
        let fullName = `${firstName} ${lastName}`;
        if (node.id === "p0") {
            fullName = currentLang === "cyr" ? "Миленко Ракићевић" : "Milenko Rakićević";
        }
        
        // Dates formatting
        let yearsText = "";
        if (node.birth_year) {
            const birth = node.birth_date ? node.birth_date : node.birth_year;
            const death = node.death_date ? node.death_date : (node.death_year ? node.death_year : "");
            
            if (node.is_alive) {
                yearsText = `${birth} - ${t.present}`;
            } else {
                yearsText = death ? `${birth} - ${death}` : `${birth} - †`;
            }
        }

        const genderClass = node.gender === "male" ? "card-male" : "card-female";

        // Create Card HTML
        const card = document.createElement("div");
        card.className = `card ${genderClass}`;
        card.setAttribute("data-id", node.id);

        let nicknameHtml = nickname ? `<span class="card-nickname">"${nickname}"</span>` : "";
        let badgeText = node.generation === 0 ? t.root : `${node.generation}. ${t.generation_suffix}`;

        let residenceText = currentLang === "cyr" ? node.residence_sr : node.residence_en;
        let residenceHtml = residenceText ? `
            <div class="card-detail">
                <span class="card-icon"><i class="fas fa-map-marker-alt"></i></span>
                <span>${residenceText}</span>
            </div>
        ` : "";

        // Spouses section inside card
        let spousesHtml = "";
        if (node.spouses && node.spouses.length > 0) {
            let spousesList = "";
            node.spouses.forEach(sp => {
                const spFirstName = currentLang === "cyr" ? sp.first_name_sr : sp.first_name_en;
                const spLastName = currentLang === "cyr" ? sp.last_name_sr : sp.last_name_en;
                const spName = `${spFirstName} ${spLastName || ""}`;
                
                let spYears = "";
                if (sp.birth_year) {
                    spYears = sp.death_year ? `(${sp.birth_year}-${sp.death_year})` : `(${sp.birth_year}-)`;
                }

                let spOrigin = currentLang === "cyr" ? sp.origin_sr : sp.origin_en;
                let spOriginText = spOrigin ? `, ${t.poreklom_iz} ${spOrigin.trim()}` : "";

                spousesList += `
                    <div class="spouse-row">
                        <div class="spouse-name">
                            <i class="fas fa-ring text-yellow-400"></i> ${spName} <span class="text-xs font-normal opacity-70">${spYears}</span>
                        </div>
                        ${sp.marriage_year ? `<div class="spouse-meta"><i class="far fa-calendar-alt"></i> ${t.vencani} ${sp.marriage_year}.${spOriginText}</div>` : ""}
                    </div>
                `;
            });

            spousesHtml = `
                <div class="spouses-wrapper">
                    ${spousesList}
                </div>
            `;
        }

        // Expand/Collapse Indicator
        const hasChildren = node.children && node.children.length > 0;
        let expandBtnHtml = "";
        if (hasChildren && !searchActive) {
            const txtCyrDesktop = isExpanded ? "Скупи" : `Потомци (${node.children.length})`;
            const txtLatDesktop = isExpanded ? "Skupi" : `Potomci (${node.children.length})`;
            const txtCyrMobile = isExpanded ? "Скупи потомке" : `Прикажи потомке (${node.children.length})`;
            const txtLatMobile = isExpanded ? "Skupi potomke" : `Prikaži potomke (${node.children.length})`;

            const desktopText = currentLang === "cyr" ? txtCyrDesktop : txtLatDesktop;
            const mobileText = currentLang === "cyr" ? txtCyrMobile : txtLatMobile;

            const iconDesktop = isExpanded ? "fa-chevron-left" : "fa-chevron-right";
            const iconMobile = isExpanded ? "fa-chevron-up" : "fa-chevron-down";
            
            expandBtnHtml = `
                <div class="expand-btn">
                    <span class="btn-text-desktop">${desktopText}</span>
                    <span class="btn-text-mobile">${mobileText}</span>
                    <i class="fas ${iconDesktop} expand-icon-desktop"></i>
                    <i class="fas ${iconMobile} expand-icon-mobile"></i>
                </div>
            `;
        }

        card.innerHTML = `
            <span class="card-badge">${badgeText}</span>
            <div class="card-header">
                <span class="card-name">${fullName}</span>
                ${nicknameHtml}
            </div>
            <div class="card-detail">
                <span class="card-icon"><i class="far fa-clock"></i></span>
                <span class="card-years">${yearsText}</span>
            </div>
            ${residenceHtml}
            ${spousesHtml}
            ${expandBtnHtml}
        `;

        // Card click handler -> Open Details Drawer
        card.addEventListener("click", (e) => {
            if (e.target.closest(".expand-btn")) {
                e.stopPropagation();
                toggleNode(node.id);
            } else {
                openDrawer(node.id);
            }
        });

        li.appendChild(card);

        // Render Children if present and expanded
        if (hasChildren) {
            const childrenUl = document.createElement("ul");
            childrenUl.className = `tree-branch children-container ${isExpanded ? 'expanded' : ''}`;
            
            node.children.forEach(child => {
                const childLi = renderNode(child);
                childrenUl.appendChild(childLi);
            });
            
            li.appendChild(childrenUl);
            if (isExpanded) {
                li.classList.add("expanded-node");
            } else {
                li.classList.remove("expanded-node");
            }
        }

        return li;
    }

    function toggleNode(nodeId) {
        if (expandedNodes.has(nodeId)) {
            expandedNodes.delete(nodeId);
        } else {
            expandedNodes.add(nodeId);
        }
        renderTree();
    }

    // Detail Drawer Actions
    function openDrawer(nodeId) {
        const p = individuals.find(x => x.id === nodeId);
        if (!p) return;

        const t = INTERFACE_TEXT[currentLang];

        // Names
        const firstName = currentLang === "cyr" ? p.first_name_sr : p.first_name_en;
        const lastName = currentLang === "cyr" ? p.current_last_name_sr : p.current_last_name_en;
        const nickname = currentLang === "cyr" ? p.nickname_sr : p.nickname_en;
        const maidenName = currentLang === "cyr" ? p.maiden_name_sr : p.maiden_name_en;
        
        let fullName = `${firstName} ${lastName}`;
        if (p.id === "p0") {
            fullName = currentLang === "cyr" ? "Миленко Ракићевић" : "Milenko Rakićević";
        }

        drawerName.textContent = fullName;
        
        if (nickname) {
            drawerName.innerHTML += ` <span style="font-size: 1.2rem; font-style: italic; font-weight: 300; opacity: 0.8;">("${nickname}")</span>`;
        }

        // Generation
        const genText = p.generation === 0 
            ? t.gen_tree_root
            : `${p.generation}. ${t.gen_descendant}`;
        
        // Dates
        let datesText = "";
        if (p.birth_year) {
            const birth = p.birth_date ? p.birth_date : p.birth_year;
            const death = p.death_date ? p.death_date : (p.death_year ? p.death_year : "");
            if (p.is_alive) {
                datesText = `${t.born}: ${birth} (${t.present})`;
            } else {
                datesText = death ? `${birth} - ${death}` : `${t.born}: ${birth} (${t.deceased})`;
            }
        }
        drawerDates.innerHTML = `<span class="relationship-badge">${genText}</span><br><br>${datesText}`;

        // Gender & Names
        const genderLabel = p.gender === "male" ? t.muski : t.zenski;
        
        let namesInfo = `<strong>${t.pol}:</strong> ${genderLabel}<br>`;
        if (maidenName && maidenName !== lastName) {
            namesInfo += `<strong>${t.devojacko}:</strong> ${maidenName}<br>`;
        }
        namesInfo += `<strong>${t.prezime}:</strong> ${lastName}`;
        drawerGender.innerHTML = namesInfo;

        // Residence
        let resText = currentLang === "cyr" ? p.residence_sr : p.residence_en;
        drawerResidence.innerHTML = resText 
            ? `<strong><i class="fas fa-map-marker-alt"></i> ${t.residence}:</strong> ${resText}` 
            : `<em>${t.residence_empty}</em>`;

        // Parent
        if (p.parent_id) {
            const parent = individuals.find(x => x.id === p.parent_id);
            if (parent) {
                const parentName = currentLang === "cyr" 
                    ? `${parent.first_name_sr} ${parent.current_last_name_sr}` 
                    : `${parent.first_name_en} ${parent.current_last_name_en}`;
                drawerParent.innerHTML = `<a href="#" class="text-cyan-400 hover:underline" data-jump="${parent.id}">${parentName}</a>`;
            }
        } else {
            drawerParent.innerHTML = `<em>${t.none_patriarch}</em>`;
        }

        // Spouses list
        if (p.spouses && p.spouses.length > 0) {
            let spListHtml = "<ul>";
            p.spouses.forEach(sp => {
                const spFirstName = currentLang === "cyr" ? sp.first_name_sr : sp.first_name_en;
                const spLastName = currentLang === "cyr" ? sp.last_name_sr : sp.last_name_en;
                const spName = `${spFirstName} ${spLastName || ""}`;
                
                let spMeta = "";
                if (sp.birth_year) {
                    spMeta += sp.death_year ? ` (${sp.birth_year}-${sp.death_year})` : ` (${sp.birth_year}-)`;
                }

                let spOrigin = currentLang === "cyr" ? sp.origin_sr : sp.origin_en;
                if (spOrigin) spMeta += `, ${t.poreklom_iz} ${spOrigin.trim()}`;
                
                let spMYear = sp.marriage_year ? `<br><small class="text-gray-400"><i class="far fa-calendar-alt"></i> ${t.vencani} ${sp.marriage_year}. ${t.god}</small>` : "";

                spListHtml += `
                    <li class="mb-2">
                        <strong>${spName}</strong> ${spMeta} ${spMYear}
                    </li>
                `;
            });
            spListHtml += "</ul>";
            drawerSpouses.innerHTML = spListHtml;
        } else {
            drawerSpouses.innerHTML = `<em>${t.no_spouses}</em>`;
        }

        // Children list
        if (p.children_ids && p.children_ids.length > 0) {
            let chListHtml = "<ul>";
            p.children_ids.forEach(cid => {
                const child = individuals.find(x => x.id === cid);
                if (child) {
                    const chFirstName = currentLang === "cyr" ? child.first_name_sr : child.first_name_en;
                    const chLastName = currentLang === "cyr" ? child.current_last_name_sr : child.current_last_name_en;
                    const chName = `${chFirstName} ${chLastName}`;
                    chListHtml += `
                        <li class="mb-1">
                            <a href="#" class="text-cyan-400 hover:underline" data-jump="${child.id}">${chName}</a>
                        </li>
                    `;
                }
            });
            chListHtml += "</ul>";
            drawerChildren.innerHTML = chListHtml;
        } else {
            drawerChildren.innerHTML = `<em>${t.no_children}</em>`;
        }

        // Notes / Raw text (fully localized to active script!)
        let rawNotes = p.raw_text;
        if (currentLang === "lat") {
            rawNotes = transliterateText(rawNotes);
        }
        drawerNotes.innerHTML = rawNotes 
            ? `<p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-muted);">${rawNotes.replace(/\n/g, '<br>')}</p>` 
            : `<em>${t.no_notes}</em>`;

        // Add jump links handlers in drawer
        const jumpLinks = drawerChildren.querySelectorAll("[data-jump]");
        const parentLink = drawerParent.querySelector("[data-jump]");
        
        const attachJump = (link) => {
            if (link) {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute("data-jump");
                    
                    expandParents(targetId);
                    renderTree();
                    
                    setTimeout(() => {
                        const targetCard = document.querySelector(`.card[data-id="${targetId}"]`);
                        if (targetCard) {
                            targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                            targetCard.classList.add("card-highlighted");
                            setTimeout(() => targetCard.classList.remove("card-highlighted"), 2500);
                        }
                    }, 500);
                    
                    closeDrawer();
                });
            }
        };

        jumpLinks.forEach(attachJump);
        attachJump(parentLink);

        drawerBackdrop.classList.add("active");
    }

    function closeDrawer() {
        drawerBackdrop.classList.remove("active");
    }

    // Helper: recursively expand all parents of a node ID to ensure it is visible in the tree
    function expandParents(nodeId) {
        const node = individuals.find(x => x.id === nodeId);
        if (node && node.parent_id) {
            expandedNodes.add(node.parent_id);
            expandParents(node.parent_id);
        }
    }

    // Advanced search logic
    function performSearch(query) {
        // Reset highlights
        const cards = document.querySelectorAll(".card");
        cards.forEach(c => {
            c.classList.remove("card-highlighted", "card-highlighted-female", "card-dimmed");
        });

        // Find matches
        const matches = [];
        individuals.forEach(p => {
            const firstNameSr = p.first_name_sr.toLowerCase();
            const firstNameEn = p.first_name_en.toLowerCase();
            const lastNameSr = p.current_last_name_sr.toLowerCase();
            const lastNameEn = p.current_last_name_en.toLowerCase();
            const nicknameSr = p.nickname_sr ? p.nickname_sr.toLowerCase() : "";
            const nicknameEn = p.nickname_en ? p.nickname_en.toLowerCase() : "";
            const maidenSr = p.maiden_name_sr ? p.maiden_name_sr.toLowerCase() : "";
            const maidenEn = p.maiden_name_en ? p.maiden_name_en.toLowerCase() : "";
            const residenceSr = p.residence_sr ? p.residence_sr.toLowerCase() : "";
            const residenceEn = p.residence_en ? p.residence_en.toLowerCase() : "";
            
            // Check spouses names/origins
            let spousesMatch = false;
            p.spouses.forEach(sp => {
                if (sp.first_name_sr.toLowerCase().includes(query) || 
                    sp.first_name_en.toLowerCase().includes(query) ||
                    (sp.last_name_sr && sp.last_name_sr.toLowerCase().includes(query)) ||
                    (sp.last_name_en && sp.last_name_en.toLowerCase().includes(query)) ||
                    (sp.origin_sr && sp.origin_sr.toLowerCase().includes(query)) ||
                    (sp.origin_en && sp.origin_en.toLowerCase().includes(query))) {
                    spousesMatch = true;
                }
            });

            if (firstNameSr.includes(query) || 
                firstNameEn.includes(query) ||
                lastNameSr.includes(query) ||
                lastNameEn.includes(query) ||
                nicknameSr.includes(query) ||
                nicknameEn.includes(query) ||
                maidenSr.includes(query) ||
                maidenEn.includes(query) ||
                residenceSr.includes(query) ||
                residenceEn.includes(query) ||
                p.raw_text.toLowerCase().includes(query) ||
                spousesMatch) {
                matches.push(p);
            }
        });

        if (matches.length > 0) {
            // Expand all parents of all matches
            matches.forEach(m => {
                expandParents(m.id);
            });

            renderTree();

            // Highlight matches and dim others
            setTimeout(() => {
                const matchIds = new Set(matches.map(m => m.id));
                const allCards = document.querySelectorAll(".card");
                allCards.forEach(c => {
                    const id = c.getAttribute("data-id");
                    if (matchIds.has(id)) {
                        const person = matches.find(m => m.id === id);
                        if (person.gender === "male") {
                            c.classList.add("card-highlighted");
                        } else {
                            c.classList.add("card-highlighted-female");
                        }
                    } else {
                        c.classList.add("card-dimmed");
                    }
                });

                // Scroll the first match into view
                const firstMatchCard = document.querySelector(`.card[data-id="${matches[0].id}"]`);
                if (firstMatchCard) {
                    firstMatchCard.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
        } else {
            // If no matches, dim everything
            const allCards = document.querySelectorAll(".card");
            allCards.forEach(c => c.classList.add("card-dimmed"));
        }
    }
});
