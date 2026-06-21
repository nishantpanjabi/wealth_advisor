package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.response.AdminDashboardResponse;
import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(
                "Admin dashboard fetched successfully",
                adminService.getDashboard()
        ));
    }
}
