package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.request.InvestmentRequest;
import com.wealthadvisor.backend.dto.response.AllocationBucketResponse;
import com.wealthadvisor.backend.dto.response.BenchmarkComparisonResponse;
import com.wealthadvisor.backend.dto.response.EfficientFrontierPointResponse;
import com.wealthadvisor.backend.dto.response.InvestmentResponse;
import com.wealthadvisor.backend.dto.response.PortfolioOptimizationResponse;
import com.wealthadvisor.backend.dto.response.PortfolioPerformancePointResponse;
import com.wealthadvisor.backend.dto.response.PortfolioResponse;
import com.wealthadvisor.backend.dto.response.PortfolioTransactionResponse;
import com.wealthadvisor.backend.dto.response.TaxReviewResponse;
import com.wealthadvisor.backend.dto.response.XirrResponse;
import com.wealthadvisor.backend.entity.Investment;
import com.wealthadvisor.backend.entity.Portfolio;
import com.wealthadvisor.backend.entity.PortfolioTransaction;
import com.wealthadvisor.backend.entity.RiskProfile;
import com.wealthadvisor.backend.entity.User;
import com.wealthadvisor.backend.enums.AssetType;
import com.wealthadvisor.backend.enums.RiskCategory;
import com.wealthadvisor.backend.exception.ResourceNotFoundException;
import com.wealthadvisor.backend.repository.InvestmentRepository;
import com.wealthadvisor.backend.repository.PortfolioRepository;
import com.wealthadvisor.backend.repository.PortfolioTransactionRepository;
import com.wealthadvisor.backend.repository.RiskProfileRepository;
import com.wealthadvisor.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final InvestmentRepository investmentRepository;
    private final UserRepository userRepository;
    private final RiskProfileRepository riskProfileRepository;
    private final PortfolioTransactionRepository portfolioTransactionRepository;

    public PortfolioService(
            PortfolioRepository portfolioRepository,
            InvestmentRepository investmentRepository,
            UserRepository userRepository,
            RiskProfileRepository riskProfileRepository,
            PortfolioTransactionRepository portfolioTransactionRepository
    ) {
        this.portfolioRepository = portfolioRepository;
        this.investmentRepository = investmentRepository;
        this.userRepository = userRepository;
        this.riskProfileRepository = riskProfileRepository;
        this.portfolioTransactionRepository = portfolioTransactionRepository;
    }

    @Transactional
    @CacheEvict(value = "portfolioOptimization", key = "#userId")
    public PortfolioResponse getPortfolio(Long userId) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        return buildPortfolioResponse(portfolio);
    }

    @Transactional
    @Cacheable(value = "portfolioOptimization", key = "#userId")
    public PortfolioOptimizationResponse getOptimization(Long userId) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        updatePortfolioMetrics(portfolio);
        List<Investment> investments = investmentRepository.findAllByPortfolioIdOrderByPurchaseDateDescIdDesc(portfolio.getId());
        RiskCategory riskCategory = riskProfileRepository.findTopByUserIdOrderByCalculatedAtDesc(userId)
                .map(RiskProfile::getRiskCategory)
                .orElse(RiskCategory.MODERATE);

        AllocationProfile profile = resolveAllocationProfile(riskCategory);
        BigDecimal totalCurrentValue = portfolio.getTotalCurrentValue() == null
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : portfolio.getTotalCurrentValue();

        List<AllocationBucketResponse> allocationBuckets = buildAllocationBuckets(portfolio, totalCurrentValue, profile);

        return new PortfolioOptimizationResponse(
                portfolio.getId(),
                riskCategory,
                profile.name,
                profile.expectedReturn,
                profile.volatility,
                totalCurrentValue,
                allocationBuckets,
                buildSubAssetRecommendations(riskCategory),
                buildEfficientFrontier(profile.name),
                buildTaxReviewFlags(investments)
        );
    }

    @Transactional
    @CacheEvict(value = "portfolioOptimization", key = "#userId")
    public PortfolioResponse addInvestment(Long userId, InvestmentRequest request) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        Investment investment = Investment.builder()
                .portfolio(portfolio)
                .build();

        applyInvestmentRequest(investment, request);
        Investment savedInvestment = investmentRepository.save(investment);
        recordTransaction(portfolio, savedInvestment, "BUY", calculateInvestedValue(savedInvestment), savedInvestment.getQuantity(), savedInvestment.getPurchaseDate());
        return refreshPortfolio(portfolio);
    }

    @Transactional
    @CacheEvict(value = "portfolioOptimization", key = "#userId")
    public PortfolioResponse updateInvestment(Long userId, Long investmentId, InvestmentRequest request) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        Investment investment = investmentRepository.findByIdAndPortfolioId(investmentId, portfolio.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Investment not found"));

        applyInvestmentRequest(investment, request);
        Investment savedInvestment = investmentRepository.save(investment);
        recordTransaction(portfolio, savedInvestment, "UPDATE", calculateInvestedValue(savedInvestment), savedInvestment.getQuantity(), LocalDate.now());
        return refreshPortfolio(portfolio);
    }

    @Transactional
    @CacheEvict(value = "portfolioOptimization", key = "#userId")
    public PortfolioResponse deleteInvestment(Long userId, Long investmentId) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        Investment investment = investmentRepository.findByIdAndPortfolioId(investmentId, portfolio.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Investment not found"));

        recordTransaction(portfolio, investment, "SELL", investment.getCurrentValue(), investment.getQuantity(), LocalDate.now());
        investmentRepository.delete(investment);
        return refreshPortfolio(portfolio);
    }

    @Transactional(readOnly = true)
    public List<PortfolioTransactionResponse> getTransactions(Long userId) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        return portfolioTransactionRepository.findAllByPortfolioIdOrderByTransactionDateDescCreatedAtDesc(portfolio.getId())
                .stream()
                .map(this::mapTransactionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PortfolioPerformancePointResponse> getPerformanceSeries(Long userId) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        List<PortfolioTransaction> transactions = portfolioTransactionRepository.findAllByPortfolioIdOrderByTransactionDateAscCreatedAtAsc(portfolio.getId());
        List<PortfolioPerformancePointResponse> points = new ArrayList<>();

        BigDecimal cumulativeInvested = BigDecimal.ZERO;
        for (PortfolioTransaction transaction : transactions) {
            if ("BUY".equals(transaction.getActionType()) || "UPDATE".equals(transaction.getActionType())) {
                cumulativeInvested = cumulativeInvested.add(transaction.getAmount());
            } else if ("SELL".equals(transaction.getActionType())) {
                cumulativeInvested = cumulativeInvested.subtract(transaction.getAmount()).max(BigDecimal.ZERO);
            }

            BigDecimal estimatedValue = estimateCurrentEquivalent(cumulativeInvested, transaction.getTransactionDate());
            points.add(new PortfolioPerformancePointResponse(
                    transaction.getTransactionDate(),
                    cumulativeInvested.setScale(2, RoundingMode.HALF_UP),
                    estimatedValue
            ));
        }

        if (points.isEmpty()) {
            points.add(new PortfolioPerformancePointResponse(LocalDate.now(), BigDecimal.ZERO.setScale(2), BigDecimal.ZERO.setScale(2)));
        }

        return points;
    }

    @Transactional(readOnly = true)
    public XirrResponse getXirr(Long userId) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        List<PortfolioTransaction> transactions = portfolioTransactionRepository.findAllByPortfolioIdOrderByTransactionDateAscCreatedAtAsc(portfolio.getId());

        if (transactions.isEmpty()) {
            return new XirrResponse(0.0, 0);
        }

        List<CashFlow> cashFlows = new ArrayList<>();
        for (PortfolioTransaction transaction : transactions) {
            double amount = transaction.getAmount().doubleValue();
            if ("BUY".equals(transaction.getActionType()) || "UPDATE".equals(transaction.getActionType())) {
                cashFlows.add(new CashFlow(transaction.getTransactionDate(), -amount));
            } else if ("SELL".equals(transaction.getActionType())) {
                cashFlows.add(new CashFlow(transaction.getTransactionDate(), amount));
            }
        }

        BigDecimal terminalValue = zeroIfNull(portfolio.getTotalCurrentValue());
        if (terminalValue.signum() > 0) {
            cashFlows.add(new CashFlow(LocalDate.now(), terminalValue.doubleValue()));
        }

        double xirr = calculateXirr(cashFlows);
        return new XirrResponse(BigDecimal.valueOf(xirr * 100).setScale(2, RoundingMode.HALF_UP).doubleValue(), cashFlows.size());
    }

    @Transactional(readOnly = true)
    public BenchmarkComparisonResponse getBenchmarkComparison(Long userId) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        List<PortfolioTransaction> transactions = portfolioTransactionRepository.findAllByPortfolioIdOrderByTransactionDateAscCreatedAtAsc(portfolio.getId());

        BigDecimal benchmarkValue = BigDecimal.ZERO;
        double annualBenchmarkReturn = 0.12;
        LocalDate today = LocalDate.now();

        for (PortfolioTransaction transaction : transactions) {
            if ("BUY".equals(transaction.getActionType()) || "UPDATE".equals(transaction.getActionType())) {
                long days = ChronoUnit.DAYS.between(transaction.getTransactionDate(), today);
                double years = days / 365.0;
                BigDecimal futureValue = transaction.getAmount()
                        .multiply(BigDecimal.valueOf(Math.pow(1 + annualBenchmarkReturn, years)));
                benchmarkValue = benchmarkValue.add(futureValue);
            } else if ("SELL".equals(transaction.getActionType())) {
                benchmarkValue = benchmarkValue.subtract(transaction.getAmount()).max(BigDecimal.ZERO);
            }
        }

        benchmarkValue = benchmarkValue.setScale(2, RoundingMode.HALF_UP);
        BigDecimal portfolioValue = zeroIfNull(portfolio.getTotalCurrentValue());
        BigDecimal alphaValue = portfolioValue.subtract(benchmarkValue).setScale(2, RoundingMode.HALF_UP);
        BigDecimal investedValue = zeroIfNull(portfolio.getTotalInvestedValue());

        double portfolioReturnPercent = investedValue.signum() <= 0 ? 0.0 :
                portfolioValue.subtract(investedValue)
                        .divide(investedValue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();

        double benchmarkReturnPercent = investedValue.signum() <= 0 ? 0.0 :
                benchmarkValue.subtract(investedValue)
                        .divide(investedValue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();

        return new BenchmarkComparisonResponse(
                "NIFTY50_MOCK",
                benchmarkValue,
                portfolioValue,
                alphaValue,
                portfolioReturnPercent,
                benchmarkReturnPercent
        );
    }

    private void applyInvestmentRequest(Investment investment, InvestmentRequest request) {
        investment.setAssetName(request.assetName().trim());
        investment.setAssetType(request.assetType());
        investment.setBuyPrice(request.buyPrice().setScale(2, RoundingMode.HALF_UP));
        investment.setQuantity(request.quantity());
        investment.setCurrentValue(request.currentValue().setScale(2, RoundingMode.HALF_UP));
        investment.setPurchaseDate(request.purchaseDate());
    }

    private Portfolio getOrCreatePortfolio(Long userId) {
        return portfolioRepository.findByUserId(userId)
                .orElseGet(() -> createPortfolio(userId));
    }

    private Portfolio createPortfolio(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Portfolio portfolio = Portfolio.builder()
                .user(user)
                .equityPct(0.0)
                .debtPct(0.0)
                .goldPct(0.0)
                .liquidPct(0.0)
                .totalInvestedValue(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .totalCurrentValue(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .build();

        return portfolioRepository.save(portfolio);
    }

    private PortfolioResponse refreshPortfolio(Portfolio portfolio) {
        updatePortfolioMetrics(portfolio);
        portfolioRepository.save(portfolio);
        return buildPortfolioResponse(portfolio);
    }

    private void updatePortfolioMetrics(Portfolio portfolio) {
        List<Investment> investments = investmentRepository.findAllByPortfolioIdOrderByPurchaseDateDescIdDesc(portfolio.getId());

        BigDecimal totalInvested = investments.stream()
                .map(this::calculateInvestedValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalCurrent = investments.stream()
                .map(Investment::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        portfolio.setTotalInvestedValue(totalInvested);
        portfolio.setTotalCurrentValue(totalCurrent);

        double totalCurrentDouble = totalCurrent.doubleValue();
        portfolio.setEquityPct(calculateAssetPercent(investments, AssetType.STOCK, AssetType.MUTUAL_FUND, AssetType.ETF, totalCurrentDouble));
        portfolio.setDebtPct(calculateAssetPercent(investments, AssetType.BOND, totalCurrentDouble));
        portfolio.setGoldPct(calculateAssetPercent(investments, AssetType.GOLD, totalCurrentDouble));
        portfolio.setLiquidPct(calculateAssetPercent(investments, AssetType.CASH, totalCurrentDouble));
    }

    private double calculateAssetPercent(List<Investment> investments, AssetType type, double totalCurrentValue) {
        return calculateAssetPercent(investments, new AssetType[]{type}, totalCurrentValue);
    }

    private double calculateAssetPercent(List<Investment> investments, AssetType type1, AssetType type2, AssetType type3, double totalCurrentValue) {
        return calculateAssetPercent(investments, new AssetType[]{type1, type2, type3}, totalCurrentValue);
    }

    private double calculateAssetPercent(List<Investment> investments, AssetType[] types, double totalCurrentValue) {
        if (totalCurrentValue <= 0.0) {
            return 0.0;
        }

        BigDecimal assetValue = investments.stream()
                .filter(investment -> {
                    for (AssetType type : types) {
                        if (investment.getAssetType() == type) {
                            return true;
                        }
                    }
                    return false;
                })
                .map(Investment::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return assetValue
                .divide(BigDecimal.valueOf(totalCurrentValue), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private PortfolioResponse buildPortfolioResponse(Portfolio portfolio) {
        List<Investment> investments = investmentRepository.findAllByPortfolioIdOrderByPurchaseDateDescIdDesc(portfolio.getId());
        List<InvestmentResponse> investmentResponses = investments.stream()
                .map(this::mapInvestmentResponse)
                .toList();

        BigDecimal totalInvested = portfolio.getTotalInvestedValue() == null ? BigDecimal.ZERO : portfolio.getTotalInvestedValue();
        BigDecimal totalCurrent = portfolio.getTotalCurrentValue() == null ? BigDecimal.ZERO : portfolio.getTotalCurrentValue();
        BigDecimal totalProfitLoss = totalCurrent.subtract(totalInvested).setScale(2, RoundingMode.HALF_UP);
        double totalReturnPercent = totalInvested.signum() <= 0
                ? 0.0
                : totalProfitLoss.divide(totalInvested, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();

        return new PortfolioResponse(
                portfolio.getId(),
                portfolio.getUser().getId(),
                totalInvested,
                totalCurrent,
                totalProfitLoss,
                totalReturnPercent,
                defaultPct(portfolio.getEquityPct()),
                defaultPct(portfolio.getDebtPct()),
                defaultPct(portfolio.getGoldPct()),
                defaultPct(portfolio.getLiquidPct()),
                investmentResponses.size(),
                investmentResponses
        );
    }

    private InvestmentResponse mapInvestmentResponse(Investment investment) {
        BigDecimal investedValue = calculateInvestedValue(investment);
        BigDecimal currentValue = investment.getCurrentValue().setScale(2, RoundingMode.HALF_UP);
        BigDecimal profitLoss = currentValue.subtract(investedValue).setScale(2, RoundingMode.HALF_UP);
        double returnPercent = investedValue.signum() <= 0
                ? 0.0
                : profitLoss.divide(investedValue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();

        return new InvestmentResponse(
                investment.getId(),
                investment.getAssetName(),
                investment.getAssetType(),
                investment.getBuyPrice(),
                investment.getQuantity(),
                investedValue,
                currentValue,
                profitLoss,
                returnPercent,
                investment.getPurchaseDate()
        );
    }

    private BigDecimal calculateInvestedValue(Investment investment) {
        return investment.getBuyPrice()
                .multiply(BigDecimal.valueOf(investment.getQuantity()))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private void recordTransaction(
            Portfolio portfolio,
            Investment investment,
            String actionType,
            BigDecimal amount,
            Double quantity,
            LocalDate transactionDate
    ) {
        PortfolioTransaction transaction = PortfolioTransaction.builder()
                .portfolio(portfolio)
                .investmentId(investment.getId())
                .assetName(investment.getAssetName())
                .actionType(actionType)
                .amount(amount.setScale(2, RoundingMode.HALF_UP))
                .quantity(quantity)
                .transactionDate(transactionDate)
                .build();
        portfolioTransactionRepository.save(transaction);
    }

    private PortfolioTransactionResponse mapTransactionResponse(PortfolioTransaction transaction) {
        return new PortfolioTransactionResponse(
                transaction.getId(),
                transaction.getInvestmentId(),
                transaction.getAssetName(),
                transaction.getActionType(),
                transaction.getAmount(),
                transaction.getQuantity(),
                transaction.getTransactionDate(),
                transaction.getCreatedAt()
        );
    }

    private BigDecimal estimateCurrentEquivalent(BigDecimal investedValue, LocalDate startDate) {
        long days = ChronoUnit.DAYS.between(startDate, LocalDate.now());
        double years = Math.max(0.0, days / 365.0);
        return investedValue.multiply(BigDecimal.valueOf(Math.pow(1.10, years))).setScale(2, RoundingMode.HALF_UP);
    }

    private double calculateXirr(List<CashFlow> cashFlows) {
        double rate = 0.10;
        for (int i = 0; i < 50; i++) {
            double f = xnpv(rate, cashFlows);
            double df = xnpvDerivative(rate, cashFlows);
            if (Math.abs(df) < 1e-9) {
                break;
            }
            double newRate = rate - (f / df);
            if (Math.abs(newRate - rate) < 1e-7) {
                rate = newRate;
                break;
            }
            rate = newRate;
        }
        return rate;
    }

    private double xnpv(double rate, List<CashFlow> cashFlows) {
        LocalDate baseDate = cashFlows.getFirst().date;
        double total = 0.0;
        for (CashFlow cashFlow : cashFlows) {
            double years = ChronoUnit.DAYS.between(baseDate, cashFlow.date) / 365.0;
            total += cashFlow.amount / Math.pow(1 + rate, years);
        }
        return total;
    }

    private double xnpvDerivative(double rate, List<CashFlow> cashFlows) {
        LocalDate baseDate = cashFlows.getFirst().date;
        double total = 0.0;
        for (CashFlow cashFlow : cashFlows) {
            double years = ChronoUnit.DAYS.between(baseDate, cashFlow.date) / 365.0;
            total += (-years * cashFlow.amount) / Math.pow(1 + rate, years + 1);
        }
        return total;
    }

    private double defaultPct(Double value) {
        return value == null ? 0.0 : value;
    }

    private List<AllocationBucketResponse> buildAllocationBuckets(
            Portfolio portfolio,
            BigDecimal totalCurrentValue,
            AllocationProfile profile
    ) {
        return List.of(
                createAllocationBucket("EQUITY", defaultPct(portfolio.getEquityPct()), profile.equityPct, totalCurrentValue),
                createAllocationBucket("DEBT", defaultPct(portfolio.getDebtPct()), profile.debtPct, totalCurrentValue),
                createAllocationBucket("GOLD", defaultPct(portfolio.getGoldPct()), profile.goldPct, totalCurrentValue),
                createAllocationBucket("LIQUID", defaultPct(portfolio.getLiquidPct()), profile.liquidPct, totalCurrentValue)
        );
    }

    private AllocationBucketResponse createAllocationBucket(
            String assetClass,
            Double currentPct,
            Double targetPct,
            BigDecimal totalCurrentValue
    ) {
        BigDecimal currentValue = pctValue(currentPct, totalCurrentValue);
        BigDecimal targetValue = pctValue(targetPct, totalCurrentValue);
        BigDecimal driftAmount = targetValue.subtract(currentValue).setScale(2, RoundingMode.HALF_UP);

        String action;
        if (driftAmount.abs().compareTo(BigDecimal.valueOf(500)) < 0) {
            action = "HOLD";
        } else if (driftAmount.signum() > 0) {
            action = "BUY";
        } else {
            action = "SELL";
        }

        return new AllocationBucketResponse(
                assetClass,
                roundPct(currentPct),
                roundPct(targetPct),
                currentValue,
                targetValue,
                driftAmount,
                action
        );
    }

    private BigDecimal pctValue(Double pct, BigDecimal totalCurrentValue) {
        return totalCurrentValue
                .multiply(BigDecimal.valueOf(pct))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private Double roundPct(Double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private List<String> buildSubAssetRecommendations(RiskCategory riskCategory) {
        return switch (riskCategory) {
            case CONSERVATIVE -> List.of(
                    "Debt-heavy mix: short-duration debt funds and high-quality bonds",
                    "Gold allocation for inflation hedge",
                    "Maintain liquid reserve for emergency coverage"
            );
            case MODERATE -> List.of(
                    "Blend large-cap equity with diversified index funds",
                    "Use debt funds for stability and rebalancing buffer",
                    "Keep a moderate gold sleeve for diversification"
            );
            case AGGRESSIVE -> List.of(
                    "Tilt equity toward large-cap and flexi-cap funds",
                    "Add controlled mid-cap exposure for growth",
                    "Keep limited debt and liquid allocation for opportunistic rebalancing"
            );
        };
    }

    private List<EfficientFrontierPointResponse> buildEfficientFrontier(String currentProfileName) {
        List<AllocationProfile> profiles = List.of(
                new AllocationProfile("CONSERVATIVE", 20.0, 55.0, 15.0, 10.0, 7.2, 5.5),
                new AllocationProfile("BALANCED", 40.0, 35.0, 15.0, 10.0, 8.8, 7.4),
                new AllocationProfile("MODERATE_GROWTH", 55.0, 25.0, 10.0, 10.0, 10.1, 9.1),
                new AllocationProfile("GROWTH", 70.0, 15.0, 10.0, 5.0, 11.4, 11.3),
                new AllocationProfile("AGGRESSIVE", 80.0, 10.0, 5.0, 5.0, 12.2, 13.0)
        );

        return profiles.stream()
                .map(profile -> new EfficientFrontierPointResponse(
                        profile.name,
                        profile.expectedReturn,
                        profile.volatility,
                        profile.equityPct,
                        profile.debtPct,
                        profile.goldPct,
                        profile.liquidPct,
                        profile.name.equals(currentProfileName)
                ))
                .toList();
    }

    private List<TaxReviewResponse> buildTaxReviewFlags(List<Investment> investments) {
        LocalDate today = LocalDate.now();
        List<TaxReviewResponse> flags = new ArrayList<>();

        for (Investment investment : investments) {
            BigDecimal gain = investment.getCurrentValue().subtract(calculateInvestedValue(investment));
            long holdingDays = ChronoUnit.DAYS.between(investment.getPurchaseDate(), today);

            if (gain.signum() > 0 && holdingDays < 365) {
                flags.add(new TaxReviewResponse(
                        investment.getId(),
                        investment.getAssetName(),
                        investment.getAssetType().name(),
                        investment.getPurchaseDate(),
                        Math.toIntExact(holdingDays),
                        gain.setScale(2, RoundingMode.HALF_UP),
                        "Profitable holding under 1 year. Review short-term tax impact before selling."
                ));
            }
        }

        return flags;
    }

    private AllocationProfile resolveAllocationProfile(RiskCategory riskCategory) {
        return switch (riskCategory) {
            case CONSERVATIVE -> new AllocationProfile("CONSERVATIVE", 20.0, 55.0, 15.0, 10.0, 7.2, 5.5);
            case MODERATE -> new AllocationProfile("BALANCED", 50.0, 25.0, 15.0, 10.0, 9.7, 8.8);
            case AGGRESSIVE -> new AllocationProfile("AGGRESSIVE", 75.0, 10.0, 10.0, 5.0, 12.0, 12.5);
        };
    }

    private record AllocationProfile(
            String name,
            Double equityPct,
            Double debtPct,
            Double goldPct,
            Double liquidPct,
            Double expectedReturn,
            Double volatility
    ) {
    }

    private record CashFlow(LocalDate date, double amount) {
    }
}
