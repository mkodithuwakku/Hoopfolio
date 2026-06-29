const state = {
  snapshot: null,
  stocks: [],
  selectedGameId: null,
  selectedTeamAbbreviation: null,
  filters: {
    boostEligible: false,
    buyLowOnly: false
  }
};

const elements = {
  contestName: document.querySelector("#contestName"),
  fixtureNotice: document.querySelector("#fixtureNotice"),
  budget: document.querySelector("#budget"),
  marketState: document.querySelector("#marketState"),
  marketReason: document.querySelector("#marketReason"),
  simProgress: document.querySelector("#simProgress"),
  activeGames: document.querySelector("#activeGames"),
  gameSlate: document.querySelector("#gameSlate"),
  gameDetail: document.querySelector("#gameDetail"),
  teamDirectory: document.querySelector("#teamDirectory"),
  teamRoster: document.querySelector("#teamRoster"),
  advanceDayButton: document.querySelector("#advanceDayButton"),
  resetSimButton: document.querySelector("#resetSimButton"),
  tutorialButton: document.querySelector("#tutorialButton"),
  googleDemoButton: document.querySelector("#googleDemoButton"),
  tutorialOverlay: document.querySelector("#tutorialOverlay"),
  tutorialClose: document.querySelector("#tutorialClose"),
  tutorialCounter: document.querySelector("#tutorialCounter"),
  tutorialTitle: document.querySelector("#tutorialTitle"),
  tutorialBody: document.querySelector("#tutorialBody"),
  tutorialBack: document.querySelector("#tutorialBack"),
  tutorialNext: document.querySelector("#tutorialNext"),
  playerCardOverlay: document.querySelector("#playerCardOverlay"),
  playerCardClose: document.querySelector("#playerCardClose"),
  playerCardContent: document.querySelector("#playerCardContent"),
  stockCount: document.querySelector("#stockCount"),
  featuredGameCard: document.querySelector("#featuredGameCard"),
  topEdgeCard: document.querySelector("#topEdgeCard"),
  topBuyLowCard: document.querySelector("#topBuyLowCard"),
  marketStories: document.querySelector("#marketStories"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  boostFilter: document.querySelector("#boostFilter"),
  buyLowFilter: document.querySelector("#buyLowFilter"),
  stockRows: document.querySelector("#stockRows"),
  trendingList: document.querySelector("#trendingList"),
  buyLowList: document.querySelector("#buyLowList"),
  portfolioCash: document.querySelector("#portfolioCash"),
  portfolioInvested: document.querySelector("#portfolioInvested"),
  portfolioTotal: document.querySelector("#portfolioTotal"),
  portfolioReturn: document.querySelector("#portfolioReturn"),
  holdingsList: document.querySelector("#holdingsList"),
  leaderboardList: document.querySelector("#leaderboardList"),
  transactionList: document.querySelector("#transactionList")
};

const sortComparators = {
  projectedReturnDesc: (a, b) => b.projectedReturn - a.projectedReturn,
  currentPriceAsc: (a, b) => a.currentPrice - b.currentPrice,
  ownershipDesc: (a, b) => b.ownershipPercent - a.ownershipPercent,
  buyLowDesc: (a, b) => b.buyLowScore - a.buyLowScore,
  trendingDesc: (a, b) => b.trendingScore - a.trendingScore
};

const tutorialSteps = [
  {
    target: "#dashboard",
    title: "Dashboard",
    body: "Look at the glowing dashboard area for the current contest, market status, and the two featured player signals."
  },
  {
    target: ".sim-bar",
    title: "Week Simulator",
    body: "The highlighted simulator bar controls the test week. Advance Day applies games; Reset Sim starts over."
  },
  {
    target: "#marketStories",
    title: "Market Stories",
    body: "Start with these highlighted player cards. They show faces, teams, arrows, and quick reasons before you touch the data table."
  },
  {
    target: "#trending",
    title: "Trending",
    body: "This highlighted panel is for fast discovery. It shows market movers with player photos and trend arrows."
  },
  {
    target: "#buy-low",
    title: "Buy Low",
    body: "This highlighted panel surfaces possible discounts and explains why each player might be interesting."
  },
  {
    target: "#stocks",
    title: "Advanced Table",
    body: "Use this highlighted table only when you want the detailed numbers, filters, and precise buy controls."
  },
  {
    target: "#portfolio",
    title: "Portfolio",
    body: "The highlighted portfolio area shows cash, holdings, returns, weekly rank, and your transaction history."
  }
];

let tutorialIndex = 0;

bindEvents();
hydrate().catch(showFatalError);

function bindEvents() {
  elements.searchInput.addEventListener("input", debounce(renderSearch, 120));
  elements.sortSelect.addEventListener("change", renderSearch);
  elements.boostFilter.addEventListener("click", () => toggleFilter("boostEligible"));
  elements.buyLowFilter.addEventListener("click", () => toggleFilter("buyLowOnly"));
  elements.advanceDayButton.addEventListener("click", () => mutate("/api/sim/advance-day"));
  elements.resetSimButton.addEventListener("click", () => mutate("/api/sim/reset"));
  elements.googleDemoButton?.addEventListener("click", createGoogleDemoSession);
  elements.stockRows.addEventListener("click", handleStockAction);
  elements.marketStories.addEventListener("click", handleStockAction);
  elements.featuredGameCard?.addEventListener("click", handleFeaturedGameAction);
  elements.gameSlate?.addEventListener("click", handleGameSelection);
  elements.gameDetail?.addEventListener("click", handleGameDetailAction);
  elements.teamDirectory?.addEventListener("click", handleTeamSelection);
  elements.teamRoster?.addEventListener("click", handleGameDetailAction);
  elements.holdingsList.addEventListener("click", handleHoldingAction);
  elements.playerCardClose?.addEventListener("click", closePlayerCard);
  elements.playerCardContent?.addEventListener("click", handleStockAction);
  elements.playerCardOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.playerCardOverlay) closePlayerCard();
  });
  elements.tutorialButton.addEventListener("click", () => openTutorial(0));
  elements.tutorialClose.addEventListener("click", closeTutorial);
  elements.tutorialBack.addEventListener("click", () => moveTutorial(-1));
  elements.tutorialNext.addEventListener("click", () => moveTutorial(1));
  elements.tutorialOverlay.addEventListener("click", (event) => {
    if (event.target === elements.tutorialOverlay) closeTutorial();
  });
  document.addEventListener(
    "error",
    (event) => {
      if (event.target instanceof HTMLImageElement && event.target.dataset.fallback) {
        event.target.src = event.target.dataset.fallback;
        event.target.removeAttribute("data-fallback");
      }
    },
    true
  );
}

