const PATCH_TOKEN = 'module_public_dashboard_responsive_polish_001';
const STYLE_ID = `${PATCH_TOKEN}_style`;

function installResponsivePolishStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html, body {
        max-width: 100%;
        overflow-x: hidden;
      }
      .harnessShell,
      .moduleMarketTapeCard,
      .moduleBriefingCard,
      .moduleMarketTapeSelectedDetail,
      .moduleChartGuide,
      #chart {
        box-sizing: border-box;
      }
      .controls {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(142px, 1fr));
        gap: 10px;
        align-items: end;
      }
      .controls .control,
      .controls select {
        min-width: 0;
        width: 100%;
      }
      .moduleMarketTapeCard,
      .moduleBriefingCard,
      .moduleMarketTapeSelectedDetail,
      .moduleChartGuide,
      #chart {
        max-width: 100%;
      }
      .moduleMarketTapeItem,
      .moduleBriefingGrid section,
      .moduleChartGuideCard,
      .moduleMarketTapeBriefingStructureHero,
      .moduleMarketTapeBriefingSignalState,
      .moduleMarketTapeTrendWidget {
        min-width: 0;
        overflow-wrap: anywhere;
      }
      #chart {
        overflow: hidden;
      }
      #chart .plot-container,
      #chart .svg-container,
      #chart .main-svg {
        max-width: 100% !important;
      }
      @media (max-width: 1180px) {
        .harnessShell {
          padding: 18px;
        }
        .moduleMarketTapeGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (max-width: 900px) {
        .harnessShell {
          padding: 14px;
        }
        .harnessBanner {
          padding: 12px 14px;
        }
        .harnessBanner h1 {
          font-size: 18px;
        }
        .controls {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .moduleMarketTapeGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .moduleMarketTapeHeader,
        .moduleBriefingHeader {
          gap: 10px;
        }
        #chart {
          min-height: 640px;
        }
      }
      @media (max-width: 720px) {
        .harnessShell {
          padding: 10px;
        }
        .harnessBanner h1 {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 17px;
        }
        .harnessBanner p {
          font-size: 12px;
          line-height: 1.4;
        }
        .controls {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .controls label {
          font-size: 10px;
        }
        .controls select {
          min-height: 36px;
        }
        .moduleMarketTapeCard,
        .moduleBriefingCard,
        .moduleMarketTapeSelectedDetail {
          padding: 12px;
        }
        .moduleMarketTapeHeader,
        .moduleBriefingHeader {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .moduleMarketTapePill,
        .moduleBriefingSource {
          justify-self: start;
        }
        .moduleMarketTapeHeader h2,
        .moduleBriefingHeader h2 {
          font-size: 16px;
        }
        .moduleMarketTapeFilters {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
        }
        .moduleMarketTapeFilterChip {
          flex: 0 0 auto;
        }
        .moduleMarketTapeGrid,
        .moduleBriefingGrid,
        .moduleChartGuideGrid {
          grid-template-columns: 1fr;
        }
        .moduleMarketTapeItem {
          min-height: auto;
        }
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact {
          grid-template-columns: 1fr !important;
        }
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact .moduleMarketTapeTrendWidget {
          grid-column: 1 / -1;
        }
        .moduleChartGuide summary {
          align-items: flex-start;
          display: grid;
          grid-template-columns: 1fr auto;
          row-gap: 4px;
        }
        .moduleChartGuide summary em {
          grid-column: 1 / -1;
          font-size: 10px;
        }
        #chart {
          min-height: 560px;
          margin-top: 10px;
        }
      }
      @media (max-width: 460px) {
        .harnessShell {
          padding: 8px;
        }
        .controls {
          grid-template-columns: 1fr;
        }
        .moduleMarketTapeCard,
        .moduleBriefingCard,
        .moduleMarketTapeSelectedDetail,
        .moduleChartGuide {
          border-radius: 12px;
        }
        .moduleBriefingGrid section,
        .moduleChartGuideCard {
          min-height: auto;
        }
        .moduleMarketTapeItemTop {
          align-items: flex-start;
          display: grid;
          grid-template-columns: 1fr auto;
        }
        .moduleMarketTapeTags span {
          font-size: 9px;
        }
        .moduleChartGuide summary {
          padding: 10px 12px;
        }
        .moduleChartGuideGrid {
          padding: 0 12px 12px;
        }
        .moduleChartGuideNote {
          margin: 0 12px 12px;
        }
        #chart {
          min-height: 500px;
          border-radius: 12px;
        }
      }
    `;
    document.head.appendChild(style);
}

function startPublicDashboardResponsivePolish() {
    installResponsivePolishStyle();
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-public-responsive-polish', PATCH_TOKEN);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPublicDashboardResponsivePolish);
} else {
    startPublicDashboardResponsivePolish();
}

export { PATCH_TOKEN, installResponsivePolishStyle, startPublicDashboardResponsivePolish };
