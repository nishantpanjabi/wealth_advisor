package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.response.FundNavSnapshotResponse;
import com.wealthadvisor.backend.dto.response.MarketDataSnapshotResponse;
import com.wealthadvisor.backend.dto.response.MarketDataSummaryResponse;
import com.wealthadvisor.backend.entity.FundNavSnapshot;
import com.wealthadvisor.backend.entity.MarketDataSnapshot;
import com.wealthadvisor.backend.repository.FundNavSnapshotRepository;
import com.wealthadvisor.backend.repository.MarketDataSnapshotRepository;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarketDataIngestionService {

    private final MarketDataSnapshotRepository marketDataSnapshotRepository;
    private final FundNavSnapshotRepository fundNavSnapshotRepository;
    private final Path marketDataCsvPath;
    private final Path navHistoryCsvPath;

    public MarketDataIngestionService(
            MarketDataSnapshotRepository marketDataSnapshotRepository,
            FundNavSnapshotRepository fundNavSnapshotRepository,
            @Value("${app.market-data.market-csv-path:../recommendation-ml-service/data/market_data.csv}") String marketDataCsvPath,
            @Value("${app.market-data.nav-csv-path:../recommendation-ml-service/data/nav_history.csv}") String navHistoryCsvPath
    ) {
        this.marketDataSnapshotRepository = marketDataSnapshotRepository;
        this.fundNavSnapshotRepository = fundNavSnapshotRepository;
        this.marketDataCsvPath = Path.of(marketDataCsvPath).normalize();
        this.navHistoryCsvPath = Path.of(navHistoryCsvPath).normalize();
    }

    @Transactional
    public MarketDataSummaryResponse refreshAll() {
        ingestMarketSnapshots();
        ingestNavHistory();
        return getSummary();
    }

    @Transactional
    public void ingestMarketSnapshots() {
        try {
            List<String> lines = Files.readAllLines(marketDataCsvPath);
            for (int i = 1; i < lines.size(); i++) {
                String line = lines.get(i).trim();
                if (line.isBlank()) {
                    continue;
                }
                String[] parts = line.split(",", -1);
                LocalDate asOfDate = LocalDate.parse(parts[0].trim());
                String assetClass = parts[1].trim().toUpperCase();
                if (marketDataSnapshotRepository.existsByAssetClassAndAsOfDateAndSource(assetClass, asOfDate, "LOCAL_CSV")) {
                    continue;
                }
                marketDataSnapshotRepository.save(MarketDataSnapshot.builder()
                        .assetClass(assetClass)
                        .asOfDate(asOfDate)
                        .returnAdjustment(Double.parseDouble(parts[2].trim()))
                        .volatilityAdjustment(Double.parseDouble(parts[3].trim()))
                        .marketRegime(parts[4].trim())
                        .source("LOCAL_CSV")
                        .build());
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to ingest market snapshot CSV", ex);
        }
    }

    @Transactional
    public void ingestNavHistory() {
        try {
            if (!Files.exists(navHistoryCsvPath)) {
                return;
            }
            List<String> lines = Files.readAllLines(navHistoryCsvPath);
            for (int i = 1; i < lines.size(); i++) {
                String line = lines.get(i).trim();
                if (line.isBlank()) {
                    continue;
                }
                String[] parts = line.split(",", -1);
                LocalDate navDate = LocalDate.parse(parts[0].trim());
                String fundName = parts[1].trim();
                if (fundNavSnapshotRepository.existsByFundNameAndNavDateAndSource(fundName, navDate, "LOCAL_CSV")) {
                    continue;
                }
                fundNavSnapshotRepository.save(FundNavSnapshot.builder()
                        .fundName(fundName)
                        .assetClass(parts[2].trim().toUpperCase())
                        .navDate(navDate)
                        .navValue(new BigDecimal(parts[3].trim()))
                        .source("LOCAL_CSV")
                        .build());
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to ingest NAV history CSV", ex);
        }
    }

    @Transactional(readOnly = true)
    public MarketDataSummaryResponse getSummary() {
        return new MarketDataSummaryResponse(
                marketDataSnapshotRepository.count(),
                fundNavSnapshotRepository.count(),
                latestMarketSnapshots(),
                latestFundNavs()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Map<String, Object>> latestMarketContext() {
        Map<String, Map<String, Object>> context = new LinkedHashMap<>();
        latestMarketSnapshots().forEach(snapshot -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("asOfDate", snapshot.asOfDate());
            item.put("returnAdjustment", snapshot.returnAdjustment());
            item.put("volatilityAdjustment", snapshot.volatilityAdjustment());
            item.put("marketRegime", snapshot.marketRegime());
            item.put("source", snapshot.source());
            context.put(snapshot.assetClass(), item);
        });
        return context;
    }

    private List<MarketDataSnapshotResponse> latestMarketSnapshots() {
        return List.of("EQUITY", "DEBT", "GOLD", "LIQUID").stream()
                .map(assetClass -> marketDataSnapshotRepository.findTopByAssetClassOrderByAsOfDateDescCreatedAtDesc(assetClass).orElse(null))
                .filter(snapshot -> snapshot != null)
                .map(snapshot -> new MarketDataSnapshotResponse(
                        snapshot.getAssetClass(),
                        snapshot.getAsOfDate(),
                        snapshot.getReturnAdjustment(),
                        snapshot.getVolatilityAdjustment(),
                        snapshot.getMarketRegime(),
                        snapshot.getSource()
                ))
                .toList();
    }

    private List<FundNavSnapshotResponse> latestFundNavs() {
        return fundNavSnapshotRepository.findTop20ByOrderByNavDateDescCreatedAtDesc().stream()
                .map(snapshot -> new FundNavSnapshotResponse(
                        snapshot.getFundName(),
                        snapshot.getAssetClass(),
                        snapshot.getNavDate(),
                        snapshot.getNavValue(),
                        snapshot.getSource()
                ))
                .toList();
    }
}
