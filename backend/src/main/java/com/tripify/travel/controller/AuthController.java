package com.tripify.travel.controller;

import com.tripify.travel.dto.AuthRequest;
import com.tripify.travel.dto.UserResponse;
import com.tripify.travel.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponse> signup(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(UserResponse.fromEntity(userService.signup(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(UserResponse.fromEntity(userService.login(request)));
    }
}
