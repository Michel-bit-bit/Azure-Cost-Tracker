document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONSTANTES ---
    const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const COST_CATEGORIES = {
        networking: { label: "Networking", color: '--chart-c1' },
        storage: { label: "Storage", color: '--chart-c2' },
        compute: { label: "Compute", color: '--chart-c3' },
        management: { label: "Management", color: '--chart-c4' },
        marketplace: { label: "Marketplace", color: '--chart-c5' },
        autre: { label: "Autre", color: '--chart-c6' },
    };
    const CATEGORY_KEYS = Object.keys(COST_CATEGORIES).filter(k => k !== 'autre');

    // --- ÉTAT DE L'APPLICATION ---
    let state = {
        entries: [],
        editingEntryId: null,
        sortOrder: 'desc',
        searchTerm: '',
        comparison: { id1: null, id2: null },
        annualReviewYear: null,
    };

    // --- ÉLÉMENTS DU DOM ---
    const fab = document.getElementById('fab');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const entriesContainer = document.getElementById('entries-container');
    const comparisonContainer = document.getElementById('comparison-container');
    const annualReviewContainer = document.getElementById('annual-review-container');

    // --- INSTANCES DE GRAPHIQUES ---
    let donutChart1 = null;
    let donutChart2 = null;
    let barChart = null;

    // --- FONCTIONS UTILITAIRES ---
    function getCssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    
    function calculateTotal(entry) {
        if (!entry) return 0;
        // La source de vérité est le totalTTC s'il existe, sinon on calcule la somme.
        return parseFloat(entry.totalTTC) || CATEGORY_KEYS.reduce((sum, key) => sum + (Number(entry[key]) || 0), 0);
    }
    
    // --- MODULE DE BASE DE DONNÉES (IndexedDB) ---
    const db = {
        _db: null,
        init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('AzureCostTrackerDB_v1', 1);
                request.onupgradeneeded = e => {
                    const dbInstance = e.target.result;
                    if (!dbInstance.objectStoreNames.contains('costEntries')) {
                        dbInstance.createObjectStore('costEntries', { keyPath: 'id', autoIncrement: true });
                    }
                };
                request.onsuccess = e => {
                    this._db = e.target.result;
                    resolve();
                };
                request.onerror = e => reject("Erreur de base de données: " + e.target.errorCode);
            });
        },
        getObjectStore(mode) {
            const transaction = this._db.transaction('costEntries', mode);
            return transaction.objectStore('costEntries');
        },
        addEntry(entry) {
            return new Promise((resolve, reject) => {
                const request = this.getObjectStore('readwrite').add(entry);
                request.onsuccess = () => resolve();
                request.onerror = (e) => reject(e.target.error);
            });
        },
        updateEntry(entry) {
            return new Promise((resolve, reject) => {
                const request = this.getObjectStore('readwrite').put(entry);
                request.onsuccess = () => resolve();
                request.onerror = (e) => reject(e.target.error);
            });
        },
        deleteEntry(id) {
            return new Promise((resolve, reject) => {
                const request = this.getObjectStore('readwrite').delete(id);
                request.onsuccess = () => resolve();
                request.onerror = (e) => reject(e.target.error);
            });
        },
        getAllEntries() {
            return new Promise((resolve, reject) => {
                const request = this.getObjectStore('readonly').getAll();
                request.onsuccess = e => resolve(e.target.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },
        exportData() {
            return this.getAllEntries().then(entries => JSON.stringify(entries, null, 2));
        },
        importData(jsonString) {
            return new Promise((resolve, reject) => {
                try {
                    const entries = JSON.parse(jsonString);
                    const store = this.getObjectStore('readwrite');
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => {
                        if (entries.length === 0) return resolve();
                        const transaction = store.transaction;
                        entries.forEach(entry => {
                            const { id, ...entryWithoutId } = entry;
                            store.add(entryWithoutId);
                        });
                        transaction.oncomplete = () => resolve();
                        transaction.onerror = (e) => reject(e.target.error);
                    };
                    clearRequest.onerror = (e) => reject(e.target.error);
                } catch (e) {
                    reject(e);
                }
            });
        }
    };
    
    // --- GESTION DES MODALES ---
    function openModal(title, content) {
        modalTitle.textContent = title;
        modalContent.innerHTML = content;
        modalBackdrop.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalBackdrop.classList.add('hidden');
        document.body.style.overflow = '';
        state.editingEntryId = null;
    }
    
    // --- FONCTIONS DE RENDU ---
    function render() {
        renderEntriesList();
        renderComparisonView();
        renderAnnualReview();
    }

    function renderEntriesList() {
        // Détecter si l'utilisateur est en train de taper dans le champ de recherche
        const searchInput = document.getElementById('search-input');
        const isSearching = searchInput && document.activeElement === searchInput;
    
        const filtered = state.entries.filter(entry => {
            const entryText = `${MONTHS[entry.month]} ${entry.year}`.toLowerCase();
            return entryText.includes(state.searchTerm.toLowerCase());
        });

        filtered.sort((a, b) => {
            const dateA = new Date(a.year, a.month).getTime();
            const dateB = new Date(b.year, b.month).getTime();
            return state.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        const listHtml = filtered.length > 0 ? filtered.map(entry => `
            <li class="entry-item" data-id="${entry.id}">
                <div>
                    <p><strong>${MONTHS[entry.month]} ${entry.year}</strong></p>
                    <p><small>Total: ${calculateTotal(entry).toFixed(2)} €</small></p>
                </div>
                <div class="entry-item-actions">
                    <button class="edit-btn icon-button" aria-label="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style="pointer-events:none;"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3.001zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>
                    </button>
                    <button class="delete-btn icon-button" aria-label="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style="pointer-events:none;"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
                    </button>
                </div>
            </li>
        `).join('') : '<div class="text-placeholder"><p>Aucune entrée trouvée.</p></div>';
        
        if (isSearching) {
            // Si l'utilisateur tape, ne mettre à jour que la liste pour ne pas perdre le focus
            const listElement = entriesContainer.querySelector('.entries-list');
            if (listElement) {
                listElement.innerHTML = listHtml;
            }
        } else {
            // Sinon, redessiner tout le composant (cas initial, tri, suppression, etc.)
            entriesContainer.innerHTML = `
                <h2 class="card-title">Liste des Entrées</h2>
                <div class="list-controls">
                    <input type="text" id="search-input" class="form-input" placeholder="Rechercher (ex: Janvier 2023)..." value="${state.searchTerm}">
                    <button id="sort-btn" class="btn btn-secondary">
                        Trier ${state.sortOrder === 'desc' ? '↓' : '↑'}
                    </button>
                </div>
                <ul class="entries-list">${listHtml}</ul>
            `;
        }
    }

    function renderComparisonView() {
        const { id1, id2 } = state.comparison;
        const entry1 = state.entries.find(e => e.id === id1);
        const entry2 = state.entries.find(e => e.id === id2);

        if (state.entries.length === 0) {
            comparisonContainer.innerHTML = `
                <h2 class="card-title">Comparaison Mensuelle</h2>
                <div class="text-placeholder"><p>Ajoutez au moins une entrée.</p></div>`;
            return;
        }

        const options = state.entries.map(e => `<option value="${e.id}" ${e.id === id1 ? 'selected' : ''}>${MONTHS[e.month]} ${e.year}</option>`).join('');
        const options2 = state.entries.map(e => `<option value="${e.id}" ${e.id === id2 ? 'selected' : ''}>${MONTHS[e.month]} ${e.year}</option>`).join('');

        let resultHtml = '';
        if (entry1 && entry2) {
            const total1 = calculateTotal(entry1);
            const total2 = calculateTotal(entry2);
            const diff = total1 - total2;
            const percentageDiff = total2 !== 0 ? (diff / total2) * 100 : (total1 > 0 ? 100 : 0);
            const trendText = percentageDiff >= 0 ? "Augmentation" : "Baisse";
            const trendClass = percentageDiff >= 0 ? "trend-up" : "trend-down";
            resultHtml = `
                <p><strong>${MONTHS[entry1.month]} ${entry1.year}</strong> (${total1.toFixed(2)}€) vs <strong>${MONTHS[entry2.month]} ${entry2.year}</strong> (${total2.toFixed(2)}€)</p>
                <p class="${trendClass}">${trendText} de ${Math.abs(percentageDiff).toFixed(2)}%</p>
            `;
        }

        comparisonContainer.innerHTML = `
            <h2 class="card-title">Comparaison Mensuelle</h2>
            <div class="comparison-selectors">
                <select id="compare-select-1" class="form-select">${options}</select>
                <select id="compare-select-2" class="form-select"><option value="">-- Comparer avec --</option>${options2}</select>
            </div>
            ${resultHtml ? `<div class="comparison-result">${resultHtml}</div>` : ''}
            <div class="charts-container">
                <div>
                    ${entry1 ? `
                        <div class="chart-wrapper">
                            <canvas id="donut-chart1"></canvas>
                        </div>
                        <ul id="donut-chart1-legend" class="legend-container"></ul>
                    ` : '<div class="text-placeholder" style="height: 300px;"><p>Sélectionnez le mois 1</p></div>'}
                </div>
                <div>
                    ${entry2 ? `
                        <div class="chart-wrapper">
                            <canvas id="donut-chart2"></canvas>
                        </div>
                        <ul id="donut-chart2-legend" class="legend-container"></ul>
                    ` : '<div class="text-placeholder" style="height: 300px;"><p>Sélectionnez le mois 2</p></div>'}
                </div>
            </div>
        `;

        if (entry1) renderDonutChart('donut-chart1', 'donut-chart1-legend', entry1, entry2);
        if (entry2) renderDonutChart('donut-chart2', 'donut-chart2-legend', entry2, entry1);
    }
    
    function renderAnnualReview() {
        const availableYears = [...new Set(state.entries.map(e => e.year))].sort((a,b) => b-a);
        
        if (availableYears.length === 0) {
            annualReviewContainer.innerHTML = `
                <div class="annual-review-header"><h2 class="card-title">Bilan Annuel</h2></div>
                <div class="text-placeholder"><p>Aucune donnée disponible.</p></div>`;
            return;
        }

        const year = state.annualReviewYear;
        const yearOptions = availableYears.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('');

        let statsHtml = '';
        let chartHtml = '<div style="height: 350px; position: relative;"><canvas id="bar-chart"></canvas></div>';

        if (year) {
            const currentYearEntries = state.entries.filter(e => e.year === year).sort((a,b) => a.month - b.month);
            
            if (currentYearEntries.length > 0) {
                const firstMonth = currentYearEntries[0];
                const lastMonth = currentYearEntries[currentYearEntries.length - 1];
                const firstTotal = calculateTotal(firstMonth);
                const lastTotal = calculateTotal(lastMonth);

                const diff = lastTotal - firstTotal;
                const diffPercent = firstTotal !== 0 ? (diff / firstTotal) * 100 : (lastTotal > 0 ? 100 : 0);

                const annualTotal = currentYearEntries.reduce((sum, e) => sum + calculateTotal(e), 0);
                
                const prevYearEntries = state.entries.filter(e => e.year === year - 1);
                const prevYearTotal = prevYearEntries.reduce((sum, e) => sum + calculateTotal(e), 0);
                const annualDiff = annualTotal - prevYearTotal;
                const annualDiffPercent = prevYearTotal !== 0 ? (annualDiff / prevYearTotal) * 100 : (annualTotal > 0 ? 100 : 0);

                statsHtml = `
                    <div class="stat-card">
                        <h4>Premier vs Dernier Mois</h4>
                        <p class="${diff >= 0 ? 'trend-up' : 'trend-down'}">${diff.toFixed(2)}€ (${diffPercent.toFixed(1)}%)</p>
                    </div>
                    <div class="stat-card">
                        <h4>Total Annuel ${year}</h4>
                        <p>${annualTotal.toFixed(2)}€</p>
                    </div>
                    <div class="stat-card">
                        <h4>vs Année ${year - 1}</h4>
                        ${prevYearEntries.length > 0 ? `
                            <p class="${annualDiff >= 0 ? 'trend-up' : 'trend-down'}">${annualDiff.toFixed(2)}€ (${annualDiffPercent.toFixed(1)}%)</p>
                        ` : '<p>N/A</p>'}
                    </div>
                `;
            } else {
                 chartHtml = `<div class="text-placeholder"><p>Aucune donnée pour ${year}.</p></div>`;
            }
        } else {
            chartHtml = `<div class="text-placeholder"><p>Sélectionnez une année.</p></div>`;
        }

        annualReviewContainer.innerHTML = `
            <div class="annual-review-header">
                <h2 class="card-title">Bilan Annuel</h2>
                <select id="year-select" class="form-select" style="max-width: 150px;">${yearOptions}</select>
            </div>
            ${chartHtml}
            <div class="annual-stats">${statsHtml}</div>
        `;

        if (year && state.entries.filter(e => e.year === year).length > 0) {
            renderBarChart('bar-chart', year);
        }
    }

    // --- RENDU DES GRAPHIQUES ---

    const getOrCreateTooltip = (chart) => {
        let tooltipEl = document.getElementById('chart-tooltip');

        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chart-tooltip';
            tooltipEl.className = 'chart-tooltip';
            document.body.appendChild(tooltipEl);
        }
        return tooltipEl;
    };

    const externalTooltipHandler = (context) => {
        const {chart, tooltip} = context;
        const tooltipEl = getOrCreateTooltip(chart);

        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        if (tooltip.body) {
            const titleLines = tooltip.title || [];
            const bodyLines = tooltip.body.map(b => b.lines);

            let innerHtml = '';

            titleLines.forEach(title => {
                innerHtml += '<h4>' + title + '</h4>';
            });

            bodyLines.forEach((body, i) => {
                innerHtml += '<p>' + body[0] + '</p>';
            });

            tooltipEl.innerHTML = innerHtml;
        }

        const canvasBounds = chart.canvas.getBoundingClientRect();

        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = canvasBounds.left + window.scrollX + tooltip.caretX + 'px';
        tooltipEl.style.top = canvasBounds.top + window.scrollY + tooltip.caretY + 'px';
        tooltipEl.style.transform = 'translate(-50%, -100%)';
    };


    function renderDonutChart(canvasId, legendId, entry, compareEntry) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const legendContainer = document.getElementById(legendId);
        
        const sumOfParts = CATEGORY_KEYS.reduce((sum, key) => sum + (entry[key] || 0), 0);
        const totalTTC = calculateTotal(entry);
        const autre = Math.max(0, totalTTC - sumOfParts);

        const data = CATEGORY_KEYS.map(key => entry[key] || 0);
        const labels = CATEGORY_KEYS.map(key => COST_CATEGORIES[key].label);
        const colors = CATEGORY_KEYS.map(key => getCssVar(COST_CATEGORIES[key].color));
        
        if (autre > 0.001) { // Utiliser une petite tolérance pour les erreurs de flottants
            data.push(autre);
            labels.push(COST_CATEGORIES.autre.label);
            colors.push(getCssVar(COST_CATEGORIES.autre.color));
        }

        const chartData = {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: getCssVar('--bg-secondary'),
                borderWidth: 3,
            }]
        };

        if (canvasId === 'donut-chart1' && donutChart1) donutChart1.destroy();
        if (canvasId === 'donut-chart2' && donutChart2) donutChart2.destroy();
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: false,
                        external: externalTooltipHandler,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const value = context.raw;
                                const percentage = totalTTC > 0 ? (value / totalTTC * 100).toFixed(1) : 0;
                                let line = `Coût: ${Number(value).toFixed(2)}€ (${percentage}%)`;
                                
                                if (compareEntry) {
                                    const categoryKey = Object.keys(COST_CATEGORIES).find(k => COST_CATEGORIES[k].label === context.label);
                                    if (categoryKey && categoryKey !== 'autre') {
                                        const compareValue = compareEntry[categoryKey] || 0;
                                        const diff = value - compareValue;
                                        const diffSign = diff >= 0 ? '+' : '';
                                        line += ` (Diff: ${diffSign}${diff.toFixed(2)}€)`;
                                    }
                                }
                                return line;
                            }
                        }
                    },
                }
            },
            plugins: [{
                id: 'doughnut-center-text',
                afterDraw: (chart) => {
                    let ctx = chart.ctx;
                    ctx.save();
                    let centerX = (chart.getDatasetMeta(0).data[0].x);
                    let centerY = (chart.getDatasetMeta(0).data[0].y);
                    
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    ctx.font = 'bold 1.5rem sans-serif';
                    ctx.fillStyle = getCssVar('--text-primary');
                    ctx.fillText(`${totalTTC.toFixed(2)}€`, centerX, centerY - 10);
                    
                    ctx.font = '0.875rem sans-serif';
                    ctx.fillStyle = getCssVar('--text-secondary');
                    ctx.fillText('Total TTC', centerX, centerY + 15);
                    ctx.restore();
                }
            }]
        });

        if (canvasId === 'donut-chart1') donutChart1 = chart;
        if (canvasId === 'donut-chart2') donutChart2 = chart;
        
        legendContainer.innerHTML = labels.map((label, i) => `
            <li class="legend-item">
                <span class="legend-color-box" style="background-color:${colors[i]}"></span>
                ${label}
            </li>
        `).join('');
    }

    function renderBarChart(canvasId, year) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const yearEntries = state.entries.filter(e => e.year === year);
        const annualTotal = yearEntries.reduce((sum, e) => sum + calculateTotal(e), 0);

        const data = MONTHS.map((_, i) => {
            const entry = yearEntries.find(e => e.month === i);
            return calculateTotal(entry);
        });

        if (barChart) barChart.destroy();

        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: MONTHS,
                datasets: [{
                    label: `Coût mensuel`,
                    data: data,
                    backgroundColor: getCssVar('--chart-c1'),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = annualTotal > 0 ? (value / annualTotal * 100).toFixed(1) : 0;
                                let lines = [`Coût: ${value.toFixed(2)}€`];
                                lines.push(`Part annuelle: ${percentage}%`);

                                const prevYearEntry = state.entries.find(e => e.year === year - 1 && e.month === context.dataIndex);
                                if (prevYearEntry) {
                                    const prevYearTotal = calculateTotal(prevYearEntry);
                                    const diff = value - prevYearTotal;
                                    const diffSign = diff >= 0 ? '+' : '';
                                    lines.push(`Diff. vs N-1: ${diffSign}${diff.toFixed(2)}€`);
                                } else {
                                    lines.push('Diff. vs N-1: N/A');
                                }
                                return lines;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- GÉNÉRATEURS DE CONTENU DE MODALE ---
    function getAddEditModalContent(entry = null) {
        const isEditing = !!entry;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
        const yearOptions = years.map(y => `<option value="${y}" ${entry ? (entry.year === y ? 'selected' : '') : (y === currentYear ? 'selected' : '')}>${y}</option>`).join('');
        const monthOptions = MONTHS.map((m, i) => `<option value="${i}" ${entry ? (entry.month === i ? 'selected' : '') : (i === currentMonth ? 'selected' : '')}>${m}</option>`).join('');
        
        const costInputs = CATEGORY_KEYS.map(key => `
            <div class="form-group">
                <label for="${key}">${COST_CATEGORIES[key].label}</label>
                <input type="text" inputmode="decimal" id="${key}" name="${key}" class="form-input cost-input" placeholder="0.00" value="${entry ? (entry[key] || '') : ''}">
            </div>
        `).join('');
        
        const totalTTCValue = entry ? (entry.totalTTC || '') : '';

        return `
            <form id="entry-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="month">Mois</label>
                        <select id="month" name="month" class="form-select">${monthOptions}</select>
                    </div>
                    <div class="form-group">
                        <label for="year">Année</label>
                        <select id="year" name="year" class="form-select">${yearOptions}</select>
                    </div>
                </div>
                <hr style="margin: 1.5rem 0; border-color: var(--border-color);">
                <div class="form-grid">${costInputs}</div>
                <hr style="margin: 1.5rem 0; border-color: var(--border-color);">
                <div class="form-group">
                     <label for="totalTTC">Prix TTC (optionnel, calculé si vide)</label>
                     <input type="text" inputmode="decimal" id="totalTTC" name="totalTTC" class="form-input" placeholder="0.00" value="${totalTTCValue}">
                </div>
                 <div style="text-align: right; margin-top: 1rem; font-size: 1rem;">
                    <p>Somme des catégories : <span id="calculated-total">0.00</span> €</p>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" data-action="close-modal">Annuler</button>
                    <button type="submit" class="btn btn-primary">${isEditing ? 'Mettre à jour' : 'Ajouter'}</button>
                </div>
            </form>
        `;
    }

    function getSettingsModalContent() {
        const currentTheme = localStorage.getItem('theme') || 'system';
        return `
            <div id="settings-modal-content">
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="theme-select">Thème</label>
                    <select id="theme-select" class="form-select">
                        <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Clair</option>
                        <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Sombre</option>
                        <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>Système</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label>Gestion des données</label>
                    <div style="display: flex; gap: 1rem;">
                        <button id="export-btn" class="btn btn-secondary" style="flex:1;">Exporter JSON</button>
                        <button id="import-btn" class="btn btn-secondary" style="flex:1;">Importer JSON</button>
                        <input type="file" id="import-file" accept=".json" class="hidden">
                    </div>
                </div>
                <div class="form-group">
                    <button id="info-btn" style="background:none; border:none; color:var(--accent-primary); cursor:pointer; text-decoration:underline; padding:0;">
                        Informations sur les bibliothèques (i)
                    </button>
                </div>
            </div>`;
    }

    function getInfoModalContent() {
        return `
            <p>Ce projet utilise la bibliothèque suivante :</p>
            <ul style="list-style-position: inside; margin: 1rem 0;">
                <li><strong>Chart.js</strong>: Pour la visualisation des données.</li>
            </ul>
            <div class="form-actions">
                <button type="button" class="btn btn-primary" data-action="close-modal">Fermer</button>
            </div>`;
    }
    
    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    async function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const entryData = {
            month: parseInt(formData.get('month')),
            year: parseInt(formData.get('year')),
        };

        if (!state.editingEntryId) {
            const isDuplicate = state.entries.some(e => e.month === entryData.month && e.year === entryData.year);
            if (isDuplicate) {
                alert("Une entrée pour ce mois et cette année existe déjà.");
                return;
            }
        }
        
        let sumOfParts = 0;
        CATEGORY_KEYS.forEach(key => {
            const value = parseFloat(String(formData.get(key)).replace(',', '.')) || 0;
            entryData[key] = value;
            sumOfParts += value;
        });

        const totalTTC = parseFloat(String(formData.get('totalTTC')).replace(',', '.')) || 0;
        entryData.totalTTC = totalTTC > 0 ? totalTTC : sumOfParts;
        
        try {
            if (state.editingEntryId) {
                entryData.id = state.editingEntryId;
                await db.updateEntry(entryData);
            } else {
                await db.addEntry(entryData);
            }
            closeModal();
            await refreshData();
        } catch(err) {
            console.error(err);
            alert("Erreur lors de la sauvegarde de l'entrée.");
        }
    }

    async function handleEditClick(id) {
        state.editingEntryId = id;
        const entry = state.entries.find(e => e.id === id);
        openModal("Modifier une Entrée", getAddEditModalContent(entry));
        updateTotalTTC();
    }

    function handleThemeChange(e) {
        localStorage.setItem('theme', e.target.value);
        applyTheme();
    }
    
    function applyTheme() {
        const theme = localStorage.getItem('theme') || 'system';
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        if(state.entries.length > 0) {
            render();
        }
    }
    
    async function handleExport() {
        try {
            const jsonString = await db.exportData();
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `azure_costs_backup_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            alert("L'exportation a échoué.");
        }
    }
    
    function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (confirm("Attention: L'importation va écraser toutes les données existantes. Continuer ?")) {
                try {
                    await db.importData(event.target.result);
                    alert("Importation réussie !");
                    closeModal();
                    await refreshData();
                } catch (error) {
                    alert("L'importation a échoué. Vérifiez le format du fichier.");
                }
            }
        };
        reader.readAsText(file);
    }
    
    function updateTotalTTC() {
        const calculatedTotalSpan = document.getElementById('calculated-total');
        const totalTTCInput = document.getElementById('totalTTC');
        if (!calculatedTotalSpan) return;
        
        const inputs = document.querySelectorAll('.cost-input');
        const total = Array.from(inputs).reduce((sum, input) => {
            return sum + (parseFloat(String(input.value).replace(',', '.')) || 0);
        }, 0);
        
        calculatedTotalSpan.textContent = total.toFixed(2);
        
        if (totalTTCInput && !totalTTCInput.value) {
            totalTTCInput.placeholder = total.toFixed(2);
        }
    }
    
    // --- INITIALISATION DES ÉCOUTEURS D'ÉVÉNEMENTS ---
    fab.addEventListener('click', () => {
        openModal("Ajouter une Entrée", getAddEditModalContent());
        updateTotalTTC();
    });
    
    settingsBtn.addEventListener('click', () => {
        openModal("Options", getSettingsModalContent());
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });

    document.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.dataset.action === 'close-modal') closeModal();
        if (target.id === 'export-btn') handleExport();
        if (target.id === 'import-btn') document.getElementById('import-file').click();
        if (target.id === 'info-btn') openModal("Informations", getInfoModalContent());
        if (target.id === 'sort-btn') {
            state.sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc';
            renderEntriesList();
        }

        const editBtn = target.closest('.edit-btn');
        if (editBtn) {
            const id = parseInt(editBtn.closest('.entry-item').dataset.id);
            handleEditClick(id);
        }

        const deleteBtn = target.closest('.delete-btn');
        if (deleteBtn) {
            const id = parseInt(deleteBtn.closest('.entry-item').dataset.id);
            if (confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
                try {
                    await db.deleteEntry(id);
                    await refreshData();
                } catch(err) {
                    alert("Erreur lors de la suppression de l'entrée.");
                }
            }
        }
    });

    document.addEventListener('change', e => {
        const target = e.target;
        if (target.id === 'theme-select') handleThemeChange(e);
        if (target.id === 'import-file') handleImport(e);
        if (target.id === 'compare-select-1') {
            state.comparison.id1 = parseInt(target.value);
            renderComparisonView();
        }
        if (target.id === 'compare-select-2') {
            state.comparison.id2 = target.value ? parseInt(target.value) : null;
            renderComparisonView();
        }
        if (target.id === 'year-select') {
            state.annualReviewYear = parseInt(target.value);
            renderAnnualReview();
        }
    });

    document.addEventListener('input', e => {
        const target = e.target;
        if (target.id === 'search-input') {
            state.searchTerm = target.value;
            renderEntriesList();
        }
        if (target.classList.contains('cost-input') || target.id === 'totalTTC') {
            updateTotalTTC();
        }
    });
    
    document.addEventListener('submit', e => {
        if (e.target.id === 'entry-form') handleFormSubmit(e);
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    
    // --- INITIALISATION DE L'APPLICATION ---
    async function refreshData() {
        state.entries = await db.getAllEntries();
        state.entries.sort((a, b) => new Date(b.year, b.month) - new Date(a.year, a.month));
        
        if (!state.comparison.id1 || !state.entries.find(e => e.id === state.comparison.id1)) {
            state.comparison.id1 = state.entries[0]?.id || null;
        }
        if (!state.comparison.id2 || !state.entries.find(e => e.id === state.comparison.id2)) {
            state.comparison.id2 = state.entries[1]?.id || null;
        }

        const availableYears = [...new Set(state.entries.map(e => e.year))].sort((a,b) => b-a);
        if (!state.annualReviewYear || !availableYears.includes(state.annualReviewYear)) {
            state.annualReviewYear = availableYears[0] || null;
        }
        
        render();
    }
    
    async function init() {
        applyTheme();
        try {
            await db.init();
            await refreshData();
        } catch (e) {
            console.error("Impossible d'initialiser l'application:", e);
            document.body.innerHTML = "<p>Erreur critique: Impossible de démarrer la base de données. L'application ne peut pas fonctionner.</p>";
        }
    }

    init();
});