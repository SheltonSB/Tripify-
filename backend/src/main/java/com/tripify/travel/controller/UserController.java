package com.tripify.travel.controller;

import com.tripify.travel.dto.PreferencesRequest;
import com.tripify.travel.dto.UserResponse;
import com.tripify.travel.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(UserResponse.fromEntity(userService.getUser(userId)));
    }

    @PutMapping("/{userId}/preferences")
    public ResponseEntity<UserResponse> updatePreferences(
            @PathVariable Long userId,
            @RequestBody PreferencesRequest preferences) {
        return ResponseEntity.ok(UserResponse.fromEntity(userService.updatePreferences(userId, preferences)));
    }
}
