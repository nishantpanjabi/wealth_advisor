package com.wealthadvisor.backend.dto.response;

public record XirrResponse(
        Double xirrPercent,
        Integer cashflowCount
) {
}
