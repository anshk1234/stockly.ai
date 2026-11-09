import React from "react";

interface FinancialDisclaimerProps {
  className?: string;
}

export function FinancialDisclaimer({ className = "" }: FinancialDisclaimerProps) {
  return (
    <div className={`text-[11px] leading-[1.65] text-neutral-400/80 px-1 pt-1 font-normal ${className}`}>
      Financial information provided by{" "}
      <a
        href="https://site.financialmodelingprep.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 decoration-white/20 hover:text-white transition-colors"
      >
        Financial Modeling Prep
      </a>
      . Options data provided by Unusual Whales. Earnings transcripts, audio, and documents provided by Quartr. Reported
      revenue and EPS data from Earnings powered by{" "}
      <a
        href="https://fiscal.ai/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 decoration-white/20 hover:text-white transition-colors"
      >
        Fiscal.ai
      </a>
      . Estimates provided by{" "}
      <a
        href="https://www.factset.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 decoration-white/20 hover:text-white transition-colors"
      >
        FactSet
      </a>
      . Prediction markets data from{" "}
      <a
        href="https://polymarket.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 decoration-white/20 hover:text-white transition-colors"
      >
        Polymarket
      </a>
      . Charting for Stockly Finance financial visualizations provided by{" "}
      <a
        href="https://www.tradingview.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 decoration-white/20 hover:text-white transition-colors"
      >
        TradingView
      </a>
      , where applicable. All data is provided for informational purposes only, and is not intended for trading
      purposes or financial, investment, tax, legal, accounting or other advice.
    </div>
  );
}
