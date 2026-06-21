package com.wealthadvisor.backend.dto.request;

import com.wealthadvisor.backend.enums.AssetType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InvestmentRequest(
        @NotBlank(message = "Asset name is required")
        String assetName,

        @NotNull(message = "Asset type is required")
        AssetType assetType,

        @NotNull(message = "Buy price is required")
        @DecimalMin(value = "0.01", message = "Buy price must be greater than zero")
        BigDecimal buyPrice,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.0001", message = "Quantity must be greater than zero")
        Double quantity,

        @NotNull(message = "Current value is required")
        @DecimalMin(value = "0.00", message = "Current value cannot be negative")
        BigDecimal currentValue,

        @NotNull(message = "Purchase date is required")
        LocalDate purchaseDate
) {
}
