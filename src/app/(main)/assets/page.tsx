import InvestmentPerformance from "../analysis/InvestmentPerformance";
import AssetsOverview from "./AssetsOverview";
import AssetsTabs from "./AssetsTabs";

export const dynamic = "force-dynamic";

export default function AssetsPage() {
  return (
    <AssetsTabs
      overview={<AssetsOverview />}
      performance={<InvestmentPerformance />}
    />
  );
}
