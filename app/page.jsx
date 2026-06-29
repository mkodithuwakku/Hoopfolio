import Script from "next/script";

export default function HomePage() {
  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">HF</div>
            <div>
              <h1>Hoopfolio</h1>
              <p>Build your NBA player portfolio.</p>
            </div>
          </div>
          <nav className="nav-list" aria-label="Primary">
            <a href="#dashboard" className="active">
              Dashboard
            </a>
            <a href="#games">Games</a>
            <a href="#stocks">Stocks</a>
            <a href="#trending">Trending</a>
            <a href="#buy-low">Buy Low</a>
            <a href="#portfolio">Portfolio</a>
          </nav>
          <button id="tutorialButton" className="help-button" type="button" aria-label="Open Hoopfolio tutorial">
            <span aria-hidden="true">i</span>
            <strong>Guide</strong>
          </button>
          <button id="googleDemoButton" className="auth-button" type="button">
            <span aria-hidden="true">G</span>
            <strong>Google sign-in demo</strong>
          </button>
          <div className="lock-panel">
            <span className="label">Market</span>
            <strong id="marketState">Loading</strong>
            <p id="marketReason">Reading local cache.</p>
          </div>
        </aside>

        <main id="dashboard" className="workspace">
          <section className="topbar">
            <div>
              <span className="eyebrow">Prototype week</span>
              <h2 id="contestName">Hoopfolio Market</h2>
              <p id="fixtureNotice" className="fixture-notice">
                Local test fixture.
              </p>
            </div>
            <div className="metrics-strip">
              <div>
                <span>Budget</span>
                <strong id="budget">-</strong>
              </div>
              <div>
                <span>Data</span>
                <strong>Local</strong>
              </div>
              <div>
                <span>API calls</span>
                <strong>0</strong>
              </div>
            </div>
          </section>

          <section className="sim-bar">
            <div>
              <span className="label">Week simulator</span>
              <strong id="simProgress">Loading</strong>
              <p id="activeGames">Preparing local test market.</p>
            </div>
            <div className="sim-actions">
              <button id="advanceDayButton" type="button">
                Advance Day
              </button>
              <button id="resetSimButton" type="button">
                Reset Sim
              </button>
            </div>
          </section>

          <section id="games" className="tool-surface games-surface">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Today&apos;s slate</span>
                <h3>Games And Player Stocks</h3>
              </div>
            </div>
            <div id="gameSlate" className="game-slate"></div>
            <div id="gameDetail" className="game-detail"></div>
          </section>

          <section className="dashboard-grid">
            <div className="market-visual">
              <img src="/assets/neutral-court.svg" alt="" aria-hidden="true" />
              <div className="market-visual-copy">
                <span>Live stock board</span>
                <strong id="stockCount">- stocks</strong>
              </div>
            </div>
            <div className="leader-card visual-leader-card">
              <span className="label">Current top projected edge</span>
              <div id="topEdgeCard" className="dashboard-player-card"></div>
            </div>
            <div className="leader-card visual-leader-card">
              <span className="label">Best buy-low signal</span>
              <div id="topBuyLowCard" className="dashboard-player-card"></div>
            </div>
          </section>

          <section className="market-stories" id="marketStories"></section>

          <section id="stocks" className="tool-surface">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Advanced market</span>
                <h3>Player Stock Table</h3>
              </div>
              <div className="controls">
                <input id="searchInput" type="search" placeholder="Search player, team, tag" />
                <select id="sortSelect" aria-label="Sort stocks" defaultValue="projectedReturnDesc">
                  <option value="projectedReturnDesc">Projected return</option>
                  <option value="currentPriceAsc">Price low to high</option>
                  <option value="ownershipDesc">Ownership</option>
                  <option value="buyLowDesc">Buy-low score</option>
                  <option value="trendingDesc">Trending</option>
                </select>
                <button id="boostFilter" type="button" aria-pressed="false">
                  Boost
                </button>
                <button id="buyLowFilter" type="button" aria-pressed="false">
                  Buy Low
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Price</th>
                    <th>Return</th>
                    <th>Proj FP</th>
                    <th>Games</th>
                    <th>Own</th>
                    <th>Trend</th>
                    <th>Signals</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="stockRows"></tbody>
              </table>
            </div>
          </section>

          <section className="split-grid">
            <div id="trending" className="tool-surface">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Trending</span>
                  <h3>Market Movers</h3>
                </div>
              </div>
              <div id="trendingList" className="signal-list"></div>
            </div>

            <div id="buy-low" className="tool-surface">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Discovery</span>
                  <h3>Buy-Low Candidates</h3>
                </div>
              </div>
              <div id="buyLowList" className="signal-list"></div>
            </div>
          </section>

          <section className="split-grid">
            <div id="portfolio" className="tool-surface portfolio-surface">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Portfolio</span>
                  <h3>Local Test State</h3>
                </div>
              </div>
              <div className="portfolio-grid">
                <div>
                  <span>Cash</span>
                  <strong id="portfolioCash">-</strong>
                </div>
                <div>
                  <span>Invested</span>
                  <strong id="portfolioInvested">-</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong id="portfolioTotal">-</strong>
                </div>
                <div>
                  <span>Return</span>
                  <strong id="portfolioReturn">-</strong>
                </div>
              </div>
              <div className="holdings-list" id="holdingsList"></div>
            </div>

            <div className="tool-surface">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Leaderboard</span>
                  <h3>Weekly Rank</h3>
                </div>
              </div>
              <div className="leaderboard-list" id="leaderboardList"></div>
            </div>
          </section>

          <section className="tool-surface">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Audit trail</span>
                <h3>Transactions</h3>
              </div>
            </div>
            <div id="transactionList" className="transaction-list"></div>
          </section>
        </main>
      </div>

      <div id="tutorialOverlay" className="tutorial-overlay" aria-hidden="true">
        <section className="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
          <button id="tutorialClose" className="icon-button close-button" type="button" aria-label="Close tutorial">
            x
          </button>
          <span id="tutorialCounter" className="eyebrow">
            Step 1 of 7
          </span>
          <h3 id="tutorialTitle">Welcome to Hoopfolio</h3>
          <p id="tutorialBody">Build a weekly player-stock portfolio, advance the test week, and climb the leaderboard.</p>
          <div className="tutorial-actions">
            <button id="tutorialBack" type="button">
              Back
            </button>
            <button id="tutorialNext" type="button">
              Next
            </button>
          </div>
        </section>
      </div>

      <div id="playerCardOverlay" className="player-card-overlay" aria-hidden="true">
        <section className="player-card-modal" role="dialog" aria-modal="true" aria-labelledby="playerCardTitle">
          <button id="playerCardClose" className="icon-button close-button" type="button" aria-label="Close player card">
            x
          </button>
          <div id="playerCardContent"></div>
        </section>
      </div>

      <Script src="/main.js?v=2026-06-29-game-slate" type="module" strategy="afterInteractive" />
    </>
  );
}