async function hydrate() {
  const snapshot = await fetchJson("/api/market/snapshot");
  applySnapshot(snapshot);
}

function applySnapshot(snapshot) {
  state.snapshot = snapshot;
  state.stocks = snapshot.stocks;

  elements.contestName.textContent = snapshot.contest.name;
  elements.fixtureNotice.textContent = snapshot.fixtureNotice;
  elements.budget.textContent = snapshot.contest.startingCoins.toLocaleString();
  elements.marketState.textContent = snapshot.marketStatus.isOpen ? "Open" : "Settled";
  elements.marketState.className = snapshot.marketStatus.isOpen ? "positive" : "negative";
  elements.marketReason.textContent = snapshot.marketStatus.reason;
  elements.simProgress.textContent = `${snapshot.sim.completedDays}/${snapshot.sim.totalDays} days complete`;
  elements.activeGames.textContent = snapshot.sim.activeDay
    ? `${snapshot.sim.progressLabel}: ${snapshot.sim.activeDay.games.map(formatGameLabel).join(", ")}`
    : "All scheduled test games have been applied.";
  elements.advanceDayButton.disabled = snapshot.sim.isSettled;
  elements.stockCount.textContent = `${snapshot.stocks.length} stocks`;

  const topEdge = [...snapshot.stocks].sort((a, b) => b.projectedReturn - a.projectedReturn)[0];
  const topBuyLow = snapshot.buyLow[0];
  renderFeaturedGame(snapshot);
  elements.topEdgeCard.innerHTML = renderDashboardPlayerCard(topEdge, "Projected edge");
  elements.topBuyLowCard.innerHTML = renderDashboardPlayerCard(topBuyLow, "Buy-low score");

  renderGames(snapshot);
  renderTeamDirectory(snapshot);
  renderSearch();
  renderMarketStories(snapshot);
  renderSignalList(elements.trendingList, snapshot.trending, "trendingScore");
  renderSignalList(elements.buyLowList, snapshot.buyLow, "buyLowScore");
  renderPortfolio(snapshot.portfolio);
  renderLeaderboard(snapshot.leaderboard);
  renderTransactions(snapshot.portfolio.transactions);
}

function renderSearch() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const sort = elements.sortSelect.value;
  const filtered = state.stocks.filter((stock) => {
    const text = [
      stock.playerName,
      stock.teamAbbreviation,
      stock.teamName,
      stock.position,
      stock.injuryStatus,
      stock.reasonTags.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    if (query && !text.includes(query)) return false;
    if (state.filters.boostEligible && !stock.loyaltyBoost.eligible) return false;
    if (state.filters.buyLowOnly && stock.buyLowScore < 70) return false;
    return true;
  });

  renderRows(filtered.sort(sortComparators[sort]));
}

function renderRows(stocks) {
  if (!stocks.length) {
    elements.stockRows.innerHTML = `
      <tr>
        <td colspan="10">
          <p class="empty-state">No player stocks match the current search and filters.</p>
        </td>
      </tr>
    `;
    return;
  }

  elements.stockRows.innerHTML = stocks
    .map((stock) => {
      const disabled = state.snapshot.sim.canTrade ? "" : "disabled";
      const avatar = playerImage(stock, "large");
      return `
        <tr>
          <td>
            <div class="player-cell">
              <button class="player-card-trigger" type="button" data-player-card="${stock.playerId}" aria-label="Open player card for ${stock.playerName}">
                ${avatar}
              </button>
              <div>
                <button class="link-button" type="button" data-player-card="${stock.playerId}">${stock.playerName}</button>
                <span class="subtle">${stock.position} · ${stock.injuryStatus}</span>
              </div>
            </div>
          </td>
          <td>${teamBadge(stock)}</td>
          <td>
            <strong>${stock.currentPrice.toFixed(2)}</strong>
            <span class="subtle ${stock.previousWeeksImpactPercent >= 0 ? "positive" : "negative"}">
              ${formatPriorImpact(stock.previousWeeksImpactPercent)} open
            </span>
            ${
              stock.loyaltyBoost.eligible
                ? `<span class="subtle">${stock.discountedBuyPrice.toFixed(2)} with boost</span>`
                : ""
            }
          </td>
          <td class="${stock.currentReturn >= 0 ? "positive" : "negative"}">${formatPercent(stock.currentReturn)}</td>
          <td>
            <strong>${stock.actualFantasyPoints} / ${stock.projectedFantasyPoints}</strong>
            ${
              stock.recentAverageFantasyPoints
                ? `<span class="subtle">${stock.priorWeeksIncluded}wk avg ${stock.recentAverageFantasyPoints} FP</span>`
                : ""
            }
          </td>
          <td>${stock.gamesPlayedThisWeek} / ${stock.gamesRemainingThisWeek}</td>
          <td>${stock.ownershipPercent}%</td>
          <td>
            ${trendPill(stock)}
          </td>
          <td>
            <div class="tag-row">
              ${indicatorChips(stock)}
            </div>
          </td>
          <td>
            <div class="trade-control">
              <input data-amount-for="${stock.playerId}" type="number" min="25" step="25" value="500" aria-label="Coins to buy ${stock.playerName}" ${disabled} />
              <button type="button" data-buy="${stock.playerId}" ${disabled}>Buy</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderMarketStories(snapshot) {
  const storyStocks = uniqueByPlayer([
    ...snapshot.trending.slice(0, 3),
    ...snapshot.buyLow.slice(0, 3),
    ...[...snapshot.stocks].sort((a, b) => b.projectedReturn - a.projectedReturn).slice(0, 2)
  ]).slice(0, 6);

  elements.marketStories.innerHTML = `
    <div class="section-heading story-heading">
      <div>
        <span class="eyebrow">Market stories</span>
        <h3>Players Moving The Week</h3>
      </div>
    </div>
    <div class="story-card-grid">
      ${storyStocks.map(renderStoryCard).join("")}
    </div>
  `;
}

function renderFeaturedGame(snapshot) {
  if (!elements.featuredGameCard) return;
  const activeDay = snapshot.sim.activeDay;
  const games = activeDay?.games ?? [];
  if (!games.length) return;

  const featured = [...games]
    .map((game) => ({
      game,
      stocks: stocksForGame(game.eventId, snapshot.stocks)
    }))
    .sort((a, b) => b.stocks.length - a.stocks.length)[0];

  const topNames = featured.stocks
    .slice(0, 3)
    .map((stock) => stock.playerName.split(" ").at(-1))
    .join(" · ");

  elements.featuredGameCard.innerHTML = `
    <img src="/assets/neutral-court.svg" alt="" aria-hidden="true" />
    <div class="featured-game-copy">
      <span class="eyebrow">Featured game</span>
      <h3>${featured.game.shortName ?? featured.game.name}</h3>
      <p>${activeDay.label} · ${featured.stocks.length} buyable stocks${topNames ? ` · ${topNames}` : ""}</p>
      <button type="button" data-game-jump="${featured.game.eventId}">View slate</button>
    </div>
  `;
}

function renderDashboardPlayerCard(stock, label) {
  const trend = trendDetails(stock);
  return `
    <div class="dashboard-player-main">
      <button class="player-card-trigger" type="button" data-player-card="${stock.playerId}" aria-label="Open player card for ${stock.playerName}">
        ${playerImage(stock, "feature")}
      </button>
      <div>
        <button class="link-button player-name-link" type="button" data-player-card="${stock.playerId}">${stock.playerName}</button>
        <span class="subtle">${teamBadge(stock)} · ${label}</span>
      </div>
    </div>
    <div class="dashboard-player-stats">
      ${trendPill(stock)}
      <span class="${stock.projectedReturn >= 0 ? "positive" : "negative"}">${formatPercent(stock.projectedReturn)} proj</span>
      <span class="${stock.previousWeeksImpactPercent >= 0 ? "positive" : "negative"}">${formatPercent(stock.previousWeeksImpactPercent)} prior</span>
      ${stock.reliabilityCarryPercent > 0 ? `<span class="positive">${formatPercent(stock.reliabilityCarryPercent)} carry</span>` : ""}
      <span>${stock.gamesRemainingThisWeek} games left</span>
    </div>
  `;
}

function renderStoryCard(stock) {
  const trend = trendDetails(stock);
  return `
    <article class="story-card" style="--team-color: ${stock.teamColor ?? "#49d6e8"}">
      <div class="story-card-media">
        ${playerImage(stock, "feature")}
        <div class="story-card-badge">${teamBadge(stock)}</div>
      </div>
      <div class="story-card-body">
        <div class="story-card-title">
          <button class="link-button player-name-link" type="button" data-player-card="${stock.playerId}">${stock.playerName}</button>
          ${trendPill(stock)}
        </div>
        <div class="story-metrics">
          <span>${formatPercent(stock.currentReturn)} live</span>
          <span class="${stock.previousWeeksImpactPercent >= 0 ? "positive" : "negative"}">${formatPriorImpact(stock.previousWeeksImpactPercent)} open</span>
          <span>${stock.actualFantasyPoints}/${stock.projectedFantasyPoints} FP</span>
          ${stock.recentAverageFantasyPoints ? `<span>${stock.priorWeeksIncluded}wk ${stock.recentAverageFantasyPoints} avg</span>` : ""}
          <span>${stock.ownershipPercent}% own</span>
        </div>
        <div class="tag-row">${indicatorChips(stock)}</div>
        <button type="button" data-buy="${stock.playerId}" data-default-amount="500">Buy 500</button>
      </div>
    </article>
  `;
}

function renderGames(snapshot) {
  if (!elements.gameSlate || !elements.gameDetail) return;
  const activeDay = snapshot.sim.activeDay;
  const games = activeDay?.games ?? [];
  if (!games.length) {
    elements.gameSlate.innerHTML = `<p class="empty-state">No games remain in this replay week.</p>`;
    elements.gameDetail.innerHTML = "";
    return;
  }

  if (!state.selectedGameId || !games.some((game) => String(game.eventId) === String(state.selectedGameId))) {
    state.selectedGameId = String(games[0].eventId);
  }

  elements.gameSlate.innerHTML = games
    .map((game) => {
      const active = String(game.eventId) === String(state.selectedGameId);
      const playerCount = stocksForGame(game.eventId, snapshot.stocks).length;
      return `
        <button class="game-card ${active ? "active" : ""}" type="button" data-game-id="${game.eventId}">
          <span class="game-status">Replay market</span>
          <span class="game-matchup">
            ${teamMini(game.awayTeam)}
            <span class="at-symbol">@</span>
            ${teamMini(game.homeTeam)}
          </span>
          <span class="subtle">${playerCount} buyable player stocks</span>
        </button>
      `;
    })
    .join("");

  const selectedGame = games.find((game) => String(game.eventId) === String(state.selectedGameId));
  const players = stocksForGame(state.selectedGameId, snapshot.stocks)
    .map((stock) => ({ stock }))
    .sort((a, b) => {
      if (a.stock.teamAbbreviation !== b.stock.teamAbbreviation) {
        return a.stock.teamAbbreviation.localeCompare(b.stock.teamAbbreviation);
      }
      return b.stock.projectedFantasyPoints - a.stock.projectedFantasyPoints;
    });

  const awayRows = players.filter((entry) => entry.stock.teamId === selectedGame.awayTeam?.id);
  const homeRows = players.filter((entry) => entry.stock.teamId === selectedGame.homeTeam?.id);

  elements.gameDetail.innerHTML = `
    <div class="game-detail-header">
      <div>
        <span class="eyebrow">${activeDay.label} · ${activeDay.date}</span>
        <h4>${selectedGame.name}</h4>
      </div>
      <span class="game-total">${players.length} player stocks</span>
    </div>
    <div class="game-team-grid">
      ${renderGameTeam(selectedGame.awayTeam, awayRows)}
      ${renderGameTeam(selectedGame.homeTeam, homeRows)}
    </div>
  `;
}

function renderTeamDirectory(snapshot) {
  if (!elements.teamDirectory || !elements.teamRoster) return;
  const teams = [...snapshot.teams].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
  if (!teams.length) {
    elements.teamDirectory.innerHTML = `<p class="empty-state">No teams are available in this replay.</p>`;
    elements.teamRoster.innerHTML = "";
    return;
  }

  if (
    !state.selectedTeamAbbreviation ||
    !teams.some((team) => team.abbreviation === state.selectedTeamAbbreviation)
  ) {
    state.selectedTeamAbbreviation = teams[0].abbreviation;
  }

  elements.teamDirectory.innerHTML = teams
    .map((team) => {
      const count = snapshot.stocks.filter((stock) => stock.teamAbbreviation === team.abbreviation).length;
      const active = team.abbreviation === state.selectedTeamAbbreviation;
      return `
        <button class="team-directory-card ${active ? "active" : ""}" type="button" data-team-abbreviation="${team.abbreviation}" style="--team-color: ${team.neutralColor ?? "#49d6e8"}">
          ${teamMini({
            abbreviation: team.abbreviation,
            color: team.neutralColor,
            logoUrl: team.logoUrl
          })}
          <span>${count} players</span>
        </button>
      `;
    })
    .join("");

  const selectedTeam = teams.find((team) => team.abbreviation === state.selectedTeamAbbreviation);
  const roster = snapshot.stocks
    .filter((stock) => stock.teamAbbreviation === state.selectedTeamAbbreviation)
    .sort((a, b) => b.projectedFantasyPoints - a.projectedFantasyPoints);

  elements.teamRoster.innerHTML = `
    <div class="team-roster-header" style="--team-color: ${selectedTeam?.neutralColor ?? "#49d6e8"}">
      <div>
        <span class="eyebrow">Available market players</span>
        <h4>${selectedTeam?.displayName ?? selectedTeam?.name ?? state.selectedTeamAbbreviation}</h4>
      </div>
      <strong>${roster.length} buyable stocks</strong>
    </div>
    <div class="team-roster-grid">
      ${roster.map(renderTeamRosterPlayer).join("")}
    </div>
  `;
}

function renderTeamRosterPlayer(stock) {
  const disabled = state.snapshot.sim.canTrade ? "" : "disabled";
  return `
    <article class="team-roster-player">
      <button class="player-card-trigger" type="button" data-player-card="${stock.playerId}" aria-label="Open player card for ${stock.playerName}">
        ${playerImage(stock, "small")}
      </button>
      <div>
        <button class="link-button" type="button" data-player-card="${stock.playerId}">${stock.playerName}</button>
        <span class="subtle">${stock.position} · ${stock.recentAverageFantasyPoints ?? "-"} recent FP avg</span>
      </div>
      ${trendPill(stock)}
      <button type="button" data-buy="${stock.playerId}" data-default-amount="250" ${disabled}>Buy</button>
    </article>
  `;
}

function renderGameTeam(team, rows) {
  return `
    <section class="game-team-panel" style="--team-color: ${team?.color ?? "#49d6e8"}">
      <header>
        ${teamMini(team)}
        <strong>${rows.length} stocks</strong>
      </header>
      <div class="game-player-list">
        ${
          rows.length
            ? rows.map(({ stock }) => renderGamePlayerRow(stock)).join("")
            : `<p class="empty-state">No scheduled player stocks found for this team.</p>`
        }
      </div>
    </section>
  `;
}

function renderGamePlayerRow(stock) {
  const disabled = state.snapshot.sim.canTrade ? "" : "disabled";
  return `
    <article class="game-player-row">
      <button class="player-card-trigger" type="button" data-player-card="${stock.playerId}" aria-label="Open player card for ${stock.playerName}">
        ${playerImage(stock, "small")}
      </button>
      <div>
        <button class="link-button" type="button" data-player-card="${stock.playerId}">${stock.playerName}</button>
        <span class="subtle">${stock.position} · ${stock.recentAverageFantasyPoints ?? "-"} recent FP avg · ${stock.gamesRemainingThisWeek} games left</span>
      </div>
      <div class="game-stat-strip">
        <span>${formatCoins(stock.currentPrice)}</span>
        <span>${formatPercent(stock.projectedReturn)} proj</span>
        ${stock.reliabilityCarryPercent > 0 ? `<span>${formatPercent(stock.reliabilityCarryPercent)} carry</span>` : ""}
      </div>
      <button type="button" data-buy="${stock.playerId}" data-default-amount="250" ${disabled}>Buy</button>
    </article>
  `;
}

function openPlayerCard(playerId) {
  const stock = state.stocks.find((entry) => entry.playerId === playerId);
  if (!stock || !elements.playerCardOverlay || !elements.playerCardContent) return;
  const disabled = state.snapshot.sim.canTrade ? "" : "disabled";
  const trend = trendDetails(stock);
  elements.playerCardContent.innerHTML = `
    <div class="player-card-hero" style="--team-color: ${stock.teamColor ?? "#49d6e8"}">
      ${playerImage(stock, "feature")}
      <div>
        <span class="eyebrow">${teamBadge(stock)} · ${stock.position}</span>
        <h3 id="playerCardTitle">${stock.playerName}</h3>
        <p>${stock.projectionBasis}</p>
      </div>
    </div>
    <div class="player-card-metrics">
      ${metricBox("Price", stock.currentPrice.toFixed(2))}
      ${metricBox("Projected", `${stock.projectedFantasyPoints} FP`)}
      ${metricBox("Actual", `${stock.actualFantasyPoints} FP`)}
      ${metricBox("Games left", stock.gamesRemainingThisWeek)}
      ${metricBox("Prior impact", formatPriorImpact(stock.previousWeeksImpactPercent))}
    </div>
    <div class="player-card-signals">
      ${trendPill(stock)}
      ${signalPill("Prior form", stock.priorFormScore, { min: 0, max: 100, icon: "↺" })}
      ${signalPill("Buy-low", stock.buyLowScore, { min: 0, max: 100, icon: "↓" })}
      ${signalPill("Stability", 100 - stock.volatilityRating, { min: 0, max: 100, icon: "σ" })}
      ${stock.reliabilityCarryPercent > 0 ? chip(`Blue-chip carry ${formatPercent(stock.reliabilityCarryPercent)}`, "chip-boost", "+") : ""}
    </div>
    <div class="price-chart-card">
      <div class="price-chart-heading">
        <span class="label">Stock price</span>
        <strong>${stock.currentPrice.toFixed(2)}</strong>
      </div>
      ${renderPriceChart(stock.priceHistory)}
    </div>
    ${stock.openingPriceBasis ? `<p class="player-card-copy">${stock.openingPriceBasis}</p>` : ""}
    <p class="player-card-copy">${stock.resultExplanation}</p>
    <div class="player-game-log">
      <h4>Revealed Game Log</h4>
      ${stock.gameLogs.length ? stock.gameLogs.map(renderPlayerGameLog).join("") : `<p class="empty-state">This replay has not advanced far enough to reveal this player's game result.</p>`}
    </div>
    <div class="trade-control player-card-trade">
      <input data-amount-for="${stock.playerId}" type="number" min="25" step="25" value="500" aria-label="Coins to buy ${stock.playerName}" ${disabled} />
      <button type="button" data-buy="${stock.playerId}" ${disabled}>Buy</button>
    </div>
  `;
  elements.playerCardOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("player-card-open");
}

function closePlayerCard() {
  elements.playerCardOverlay?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("player-card-open");
}

function renderPriceChart(history = []) {
  const points = history.length ? history : [];
  if (points.length < 2) {
    return `<p class="empty-state">Price history will build as the replay advances.</p>`;
  }

  const width = 640;
  const height = 180;
  const padding = 18;
  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = Math.max(maxPrice - minPrice, 1);
  const coordinates = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.price - minPrice) / range) * (height - padding * 2);
    return { ...point, x: roundForSvg(x), y: roundForSvg(y) };
  });
  const actualPoints = coordinates.filter((point) => point.kind !== "projected");
  const projectedStart = actualPoints.at(-1);
  const projectedPoint = coordinates.find((point) => point.kind === "projected");
  const actualLine = actualPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const projectedLine =
    projectedStart && projectedPoint ? `${projectedStart.x},${projectedStart.y} ${projectedPoint.x},${projectedPoint.y}` : "";
  const isUp = coordinates.at(-1).price >= coordinates[0].price;

  return `
    <svg class="price-chart ${isUp ? "up" : "down"}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Stock price history">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" />
      <polyline class="price-chart-line" points="${actualLine}" />
      ${projectedLine ? `<polyline class="price-chart-line projected" points="${projectedLine}" />` : ""}
      ${coordinates
        .map(
          (point) => `
            <circle class="${point.kind === "projected" ? "projected" : ""}" cx="${point.x}" cy="${point.y}" r="4">
              <title>${point.label}: ${point.price.toFixed(2)}</title>
            </circle>
          `
        )
        .join("")}
      <text x="${padding}" y="14">${maxPrice.toFixed(2)}</text>
      <text x="${padding}" y="${height - 4}">${minPrice.toFixed(2)}</text>
    </svg>
  `;
}

function renderPlayerGameLog(log) {
  return `
    <article class="player-log-row">
      <div>
        <strong>${log.eventShortName ?? log.eventName}</strong>
        <span class="subtle">${log.date} · ${formatMinutes(log.stats.minutes)} min</span>
      </div>
      <div class="game-stat-strip">
        <span>${log.stats.points} PTS</span>
        <span>${log.stats.rebounds} REB</span>
        <span>${log.stats.assists} AST</span>
        <span>${log.stats.steals} STL</span>
        <span>${log.stats.blocks} BLK</span>
      </div>
      <strong>${log.fantasyPoints} FP</strong>
    </article>
  `;
}

function metricBox(label, value) {
  return `
    <div>
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderPortfolio(portfolio) {
  elements.portfolioCash.textContent = formatCoins(portfolio.cash);
  elements.portfolioInvested.textContent = formatCoins(portfolio.investedValue);
  elements.portfolioTotal.textContent = formatCoins(portfolio.totalValue);
  elements.portfolioReturn.textContent = formatPercent(portfolio.netReturn);
  elements.portfolioReturn.className = portfolio.netReturn >= 0 ? "positive" : "negative";

  elements.holdingsList.innerHTML = portfolio.holdings.length
    ? portfolio.holdings
        .map(
          (holding) => `
            <article class="holding-item">
              <div>
                <div class="player-cell compact">
                  ${playerImage(holding, "small")}
                  <div>
                    <strong>${holding.playerName}</strong>
                    <span class="subtle">${holding.teamAbbreviation} · ${holding.shares.toFixed(3)} shares @ ${holding.averageEntryPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <strong>${formatCoins(holding.currentValue)}</strong>
                <span class="${holding.unrealizedReturn >= 0 ? "positive" : "negative"}">${formatPercent(holding.unrealizedReturn)}</span>
              </div>
              <button type="button" data-sell="${holding.playerId}" ${state.snapshot.sim.canTrade ? "" : "disabled"}>Sell</button>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No holdings yet. Buy stocks from the market table to start the sim.</p>`;
}

function renderLeaderboard(rows) {
  elements.leaderboardList.innerHTML = rows
    .map(
      (row) => `
        <article class="leaderboard-row ${row.isCurrentUser ? "current-user" : ""}">
          <span>#${row.rank}</span>
          <strong>${row.displayName}</strong>
          <span>${formatCoins(row.totalValue)}</span>
          <span class="${row.netReturn >= 0 ? "positive" : "negative"}">${formatPercent(row.netReturn)}</span>
        </article>
      `
    )
    .join("");
}

function renderTransactions(transactions) {
  elements.transactionList.innerHTML = transactions.length
    ? transactions
        .map(
          (transaction) => `
            <article class="transaction-row">
              <span class="tag">${transaction.type}</span>
              <strong>${transaction.playerName}</strong>
              <span>${transaction.shares.toFixed(3)} shares</span>
              <span>${formatCoins(transaction.coins)}</span>
              <span class="subtle">${new Date(transaction.createdAt).toLocaleString()}</span>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">Trades will appear here with server timestamps.</p>`;
}

function renderSignalList(target, stocks, scoreKey) {
  target.innerHTML = stocks
    .map(
      (stock) => {
        return `
        <article class="signal-item">
          <header>
            <div class="player-cell compact">
              <button class="player-card-trigger" type="button" data-player-card="${stock.playerId}" aria-label="Open player card for ${stock.playerName}">
                ${playerImage(stock, "small")}
              </button>
              <div>
                <button class="link-button" type="button" data-player-card="${stock.playerId}">${stock.playerName}</button>
                <span class="subtle">${teamBadge(stock)}</span>
              </div>
            </div>
            ${scoreKey === "trendingScore" ? trendPill(stock) : signalPill("Buy-low", stock[scoreKey], { min: 0, max: 100, icon: "↓" })}
          </header>
          <p>${stock.resultExplanation}</p>
          <div class="tag-row">
            ${indicatorChips(stock)}
          </div>
        </article>
      `;
      }
    )
    .join("");
}

async function handleStockAction(event) {
  const cardPlayerId = event.target.closest("[data-player-card]")?.dataset.playerCard;
  if (cardPlayerId) {
    openPlayerCard(cardPlayerId);
    return;
  }
  const playerId = event.target.dataset.buy;
  if (!playerId) return;
  const amountInput = document.querySelector(`[data-amount-for="${playerId}"]`);
  const defaultAmount = Number(event.target.dataset.defaultAmount ?? 500);
  await mutate("/api/trades/buy", {
    playerId,
    amountCoins: amountInput ? Number(amountInput.value) : defaultAmount
  });
}

async function handleGameDetailAction(event) {
  const cardPlayerId = event.target.closest("[data-player-card]")?.dataset.playerCard;
  if (cardPlayerId) {
    openPlayerCard(cardPlayerId);
    return;
  }
  await handleStockAction(event);
}

function handleGameSelection(event) {
  const gameId = event.target.closest("[data-game-id]")?.dataset.gameId;
  if (!gameId) return;
  state.selectedGameId = gameId;
  renderGames(state.snapshot);
}

function handleFeaturedGameAction(event) {
  const gameId = event.target.closest("[data-game-jump]")?.dataset.gameJump;
  if (!gameId) return;
  state.selectedGameId = gameId;
  renderGames(state.snapshot);
  document.querySelector("#games")?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function handleTeamSelection(event) {
  const abbreviation = event.target.closest("[data-team-abbreviation]")?.dataset.teamAbbreviation;
  if (!abbreviation) return;
  state.selectedTeamAbbreviation = abbreviation;
  renderTeamDirectory(state.snapshot);
}

async function handleHoldingAction(event) {
  const playerId = event.target.dataset.sell;
  if (!playerId) return;
  await mutate("/api/trades/sell", {
    playerId,
    shares: "all"
  });
}

async function mutate(path, body) {
  try {
    const snapshot = await fetchJson(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : "{}"
    });
    applySnapshot(snapshot);
  } catch (error) {
    window.alert(error.message);
  }
}

async function createGoogleDemoSession() {
  try {
    const result = await fetchJson("/api/auth/google-demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    elements.googleDemoButton.innerHTML = `
      <span aria-hidden="true">G</span>
      <strong>${result.user.name}</strong>
    `;
  } catch (error) {
    window.alert(error.message);
  }
}

function toggleFilter(key) {
  state.filters[key] = !state.filters[key];
  elements.boostFilter.setAttribute("aria-pressed", String(state.filters.boostEligible));
  elements.buyLowFilter.setAttribute("aria-pressed", String(state.filters.buyLowOnly));
  renderSearch();
}

function openTutorial(index) {
  tutorialIndex = index;
  elements.tutorialOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("tutorial-open");
  renderTutorialStep();
}

function closeTutorial() {
  elements.tutorialOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("tutorial-open");
  clearTutorialHighlight();
}

function moveTutorial(direction) {
  if (tutorialIndex + direction >= tutorialSteps.length) {
    closeTutorial();
    return;
  }
  tutorialIndex = Math.max(0, tutorialIndex + direction);
  renderTutorialStep();
}

function renderTutorialStep() {
  const step = tutorialSteps[tutorialIndex];
  elements.tutorialCounter.textContent = `Step ${tutorialIndex + 1} of ${tutorialSteps.length}`;
  elements.tutorialTitle.textContent = step.title;
  elements.tutorialBody.textContent = step.body;
  elements.tutorialBack.disabled = tutorialIndex === 0;
  elements.tutorialNext.textContent = tutorialIndex === tutorialSteps.length - 1 ? "Finish" : "Next";
  clearTutorialHighlight();
  const target = document.querySelector(step.target);
  if (target) {
    target.classList.add("tutorial-highlight");
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

function clearTutorialHighlight() {
  document
    .querySelectorAll(".tutorial-highlight")
    .forEach((element) => element.classList.remove("tutorial-highlight"));
}

function indicatorChips(stock) {
  const trend = trendDetails(stock);
  const chips = [
    scoreChip(trend.label, stock.trendingScore, -100, 100, trend.arrow),
    scoreChip("Prior form", stock.priorFormScore ?? 50, 0, 100, "↺"),
    stock.buyLowScore >= 75
      ? scoreChip("Buy low", stock.buyLowScore, 0, 100, "↓")
      : stock.buyLowScore >= 60
        ? scoreChip("Watch", stock.buyLowScore, 0, 100, "!")
        : null,
    stock.loyaltyBoost.eligible ? chip("Boost", "chip-boost", "%") : null,
    stock.volatilityRating >= 65
      ? scoreChip("High vol", 100 - stock.volatilityRating, 0, 100, "!")
      : stock.volatilityRating <= 35
        ? scoreChip("Stable", 100 - stock.volatilityRating, 0, 100, "→")
        : null,
    stock.gamesRemainingThisWeek >= 3 ? chip(`${stock.gamesRemainingThisWeek} games`, "chip-schedule", "+") : null,
    stock.recentAverageFantasyPoints
      ? chip(`${stock.priorWeeksIncluded}wk avg ${stock.recentAverageFantasyPoints}`, "chip-history", "↺")
      : null,
    ...stock.reasonTags.slice(0, 2).map((tag) => chip(tag, "chip-neutral", ""))
  ].filter(Boolean);

  return chips.join("");
}

function chip(label, className, icon) {
  return `<span class="tag indicator-chip ${className}">${icon ? `<span aria-hidden="true">${icon}</span>` : ""}${label}</span>`;
}

function scoreChip(label, value, min, max, icon) {
  const color = scoreColor(value, min, max);
  return `<span class="tag indicator-chip spectrum-chip" style="--score-color: ${color}">${icon ? `<span aria-hidden="true">${icon}</span>` : ""}${label}</span>`;
}

function stocksForGame(eventId, stocks = state.stocks) {
  return stocks.filter((stock) =>
    (stock.scheduledGameLogs ?? stock.gameLogs ?? []).some((log) => String(log.eventId) === String(eventId))
  );
}

function trendPill(stock) {
  const trend = trendDetails(stock);
  return `
    <span class="trend-pill ${trend.className}" title="${trend.title}: ${Math.round(stock.trendingScore)}">
      <span aria-hidden="true">${trend.arrow}</span>
      <span>${trend.label}</span>
    </span>
  `;
}

function signalPill(label, value, { min = 0, max = 100, icon = "" } = {}) {
  const quality = signalQuality(value, min, max);
  return `
    <span class="trend-pill signal-pill ${quality.className}" title="${label}: ${Math.round(value)}">
      ${icon ? `<span aria-hidden="true">${icon}</span>` : ""}
      <span>${label} ${quality.label}</span>
    </span>
  `;
}

function signalQuality(value, min = 0, max = 100) {
  const normalized = clamp((value - min) / (max - min), 0, 1);
  if (normalized >= 0.72) return { label: "strong", className: "trend-up" };
  if (normalized <= 0.32) return { label: "weak", className: "trend-down" };
  return { label: "watch", className: "trend-flat" };
}

function scoreColor(value, min = 0, max = 100) {
  const normalized = clamp((value - min) / (max - min), 0, 1);
  const hue = Math.round(normalized * 122);
  const lightness = Math.round(45 + normalized * 7);
  return `hsl(${hue} 86% ${lightness}%)`;
}

function trendDetails(stock) {
  if (stock.trendingScore >= 60 || stock.currentReturn > 0.03) {
    return {
      arrow: "↑",
      className: "trend-up",
      chipClassName: "chip-trend-up",
      label: "Rising",
      title: "Trending up"
    };
  }
  if (stock.trendingScore <= -35 || stock.currentReturn < -0.08) {
    return {
      arrow: "↓",
      className: "trend-down",
      chipClassName: "chip-trend-down",
      label: "Falling",
      title: "Trending down"
    };
  }
  return {
    arrow: "→",
    className: "trend-flat",
    chipClassName: "chip-trend-flat",
    label: "Steady",
    title: "Steady trend"
  };
}

function teamBadge(stock) {
  const fallback = teamFallbackDataUri(stock);
  const logo = stock.teamLogoUrl
    ? `<img class="team-logo" src="${stock.teamLogoUrl}" data-fallback="${fallback}" alt="${stock.teamAbbreviation} logo" />`
    : `<img class="team-logo" src="${fallback}" alt="${stock.teamAbbreviation} logo" />`;

  return `
    <span class="team-badge" style="--team-color: ${stock.teamColor ?? "#49d6e8"}">
      <span class="team-mark">${logo}</span>
      <span>${stock.teamAbbreviation}</span>
    </span>
  `;
}

function teamMini(team = {}) {
  const fallback = teamFallbackDataUri({
    teamColor: team.color,
    teamAbbreviation: team.abbreviation
  });
  const logo = team.logoUrl
    ? `<img class="team-logo" src="${team.logoUrl}" data-fallback="${fallback}" alt="${team.abbreviation} logo" />`
    : `<img class="team-logo" src="${fallback}" alt="${team.abbreviation} logo" />`;
  return `
    <span class="team-badge" style="--team-color: ${team.color ?? "#49d6e8"}">
      <span class="team-mark">${logo}</span>
      <span>${team.abbreviation ?? "TBD"}</span>
    </span>
  `;
}

function playerImage(stock, size) {
  const fallback = avatarDataUri(stock);
  const src = stock.headshotUrl ?? fallback;
  const sizeClass = size === "small" ? " small" : size === "feature" ? " feature" : "";
  const label = stock.headshotUrl
    ? `${stock.playerName} headshot`
    : `Generated avatar for ${stock.playerName}`;
  return `<img class="player-avatar${sizeClass}" src="${src}" data-fallback="${fallback}" alt="${label}" />`;
}

function uniqueByPlayer(stocks) {
  const seen = new Set();
  return stocks.filter((stock) => {
    if (seen.has(stock.playerId)) return false;
    seen.add(stock.playerId);
    return true;
  });
}

function formatGameLabel(game) {
  return typeof game === "string" ? game : (game.shortName ?? game.name ?? "Game");
}

function formatMinutes(value) {
  return Number.isFinite(value) ? `${Math.round(value)}` : "-";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function teamFallbackDataUri(stock) {
  const color = stock.teamColor ?? "#49d6e8";
  const abbreviation = stock.teamAbbreviation ?? "HF";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="40" fill="${color}"/>
      <circle cx="40" cy="40" r="30" fill="none" stroke="#ffffff" stroke-width="5" opacity=".45"/>
      <text x="40" y="47" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#071018">${abbreviation}</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function avatarDataUri(stock) {
  const seed = hashString(stock.playerId ?? stock.playerName);
  const jersey = stock.teamColor ?? palette[seed % palette.length];
  const skin = skinTones[seed % skinTones.length];
  const hair = hairTones[(seed >> 2) % hairTones.length];
  const initialsText = initials(stock.playerName);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="18" fill="#111923"/>
      <circle cx="40" cy="32" r="18" fill="${skin}"/>
      <path d="M22 30c3-16 30-20 36-3-8-7-22-8-36 3z" fill="${hair}"/>
      <circle cx="34" cy="34" r="2" fill="#10151d"/>
      <circle cx="46" cy="34" r="2" fill="#10151d"/>
      <path d="M34 43c4 3 8 3 12 0" fill="none" stroke="#10151d" stroke-width="2" stroke-linecap="round"/>
      <path d="M15 76c3-20 47-20 50 0z" fill="${jersey}"/>
      <text x="40" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#081018">${initialsText}</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function showFatalError(error) {
  console.error(error);
  elements.stockRows.innerHTML = `
    <tr>
      <td colspan="10">
        <p class="empty-state error-state">Could not load the test market: ${escapeHtml(error.message)}. The Guide button still works.</p>
      </td>
    </tr>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const palette = ["#49d6e8", "#42d392", "#f7c948", "#ff6b6b", "#8ecae6", "#a0c4ff"];
const skinTones = ["#c98b5f", "#9f6748", "#d7a071", "#7c5139", "#e1b287"];
const hairTones = ["#17120f", "#2a1a12", "#4b3020", "#111827"];

function hashString(value) {
  return [...String(value)].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

async function fetchJson(path, options) {
  const response = await fetch(path, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed: ${path}`);
  }
  return payload;
}

function formatCoins(value) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatPercent(value) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function formatPriorImpact(value) {
  return `Prior ${formatPercent(value ?? 0)}`;
}

function roundForSvg(value) {
  return Math.round(value * 100) / 100;
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function debounce(callback, wait) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), wait);
  };
}
